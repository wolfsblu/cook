import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	addAlias,
	addCategory,
	categoryOrder,
	findDuplicates,
	findEntry,
	lookupEntry,
	moveCategory,
	parseAisle,
	removeCategory,
	removeEntry,
	removeTerm,
	renameCategory,
	serializeAisle,
	upsertEntry
} from './format';

const REAL_AISLE = fs.readFileSync(
	path.resolve(process.cwd(), 'recipes/config/aisle.conf'),
	'utf8'
);

/** The categories of the bundled file, in the order it lists them. */
const REAL_CATEGORIES = [
	'fruit and veg',
	'milk and dairy',
	'meat and seafood',
	'breads and baked goods',
	'tinned goods and baking',
	'packaged goods, pasta and sauces',
	'dried herbs and spices',
	'oils and dressings'
];

const lines = (text: string) => text.split(/\r?\n/);

const roundTrip = (text: string) => serializeAisle(parseAisle(text));

describe('round trip', () => {
	it('reproduces the real aisle.conf byte for byte', () => {
		// The whole reason the parser is hand-written. If this fails, saving from
		// the aisles page would quietly rewrite the user's file.
		expect(roundTrip(REAL_AISLE)).toBe(REAL_AISLE);
	});

	it('preserves comments, blank lines and odd spacing', () => {
		const text = [
			'// what I actually buy',
			'',
			'[dairy]',
			'butter|unsalted butter',
			'  milk  ',
			'cheese // the orange one',
			'',
			''
		].join('\n');

		expect(roundTrip(text)).toBe(text);
	});

	it('treats # as an ordinary character, not a comment', () => {
		// pantry.conf comments with #; this file comments with //. Reading # as a
		// comment here would silently drop a real ingredient.
		const text = '[baking]\n#1 flour\n';
		const doc = parseAisle(text);

		expect(doc.entries.map((entry) => entry.name)).toEqual(['#1 flour']);
		expect(serializeAisle(doc)).toBe(text);
	});

	it('preserves CRLF', () => {
		// Built here rather than committed as a fixture: .gitattributes forces
		// *.conf to LF, so a CRLF file cannot survive in the repository.
		const text = '[dairy]\r\nbutter\r\n';

		expect(parseAisle(text).eol).toBe('\r\n');
		expect(roundTrip(text)).toBe(text);
	});
});

describe('parsing', () => {
	it('takes the first name as canonical and the rest as aliases', () => {
		const doc = parseAisle('[dairy]\nbutter | unsalted butter | sweet butter\n');

		expect(doc.entries[0]).toMatchObject({
			name: 'butter',
			aliases: ['unsalted butter', 'sweet butter'],
			category: 'dairy'
		});
	});

	it('splits a trailing comment off the last alias', () => {
		const doc = parseAisle('[dairy]\nbutter | unsalted butter // only the Irish one\n');

		expect(doc.entries[0]).toMatchObject({
			name: 'butter',
			aliases: ['unsalted butter'],
			comment: 'only the Irish one'
		});
	});

	it('reads a commented-out header as a comment, not a category', () => {
		const doc = parseAisle('[dairy]\nbutter\n// [frozen]\n');

		expect(doc.categories).toEqual(['dairy']);
	});

	it('keeps the real categories in file order', () => {
		expect(parseAisle(REAL_AISLE).categories).toEqual(REAL_CATEGORIES);
	});

	it('preserves an ingredient above the first header as unrecognised content', () => {
		// cooklang-rs rejects this file outright. Preserving the line is safer
		// than eating something this app did not write.
		const text = 'stray\n[dairy]\nbutter\n';
		const doc = parseAisle(text);

		expect(doc.entries.map((entry) => entry.name)).toEqual(['butter']);
		expect(serializeAisle(doc)).toBe(text);
	});

	it('indexes categories by lowercased name and file position', () => {
		const order = categoryOrder(parseAisle('[Fruit And Veg]\napples\n\n[Dairy]\nbutter\n'));

		expect([...order]).toEqual([
			['fruit and veg', 0],
			['dairy', 1]
		]);
	});

	it('looks an ingredient up by alias, but finds it only by canonical name', () => {
		const doc = parseAisle('[dairy]\nbutter | unsalted butter\n');

		expect(lookupEntry(doc, 'UNSALTED BUTTER')?.name).toBe('butter');
		expect(lookupEntry(doc, 'butter')?.name).toBe('butter');
		expect(findEntry(doc, 'unsalted butter')).toBeUndefined();
	});
});

