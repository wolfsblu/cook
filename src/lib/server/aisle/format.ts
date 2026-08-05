/**
 * aisle.conf parsing and serialization.
 *
 * A line-oriented round-tripping parser, for the same reason pantry.conf has
 * one: this file is hand-edited, and an edit to one ingredient must not
 * reformat the rest of it.
 *
 * Two things differ from the pantry parser, both of them load-bearing:
 *
 *  - `//` starts a comment here, and `#` does not. pantry.conf is the other way
 *    around. Reading `# flour` as a comment in this file would turn a real
 *    ingredient into one, and reading `// note` as an ingredient would put a
 *    sentence on the shopping list.
 *  - Every line carries `raw`, and is re-rendered only when `raw` is null.
 *    pantry.conf's grammar is canonical enough that re-rendering an item is a
 *    no-op; this one is not. `butter|unsalted butter`, `butter | unsalted
 *    butter` and `  butter |unsalted  ` are all legal and all mean the same
 *    thing, so re-rendering unconditionally would turn a one-entry edit into a
 *    whole-file diff.
 *
 * The consequence of that second point: assigning to an entry outside the
 * mutators below will not be written out, because `raw` still holds the
 * original bytes. Go through upsertEntry / addAlias / removeTerm, which clear
 * it.
 */

/** One ingredient line: the canonical name plus any alternative spellings. */
export interface AisleEntry {
	/**
	 * The name the CLI prints on the shopping list. Always the first field on
	 * the line -- cooklang-rs calls it the common name used in lists.
	 */
	name: string;
	/** Alternative spellings that resolve to `name`. */
	aliases: string[];
	/** Owning category. Maintained by reindex, never set by callers. */
	category: string;
	/** Trailing `// ...` text, without the slashes. Null when there is none. */
	comment: string | null;
}

/**
 * A parsed line. `raw` holds the bytes it was read from; null means it was
 * edited and must be re-rendered from the model.
 */
type Line =
	| { kind: 'category'; name: string; comment: string | null; raw: string | null }
	| { kind: 'entry'; entry: AisleEntry; raw: string | null }
	| { kind: 'other'; raw: string };

export interface AisleDoc {
	/**
	 * Category names in file order. That order is the order the shopping list
	 * groups by, which is the whole point of editing this file.
	 */
	categories: string[];
	entries: AisleEntry[];
	/** Every line, so unknown content survives a round trip. */
	lines: Line[];
	/**
	 * The file's own line ending, preserved on write.
	 *
	 * .gitattributes asks for LF, but a working copy on Windows still ends up
	 * CRLF. Splitting on "\n" and joining with "\n" would rewrite every line in
	 * the file the first time anything was saved.
	 */
	eol: '\n' | '\r\n';
}

/** A name or alias claimed by more than one entry. */
export interface AisleDuplicate {
	term: string;
	/** Every entry claiming it, in file order. */
	entries: AisleEntry[];
}

const CATEGORY_RE = /^\[([^\]]+)\]$/;
const COMMENT = '//';

/** How an edited line separates its names. Untouched lines keep their own spacing. */
const ALIAS_SEPARATOR = ' | ';

const key = (value: string): string => value.trim().toLowerCase();

const isBlank = (line: Line): boolean => line.kind === 'other' && line.raw.trim() === '';

/** Every term an entry answers to, deduped so `butter | Butter` is one term. */
function terms(entry: AisleEntry): string[] {
	return [...new Set([entry.name, ...entry.aliases].map(key))].filter(Boolean);
}

/**
 * Rebuild `categories`, `entries` and every `entry.category` from `lines`.
 *
 * Every mutator ends here, so each one only has to get `lines` right. That is
 * what makes renameCategory and moveCategory correct for free -- they touch
 * nothing but the line array. Entry objects keep their identity, so a caller
 * holding a reference across a mutation still sees the same object.
 */
function reindex(doc: AisleDoc): void {
	const categories: string[] = [];
	const entries: AisleEntry[] = [];
	let current = '';

	for (const line of doc.lines) {
		if (line.kind === 'category') {
			current = line.name;
			if (!categories.some((name) => key(name) === key(current))) categories.push(current);
			continue;
		}

		if (line.kind === 'entry') {
			line.entry.category = current;
			entries.push(line.entry);
		}
	}

	doc.categories = categories;
	doc.entries = entries;
}

