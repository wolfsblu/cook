/**
 * In-memory index of the recipe directory.
 *
 * The recipe directory is a spinning-disk NAS mount. Before this existed, every
 * request to the list page read *and* WASM-parsed every .cook file on disk, so
 * page load cost scaled with library size and was paid again on every
 * navigation. The index reads and parses a file only when its mtime or size
 * changes; a steady-state refresh costs one stat per file and nothing else.
 *
 * Invalidation is stat-based rather than fs.watch: the directory is a network
 * mount, and recursive watches over SMB/NFS are unreliable and fail silently.
 */

import { CooklangParser } from '@cooklang/cooklang';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { assignSlugs } from './slug.js';

/** Image extensions probed for recipe artwork, in preference order. */
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

/** Directories that never hold recipes, skipped during the walk. */
const IGNORED_DIRS = new Set(['config', 'db', 'reports', 'node_modules']);

/** Concurrent stat calls. Enough to keep a spinning disk busy, not enough to thrash it. */
const STAT_CONCURRENCY = 32;

export interface RecipeImage {
	/** Path relative to the recipe directory, e.g. "Breakfast/Easy Pancakes.jpg". */
	key: string;
	mtimeMs: number;
}

export interface RecipeEntry {
	/** URL slug, e.g. "breakfast/easy-pancakes". */
	slug: string;
	/** Path relative to the recipe directory, as the Cook CLI wants it. */
	relPath: string;
	/** Absolute path on disk. The only path routes are ever allowed to read. */
	absPath: string;

	title: string;
	description: string | null;
	tags: string[];
	course: string | null;
	servings: number | null;
	/** Total time in minutes, or null when the recipe declares none. */
	timeMinutes: number | null;

	/** Main image, if one sits beside the recipe file. */
	image: RecipeImage | null;
	/** Step images keyed by step number, from the `Name.<n>.jpg` convention. */
	stepImages: Record<number, RecipeImage>;

	mtimeMs: number;
	size: number;

	/** Lowercased text used by search; not sent to the client. */
	searchable: {
		title: string;
		tags: string;
		ingredients: string;
		body: string;
	};
}

export interface RecipeIndex {
	entries: RecipeEntry[];
	bySlug: ReadonlyMap<string, RecipeEntry>;
	allTags: string[];
	allCourses: string[];
	scannedAt: number;
	/** Newest mtime across all recipes; used as a cache key by the shopping list. */
	maxMtimeMs: number;
	/**
	 * Whether the recipe directory could be read at all.
	 *
	 * Distinguishes "the library is empty" from "the volume is not mounted",
	 * which otherwise look identical. The health endpoint reports on this.
	 */
	readable: boolean;
}

/** Everything cached for one file, so an unchanged file is never re-read. */
interface CachedFile {
	mtimeMs: number;
	size: number;
	parsed: ParsedRecipeFields;
}

interface ParsedRecipeFields {
	title: string;
	description: string | null;
	tags: string[];
	course: string | null;
	servings: number | null;
	timeMinutes: number | null;
	searchable: RecipeEntry['searchable'];
}

const fileCache = new Map<string, CachedFile>();

let cachedIndex: RecipeIndex | null = null;
let inflight: Promise<RecipeIndex> | null = null;

/**
 * Drop the cached index so the next read re-scans.
 *
 * Called by write paths (pantry edits, shopping list changes) so a user's own
 * change is visible immediately rather than after the TTL.
 */
export function invalidateIndex(): void {
	cachedIndex = null;
}

/** Get the index, rescanning if the TTL has elapsed. Concurrent calls share one scan. */
export async function getIndex(): Promise<RecipeIndex> {
	if (cachedIndex && Date.now() - cachedIndex.scannedAt < config.RECIPE_INDEX_TTL_MS) {
		return cachedIndex;
	}

	// Single-flight: a burst of requests after expiry triggers one walk, not N.
	inflight ??= buildIndex().finally(() => {
		inflight = null;
	});

	return inflight;
}

/** Look up one recipe by slug. Returns undefined rather than throwing. */
export async function getEntry(slug: string): Promise<RecipeEntry | undefined> {
	const index = await getIndex();
	return index.bySlug.get(slug);
}

