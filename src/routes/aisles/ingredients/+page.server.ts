import type { Actions, PageServerLoad } from './$types';
import {
	bulkMove,
	bulkRemove,
	remove,
	resolveDuplicate,
	upsert
} from '$lib/server/aisle/actions.js';
import { findDuplicates, type AisleEntry } from '$lib/server/aisle/format.js';
import { readAisle } from '$lib/server/aisle/store.js';

export interface AisleEntryView extends AisleEntry {
	/** True when this entry's name or one of its aliases is claimed twice. */
	duplicate: boolean;
}

export const load: PageServerLoad = async () => {
	const doc = await readAisle();

	const duplicates = findDuplicates(doc);
	const duplicated = new Set(duplicates.flatMap((duplicate) => duplicate.entries));

	return {
		entries: doc.entries.map((entry): AisleEntryView => ({
			...entry,
			duplicate: duplicated.has(entry)
		})),
		duplicates: duplicates.map((duplicate) => ({
			term: duplicate.term,
			categories: [...new Set(duplicate.entries.map((entry) => entry.category))]
		}))
	};
};

export const actions: Actions = { upsert, remove, bulkMove, bulkRemove, resolveDuplicate };
