import type { PageServerLoad } from './$types';
import { getIndex } from '$lib/server/recipes/index.js';
import { searchIndex } from '$lib/server/recipes/search.js';
import { imageRef } from '$lib/server/images.js';
import type { RecipeCardModel } from '$lib/types/recipe.js';
import type { RecipeEntry } from '$lib/server/recipes/index.js';

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

export const load: PageServerLoad = async ({ url }) => {
	const searchQuery = url.searchParams.get('q') ?? '';
	const index = await getIndex();
	const matched = searchIndex(index, searchQuery);

	return {
		recipes: matched.map(toCardModel),
		searchQuery,
		// Facets come from the whole library rather than the filtered view, so
		// filter options do not vanish as you narrow the results.
		allTags: index.allTags,
		allCourses: index.allCourses
	};
};