/** Run tasks with bounded concurrency, preserving input order in the result. */
async function mapLimit<T, R>(
	items: readonly T[],
	limit: number,
	fn: (item: T) => Promise<R>
): Promise<R[]> {
	const results = new Array<R>(items.length);
	let cursor = 0;

	const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
		while (cursor < items.length) {
			const index = cursor++;
			results[index] = await fn(items[index]);
		}
	});

	await Promise.all(workers);
	return results;
}

/** Normalize a path for use as a slash-separated relative key. */
function toRelKey(relPath: string): string {
	return relPath.split(path.sep).join('/');
}

/**
 * Walk the recipe directory once, collecting .cook files and image files
 * together. Doing both in a single pass means image lookup costs no extra
 * directory reads -- the previous image route probed four extensions per
 * request, up to four failed syscalls for every miss.
 */
async function walk(root: string): Promise<{ recipes: string[]; images: string[] }> {
	const dirents = await fs.readdir(root, { withFileTypes: true, recursive: true });

	const recipes: string[] = [];
	const images: string[] = [];

	for (const dirent of dirents) {
		if (!dirent.isFile()) continue;
		if (dirent.name.startsWith('.')) continue;

		// parentPath is absolute; make it relative to the recipe root.
		const relDir = path.relative(root, dirent.parentPath);
		const segments = relDir.split(path.sep).filter(Boolean);
		if (segments.some((segment) => IGNORED_DIRS.has(segment) || segment.startsWith('.'))) {
			continue;
		}

		const relPath = toRelKey(path.join(relDir, dirent.name));
		const ext = path.extname(dirent.name).toLowerCase();

		if (ext === '.cook') {
			recipes.push(relPath);
		} else if ((IMAGE_EXTENSIONS as readonly string[]).includes(ext)) {
			images.push(relPath);
		}
	}

	return { recipes, images };
}

/**
 * Index images by the recipe they belong to.
 *
 * Cooklang puts a recipe's artwork beside it: "Easy Pancakes.jpg" is the main
 * image and "Easy Pancakes.3.jpg" illustrates step 3. Both are matched here.
 */
function groupImages(
	images: readonly { relPath: string; mtimeMs: number }[]
): Map<string, { main: RecipeImage | null; steps: Record<number, RecipeImage> }> {
	const grouped = new Map<
		string,
		{ main: RecipeImage | null; steps: Record<number, RecipeImage> }
	>();

	// Sort so extension preference is deterministic: a .jpg wins over a .webp
	// for the same recipe because IMAGE_EXTENSIONS lists it first.
	const byPreference = [...images].sort(
		(a, b) =>
			IMAGE_EXTENSIONS.indexOf(path.extname(a.relPath).toLowerCase() as never) -
			IMAGE_EXTENSIONS.indexOf(path.extname(b.relPath).toLowerCase() as never)
	);

	for (const { relPath, mtimeMs } of byPreference) {
		const ext = path.extname(relPath);
		const withoutExt = relPath.slice(0, -ext.length);

		// A trailing ".<digits>" marks a step image.
		const stepMatch = withoutExt.match(/^(.*)\.(\d+)$/);
		const base = stepMatch ? stepMatch[1] : withoutExt;
		const step = stepMatch ? Number.parseInt(stepMatch[2], 10) : null;

		const bucket = grouped.get(base) ?? { main: null, steps: {} };

		if (step === null) {
			bucket.main ??= { key: relPath, mtimeMs };
		} else {
			bucket.steps[step] ??= { key: relPath, mtimeMs };
		}

		grouped.set(base, bucket);
	}

	return grouped;
}

/** Total time in minutes across cooklang's several time shapes. */
function totalTimeMinutes(time: unknown): number | null {
	if (typeof time === 'number') return time > 0 ? time : null;

	if (time && typeof time === 'object') {
		const { prep_time: prep, cook_time: cook } = time as {
			prep_time?: number;
			cook_time?: number;
		};
		const total = (prep ?? 0) + (cook ?? 0);
		return total > 0 ? total : null;
	}

	return null;
}