describe('duplicates', () => {
	it('finds none in the real file', () => {
		expect(findDuplicates(parseAisle(REAL_AISLE))).toEqual([]);
	});

	it('reports a name claimed by two categories', () => {
		const doc = parseAisle('[dairy]\nbutter\n\n[baking]\nbutter\n');
		const duplicates = findDuplicates(doc);

		expect(duplicates).toHaveLength(1);
		expect(duplicates[0].term).toBe('butter');
		expect(duplicates[0].entries.map((entry) => entry.category)).toEqual(['dairy', 'baking']);
	});

	it('reports an alias colliding with another category’s canonical name', () => {
		const doc = parseAisle('[dairy]\nbutter | ghee\n\n[oils]\nghee\n');

		expect(findDuplicates(doc).map((duplicate) => duplicate.term)).toEqual(['ghee']);
	});

	it('does not report an entry that lists its own name twice', () => {
		expect(findDuplicates(parseAisle('[dairy]\nbutter | Butter\n'))).toEqual([]);
	});
});

describe('editing entries', () => {
	it('updates an entry in place without moving its line', () => {
		const doc = parseAisle(REAL_AISLE);
		const before = lines(REAL_AISLE).indexOf('apples');

		upsertEntry(doc, {
			name: 'apples',
			aliases: ['apple'],
			category: 'fruit and veg',
			comment: null
		});

		const after = lines(serializeAisle(doc));
		expect(after).toHaveLength(lines(REAL_AISLE).length);
		expect(after[before]).toBe('apples | apple');
	});

	it('inserts after the category’s last entry, not after the blank separator', () => {
		const doc = parseAisle(REAL_AISLE);

		upsertEntry(doc, { name: 'kohlrabi', aliases: [], category: 'fruit and veg', comment: null });

		const after = lines(serializeAisle(doc));
		expect(after[after.indexOf('kohlrabi') - 1]).toBe('tomatoes');
	});

	it('renders an edited line canonically without reformatting its siblings', () => {
		const doc = parseAisle('[dairy]\nbutter|unsalted butter\nmilk|whole milk\n');

		upsertEntry(doc, {
			name: 'milk',
			aliases: ['whole milk', 'full fat'],
			category: 'dairy',
			comment: null
		});

		expect(serializeAisle(doc)).toBe(
			'[dairy]\nbutter|unsalted butter\nmilk | whole milk | full fat\n'
		);
	});

	it('creates the category when it does not exist yet', () => {
		const doc = parseAisle('[dairy]\nbutter\n');

		upsertEntry(doc, { name: 'peas', aliases: [], category: 'frozen', comment: null });

		expect(doc.categories).toEqual(['dairy', 'frozen']);
		expect(serializeAisle(doc)).toBe('[dairy]\nbutter\n\n[frozen]\npeas\n');
	});

	it('removes an entry and leaves every other line untouched', () => {
		const doc = parseAisle(REAL_AISLE);
		removeEntry(doc, 'fruit and veg', 'apples');

		const expected = lines(REAL_AISLE).filter((line) => line !== 'apples');
		expect(lines(serializeAisle(doc))).toEqual(expected);
	});

	it('appends an alias, re-rendering only that line', () => {
		const doc = parseAisle('[dairy]\nbutter\nmilk|whole milk\n');
		addAlias(doc, 'butter', 'unsalted butter');

		expect(serializeAisle(doc)).toBe('[dairy]\nbutter | unsalted butter\nmilk|whole milk\n');
	});

	it('does not add an alias an entry already answers to', () => {
		const doc = parseAisle('[dairy]\nbutter | ghee\n');
		addAlias(doc, 'butter', 'GHEE');

		expect(doc.entries[0].aliases).toEqual(['ghee']);
	});

	it('strips a duplicated alias but keeps the entry', () => {
		const doc = parseAisle('[dairy]\nbutter | ghee\n\n[oils]\nghee\n');
		removeTerm(doc, 'dairy', 'ghee');

		expect(serializeAisle(doc)).toBe('[dairy]\nbutter\n\n[oils]\nghee\n');
	});

	it('drops the whole entry when the duplicated term is its canonical name', () => {
		const doc = parseAisle('[dairy]\nbutter\n\n[baking]\nbutter\n');
		removeTerm(doc, 'baking', 'butter');

		expect(serializeAisle(doc)).toBe('[dairy]\nbutter\n\n[baking]\n');
	});
});

