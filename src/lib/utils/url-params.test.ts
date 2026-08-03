import { describe, expect, it } from 'vitest';
import { buildFilterUrl, parseFilterParams } from './url-params';
import type { FilterState } from './recipe-filters';

const EMPTY: FilterState = {
	tags: [],
	course: null,
	timeRange: { min: 0, max: Infinity },
	servingsRange: { min: 0, max: Infinity }
};

describe('parseFilterParams', () => {
	it('returns unbounded defaults for an empty query string', () => {
		expect(parseFilterParams(new URLSearchParams())).toEqual(EMPTY);
	});

	it('splits tags and drops empty segments', () => {
		const filters = parseFilterParams(new URLSearchParams('tags=quick,,vegan,'));
		expect(filters.tags).toEqual(['quick', 'vegan']);
	});

	it('reads numeric ranges', () => {
		const filters = parseFilterParams(
			new URLSearchParams('time_min=10&time_max=45&servings_min=2&servings_max=6')
		);
		expect(filters.timeRange).toEqual({ min: 10, max: 45 });
		expect(filters.servingsRange).toEqual({ min: 2, max: 6 });
	});

	it('treats a non-numeric bound as unset rather than NaN', () => {
		const filters = parseFilterParams(new URLSearchParams('time_max=soon'));
		expect(filters.timeRange.max).toBe(Infinity);
	});
});

describe('buildFilterUrl', () => {
	it('collapses to "/" when nothing is set', () => {
		expect(buildFilterUrl('', EMPTY, 'name', 'asc')).toBe('/');
	});

	it('omits values that equal the default', () => {
		const url = buildFilterUrl('', EMPTY, 'name', 'asc');
		expect(url).not.toContain('sort');
		expect(url).not.toContain('order');
	});

	it('round-trips through parseFilterParams', () => {
		const filters: FilterState = {
			tags: ['quick', 'vegan'],
			course: 'dinner',
			timeRange: { min: 10, max: 45 },
			servingsRange: { min: 2, max: 6 }
		};

		const url = buildFilterUrl('pancakes', filters, 'time', 'desc');
		const parsed = parseFilterParams(new URLSearchParams(url.slice(1)));

		expect(parsed).toEqual(filters);
	});
});
