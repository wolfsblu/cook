/**
 * Recipe filtering and sorting utilities
 */

export interface FilterState {
	tags: string[];
	course: string | null;
	timeRange: { min: number; max: number };
	servingsRange: { min: number; max: number };
}

/**
 * Apply filters to a list of recipes
 */
export function applyFilters(recipes: any[], filters: FilterState): any[] {
	return recipes.filter((recipe) => {
		// Tag filter (AND logic - all tags must match)
		if (filters.tags.length > 0) {
			const recipeTags = Array.from(recipe.parsed.tags);
			if (!filters.tags.every((tag) => recipeTags.includes(tag))) {
				return false;
			}
		}

		// Course filter
		if (filters.course && recipe.parsed.course !== filters.course) {
			return false;
		}

		// Time filter
		const recipeTime = getRecipeTime(recipe);
		if (recipeTime < filters.timeRange.min || recipeTime > filters.timeRange.max) {
			return false;
		}

		// Servings filter
		const servings = getRecipeServings(recipe);
		if (servings < filters.servingsRange.min || servings > filters.servingsRange.max) {
			return false;
		}

		return true;
	});
}

/**
 * Get total time for a recipe in minutes
 */
export function getRecipeTime(recipe: any): number {
	if (typeof recipe.parsed.time === 'number') return recipe.parsed.time;
	if (recipe.parsed.time?.prep_time && recipe.parsed.time?.cook_time) {
		return recipe.parsed.time.prep_time + recipe.parsed.time.cook_time;
	}
	if (recipe.parsed.time?.prep_time) return recipe.parsed.time.prep_time;
	if (recipe.parsed.time?.cook_time) return recipe.parsed.time.cook_time;
	return 0;
}

/**
 * Get servings count for a recipe
 */
export function getRecipeServings(recipe: any): number {
	return typeof recipe.parsed.servings === 'number' ? recipe.parsed.servings : 0;
}

/**
 * Sort recipes by field and order
 */
export function sortRecipes(recipes: any[], field: string, order: 'asc' | 'desc'): any[] {
	const sorted = [...recipes].sort((a, b) => {
		let compareValue = 0;

		switch (field) {
			case 'name': {
				const aTitle = a.parsed.title || a.filename || '';
				const bTitle = b.parsed.title || b.filename || '';
				compareValue = aTitle.localeCompare(bTitle);
				break;
			}
			case 'time':
				compareValue = getRecipeTime(a) - getRecipeTime(b);
				break;
			case 'servings':
				compareValue = getRecipeServings(a) - getRecipeServings(b);
				break;
		}

		return order === 'asc' ? compareValue : -compareValue;
	});

	return sorted;
}

/**
 * Get all unique tags from recipes
 */
export function getAvailableTags(recipes: any[]): string[] {
	const allTags = new Set<string>();
	recipes.forEach((recipe) => {
		if (recipe.parsed.tags) {
			Array.from(recipe.parsed.tags).forEach((tag) => allTags.add(tag as string));
		}
	});
	return Array.from(allTags).sort();
}

/**
 * Get all unique courses from recipes
 */
export function getAvailableCourses(recipes: any[]): string[] {
	const courses = new Set<string>();
	recipes.forEach((recipe) => {
		if (recipe.parsed.course) {
			courses.add(recipe.parsed.course);
		}
	});
	return Array.from(courses).sort();
}
