import type { LayoutServerLoad } from './$types';
import { resolveSelections } from '$lib/server/shopping/store.js';

/**
 * Feeds the shopping count badge in the navigation.
 *
 * Resolved against the index rather than counting raw file entries, so the
 * badge cannot disagree with the shopping page when a recipe has been deleted
 * from disk. Both read cached data; generating the actual list would mean
 * spawning the Cook CLI, which is far too much work for a number.
 */
export const load: LayoutServerLoad = async () => {
	try {
		const recipes = await resolveSelections();
		return { shoppingCount: recipes.length };
	} catch (error) {
		console.error('Failed to read shopping list selections:', error);
		return { shoppingCount: 0 };
	}
};
