/**
 * Shopping list selections, persisted beside the recipes.
 *
 * The file holds slugs and scales only. It used to also copy the title,
 * servings and image URL of each recipe, which went stale as soon as a recipe
 * was edited or renamed; those are re-derived from the index on read.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { getIndex } from '../recipes/index.js';

/** A recipe in the list, as stored. */
export interface StoredSelection {
	slug: string;
	scale: number;
}

/** A selection joined against the index, as the UI needs it. */
export interface ResolvedSelection extends StoredSelection {
	title: string;
	relPath: string;
	servings: number | null;
}

interface ShoppingListFileV2 {
	version: 2;
	recipes: StoredSelection[];
}

const FILE_NAME = '.shopping-list.json';

function filePath(): string {
	return path.join(config.RECIPE_PATH, FILE_NAME);
}

/**
 * Serializes read-modify-write cycles within this process.
 *
 * Two quick submissions previously raced: both read the file, both wrote it,
 * and whichever finished second silently discarded the other's change. The
 * atomic rename made each write whole but did nothing about the interleaving.
 */
let queue: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
	const run = queue.then(fn, fn);
	// Keep the chain alive even if this operation rejects.
	queue = run.then(
		() => undefined,
		() => undefined
	);
	return run;
}

function clampScale(value: unknown): number {
	const scale = Number(value);
	if (!Number.isFinite(scale) || scale <= 0) return 1;
	return Math.min(Math.max(scale, 0.5), 100);
}

/**
 * Read the file, migrating older shapes.
 *
 * v1 stored the recipe's filename ("Easy Pancakes.cook") as its slug. Those
 * are matched back to recipes by basename; anything that no longer resolves is
 * dropped rather than left to fail the CLI call later.
 */
async function readFile(): Promise<StoredSelection[]> {
	let raw: string;
	try {
		raw = await fs.readFile(filePath(), 'utf8');
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
		throw error;
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		console.error('Shopping list file is not valid JSON; treating as empty');
		return [];
	}

	const data = parsed as Partial<ShoppingListFileV2> & { recipes?: unknown };
	if (!Array.isArray(data.recipes)) return [];

	const entries = data.recipes as Array<{ slug?: unknown; scale?: unknown }>;

	if (data.version === 2) {
		return entries
			.filter((entry) => typeof entry.slug === 'string')
			.map((entry) => ({ slug: entry.slug as string, scale: clampScale(entry.scale) }));
	}

	// v1 (or unversioned): slugs were filenames.
	const index = await getIndex();
	const byBasename = new Map(
		index.entries.map((entry) => [path.basename(entry.relPath).toLowerCase(), entry.slug])
	);

	const migrated: StoredSelection[] = [];
	for (const entry of entries) {
		if (typeof entry.slug !== 'string') continue;

		const resolved =
			index.bySlug.get(entry.slug)?.slug ?? byBasename.get(path.basename(entry.slug).toLowerCase());

		if (!resolved) {
			console.warn(`Dropping unknown recipe "${entry.slug}" while migrating the shopping list`);
			continue;
		}

		migrated.push({ slug: resolved, scale: clampScale(entry.scale) });
	}

	return migrated;
}

/** Atomic write: a crash mid-write cannot leave a truncated file behind. */
async function writeFile(recipes: StoredSelection[]): Promise<void> {
	const target = filePath();
	const temp = `${target}.${process.pid}.tmp`;
	const payload: ShoppingListFileV2 = { version: 2, recipes };

	try {
		await fs.writeFile(temp, JSON.stringify(payload, null, 2), 'utf8');
		await fs.rename(temp, target);
	} catch (error) {
		await fs.unlink(temp).catch(() => {});
		throw error;
	}
}

/** Selections as stored, without touching the recipe index. */
export async function readSelections(): Promise<StoredSelection[]> {
	return withLock(readFile);
}

/** Selections joined against the index. Recipes that no longer exist are omitted. */
export async function resolveSelections(): Promise<ResolvedSelection[]> {
	const [stored, index] = await Promise.all([readSelections(), getIndex()]);

	return stored.flatMap((selection) => {
		const entry = index.bySlug.get(selection.slug);
		if (!entry) {
			console.warn(`Shopping list references unknown recipe "${selection.slug}"`);
			return [];
		}

		return [
			{
				...selection,
				title: entry.title,
				relPath: entry.relPath,
				servings: entry.servings
			}
		];
	});
}

/**
 * Add a recipe, or update its scale if already present.
 *
 * @returns false if the slug matches no recipe, in which case nothing is written
 */
export async function upsertSelection(slug: string, scale: number): Promise<boolean> {
	// Validate against the index so a hand-crafted request cannot put an entry
	// in the file that no page can ever resolve or remove.
	const index = await getIndex();
	if (!index.bySlug.has(slug)) return false;

	await withLock(async () => {
		const recipes = await readFile();
		const existing = recipes.find((recipe) => recipe.slug === slug);

		if (existing) existing.scale = clampScale(scale);
		else recipes.push({ slug, scale: clampScale(scale) });

		await writeFile(recipes);
	});

	return true;
}

export async function removeSelection(slug: string): Promise<void> {
	await withLock(async () => {
		const recipes = await readFile();
		await writeFile(recipes.filter((recipe) => recipe.slug !== slug));
	});
}

export async function clearSelections(): Promise<void> {
	await withLock(async () => {
		await fs.unlink(filePath()).catch((error: NodeJS.ErrnoException) => {
			if (error.code !== 'ENOENT') throw error;
		});
	});
}