/** Parse an aisle.conf into categories, entries, and the lines they came from. */
export function parseAisle(text: string): AisleDoc {
	const lines: Line[] = [];
	const eol: '\n' | '\r\n' = text.includes('\r\n') ? '\r\n' : '\n';

	let inCategory = false;

	for (const raw of text.split(/\r?\n/)) {
		// The comment comes off first. Doing it in this order is what makes
		// `// [old aisle]` a comment rather than a category header.
		const at = raw.indexOf(COMMENT);
		const content = at === -1 ? raw : raw.slice(0, at);
		const comment = at === -1 ? null : raw.slice(at + COMMENT.length).trim();
		const trimmed = content.trim();

		// Blank lines and whole-line comments alike. Both are kept verbatim and
		// never re-rendered, so someone's notes and spacing survive an edit.
		if (!trimmed) {
			lines.push({ kind: 'other', raw });
			continue;
		}

		const category = trimmed.match(CATEGORY_RE);
		if (category) {
			inCategory = true;
			lines.push({ kind: 'category', name: category[1].trim(), comment, raw });
			continue;
		}

		const names = trimmed
			.split('|')
			.map((part) => part.trim())
			.filter(Boolean);

		// An ingredient above the first header is a file cooklang-rs rejects
		// outright. Keeping it as unrecognised content preserves it byte for
		// byte rather than quietly eating a line this app did not write.
		if (inCategory && names.length > 0) {
			lines.push({
				kind: 'entry',
				entry: { name: names[0], aliases: names.slice(1), category: '', comment },
				raw
			});
			continue;
		}

		lines.push({ kind: 'other', raw });
	}

	const doc: AisleDoc = { categories: [], entries: [], lines, eol };
	reindex(doc);
	return doc;
}

function formatEntry(entry: AisleEntry): string {
	const names = [entry.name, ...entry.aliases].join(ALIAS_SEPARATOR);
	return entry.comment ? `${names} ${COMMENT} ${entry.comment}` : names;
}

function formatCategory(line: { name: string; comment: string | null }): string {
	return line.comment ? `[${line.name}] ${COMMENT} ${line.comment}` : `[${line.name}]`;
}

/**
 * Serialize a document back to text.
 *
 * serializeAisle(parseAisle(x)) === x for any file this has not been asked to
 * change, because every untouched line still carries its original bytes.
 */
export function serializeAisle(doc: AisleDoc): string {
	return doc.lines
		.map((line) => {
			switch (line.kind) {
				case 'other':
					return line.raw;
				case 'category':
					return line.raw ?? formatCategory(line);
				case 'entry':
					return line.raw ?? formatEntry(line.entry);
			}
		})
		.join(doc.eol);
}

/** Lowercased category name to its position in the file, for ordering the list. */
export function categoryOrder(doc: AisleDoc): Map<string, number> {
	const order = new Map<string, number>();
	for (const name of doc.categories) {
		if (!order.has(key(name))) order.set(key(name), order.size);
	}
	return order;
}

/** Find an entry by its canonical name, ignoring aliases. */
export function findEntry(doc: AisleDoc, name: string): AisleEntry | undefined {
	return doc.entries.find((entry) => key(entry.name) === key(name));
}

/**
 * Resolve an ingredient the way the CLI does: canonical name or any alias,
 * case-insensitively, and nothing else.
 *
 * There is deliberately no stemming or fuzzy matching here. "onion" and
 * "onions" are two separate entries as far as the CLI is concerned -- which is
 * why the bundled aisle.conf lists both -- and matching them here would report
 * coverage the shopping list does not actually have.
 */
export function lookupEntry(doc: AisleDoc, ingredient: string): AisleEntry | undefined {
	const wanted = key(ingredient);
	return doc.entries.find((entry) => terms(entry).includes(wanted));
}

/**
 * Terms claimed by more than one entry.
 *
 * The CLI parses this file leniently: it keeps the first occurrence, warns on
 * stderr and carries on. The symptom is an ingredient stuck in the wrong aisle
 * with nothing on the page to explain why, so the editor surfaces these.
 */
export function findDuplicates(doc: AisleDoc): AisleDuplicate[] {
	const claims = new Map<string, AisleEntry[]>();

	for (const entry of doc.entries) {
		for (const term of terms(entry)) {
			const existing = claims.get(term);
			if (existing) existing.push(entry);
			else claims.set(term, [entry]);
		}
	}

	return [...claims]
		.filter(([, entries]) => entries.length > 1)
		.map(([term, entries]) => ({ term, entries }));
}

