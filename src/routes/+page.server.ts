import type { PageServerLoad } from './$types';
import { getIndex } from '$lib/server/recipes/index.js';
import { searchIndex } from '$lib/server/recipes/search.js';
import { imageRef } from '$lib/server/images.js';
import type { RecipeCardModel } from '$lib/types/recipe.js';
import type { RecipeEntry } from '$lib/server/recipes/index.js';
import { applyFilters, sortRecipes, type SortOrder } from '$lib/utils/recipe-filters.js';
import { paginate, parsePageParam } from '$lib/utils/pagination.js';
import { parseFilterParams } from '$lib/utils/url-params.js';

function toCardModel(entry: RecipeEntry): RecipeCardModel {
	return {
		slug: entry.slug,
		href: `/recipe/${entry.slug}`,
		title: entry.title,
		tags: entry.tags,
		course: entry.course,
		servings: entry.servings,
		timeMinutes: entry.timeMinutes,
		image: imageRef(entry.image, 'card')
	};
}

/**
 * Search, filter, sort and slice happen here rather than on the client. The
 * client used to filter and sort the whole library itself, which meant the
 * whole library had to be sent; it also makes paging correct, since a page can
 * only be cut once the result set is final.
 */
export const load: PageServerLoad = async ({ url }) => {
	const searchQuery = url.searchParams.get('q') ?? '';
	const index = await getIndex();

	const matched = sortRecipes(
		applyFilters(searchIndex(index, searchQuery), parseFilterParams(url.searchParams)),
		url.searchParams.get('sort') || 'name',
		(url.searchParams.get('order') || 'asc') as SortOrder
	);

	const paged = paginate(matched, parsePageParam(url.searchParams));

	return {
		// Only the visible page is projected: toCardModel calls imageRef, which
		// signs an imgproxy URL per recipe.
		recipes: paged.items.map(toCardModel),
		pageNumber: paged.page,
		totalPages: paged.totalPages,
		totalRecipes: paged.totalItems,
		searchQuery,
		// Facets come from the whole library rather than the filtered view, so
		// filter options do not vanish as you narrow the results.
		allTags: index.allTags,
		allCourses: index.allCourses
	};
};
