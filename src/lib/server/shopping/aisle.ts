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
 *
 * Reading and caching the file itself belongs to $lib/server/aisle, which owns
 * the format. This module used to scrape the section headers with its own
 * regex, which meant two parsers for one file and no way for the app to read
 * the ingredients underneath them.
 */

import { categoryOrder } from '../aisle/format.js';
import { readAisle } from '../aisle/store.js';
import { UNCATEGORIZED } from '$lib/types/shopping-list.js';

/** Section order from the aisle config. Empty when the file is absent. */
export async function getAisleOrder(): Promise<ReadonlyMap<string, number>> {
	return categoryOrder(await readAisle());
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
