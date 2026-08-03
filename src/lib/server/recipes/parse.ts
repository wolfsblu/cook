/**
 * Full recipe parsing for the detail page.
 *
 * The index keeps only what the list page needs. Rendering a single recipe
 * needs the whole parse tree turned into display strings, which is expensive
 * enough to be worth caching -- and it is scale-dependent, since cooklang
 * applies scaling during parsing.
 */

import {
	CooklangParser,
	cookware_display_name,
	cookware_should_be_listed,
	grouped_quantity_display,
	grouped_quantity_is_empty,
	ingredient_display_name,
	ingredient_should_be_listed,
	quantity_display
} from '@cooklang/cooklang';
import fs from 'node:fs/promises';
import type { RecipeDisplay } from '$lib/types/recipe.js';
import type { RecipeEntry } from './index.js';

/**
 * Cache size. Keyed by slug *and* scale, so a user dragging the servings
 * control generates a new entry per step; the cap stops that from growing
 * without bound.
 */
const CACHE_LIMIT = 64;

/** Insertion-ordered map used as an LRU: re-inserting moves a key to the end. */
const cache = new Map<string, RecipeDisplay>();

/** Clamp scale to a sane range; it arrives from a query parameter. */
export function clampScale(raw: string | null): number {
	const parsed = Number(raw);
	if (!Number.isFinite(parsed) || parsed <= 0) return 1;
	return Math.min(Math.max(parsed, 0.1), 100);
}

function remember(key: string, value: RecipeDisplay): RecipeDisplay {
	cache.set(key, value);

	if (cache.size > CACHE_LIMIT) {
		const oldest = cache.keys().next();
		if (!oldest.done) cache.delete(oldest.value);
	}

	return value;
}

/**
 * Parse a recipe and pre-compute every display string the client needs.
 *
 * All the cooklang helper calls happen here so the Svelte components stay
 * presentational, which is how the original detail route worked.
 */
export async function getRecipeDisplay(entry: RecipeEntry, scale: number): Promise<RecipeDisplay> {
	// mtime is part of the key, so editing a file invalidates its cached render
	// without anyone having to remember to clear it.
	const key = `${entry.slug}|${entry.mtimeMs}|${scale}`;

	const hit = cache.get(key);
	if (hit) {
		// Refresh recency.
		cache.delete(key);
		return remember(key, hit);
	}

	const source = await fs.readFile(entry.absPath, 'utf8');
	const parser = new CooklangParser();
	const [recipe] = parser.parse(source, scale);

	const ingredients = recipe.groupedIngredients
		.filter(([ingredient]) => ingredient_should_be_listed(ingredient))
		.map(([ingredient, quantity], index) => ({
			index,
			name: ingredient_display_name(ingredient),
			quantity: !grouped_quantity_is_empty(quantity) ? grouped_quantity_display(quantity) : null,
			note: ingredient.note
		}));

	const cookware = recipe.groupedCookware
		.filter(([item]) => cookware_should_be_listed(item))
		.map(([item, quantity], index) => ({
			index,
			name: cookware_display_name(item),
			quantity: !grouped_quantity_is_empty(quantity) ? grouped_quantity_display(quantity) : null,
			note: item.note
		}));

	const sections = recipe.sections.map((section) => ({
		name: section.name,
		content: section.content.map((content) => {
			if (content.type === 'text') {
				return { type: 'text' as const, value: content.value };
			}

			return {
				type: 'step' as const,
				number: content.value.number,
				items: content.value.items.map((item) => {
					if (item.type === 'text') {
						return { type: 'text' as const, value: item.value };
					}

					if (item.type === 'ingredient') {
						const ingredient = recipe.ingredients[item.index];
						return {
							type: 'ingredient' as const,
							index: item.index,
							name: ingredient_display_name(ingredient),
							quantity: ingredient.quantity ? quantity_display(ingredient.quantity) : null
						};
					}

					if (item.type === 'cookware') {
						const cookwareItem = recipe.cookware[item.index];
						return {
							type: 'cookware' as const,
							index: item.index,
							name: cookware_display_name(cookwareItem),
							quantity: cookwareItem.quantity ? quantity_display(cookwareItem.quantity) : null
						};
					}

					if (item.type === 'timer') {
						const timer = recipe.timers[item.index];
						return {
							type: 'timer' as const,
							index: item.index,
							name: timer.name,
							quantity: timer.quantity ? quantity_display(timer.quantity) : null
						};
					}

					return {
						type: 'inlineQuantity' as const,
						index: item.index,
						quantity: quantity_display(recipe.inlineQuantities[item.index])
					};
				})
			};
		})
	}));

	const display: RecipeDisplay = {
		title: recipe.title || entry.title,
		description: recipe.description,
		tags: Array.from(recipe.tags ?? []),
		author: recipe.author,
		source: recipe.source,
		servings: recipe.servings,
		time: recipe.time,
		ingredients,
		cookware,
		sections
	};

	return remember(key, display);
}
