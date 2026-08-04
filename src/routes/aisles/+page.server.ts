import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { coverageFor } from '$lib/server/aisle/coverage.js';
import {
	addAlias,
	addCategory,
	findDuplicates,
	moveCategory,
	removeCategory,
	removeEntry,
	removeTerm,
	renameCategory,
	upsertEntry,
	type AisleEntry
} from '$lib/server/aisle/format.js';
import { readAisle, updateAisle } from '$lib/server/aisle/store.js';
import { getIndex } from '$lib/server/recipes/index.js';
import { UNCATEGORIZED } from '$lib/types/shopping-list.js';

export interface AisleEntryView extends AisleEntry {
	/** True when this entry's name or one of its aliases is claimed twice. */
	duplicate: boolean;
}

export const load: PageServerLoad = async () => {
	const [doc, index] = await Promise.all([readAisle(), getIndex()]);

	const duplicates = findDuplicates(doc);
	const duplicated = new Set(duplicates.flatMap((duplicate) => duplicate.entries));

	return {
		categories: doc.categories,
		entries: doc.entries.map((entry): AisleEntryView => ({
			...entry,
			duplicate: duplicated.has(entry)
		})),
		duplicates: duplicates.map((duplicate) => ({
			term: duplicate.term,
			categories: [...new Set(duplicate.entries.map((entry) => entry.category))]
		})),
		coverage: coverageFor(index.entries, doc)
	};
};

