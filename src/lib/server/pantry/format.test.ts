import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { findItem, parsePantry, removeItem, serializePantry, upsertItem } from './format';

const REAL_PANTRY = fs.readFileSync(
	path.resolve(process.cwd(), 'recipes/config/pantry.conf'),
	'utf8'
);

describe('round trip', () => {
	it('reproduces the real pantry.conf byte for byte', () => {
		// This is the whole reason the parser is hand-written. If it ever fails,
		// saving the pantry page would quietly rewrite the user's file.
		expect(serializePantry(parsePantry(REAL_PANTRY))).toBe(REAL_PANTRY);
	});

	it('preserves commented-out entries as disabled items', () => {
		const doc = parsePantry(REAL_PANTRY);

		const eggs = findItem(doc, 'fridge', 'eggs');
		expect(eggs).toMatchObject({ disabled: true, quantity: '6' });

		const salt = findItem(doc, 'pantry', 'salt');
		expect(salt).toMatchObject({ disabled: false, quantity: '500%g' });
	});

	it('keeps section order', () => {
		expect(parsePantry(REAL_PANTRY).sections).toEqual(['fridge', 'pantry', 'spices']);
	});

	it('reads quoted keys containing spaces', () => {
		const doc = parsePantry(REAL_PANTRY);
		expect(findItem(doc, 'pantry', 'olive oil')).toMatchObject({
			disabled: true,
			quantity: '750%ml'
		});
		expect(findItem(doc, 'pantry', 'vegetable oil')).toMatchObject({
			disabled: false,
			quantity: '1%L'
		});
	});

	it('round-trips the inline-table form', () => {
		const source = ['[fridge]', 'milk = { quantity = "2%l", expire = "2025-09-20" }', ''].join(
			'\n'
		);
		const doc = parsePantry(source);

		expect(findItem(doc, 'fridge', 'milk')).toMatchObject({
			quantity: '2%l',
			expire: '2025-09-20'
		});
		expect(serializePantry(doc)).toBe(source);
	});

	it('preserves free-text comments and blank lines verbatim', () => {
		const source = [
			'# My pantry',
			'',
			'[fridge]',
			'# things I usually keep',
			'eggs = "6"',
			'',
			''
		].join('\n');

		expect(serializePantry(parsePantry(source))).toBe(source);
	});
});

describe('editing', () => {
	it('updates an item in place without moving it', () => {
		const doc = parsePantry(REAL_PANTRY);
		const before = serializePantry(doc).split(doc.eol);

		upsertItem(doc, {
			name: 'salt',
			section: 'pantry',
			quantity: '250%g',
			low: null,
			bought: null,
			expire: null,
			disabled: false
		});

		const after = serializePantry(doc).split(doc.eol);

		expect(after).toHaveLength(before.length);
		expect(after.indexOf('salt = "250%g"')).toBe(before.indexOf('salt = "500%g"'));
	});

	it('quotes a new key that contains a space', () => {
		const doc = parsePantry('[pantry]\n');
		upsertItem(doc, {
			name: 'plain flour',
			section: 'pantry',
			quantity: '1%kg',
			low: null,
			bought: null,
			expire: null,
			disabled: false
		});

		expect(serializePantry(doc)).toContain('"plain flour" = "1%kg"');
	});

	it('does not quote a simple key', () => {
		const doc = parsePantry('[pantry]\n');
		upsertItem(doc, {
			name: 'rice',
			section: 'pantry',
			quantity: '1%kg',
			low: null,
			bought: null,
			expire: null,
			disabled: false
		});

		expect(serializePantry(doc)).toContain('rice = "1%kg"');
	});

	it('emits the inline-table form only when there is more than a quantity', () => {
		const doc = parsePantry('[fridge]\n');

		upsertItem(doc, {
			name: 'plain',
			section: 'fridge',
			quantity: '1',
			low: null,
			bought: null,
			expire: null,
			disabled: false
		});
		upsertItem(doc, {
			name: 'dated',
			section: 'fridge',
			quantity: '1',
			low: null,
			bought: null,
			expire: '2026-01-01',
			disabled: false
		});

		const text = serializePantry(doc);
		expect(text).toContain('plain = "1"');
		expect(text).toContain('dated = { quantity = "1", expire = "2026-01-01" }');
	});

	it('keeps a toggled item in position', () => {
		const doc = parsePantry(REAL_PANTRY);
		const index = serializePantry(doc).split(doc.eol).indexOf('salt = "500%g"');

		const salt = findItem(doc, 'pantry', 'salt')!;
		salt.disabled = true;

		expect(serializePantry(doc).split(doc.eol)[index]).toBe('# salt = "500%g"');
	});

	it('adds a new item beside its siblings in the right section', () => {
		const doc = parsePantry(REAL_PANTRY);
		upsertItem(doc, {
			name: 'cardamom',
			section: 'spices',
			quantity: '20%g',
			low: null,
			bought: null,
			expire: null,
			disabled: false
		});

		// Split on the document's own ending so CRLF files compare cleanly.
		const lines = serializePantry(doc).split(doc.eol);
		const spicesAt = lines.indexOf('[spices]');
		const cardamomAt = lines.indexOf('cardamom = "20%g"');

		expect(spicesAt).toBeGreaterThan(-1);
		expect(cardamomAt).toBeGreaterThan(spicesAt);
		// No later section header between the two.
		expect(lines.slice(spicesAt + 1, cardamomAt).some((l) => l.startsWith('['))).toBe(false);
		// Directly after the section's last existing item, not after the blank
		// lines that separate sections.
		expect(lines[cardamomAt - 1]).toBe('thyme = "15%g"');
	});

	it('creates a missing section', () => {
		const doc = parsePantry('[fridge]\neggs = "6"\n');
		upsertItem(doc, {
			name: 'bleach',
			section: 'cleaning',
			quantity: '1',
			low: null,
			bought: null,
			expire: null,
			disabled: false
		});

		const text = serializePantry(doc);
		expect(text).toContain('[cleaning]');
		expect(text.indexOf('[cleaning]')).toBeLessThan(text.indexOf('bleach = "1"'));
	});

	it('removes an item and leaves everything else untouched', () => {
		const doc = parsePantry(REAL_PANTRY);
		removeItem(doc, 'pantry', 'salt');

		const text = serializePantry(doc);
		expect(text).not.toContain('salt = "500%g"');
		expect(findItem(doc, 'pantry', 'salt')).toBeUndefined();
		// Everything else survives.
		expect(text).toContain('"vegetable oil" = "1%L"');
		expect(text).toContain('# flour = "400%g"');
	});
});