/** Add an entry, or update it in place if that name already exists in the category. */
export function upsertEntry(doc: AisleDoc, entry: AisleEntry): AisleDoc {
	const existing = doc.lines.find(
		(line) =>
			line.kind === 'entry' &&
			key(line.entry.category) === key(entry.category) &&
			key(line.entry.name) === key(entry.name)
	);

	if (existing?.kind === 'entry') {
		Object.assign(existing.entry, entry);
		existing.raw = null;
		reindex(doc);
		return doc;
	}

	// Insert after the category's last entry, so a new ingredient sits with its
	// siblings rather than after the blank lines that separate categories.
	let insertAt = -1;
	let inCategory = false;

	for (const [index, line] of doc.lines.entries()) {
		if (line.kind === 'category') {
			if (key(line.name) === key(entry.category)) {
				inCategory = true;
				insertAt = index;
				continue;
			}
			if (inCategory) break;
		}

		if (inCategory && line.kind === 'entry') insertAt = index;
	}

	if (insertAt === -1) {
		addCategory(doc, entry.category);
		insertAt = doc.lines.findLastIndex((line) => line.kind === 'category');
	}

	doc.lines.splice(insertAt + 1, 0, { kind: 'entry', entry, raw: null });
	reindex(doc);
	return doc;
}

/** Remove an entry entirely, including its line. */
export function removeEntry(doc: AisleDoc, category: string, name: string): AisleDoc {
	doc.lines = doc.lines.filter(
		(line) =>
			!(
				line.kind === 'entry' &&
				key(line.entry.category) === key(category) &&
				key(line.entry.name) === key(name)
			)
	);

	reindex(doc);
	return doc;
}

/** Add an alias to an existing entry, found by its canonical name. */
export function addAlias(doc: AisleDoc, canonicalName: string, alias: string): AisleDoc {
	const line = doc.lines.find(
		(candidate) => candidate.kind === 'entry' && key(candidate.entry.name) === key(canonicalName)
	);

	if (line?.kind === 'entry' && !terms(line.entry).includes(key(alias))) {
		line.entry.aliases.push(alias.trim());
		line.raw = null;
	}

	reindex(doc);
	return doc;
}

/**
 * Strip a term from whichever entry in `category` claims it: the whole entry
 * when the term is its canonical name, just the alias otherwise. Used to
 * resolve a duplicate by choosing which category keeps it.
 */
export function removeTerm(doc: AisleDoc, category: string, term: string): AisleDoc {
	const wanted = key(term);

	for (const line of doc.lines) {
		if (line.kind !== 'entry') continue;
		if (key(line.entry.category) !== key(category)) continue;
		if (!terms(line.entry).includes(wanted)) continue;

		if (key(line.entry.name) === wanted) {
			return removeEntry(doc, category, line.entry.name);
		}

		line.entry.aliases = line.entry.aliases.filter((alias) => key(alias) !== wanted);
		line.raw = null;
	}

	reindex(doc);
	return doc;
}

/** Append a category. A name that already exists is left alone. */
export function addCategory(doc: AisleDoc, name: string): AisleDoc {
	if (doc.categories.some((existing) => key(existing) === key(name))) return doc;

	// Inserted before the file's trailing blank run, not after it. Splitting a
	// file that ends in a newline yields a final empty element; appending past
	// it would leave the file without its trailing newline.
	const last = doc.lines.findLastIndex((line) => !isBlank(line));
	const separator: Line[] = last >= 0 ? [{ kind: 'other', raw: '' }] : [];

	doc.lines.splice(last + 1, 0, ...separator, {
		kind: 'category',
		name,
		comment: null,
		raw: null
	});

	reindex(doc);
	return doc;
}

/** Rename a category, leaving its entries where they are. */
export function renameCategory(doc: AisleDoc, from: string, to: string): AisleDoc {
	for (const line of doc.lines) {
		if (line.kind === 'category' && key(line.name) === key(from)) {
			line.name = to;
			// Only the header is re-rendered. The entries beneath it keep their
			// original bytes, so a rename is a one-line diff.
			line.raw = null;
		}
	}

	reindex(doc);
	return doc;
}

