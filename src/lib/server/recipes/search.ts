/**
 * In-process recipe search.
 *
 * This replaces `cook search`, which was spawned as a subprocess per query.
 * That had three problems: it needed the binary, which is not installed in dev;
 * it returned paths that the caller reduced to bare filenames, so every hit in
 * a subdirectory was silently discarded; and it re-read the library from a NAS
 * mount on each keystroke. The corpus is already in memory, so search it there.
 */

import type { RecipeEntry, RecipeIndex } from './index.js';

/**
 * Field weights. Title matches dominate, then tags, then ingredients; a bare
 * mention in the body is the weakest signal.
 */
const WEIGHTS = {
	title: 4,
	tags: 3,
	ingredients: 2,
	body: 1
} as const;

function countOccurrences(haystack: string, needle: string): number {
	if (!needle) return 0;

	let count = 0;
	let position = haystack.indexOf(needle);
	while (position !== -1) {
		count++;
		position = haystack.indexOf(needle, position + needle.length);
	}
	return count;
}

function scoreEntry(entry: RecipeEntry, terms: readonly string[]): number {
	let score = 0;

	for (const term of terms) {
		const inTitle = countOccurrences(entry.searchable.title, term);
		const inTags = countOccurrences(entry.searchable.tags, term);
		const inIngredients = countOccurrences(entry.searchable.ingredients, term);
		const inBody = countOccurrences(entry.searchable.body, term);

		// Every term must appear somewhere, so that multi-word queries narrow
		// rather than widen the result set.
		if (inTitle + inTags + inIngredients + inBody === 0) return 0;

		score +=
			inTitle * WEIGHTS.title +
			inTags * WEIGHTS.tags +
			inIngredients * WEIGHTS.ingredients +
			inBody * WEIGHTS.body;

		// A title that starts with the term is almost always what was meant.
		if (entry.searchable.title.startsWith(term)) score += WEIGHTS.title * 2;
	}

	return score;
}

/**
 * Rank recipes against a query, best first.
 *
 * An empty query returns every entry in the index's own order, so callers can
 * use this unconditionally.
 */
export function searchIndex(index: RecipeIndex, query: string): RecipeEntry[] {
	const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
	if (terms.length === 0) return index.entries;

	return index.entries
		.map((entry) => ({ entry, score: scoreEntry(entry, terms) }))
		.filter((scored) => scored.score > 0)
		.sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title))
		.map((scored) => scored.entry);
}
