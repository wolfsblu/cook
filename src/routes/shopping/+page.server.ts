import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getShoppingList } from '$lib/server/shopping/generate.js';
import {
	clearSelections,
	removeSelection,
	resolveSelections,
	upsertSelection
} from '$lib/server/shopping/store.js';

export const load: PageServerLoad = async () => {
	const selections = await resolveSelections();
	const { list, error, cliMissing, warnings } = await getShoppingList(selections);

	return { selections, list, error, cliMissing, warnings };
};

function readSlug(data: FormData): string | null {
	const slug = data.get('slug');
	return typeof slug === 'string' && slug.length > 0 ? slug : null;
}

function readScale(data: FormData): number {
	const scale = Number(data.get('scale'));
	return Number.isFinite(scale) && scale > 0 ? scale : 1;
}

/**
 * Form actions rather than a client store.
 *
 * The previous store was a module-level $state singleton, which on the server
 * is shared by every SSR request -- one visitor's list could be rendered into
 * another's page, and `hasRecipe()` was evaluated during SSR against whatever
 * the last request happened to leave behind. Actions also mean add and remove
 * work without JavaScript.
 */
export const actions: Actions = {
	add: async ({ request }) => {
		const data = await request.formData();
		const slug = readSlug(data);
		if (!slug) return fail(400, { message: 'Missing recipe' });

		if (!(await upsertSelection(slug, readScale(data)))) {
			return fail(404, { message: `No recipe named "${slug}"` });
		}

		return { success: true };
	},

	setScale: async ({ request }) => {
		const data = await request.formData();
		const slug = readSlug(data);
		if (!slug) return fail(400, { message: 'Missing recipe' });

		if (!(await upsertSelection(slug, readScale(data)))) {
			return fail(404, { message: `No recipe named "${slug}"` });
		}

		return { success: true };
	},

	remove: async ({ request }) => {
		const data = await request.formData();
		const slug = readSlug(data);
		if (!slug) return fail(400, { message: 'Missing recipe' });

		await removeSelection(slug);
		return { success: true };
	},

	clear: async () => {
		await clearSelections();
		return { success: true };
	}
};