/**
 * A category and everything under it, split from the blank lines that trail it.
 *
 * Comments attach upward and blank lines do not. A comment sitting between the
 * last ingredient and the next header is far likelier to be about those
 * ingredients than about the next category, and attaching upward means it can
 * never end up describing a different category's items.
 */
interface Block {
	name: string;
	/** Header, entries, comments, and any blank lines interior to them. */
	lines: Line[];
	/** The trailing blank run. Stays in its slot when blocks are reordered. */
	gap: Line[];
}

function decompose(doc: AisleDoc): { preamble: Line[]; blocks: Block[] } {
	const preamble: Line[] = [];
	const blocks: Block[] = [];

	for (const line of doc.lines) {
		if (line.kind === 'category') {
			blocks.push({ name: line.name, lines: [line], gap: [] });
			continue;
		}

		const block = blocks.at(-1);
		if (!block) {
			preamble.push(line);
			continue;
		}

		// Blanks are provisional: they sit in the gap until a later non-blank
		// line proves they were interior after all.
		if (isBlank(line)) {
			block.gap.push(line);
		} else {
			block.lines.push(...block.gap, line);
			block.gap = [];
		}
	}

	return { preamble, blocks };
}

function recompose(preamble: Line[], blocks: Block[], gaps: Line[][]): Line[] {
	return [...preamble, ...blocks.flatMap((block, index) => [...block.lines, ...gaps[index]])];
}

/**
 * Move a category one position up or down. This is what shapes the shopping
 * list, whose categories come out in this file's order.
 */
export function moveCategory(doc: AisleDoc, name: string, direction: 'up' | 'down'): AisleDoc {
	const { preamble, blocks } = decompose(doc);

	const from = blocks.findIndex((block) => key(block.name) === key(name));
	const to = direction === 'up' ? from - 1 : from + 1;

	// A silent no-op rather than an error. The buttons at the ends of the list
	// are disabled, but a stale page can still post one and must not 500.
	if (from === -1 || to < 0 || to >= blocks.length) return doc;

	// The gaps stay in their slots while the blocks move around them. Carrying
	// a gap along with its block would break the last category, which has no
	// trailing blank line at all: moving it up would glue its final ingredient
	// onto the following header and strip the file's trailing newline.
	const gaps = blocks.map((block) => block.gap);
	const reordered = [...blocks];
	[reordered[from], reordered[to]] = [reordered[to], reordered[from]];

	doc.lines = recompose(preamble, reordered, gaps);
	reindex(doc);
	return doc;
}

/**
 * Reorder the categories to match `order`, a complete list of names. Used by the
 * drag-and-drop editor, which sends the whole new order rather than a swap.
 *
 * Names in `order` that the file does not have are ignored, and any category the
 * list omits keeps its place at the end, so a stale page can never drop an
 * aisle. Gaps stay in their positional slots for the same reason moveCategory
 * leaves them there: carrying a block's trailing blank line with it would strip
 * the file's final newline when that block lands last.
 */
export function reorderCategories(doc: AisleDoc, order: string[]): AisleDoc {
	const { preamble, blocks } = decompose(doc);

	const byName = new Map(blocks.map((block) => [key(block.name), block]));
	const seen = new Set<string>();
	const reordered: Block[] = [];

	for (const name of order) {
		const block = byName.get(key(name));
		if (block && !seen.has(key(name))) {
			reordered.push(block);
			seen.add(key(name));
		}
	}

	// Anything the incoming order did not mention keeps its original relative
	// position, appended after the named ones.
	for (const block of blocks) {
		if (!seen.has(key(block.name))) reordered.push(block);
	}

	const gaps = blocks.map((block) => block.gap);
	doc.lines = recompose(preamble, reordered, gaps);
	reindex(doc);
	return doc;
}

/** Remove a category and everything under it. */
export function removeCategory(doc: AisleDoc, name: string): AisleDoc {
	const { preamble, blocks } = decompose(doc);

	const index = blocks.findIndex((block) => key(block.name) === key(name));
	if (index === -1) return doc;

	// The gap goes with the block here, unlike a move: dropping the block on its
	// own would leave its blank run behind as an orphan.
	blocks.splice(index, 1);

	doc.lines = recompose(
		preamble,
		blocks,
		blocks.map((block) => block.gap)
	);
	reindex(doc);
	return doc;
}
