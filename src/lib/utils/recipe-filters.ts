/**
 * Recipe filtering and sorting.
 *
 * Operates on flat records rather than a parse tree. The previous version
 * reached through `recipe.parsed.*` into the full cooklang parse tree, which is
 * why the whole tree had to be serialized to the client in the first place.
 */

/**
 * The fields filtering and sorting actually read. Both RecipeCardModel and the
 * server's RecipeEntry satisfy this, so the load function can filter and sort
 * index entries before projecting the visible page to card models.
 */
export interface FilterableRecipe {
	title: string;
	tags: string[];
	course: string | null;
	servings: number | null;
	timeMinutes: number | null;
}

export interface FilterState {
	tags: string[];
	course: string | null;
	timeRange: { min: number; max: number };
	servingsRange: { min: number; max: number };
}

export type SortField = 'name' | 'time' | 'servings';
export type SortOrder = 'asc' | 'desc';

/** Total time in minutes; recipes without one sort as zero. */
export function getRecipeTime(recipe: FilterableRecipe): number {
	return recipe.timeMinutes ?? 0;
}

/** Servings count; recipes without one sort as zero. */
export function getRecipeServings(recipe: FilterableRecipe): number {
	return recipe.servings ?? 0;
}

/** Keep recipes matching every active filter. Tags use AND logic. */
export function applyFilters<T extends FilterableRecipe>(
	recipes: readonly T[],
	filters: FilterState
): T[] {
	return recipes.filter((recipe) => {
		if (filters.tags.length > 0 && !filters.tags.every((tag) => recipe.tags.includes(tag))) {
			return false;
		}

		if (filters.course && recipe.course !== filters.course) {
			return false;
		}

		const time = getRecipeTime(recipe);
		if (time < filters.timeRange.min || time > filters.timeRange.max) {
			return false;
		}

		const servings = getRecipeServings(recipe);
		if (servings < filters.servingsRange.min || servings > filters.servingsRange.max) {
			return false;
		}

		return true;
	});
}

/** Sort a copy of the list; the input is left untouched. */
export function sortRecipes<T extends FilterableRecipe>(
	recipes: readonly T[],
	field: string,
	order: SortOrder
): T[] {
	const direction = order === 'asc' ? 1 : -1;

	return [...recipes].sort((a, b) => {
		switch (field) {
			case 'time':
				return (getRecipeTime(a) - getRecipeTime(b)) * direction;
			case 'servings':
				return (getRecipeServings(a) - getRecipeServings(b)) * direction;
			default:
				return a.title.localeCompare(b.title) * direction;
		}
	});
}
