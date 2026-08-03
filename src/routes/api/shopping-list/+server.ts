/**
 * Main shopping list API endpoint
 * GET: Load recipe selections from file and generate shopping list
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadShoppingListFile } from '$lib/cooklang/persistence.js';
import { generateShoppingList, CookCLIError } from '$lib/cooklang/cli.js';
import { transformShoppingList } from '$lib/cooklang/transform.js';
import { getIndex } from '$lib/server/recipes/index.js';
import type { ShoppingListDisplay } from '$lib/types/shopping-list.js';

export const GET: RequestHandler = async () => {
	try {
		// Load recipe selections from file
		const recipes = await loadShoppingListFile();

		// If no recipes, return empty state
		if (recipes.length === 0) {
			return json({
				recipes: [],
				shoppingList: null
			});
		}

		// Selections are stored by slug; the CLI needs the path on disk. Resolving
		// through the index also drops recipes that have since been deleted,
		// rather than failing the whole list on one missing file.
		const index = await getIndex();
		const resolved = recipes.flatMap((selection) => {
			const entry = index.bySlug.get(selection.slug);
			if (!entry) {
				console.warn(`Shopping list references unknown recipe "${selection.slug}", skipping`);
				return [];
			}
			return [{ relPath: entry.relPath, scale: selection.scale }];
		});

		const cliOutput = await generateShoppingList(resolved);

		// Transform to display format
		const shoppingList: ShoppingListDisplay = transformShoppingList(cliOutput, recipes.length);

		return json({
			recipes,
			shoppingList
		});
	} catch (err) {
		console.error('Shopping list generation failed:', err);

		// Handle Cook CLI specific errors. App.Error only carries `message`, so
		// fold the CLI's stderr into it rather than inventing a field.
		if (err instanceof CookCLIError) {
			const detail = err.stderr?.trim();
			throw error(500, {
				message: `Failed to generate shopping list: ${err.message}${detail ? ` (${detail})` : ''}`
			});
		}

		// Handle generic errors
		throw error(500, {
			message: err instanceof Error ? err.message : 'Failed to load shopping list'
		});
	}
};
