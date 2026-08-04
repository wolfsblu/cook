/**
 * Which of the library's ingredients the aisle configuration actually covers.
 *
 * The CLI matches an ingredient to an aisle by exact name, case-insensitively
 * and nothing more, so "onion" and "onions" are two separate entries -- which
 * is why the bundled aisle.conf lists both, along with "red onion" and "red
 * onions". Anything it cannot match lands in "other" at the bottom of the
 * shopping list, and until now there was no way to find out which ingredients
 * those were without shopping with them.
 *
 * The matching here is exactly as literal as the CLI's, on purpose. Stemming
 * "onions" onto "onion" would report coverage the shopping list does not have.
 * The near-miss is offered as a suggestion instead, so it can be fixed by
 * adding an alias rather than another top-level entry.
 */

import { lookupEntry, type AisleDoc } from './format.js';
import type { RecipeEntry } from '../recipes/index.js';

/** How many using recipes to name per unassigned ingredient. */
const SAMPLE_LIMIT = 3;

/**
 * The slice of a recipe this needs. Narrower than RecipeIndex so tests can pass
 * plain object literals instead of building a whole index.
 */
export type CoverageRecipe = Pick<RecipeEntry, 'slug' | 'title' | 'ingredientNames'>;

export interface AisleCoverageItem {
	/** The ingredient name as the recipes write it. */
	name: string;
	recipeCount: number;
	/** A few of the recipes using it, for context. */
	recipes: { slug: string; title: string }[];
	/**
	 * An existing canonical name this looks like a variant of, or null. Drives
	 * an "add as an alias of X" action rather than a new entry.
	 */
	suggestedAliasOf: string | null;
}

export interface AisleCoverage {
	unassigned: AisleCoverageItem[];
	assignedCount: number;
	totalCount: number;
	/** Aisle entries no recipe mentions. Stale or aspirational, not an error. */
	unusedEntries: { name: string; category: string }[];
}

/**
 * Strip a plural ending. Deliberately crude: it only has to be good enough to
 * offer a suggestion someone confirms, and a wrong guess costs a glance.
 */
function singular(name: string): string {
	const lower = name.trim().toLowerCase();
	if (lower.endsWith('es')) return lower.slice(0, -2);
	if (lower.endsWith('s')) return lower.slice(0, -1);
	return lower;
}

export function coverageFor(recipes: readonly CoverageRecipe[], doc: AisleDoc): AisleCoverage {
	const canonical = new Map(
		doc.entries.map((entry) => [entry.name.trim().toLowerCase(), entry.name])
	);

	const unassigned = new Map<string, AisleCoverageItem>();
	const used = new Set<string>();
	let assignedCount = 0;
	let totalCount = 0;

	for (const recipe of recipes) {
		for (const name of recipe.ingredientNames) {
			totalCount++;

			const entry = lookupEntry(doc, name);
			if (entry) {
				assignedCount++;
				used.add(entry.name.trim().toLowerCase());
				continue;
			}

			const key = name.trim().toLowerCase();
			const existing = unassigned.get(key);

			if (existing) {
				existing.recipeCount++;
				if (existing.recipes.length < SAMPLE_LIMIT) {
					existing.recipes.push({ slug: recipe.slug, title: recipe.title });
				}
				continue;
			}

			// A suggestion only when the singular form is a canonical name that
			// already exists; "kohlrabi" has nothing to be an alias of.
			const stem = singular(name);
			const suggestion = canonical.get(stem);

			unassigned.set(key, {
				name,
				recipeCount: 1,
				recipes: [{ slug: recipe.slug, title: recipe.title }],
				suggestedAliasOf: suggestion && stem !== key ? suggestion : null
			});
		}
	}

	return {
		// Most-used first: the ingredient worth categorising is the one that
		// keeps turning up at the bottom of the list.
		unassigned: [...unassigned.values()].sort(
			(a, b) => b.recipeCount - a.recipeCount || a.name.localeCompare(b.name)
		),
		assignedCount,
		totalCount,
		unusedEntries: doc.entries
			.filter((entry) => !used.has(entry.name.trim().toLowerCase()))
			.map((entry) => ({ name: entry.name, category: entry.category }))
	};
}
