import type { Actions, PageServerLoad } from './$types';
import { assign, bulkAssign } from '$lib/server/aisle/actions.js';
import { coverageFor } from '$lib/server/aisle/coverage.js';
import { readAisle } from '$lib/server/aisle/store.js';
import { getIndex } from '$lib/server/recipes/index.js';

export const load: PageServerLoad = async () => {
	const [doc, index] = await Promise.all([readAisle(), getIndex()]);
	return {
		unassigned: coverageFor(index.entries, doc).unassigned
	};
};

export const actions: Actions = { assign, bulkAssign };
