/**
 * Slugs for recipe URLs.
 *
 * Recipes live in a directory tree ("Breakfast/Easy Pancakes.cook"), and the
 * app is addressed by slug ("breakfast/easy-pancakes"). Each path segment is
 * slugified independently and the separators are preserved, so a slug drops
 * straight into a URL without encoding.
 *
 * Slugs are also the traversal defence: routes look an incoming slug up in the
 * index and use the absolute path recorded there. No user-supplied string is
 * ever joined onto a filesystem path.
 */

/** Slugify a single path segment. Never returns an empty string. */
export function slugifySegment(segment: string): string {
	const slug = segment
		.normalize('NFKD')
		// Drop the combining marks NFKD split off, so "Crème" folds to "creme".
		// Without this they would survive to the next rule and become hyphens.
		.replace(/\p{M}+/gu, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

	// A segment of entirely non-Latin characters slugifies to nothing. Fall back
	// to a stable marker so the slug stays a valid, non-empty URL segment.
	return slug || 'recipe';
}

/**
 * Build a slug from a path relative to the recipe directory.
 *
 * The .cook extension is dropped; directory structure is kept.
 *
 *   "lamb-chops.cook"              -> "lamb-chops"
 *   "Breakfast/Easy Pancakes.cook" -> "breakfast/easy-pancakes"
 */
export function slugForRelPath(relPath: string): string {
	const segments = relPath
		.split(/[/\\]/)
		.filter(Boolean)
		.map((segment, index, all) =>
			index === all.length - 1 ? segment.replace(/\.cook$/i, '') : segment
		);

	if (segments.length === 0) return 'recipe';

	return segments.map(slugifySegment).join('/');
}

/**
 * Assign a unique slug to every path, resolving collisions deterministically.
 *
 * Two different files can slugify to the same string ("Red Beans.cook" and
 * "red-beans.cook"). Input is sorted first so the winner does not depend on
 * directory listing order, which varies by filesystem; the first path keeps the
 * bare slug and later ones get a numeric suffix.
 *
 * @returns relative path -> slug, and any collisions that were renamed
 */
export function assignSlugs(relPaths: readonly string[]): {
	slugs: Map<string, string>;
	collisions: Array<{ relPath: string; slug: string; preferred: string }>;
} {
	const slugs = new Map<string, string>();
	const taken = new Set<string>();
	const collisions: Array<{ relPath: string; slug: string; preferred: string }> = [];

	for (const relPath of [...relPaths].sort((a, b) => a.localeCompare(b, 'en'))) {
		const preferred = slugForRelPath(relPath);

		let slug = preferred;
		let suffix = 2;
		while (taken.has(slug)) {
			slug = `${preferred}-${suffix++}`;
		}

		if (slug !== preferred) {
			collisions.push({ relPath, slug, preferred });
		}

		taken.add(slug);
		slugs.set(relPath, slug);
	}

	return { slugs, collisions };
}
