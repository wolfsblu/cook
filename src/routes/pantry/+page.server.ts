import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { findItem, removeItem, upsertItem, type PantryItem } from '$lib/server/pantry/format.js';
import {
	daysUntilExpiry,
	formatQuantity,
	isExpiringSoon,
	isLow
} from '$lib/server/pantry/quantity.js';
import { readPantry, updatePantry } from '$lib/server/pantry/store.js';

export interface PantryItemView extends PantryItem {
	displayQuantity: string | null;
	runningLow: boolean;
	expiringSoon: boolean;
	daysLeft: number | null;
}

export const load: PageServerLoad = async () => {
	const doc = await readPantry();

	const items: PantryItemView[] = doc.items.map((item) => ({
		...item,
		displayQuantity: formatQuantity(item.quantity),
		runningLow: isLow(item),
		expiringSoon: isExpiringSoon(item),
		daysLeft: daysUntilExpiry(item)
	}));

	return {
		sections: doc.sections,
		items,
		// Computed here rather than by shelling out to `cook pantry depleted`:
		// the file is already parsed in this process, and this keeps the page
		// working when the CLI is not installed.
		lowCount: items.filter((item) => !item.disabled && item.runningLow).length,
		expiringCount: items.filter((item) => !item.disabled && item.expiringSoon).length
	};
};

function str(data: FormData, key: string): string | null {
	const value = data.get(key);
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

export const actions: Actions = {
	upsert: async ({ request }) => {
		const data = await request.formData();

		const section = str(data, 'section');
		const name = str(data, 'name');
		if (!section || !name) return fail(400, { message: 'Section and name are required' });

		const originalName = str(data, 'originalName');

		await updatePantry((doc) => {
			// A rename is a remove plus an add; doing it in one lock keeps the
			// file from ever holding both spellings.
			if (originalName && originalName.toLowerCase() !== name.toLowerCase()) {
				removeItem(doc, section, originalName);
			}

			const existing = originalName ? findItem(doc, section, originalName) : undefined;

			upsertItem(doc, {
				name,
				section,
				quantity: str(data, 'quantity'),
				low: str(data, 'low'),
				bought: str(data, 'bought'),
				expire: str(data, 'expire'),
				disabled: existing?.disabled ?? false
			});
		});

		return { success: true };
	},

	remove: async ({ request }) => {
		const data = await request.formData();
		const section = str(data, 'section');
		const name = str(data, 'name');
		if (!section || !name) return fail(400, { message: 'Section and name are required' });

		await updatePantry((doc) => {
			removeItem(doc, section, name);
		});

		return { success: true };
	},

	/** Flip an item between "in stock" and "remembered but not stocked". */
	toggle: async ({ request }) => {
		const data = await request.formData();
		const section = str(data, 'section');
		const name = str(data, 'name');
		if (!section || !name) return fail(400, { message: 'Section and name are required' });

		await updatePantry((doc) => {
			const item = findItem(doc, section, name);
			if (item) item.disabled = !item.disabled;
		});

		return { success: true };
	},

	addSection: async ({ request }) => {
		const data = await request.formData();
		const name = str(data, 'name');
		if (!name) return fail(400, { message: 'Section name is required' });

		await updatePantry((doc) => {
			if (doc.sections.includes(name)) return;
			if (doc.lines.length > 0) doc.lines.push({ kind: 'other', raw: '' });
			doc.lines.push({ kind: 'section', name, raw: `[${name}]` });
			doc.sections.push(name);
		});

		return { success: true };
	}
};
