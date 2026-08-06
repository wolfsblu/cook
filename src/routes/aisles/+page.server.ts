import type { Actions } from './$types';
import {
	addCategory,
	moveCategory,
	removeCategory,
	renameCategory,
	reorderCategories
} from '$lib/server/aisle/actions.js';

// Categories and counts come from the shared /aisles layout load, so this route
// only owns the structural actions.
export const actions: Actions = {
	addCategory,
	renameCategory,
	removeCategory,
	moveCategory,
	reorderCategories
};
