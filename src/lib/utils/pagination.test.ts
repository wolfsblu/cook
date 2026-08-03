import { describe, expect, it } from 'vitest';
import { pageHref, pageWindow, paginate, parsePageParam } from './pagination';

describe('parsePageParam', () => {
	it('defaults to the first page when the param is absent', () => {
		expect(parsePageParam(new URLSearchParams())).toBe(1);
	});

	it('reads a page number', () => {
		expect(parsePageParam(new URLSearchParams('page=5'))).toBe(5);
	});

	it('clamps zero and negatives to the first page', () => {
		expect(parsePageParam(new URLSearchParams('page=0'))).toBe(1);
		expect(parsePageParam(new URLSearchParams('page=-3'))).toBe(1);
	});

	it('falls back to the first page for a non-numeric value', () => {
		expect(parsePageParam(new URLSearchParams('page=abc'))).toBe(1);
	});

	it('truncates a fractional page', () => {
		expect(parsePageParam(new URLSearchParams('page=2.7'))).toBe(2);
	});
});

describe('paginate', () => {
	const items = Array.from({ length: 25 }, (_, i) => i + 1);

	it('slices the first page', () => {
		const result = paginate(items, 1, 10);
		expect(result.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
		expect(result).toMatchObject({ page: 1, totalPages: 3, totalItems: 25 });
	});

	it('slices a middle page', () => {
		expect(paginate(items, 2, 10).items).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
	});

	it('leaves the last page short rather than padding it', () => {
		expect(paginate(items, 3, 10).items).toEqual([21, 22, 23, 24, 25]);
	});

	it('clamps an over-range page to the last one', () => {
		const result = paginate(items, 999, 10);
		expect(result.page).toBe(3);
		expect(result.items).toEqual([21, 22, 23, 24, 25]);
	});

	it('reports one page for an empty list', () => {
		expect(paginate([], 1, 10)).toEqual({ items: [], page: 1, totalPages: 1, totalItems: 0 });
	});
});

describe('pageWindow', () => {
	it('shows every page when they all fit', () => {
		expect(pageWindow(2, 4)).toEqual([1, 2, 3, 4]);
	});

	it('stays anchored at the start until the current page reaches the middle', () => {
		expect(pageWindow(1, 40)).toEqual([1, 2, 3, 4, 5, 6, 7]);
		expect(pageWindow(4, 40)).toEqual([1, 2, 3, 4, 5, 6, 7]);
	});

	it('centres the current page once it has moved past the middle', () => {
		expect(pageWindow(12, 40)).toEqual([9, 10, 11, 12, 13, 14, 15]);
	});

	it('stops sliding at the last page', () => {
		expect(pageWindow(40, 40)).toEqual([34, 35, 36, 37, 38, 39, 40]);
	});
});

describe('pageHref', () => {
	it('omits the param for the first page', () => {
		expect(pageHref(new URLSearchParams('page=4'), 1)).toBe('/');
	});

	it('preserves search, filters and sort', () => {
		const href = pageHref(new URLSearchParams('q=pancakes&tags=quick&sort=time'), 3);
		const params = new URLSearchParams(href.slice(1));

		expect(params.get('q')).toBe('pancakes');
		expect(params.get('tags')).toBe('quick');
		expect(params.get('sort')).toBe('time');
		expect(params.get('page')).toBe('3');
	});
});