describe('editing categories', () => {
	it('appends a category before the trailing newline', () => {
		const doc = parseAisle(REAL_AISLE);
		addCategory(doc, 'frozen');

		const text = serializeAisle(doc);
		expect(doc.categories).toEqual([...REAL_CATEGORIES, 'frozen']);
		expect(text.endsWith('[frozen]' + (doc.eol === '\r\n' ? '\r\n' : '\n'))).toBe(true);
	});

	it('leaves an existing category alone', () => {
		const doc = parseAisle(REAL_AISLE);
		addCategory(doc, 'FRUIT AND VEG');

		expect(serializeAisle(doc)).toBe(REAL_AISLE);
	});

	it('renames only the header', () => {
		const doc = parseAisle(REAL_AISLE);
		renameCategory(doc, 'fruit and veg', 'produce');

		const expected = lines(REAL_AISLE);
		expected[expected.indexOf('[fruit and veg]')] = '[produce]';

		expect(lines(serializeAisle(doc))).toEqual(expected);
		expect(doc.entries[0].category).toBe('produce');
		expect([...categoryOrder(doc)][0]).toEqual(['produce', 0]);
	});

	it('takes a removed category’s blank run with it', () => {
		const doc = parseAisle('[a]\nx\n\n[b]\ny\n\n[c]\nz\n');
		removeCategory(doc, 'b');

		expect(serializeAisle(doc)).toBe('[a]\nx\n\n[c]\nz\n');
	});
});

describe('reordering categories', () => {
	it('moves the header and every line under it, leaving the blank run in place', () => {
		const doc = parseAisle('[a]\nx\n\n\n[b]\ny\n// about y\n\n[c]\nz\n');
		moveCategory(doc, 'b', 'up');

		// The comment travels inside b's block; both blank runs stay in their
		// slots, so the file's spacing is unchanged.
		expect(lines(serializeAisle(doc))).toEqual([
			'[b]',
			'y',
			'// about y',
			'',
			'',
			'[a]',
			'x',
			'',
			'[c]',
			'z',
			''
		]);
	});

	it('preserves every line of the real file, and its length', () => {
		const doc = parseAisle(REAL_AISLE);
		moveCategory(doc, 'oils and dressings', 'up');

		const after = lines(serializeAisle(doc));
		expect(after).toHaveLength(lines(REAL_AISLE).length);
		expect([...after].sort()).toEqual([...lines(REAL_AISLE)].sort());
	});

	it('reorders the categories the shopping list groups by', () => {
		const doc = parseAisle(REAL_AISLE);
		moveCategory(doc, 'milk and dairy', 'up');

		expect(doc.categories.slice(0, 2)).toEqual(['milk and dairy', 'fruit and veg']);
	});

	it('returns the original bytes after a move and its reverse', () => {
		const doc = parseAisle(REAL_AISLE);
		moveCategory(doc, 'oils and dressings', 'up');
		moveCategory(doc, 'oils and dressings', 'down');

		expect(serializeAisle(doc)).toBe(REAL_AISLE);
	});

	it('keeps the trailing newline when the last category moves up', () => {
		// The last category has no blank line after it. If gaps travelled with
		// their blocks, this would glue "white wine" onto the next header and
		// strip the file's final newline.
		const doc = parseAisle(REAL_AISLE);
		moveCategory(doc, 'oils and dressings', 'up');

		const text = serializeAisle(doc);
		expect(text.endsWith('\n')).toBe(true);
		expect(text).not.toMatch(/white wine\r?\n\[/);
	});

	it('is a no-op at either end', () => {
		const doc = parseAisle(REAL_AISLE);

		moveCategory(doc, 'fruit and veg', 'up');
		moveCategory(doc, 'oils and dressings', 'down');
		moveCategory(doc, 'no such aisle', 'up');

		expect(serializeAisle(doc)).toBe(REAL_AISLE);
	});

	it('leaves a preamble comment at the top', () => {
		const doc = parseAisle('// my shop\n\n[a]\nx\n\n[b]\ny\n');
		moveCategory(doc, 'b', 'up');

		expect(lines(serializeAisle(doc)).slice(0, 2)).toEqual(['// my shop', '']);
	});
});
