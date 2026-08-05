import type { LayoutServerLoad } from './$types';
import { coverageFor } from '$lib/server/aisle/coverage.js';
import { readAisle } from '$lib/server/aisle/store.js';
import { getIndex } from '$lib/server/recipes/index.js';

/**
 * Data shared by every aisles tab: the aisle list, per-aisle counts, and the
 * unassigned count for the tab badge. Computing it here means the badge is
 * correct on whichever tab you land on, and the child pages inherit it.
 */
export const load: LayoutServerLoad = async () => {
	const [doc, index] = await Promise.all([readAisle(), getIndex()]);

	const counts: Record<string, number> = {};
	for (const name of doc.categories) counts[name] = 0;
	for (const entry of doc.entries) {
		counts[entry.category] = (counts[entry.category] ?? 0) + 1;
	}

	const coverage = coverageFor(index.entries, doc);

	return {
		categories: doc.categories,
		counts,
		total: doc.entries.length,
		unassignedCount: coverage.unassigned.length
	};
};