/** Parse one recipe into the subset of fields the index keeps. */
function parseRecipe(source: string, relPath: string): ParsedRecipeFields {
	const parser = new CooklangParser();
	const [recipe] = parser.parse(source);

	const fallbackTitle = path.basename(relPath, path.extname(relPath));
	const title = recipe.title || fallbackTitle;
	const tags = Array.from(recipe.tags ?? []) as string[];

	const ingredientNames = (recipe.ingredients ?? [])
		.map((ingredient: { name?: string }) => ingredient?.name ?? '')
		.filter(Boolean);

	return {
		title,
		description: recipe.description ?? null,
		tags,
		course: recipe.course ?? null,
		servings: typeof recipe.servings === 'number' ? recipe.servings : null,
		timeMinutes: totalTimeMinutes(recipe.time),
		searchable: {
			title: title.toLowerCase(),
			tags: tags.join(' ').toLowerCase(),
			ingredients: ingredientNames.join(' ').toLowerCase(),
			body: source.toLowerCase()
		}
	};
}

async function buildIndex(): Promise<RecipeIndex> {
	const root = config.RECIPE_PATH;
	const scannedAt = Date.now();

	let walked: { recipes: string[]; images: string[] };
	try {
		walked = await walk(root);
	} catch (error) {
		console.error(`Failed to read recipe directory "${root}":`, error);
		const empty: RecipeIndex = {
			entries: [],
			bySlug: new Map(),
			allTags: [],
			allCourses: [],
			scannedAt,
			maxMtimeMs: 0,
			readable: false
		};
		cachedIndex = empty;
		return empty;
	}

	const imageStats = await mapLimit(walked.images, STAT_CONCURRENCY, async (relPath) => {
		try {
			const stat = await fs.stat(path.join(root, relPath));
			return { relPath, mtimeMs: Math.round(stat.mtimeMs) };
		} catch {
			return null;
		}
	});

	const groupedImages = groupImages(imageStats.filter((image) => image !== null));

	const { slugs, collisions } = assignSlugs(walked.recipes);
	for (const collision of collisions) {
		console.warn(
			`Recipe slug collision: "${collision.relPath}" wanted "${collision.preferred}", using "${collision.slug}"`
		);
	}

	const entries = await mapLimit(walked.recipes, STAT_CONCURRENCY, async (relPath) => {
		const absPath = path.join(root, relPath);

		let stat;
		try {
			stat = await fs.stat(absPath);
		} catch {
			// Deleted between the walk and the stat.
			return null;
		}

		// Rounded because mtimeMs is fractional on some filesystems and this
		// value ends up in image URLs as a cache buster.
		const mtimeMs = Math.round(stat.mtimeMs);

		// Re-read and re-parse only when the file actually changed.
		let cached = fileCache.get(relPath);
		if (!cached || cached.mtimeMs !== mtimeMs || cached.size !== stat.size) {
			try {
				const source = await fs.readFile(absPath, 'utf8');
				cached = {
					mtimeMs,
					size: stat.size,
					parsed: parseRecipe(source, relPath)
				};
				fileCache.set(relPath, cached);
			} catch (error) {
				console.error(`Failed to read recipe "${relPath}":`, error);
				return null;
			}
		}

		const imageBucket = groupedImages.get(relPath.replace(/\.cook$/i, ''));

		return {
			slug: slugs.get(relPath)!,
			relPath,
			absPath,
			...cached.parsed,
			image: imageBucket?.main ?? null,
			stepImages: imageBucket?.steps ?? {},
			mtimeMs,
			size: stat.size
		} satisfies RecipeEntry;
	});

	const live = entries.filter((entry) => entry !== null);

	// Drop cache entries for files that no longer exist, so the map cannot grow
	// without bound across renames.
	const present = new Set(walked.recipes);
	for (const key of fileCache.keys()) {
		if (!present.has(key)) fileCache.delete(key);
	}

	const index: RecipeIndex = {
		entries: live,
		bySlug: new Map(live.map((entry) => [entry.slug, entry])),
		allTags: [...new Set(live.flatMap((entry) => entry.tags))].sort((a, b) => a.localeCompare(b)),
		allCourses: [...new Set(live.map((entry) => entry.course).filter((c) => c !== null))].sort(
			(a, b) => a.localeCompare(b)
		),
		scannedAt,
		maxMtimeMs: live.reduce((max, entry) => Math.max(max, entry.mtimeMs), 0),
		readable: true
	};

	cachedIndex = index;
	return index;
}
