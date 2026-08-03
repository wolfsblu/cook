/**
 * URL parameter utilities for filter state management
 */

import type { FilterState } from './recipe-filters';

/**
 * Parse filter parameters from URL search params
 */
export function parseFilterParams(searchParams: URLSearchParams): FilterState {
	return {
		tags: searchParams.get('tags')?.split(',').filter(Boolean) || [],
		course: searchParams.get('course') || null,
		timeRange: {
			min: Number(searchParams.get('time_min')) || 0,
			max: Number(searchParams.get('time_max')) || Infinity
		},
		servingsRange: {
			min: Number(searchParams.get('servings_min')) || 0,
			max: Number(searchParams.get('servings_max')) || Infinity
		}
	};
}

/**
 * Build URL from filter state.
 *
 * Deliberately built from an empty URLSearchParams: applying filters produces a
 * different result set, so dropping `page` and landing back on the first page
 * is the wanted behaviour rather than an oversight.
 */
export function buildFilterUrl(
	query: string,
	filters: FilterState,
	sortField: string,
	sortOrder: 'asc' | 'desc'
): string {
	const params = new URLSearchParams();

	if (query) params.set('q', query);
	if (filters.tags.length) params.set('tags', filters.tags.join(','));
	if (filters.course) params.set('course', filters.course);
	if (filters.timeRange.min > 0) params.set('time_min', String(filters.timeRange.min));
	if (filters.timeRange.max !== Infinity) params.set('time_max', String(filters.timeRange.max));
	if (filters.servingsRange.min > 0) params.set('servings_min', String(filters.servingsRange.min));
	if (filters.servingsRange.max !== Infinity)
		params.set('servings_max', String(filters.servingsRange.max));
	if (sortField !== 'name') params.set('sort', sortField);
	if (sortOrder !== 'asc') params.set('order', sortOrder);

	const queryString = params.toString();
	return queryString ? `?${queryString}` : '/';
}
