/**
 * pantry.conf parsing and serialization.
 *
 * Deliberately a line-oriented parser rather than a TOML library:
 *
 *  - More than half of a typical pantry.conf is commented-out entries
 *    (`# flour = "400%g"`). They are not noise -- they are a template of what
 *    the user stocks, toggled off. Every general-purpose TOML round-tripper
 *    discards comments, which would silently destroy that.
 *  - Section order is meaningful for the UI; TOML tables are unordered.
 *  - Anything not recognised is preserved verbatim at its original position,
 *    so editing one item cannot reformat the rest of someone's file.
 *
 * The grammar is small enough that this is less code than configuring a
 * library to preserve everything.
 */

/** A single stocked (or template) item. */
export interface PantryItem {
	name: string;
	section: string;
	/** Raw cooklang quantity, e.g. "500%g" or "6". Null when only presence matters. */
	quantity: string | null;
	/** Threshold below which the item counts as running low. */
	low: string | null;
	bought: string | null;
	expire: string | null;
	/** True for `# name = "..."` entries: remembered, but not in stock. */
	disabled: boolean;
}

type Line =
	| { kind: 'section'; name: string; raw: string }
	| { kind: 'item'; item: PantryItem }
	| { kind: 'other'; raw: string };

export interface PantryDoc {
	/** Section names in file order. */
	sections: string[];
	items: PantryItem[];
	/** Every line, so unknown content survives a round trip. */
	lines: Line[];
	/**
	 * The file's own line ending, preserved on write.
	 *
	 * A pantry.conf edited on Windows uses CRLF. Splitting on "\n" and joining
	 * with "\n" would silently rewrite every line in the file the first time
	 * anything was saved, turning a one-line edit into a whole-file diff.
	 */
	eol: '\n' | '\r\n';
}

const SECTION_RE = /^\s*\[([^\]]+)\]\s*$/;

/** `key = value`, optionally commented out, where key may be quoted. */
const ENTRY_RE = /^(\s*)(#\s*)?("([^"]*)"|[^\s=#][^=]*?)\s*=\s*(.+?)\s*$/;

/** Attributes recognised inside the inline-table form. */
const ATTRIBUTES = ['quantity', 'low', 'bought', 'expire'] as const;
type Attribute = (typeof ATTRIBUTES)[number];

function unquote(value: string): string {
	const trimmed = value.trim();
	if (
		(trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2)
	) {
		return trimmed.slice(1, -1);
	}
	return trimmed;
}

/**
 * Parse the right-hand side, which is either a bare value:
 *   salt = "500%g"
 * or an inline table:
 *   milk = { quantity = "2%l", expire = "2025-09-20" }
 */
function parseValue(raw: string): Pick<PantryItem, 'quantity' | 'low' | 'bought' | 'expire'> {
	const result = { quantity: null as string | null, low: null, bought: null, expire: null } as Pick<
		PantryItem,
		'quantity' | 'low' | 'bought' | 'expire'
	>;

	const trimmed = raw.trim();

	if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
		for (const part of trimmed.slice(1, -1).split(',')) {
			const [key, ...rest] = part.split('=');
			if (rest.length === 0) continue;

			const attribute = key.trim().toLowerCase();
			if ((ATTRIBUTES as readonly string[]).includes(attribute)) {
				result[attribute as Attribute] = unquote(rest.join('='));
			}
		}
		return result;
	}

	result.quantity = unquote(trimmed) || null;
	return result;
}