function str(data: FormData, key: string): string | null {
	const value = data.get(key);
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

/**
 * Read a list of names. Split on newlines and on the file's own separator, so a
 * line pasted straight out of aisle.conf works as well as one name per line.
 */
function list(data: FormData, key: string): string[] {
	const value = data.get(key);
	if (typeof value !== 'string') return [];

	const seen = new Set<string>();
	const names: string[] = [];

	for (const part of value.split(/[\n|]/)) {
		const name = part.trim();
		if (!name || seen.has(name.toLowerCase())) continue;
		seen.add(name.toLowerCase());
		names.push(name);
	}

	return names;
}

/**
 * A category name has to survive a write followed by a read.
 *
 * `|` is the alias separator, so a category containing one cannot. "other" is
 * reserved: it is what the CLI emits for anything it could not place, and
 * sortByAisle pins it last, so a real aisle by that name would sink to the
 * bottom of the shopping list wherever the file put it.
 */
function categoryError(name: string): string | null {
	if (name.includes('|') || name.includes('//')) {
		return 'An aisle name cannot contain “|” or “//”.';
	}
	if (name.toLowerCase() === UNCATEGORIZED) {
		return '“Other” is where uncategorised ingredients go, so it cannot be an aisle.';
	}
	if (name.includes('[') || name.includes(']')) {
		return 'An aisle name cannot contain brackets.';
	}
	return null;
}

/** Same reasoning as categoryError: these characters change how the line parses. */
function nameError(name: string): string | null {
	return name.includes('|') || name.includes('//')
		? 'An ingredient name cannot contain “|” or “//”.'
		: null;
}

/**
 * Where to go after a one-click assignment. Only same-site absolute paths: a
 * value starting with "//" is protocol-relative, so "//evil.example" would
 * redirect off the site.
 */
function safeReturnTo(value: string | null): string {
	return value && value.startsWith('/') && !value.startsWith('//') ? value : '/aisles';
}

export const actions: Actions = {
	upsert: async ({ request }) => {
		const data = await request.formData();

		const name = str(data, 'name');
		const category = str(data, 'category');
		if (!name || !category) return fail(400, { message: 'Name and aisle are required' });

		const aliases = list(data, 'aliases').filter(
			(alias) => alias.toLowerCase() !== name.toLowerCase()
		);

		for (const term of [name, ...aliases]) {
			const error = nameError(term);
			if (error) return fail(400, { message: error });
		}

		const originalName = str(data, 'originalName');
		const originalCategory = str(data, 'originalCategory') ?? category;

		const doc = await readAisle();

		// Refuse to write a duplicate rather than leaving the CLI to warn about
		// it on stderr, where nothing on the page would explain the result.
		for (const term of [name, ...aliases]) {
			const clash = doc.entries.find(
				(entry) =>
					[entry.name, ...entry.aliases].some((it) => it.toLowerCase() === term.toLowerCase()) &&
					!(
						entry.category.toLowerCase() === originalCategory.toLowerCase() &&
						entry.name.toLowerCase() === (originalName ?? name).toLowerCase()
					)
			);

			if (clash) {
				return fail(400, { message: `“${term}” is already in ${clash.category}.` });
			}
		}

		await updateAisle((current) => {
			// A rename or a move is a remove plus an add. Doing both inside one
			// lock keeps the file from ever holding two entries for one thing.
			const renamed = !!originalName && originalName.toLowerCase() !== name.toLowerCase();
			const moved = originalCategory.toLowerCase() !== category.toLowerCase();
			if (originalName && (renamed || moved)) {
				removeEntry(current, originalCategory, originalName);
			}

			upsertEntry(current, { name, aliases, category, comment: str(data, 'comment') });
		});

		return { success: true };
	},

	remove: async ({ request }) => {
		const data = await request.formData();
		const category = str(data, 'category');
		const name = str(data, 'name');
		if (!category || !name) return fail(400, { message: 'Aisle and name are required' });

		await updateAisle((doc) => {
			removeEntry(doc, category, name);
		});

		return { success: true };
	},

	/**
	 * One-click assignment, used by the unassigned list and by the shopping
	 * list's "other" group. Redirects rather than returning, so the page that
	 * asked for it re-renders with the new grouping.
	 */
	assign: async ({ request }) => {
		const data = await request.formData();

		const name = str(data, 'name');
		const category = str(data, 'category');
		const returnTo = safeReturnTo(str(data, 'returnTo'));
		if (!name || !category) return fail(400, { message: 'Name and aisle are required' });

		const error = nameError(name);
		if (error) return fail(400, { message: error });

		const aliasOf = str(data, 'aliasOf');

		await updateAisle((doc) => {
			if (aliasOf) addAlias(doc, aliasOf, name);
			else upsertEntry(doc, { name, aliases: [], category, comment: null });
		});

		redirect(303, returnTo);
	},

	addCategory: async ({ request }) => {
		const data = await request.formData();
		const name = str(data, 'name');
		if (!name) return fail(400, { message: 'An aisle name is required' });

		const error = categoryError(name);
		if (error) return fail(400, { message: error });

		await updateAisle((doc) => {
			addCategory(doc, name);
		});

		return { success: true };
	},

	renameCategory: async ({ request }) => {
		const data = await request.formData();
		const from = str(data, 'from');
		const to = str(data, 'to');
		if (!from || !to) return fail(400, { message: 'Both names are required' });

		const error = categoryError(to);
		if (error) return fail(400, { message: error });

		await updateAisle((doc) => {
			renameCategory(doc, from, to);
		});

		return { success: true };
	},

	removeCategory: async ({ request }) => {
		const data = await request.formData();
		const name = str(data, 'name');
		if (!name) return fail(400, { message: 'An aisle name is required' });

		const doc = await readAisle();
		const populated = doc.entries.filter(
			(entry) => entry.category.toLowerCase() === name.toLowerCase()
		);

		// Deleting an aisle full of ingredients would drop every one of them, and
		// the only record of where they belonged is the file being edited.
		if (populated.length > 0) {
			return fail(400, {
				message: `${name} still has ${populated.length} ingredient${populated.length === 1 ? '' : 's'}. Move or remove them first.`
			});
		}

		await updateAisle((current) => {
			removeCategory(current, name);
		});

		return { success: true };
	},

	moveCategory: async ({ request }) => {
		const data = await request.formData();
		const name = str(data, 'name');
		const direction = str(data, 'direction');
		if (!name || (direction !== 'up' && direction !== 'down')) {
			return fail(400, { message: 'An aisle and a direction are required' });
		}

		await updateAisle((doc) => {
			moveCategory(doc, name, direction);
		});

		return { success: true };
	},

	/** Settle a duplicate by keeping one claimant and stripping the term from the rest. */
	resolveDuplicate: async ({ request }) => {
		const data = await request.formData();
		const term = str(data, 'term');
		const keepCategory = str(data, 'keepCategory');
		if (!term || !keepCategory) return fail(400, { message: 'A term and an aisle are required' });

		await updateAisle((doc) => {
			const others = [
				...new Set(
					doc.entries
						.filter((entry) =>
							[entry.name, ...entry.aliases].some((it) => it.toLowerCase() === term.toLowerCase())
						)
						.map((entry) => entry.category)
						.filter((category) => category.toLowerCase() !== keepCategory.toLowerCase())
				)
			];

			for (const category of others) removeTerm(doc, category, term);
		});

		return { success: true };
	}
};
