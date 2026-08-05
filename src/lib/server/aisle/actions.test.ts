import type { RequestEvent } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseAisle, serializeAisle, type AisleDoc } from './format.js';

// The store is mocked with a single in-memory document: readAisle hands it back
// and updateAisle mutates it in place, so the actions can be driven without
// touching the filesystem.
let doc: AisleDoc;

vi.mock('./store.js', () => ({
	readAisle: async () => doc,
	updateAisle: async (mutate: (doc: AisleDoc) => void | Promise<void>) => {
		await mutate(doc);
	}
}));

const { bulkAssign, bulkMove, bulkRemove } = await import('./actions.js');

/** A minimal RequestEvent carrying just the form fields an action reads. */
function event(fields: Array<[string, string]>): RequestEvent {
	const data = new FormData();
	for (const [key, value] of fields) data.append(key, value);
	return { request: { formData: async () => data } } as unknown as RequestEvent;
}

function entry(name: string) {
	return doc.entries.find((candidate) => candidate.name === name);
}

describe('bulkMove', () => {
	beforeEach(() => {
		doc = parseAisle(
			'[dairy]\nbutter | unsalted butter // the good stuff\nmilk\n\n[bakery]\nbread\n'
		);
	});

	it('moves entries and preserves their aliases and comment', async () => {
		await bulkMove(
			event([
				['from', 'dairy'],
				['category', 'bakery'],
				['name', 'butter']
			])
		);

		expect(entry('butter')?.category).toBe('bakery');
		expect(entry('butter')?.aliases).toEqual(['unsalted butter']);
		expect(entry('butter')?.comment).toBe('the good stuff');
		// The alias travels with it, so the line still round-trips whole.
		expect(serializeAisle(doc)).toContain('butter | unsalted butter // the good stuff');
	});

	it('moves several at once and skips names not in the source aisle', async () => {
		await bulkMove(
			event([
				['from', 'dairy'],
				['category', 'bakery'],
				['name', 'milk'],
				['name', 'butter'],
				['name', 'ghost']
			])
		);

		expect(entry('milk')?.category).toBe('bakery');
		expect(entry('butter')?.category).toBe('bakery');
		expect(doc.entries.some((e) => e.name === 'ghost')).toBe(false);
	});
});

describe('bulkRemove', () => {
	beforeEach(() => {
		doc = parseAisle('[dairy]\nbutter\nmilk\ncheese\n');
	});

	it('removes only the named entries', async () => {
		await bulkRemove(
			event([
				['category', 'dairy'],
				['name', 'butter'],
				['name', 'cheese']
			])
		);

		expect(doc.entries.map((e) => e.name)).toEqual(['milk']);
	});
});

describe('bulkAssign', () => {
	beforeEach(() => {
		doc = parseAisle('[dairy]\nmilk\n\n[bakery]\nbread\n');
	});

	it('adds selected ingredients to the chosen aisle', async () => {
		await expect(
			bulkAssign(
				event([
					['category', 'bakery'],
					['name', 'flour'],
					['name', 'yeast']
				])
			)
		).rejects.toMatchObject({ status: 303 });

		expect(entry('flour')?.category).toBe('bakery');
		expect(entry('yeast')?.category).toBe('bakery');
	});

	it('skips a name already claimed by another aisle rather than duplicating it', async () => {
		await expect(
			bulkAssign(
				event([
					['category', 'bakery'],
					['name', 'milk'],
					['name', 'flour']
				])
			)
		).rejects.toMatchObject({ status: 303 });

		// milk stays where it was; only flour is added.
		expect(entry('milk')?.category).toBe('dairy');
		expect(doc.entries.filter((e) => e.name === 'milk')).toHaveLength(1);
		expect(entry('flour')?.category).toBe('bakery');
	});
});