/** Parse a pantry.conf into sections, items, and the lines they came from. */
export function parsePantry(text: string): PantryDoc {
	const lines: Line[] = [];
	const items: PantryItem[] = [];
	const sections: string[] = [];

	const eol: '\n' | '\r\n' = text.includes('\r\n') ? '\r\n' : '\n';

	let current = '';

	for (const raw of text.split(/\r?\n/)) {
		const sectionMatch = raw.match(SECTION_RE);
		if (sectionMatch) {
			current = sectionMatch[1].trim();
			if (!sections.includes(current)) sections.push(current);
			lines.push({ kind: 'section', name: current, raw });
			continue;
		}

		const entryMatch = raw.match(ENTRY_RE);
		if (entryMatch && current) {
			const [, , commented, rawKey, quotedKey, rawValue] = entryMatch;

			// A `#` that is not followed by `key = value` is an ordinary comment.
			const name = (quotedKey ?? rawKey).trim();
			if (name) {
				const item: PantryItem = {
					name,
					section: current,
					disabled: Boolean(commented),
					...parseValue(rawValue)
				};
				items.push(item);
				lines.push({ kind: 'item', item });
				continue;
			}
		}

		lines.push({ kind: 'other', raw });
	}

	return { sections, items, lines, eol };
}

/** Quote a key only when it contains something that needs it. */
function formatKey(name: string): string {
	return /^[A-Za-z0-9_-]+$/.test(name) ? name : `"${name}"`;
}

function formatItem(item: PantryItem): string {
	const extras = (['low', 'bought', 'expire'] as const).filter((key) => item[key]);

	// The inline-table form is only used when it is actually needed, so a plain
	// `salt = "500%g"` stays plain.
	const value =
		extras.length > 0
			? `{ ${[
					`quantity = "${item.quantity ?? ''}"`,
					...extras.map((key) => `${key} = "${item[key]}"`)
				].join(', ')} }`
			: `"${item.quantity ?? ''}"`;

	return `${item.disabled ? '# ' : ''}${formatKey(item.name)} = ${value}`;
}

/**
 * Serialize a document back to text.
 *
 * Lines are emitted in their original order; unrecognised lines are written
 * back byte for byte. serializePantry(parsePantry(x)) === x for any file this
 * has not been asked to change.
 */
export function serializePantry(doc: PantryDoc): string {
	return doc.lines
		.map((line) => (line.kind === 'item' ? formatItem(line.item) : line.raw))
		.join(doc.eol);
}

/** Add an item, or update it in place if the name already exists in that section. */
export function upsertItem(doc: PantryDoc, item: PantryItem): PantryDoc {
	const existing = doc.lines.find(
		(line) =>
			line.kind === 'item' &&
			line.item.section === item.section &&
			line.item.name.toLowerCase() === item.name.toLowerCase()
	);

	if (existing && existing.kind === 'item') {
		Object.assign(existing.item, item);
		return doc;
	}

	// Insert after the section's last item, so new entries sit with their
	// siblings rather than after the blank lines that separate sections.
	let insertAt = -1;
	let inSection = false;

	for (const [index, line] of doc.lines.entries()) {
		if (line.kind === 'section') {
			if (line.name === item.section) {
				inSection = true;
				insertAt = index;
				continue;
			}
			if (inSection) break;
		}

		if (inSection && line.kind === 'item') insertAt = index;
	}

	if (insertAt === -1) {
		// Unknown section: append it.
		if (doc.lines.length > 0 && doc.lines.at(-1)?.kind !== 'other') {
			doc.lines.push({ kind: 'other', raw: '' });
		}
		doc.lines.push({ kind: 'section', name: item.section, raw: `[${item.section}]` });
		doc.sections.push(item.section);
		insertAt = doc.lines.length - 1;
	}

	doc.lines.splice(insertAt + 1, 0, { kind: 'item', item });
	doc.items.push(item);
	return doc;
}

/** Remove an item entirely, including its line. */
export function removeItem(doc: PantryDoc, section: string, name: string): PantryDoc {
	const matches = (item: PantryItem) =>
		item.section === section && item.name.toLowerCase() === name.toLowerCase();

	doc.lines = doc.lines.filter((line) => !(line.kind === 'item' && matches(line.item)));
	doc.items = doc.items.filter((item) => !matches(item));
	return doc;
}

/** Find an item by section and name. */
export function findItem(doc: PantryDoc, section: string, name: string): PantryItem | undefined {
	return doc.items.find(
		(item) => item.section === section && item.name.toLowerCase() === name.toLowerCase()
	);
}
