/**
 * Pagination for the recipe list.
 *
 * Kept free of Svelte and SvelteKit imports so the load function and the
 * pagination component can share one definition of where a page starts and
 * which page numbers are worth showing.
 */

/** Recipes per page. */
export const PAGE_SIZE = 20;

/** How many page numbers the control shows at once. */
export const WINDOW_SIZE = 7;

export interface Paged<T> {
	items: T[];
	/** The requested page after clamping; may differ from what was asked for. */
	page: number;
	totalPages: number;
	totalItems: number;
}

/** Read `?page=`, defaulting to 1 for anything absent, fractional or nonsensical. */
export function parsePageParam(searchParams: URLSearchParams): number {
	const raw = Number(searchParams.get('page'));
	if (!Number.isFinite(raw)) return 1;
	return Math.max(1, Math.floor(raw));
}

/**
 * Slice one page out of a list.
 *
 * The page is clamped to the available range, so `?page=999` lands on the last
 * page rather than an empty grid. An empty list still has one page.
 */
export function paginate<T>(items: readonly T[], page: number, pageSize = PAGE_SIZE): Paged<T> {
	const totalItems = items.length;
	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
	const current = Math.min(Math.max(1, page), totalPages);
	const start = (current - 1) * pageSize;

	return {
		items: items.slice(start, start + pageSize),
		page: current,
		totalPages,
		totalItems
	};
}

/**
 * The page numbers to offer, as a window that slides rather than a first/last
 * pair with ellipses. Near the start it is simply pages 1..size; past that it
 * keeps the current page centred, and it stops sliding at the last page.
 */
export function pageWindow(current: number, totalPages: number, size = WINDOW_SIZE): number[] {
	if (totalPages <= size) {
		return Array.from({ length: totalPages }, (_, i) => i + 1);
	}

	const half = Math.floor(size / 2);
	let start = Math.max(1, current - half);
	const end = Math.min(totalPages, start + size - 1);
	start = Math.max(1, end - size + 1);

	return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * Link to a page, preserving search, filters and sort. Page 1 leaves the param
 * off entirely, the way `sort` and `order` omit their defaults.
 */
export function pageHref(searchParams: URLSearchParams, page: number): string {
	const params = new URLSearchParams(searchParams);

	if (page > 1) params.set('page', String(page));
	else params.delete('page');

	const query = params.toString();
	return query ? `?${query}` : '/';
}
