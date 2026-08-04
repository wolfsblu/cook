/**
 * Aisle file access.
 *
 * The aisle configuration lives at <recipes>/config/aisle.conf, which is
 * exactly where the Cook CLI looks for it -- the same arrangement as
 * pantry.conf. Writing there means `shopping-list` regroups by the edited
 * categories with no further wiring.
 *
 * Reads are cached because this file is consulted on every shopping-list cache
 * key computation and the recipe directory is a network mount. The cache holds
 * the file *text* rather than a parsed document: parsing 170 lines costs
 * nothing next to the read, and handing every caller its own document means no
 * caller can mutate state another one is holding.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { parseAisle, serializeAisle, type AisleDoc } from './format.js';

interface TextCache {
	mtimeMs: number;
	size: number;
	text: string;
}

let cache: TextCache | null = null;

/**
 * Bumped on every successful write.
 *
 * mtime resolution is a whole second on some SMB mounts, so two writes inside
 * the same second are indistinguishable by mtime alone. That matters here more
 * than it does for the pantry: assigning an aisle from the shopping list writes
 * this file and immediately redirects back to a page whose entire purpose is to
 * re-render with the new grouping, and a stale cache key would serve the old
 * list back.
 */
let revision = 0;

export function aislePath(): string {
	return path.join(config.RECIPE_PATH, 'config', 'aisle.conf');
}

/** mtime of the aisle config. Zero when absent. */
export async function aisleMtimeMs(): Promise<number> {
	try {
		return Math.round((await fs.stat(aislePath())).mtimeMs);
	} catch {
		return 0;
	}
}

/**
 * Everything that identifies the current contents, for cache keys: mtime, size,
 * and this process's write count.
 */
export async function aisleStamp(): Promise<string> {
	try {
		const stat = await fs.stat(aislePath());
		return `${Math.round(stat.mtimeMs)}:${stat.size}:${revision}`;
	} catch {
		return `0:0:${revision}`;
	}
}

/** Read the file, bypassing the cache. */
async function readFresh(): Promise<string> {
	try {
		return await fs.readFile(aislePath(), 'utf8');
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return '';
		throw error;
	}
}

/**
 * Read and parse the aisle configuration.
 *
 * An absent file parses as an empty document rather than a seeded default:
 * unlike the pantry, there is no set of aisles that is obviously right for
 * someone else's supermarket.
 */
export async function readAisle(): Promise<AisleDoc> {
	try {
		const stat = await fs.stat(aislePath());
		const mtimeMs = Math.round(stat.mtimeMs);

		if (cache && cache.mtimeMs === mtimeMs && cache.size === stat.size) {
			return parseAisle(cache.text);
		}

		const text = await fs.readFile(aislePath(), 'utf8');
		cache = { mtimeMs, size: stat.size, text };
		return parseAisle(text);
	} catch {
		return parseAisle('');
	}
}

/** Write the aisle config atomically, creating config/ if it does not exist. */
export async function writeAisle(doc: AisleDoc): Promise<void> {
	const target = aislePath();
	const temp = `${target}.${process.pid}.tmp`;

	await fs.mkdir(path.dirname(target), { recursive: true });

	try {
		await fs.writeFile(temp, serializeAisle(doc), 'utf8');
		await fs.rename(temp, target);
		cache = null;
		revision++;
	} catch (error) {
		await fs.unlink(temp).catch(() => {});
		throw error;
	}
}

/** Serializes read-modify-write cycles, as the pantry and shopping list stores do. */
let queue: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
	const run = queue.then(fn, fn);
	queue = run.then(
		() => undefined,
		() => undefined
	);
	return run;
}

/**
 * Read, modify and write under the lock.
 *
 * The read here deliberately bypasses the cache. Within the lock the file may
 * have been written a moment ago by the previous mutation, and a same-second
 * write of the same size would otherwise be served stale text -- silently
 * discarding the earlier edit.
 */
export async function updateAisle(mutate: (doc: AisleDoc) => void | Promise<void>): Promise<void> {
	await withLock(async () => {
		const doc = parseAisle(await readFresh());
		await mutate(doc);
		await writeAisle(doc);
	});
}
