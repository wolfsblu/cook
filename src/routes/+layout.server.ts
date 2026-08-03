import type { LayoutServerLoad } from './$types';
import { loadShoppingListFile } from '$lib/cooklang/persistence.js';

/**
 * Feeds the shopping count badge in the navigation.
 *
 * Reads only the selections file. Generating the actual list means spawning
 * the Cook CLI, which would be an absurd cost to pay on every page just to
 * render a number.
 */
export const load: LayoutServerLoad = async () => {
	try {
		const recipes = await loadShoppingListFile();
		return { shoppingCount: recipes.length };
	} catch (error) {
		console.error('Failed to read shopping list selections:', error);
		return { shoppingCount: 0 };
	}
};
