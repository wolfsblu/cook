/**
 * Category ordering, taken from the aisle configuration.
 *
 * The previous implementation ordered categories against a hardcoded map of
 * "produce / dairy / meat / pantry / spices / other". None of those names
 * appear in a real aisle.conf, whose sections are "fruit and veg", "milk and
 * dairy", "meat and seafood" and so on, so every category fell through to the
 * same default and the ordering was a no-op.
 *
 * Sections are read in file order instead. That is already the order someone
 * walks a shop in, and it stays correct when the config is edited.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';

/** Categories the CLI emits for anything it could not place. */
const UNCATEGORIZED = 'other';

interface AisleCache {
	mtimeMs: number;
	order: Map<string, number>;
}

let cache: AisleCache | null = null;

function aisleConfigPath(): string {
	return path.join(config.RECIPE_PATH, 'config', 'aisle.conf');
}

/** Parse section headers, keeping the order they appear in. */
function parseSections(text: string): Map<string, number> {
	const order = new Map<string, number>();

	for (const line of text.split(/\r?\n/)) {
		const match = line.trim().match(/^\[(.+)\]$/);
		if (match) {
			const name = match[1].trim().toLowerCase();
			if (!order.has(name)) order.set(name, order.size);
		}
	}

	return order;
}

/**
 * Section order from the aisle config, cached against the file's mtime so an
 * edit is picked up without a restart and an unchanged file is not re-read.
 */
export async function getAisleOrder(): Promise<Map<string, number>> {
	const filePath = aisleConfigPath();

	try {
		const stat = await fs.stat(filePath);
		const mtimeMs = Math.round(stat.mtimeMs);

		if (cache && cache.mtimeMs === mtimeMs) return cache.order;

		const text = await fs.readFile(filePath, 'utf8');
		cache = { mtimeMs, order: parseSections(text) };
		return cache.order;
	} catch {
		// No aisle config: the CLI puts everything in "other" and order is moot.
		return new Map();
	}
}

/** mtime of the aisle config, for cache keys. Zero when absent. */
export async function aisleMtimeMs(): Promise<number> {
	try {
		return Math.round((await fs.stat(aisleConfigPath())).mtimeMs);
	} catch {
		return 0;
	}
}

/**
 * Sort categories by their position in the aisle config.
 *
 * Anything the config does not mention sorts after the known sections but
 * before "other", which always comes last.
 */
export function sortByAisle<T extends { name: string }>(
	categories: T[],
	order: ReadonlyMap<string, number>
): T[] {
	const rank = (name: string): number => {
		const key = name.trim().toLowerCase();
		if (key === UNCATEGORIZED) return Number.MAX_SAFE_INTEGER;
		return order.get(key) ?? Number.MAX_SAFE_INTEGER - 1;
	};

	return [...categories].sort(
		(a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name)
	);
}
