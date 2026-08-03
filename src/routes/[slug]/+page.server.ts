import {
	CooklangParser,
	ingredient_display_name,
	ingredient_should_be_listed,
	cookware_display_name,
	cookware_should_be_listed,
	grouped_quantity_display,
	grouped_quantity_is_empty,
	quantity_display
} from '@cooklang/cooklang';
import type { PageServerLoad } from './$types';
import fs from 'node:fs/promises';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ params, url }) => {
	const recipePath = env.RECIPE_PATH || './recipes';
	const scale = Number(url.searchParams.get('scale')) || 1;
	const recipeFile = await fs.readFile(`${recipePath}/${params.slug}`, 'utf8');

	const parser = new CooklangParser();
	const [parsedRecipe] = parser.parse(recipeFile, scale);

	const recipeTitle = parsedRecipe.title
		? parsedRecipe.title
		: params.slug
				.replace('.cook', '')
				.split('-')
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(' ');

	// Pre-compute display strings for ingredients
	const ingredientsDisplay = parsedRecipe.groupedIngredients
		.filter(([ing]) => ingredient_should_be_listed(ing))
		.map(([ing, qty], index) => ({
			index,
			name: ingredient_display_name(ing),
			quantity: !grouped_quantity_is_empty(qty) ? grouped_quantity_display(qty) : null,
			note: ing.note
		}));

	// Pre-compute display strings for cookware
	const cookwareDisplay = parsedRecipe.groupedCookware
		.filter(([cw]) => cookware_should_be_listed(cw))
		.map(([cw, qty], index) => ({
			index,
			name: cookware_display_name(cw),
			quantity: !grouped_quantity_is_empty(qty) ? grouped_quantity_display(qty) : null,
			note: cw.note
		}));

	// Pre-compute inline display for steps
	const sectionsDisplay = parsedRecipe.sections.map((section) => ({
		name: section.name,
		content: section.content.map((content) => {
			if (content.type === 'text') {
				return { type: 'text' as const, value: content.value };
			}
			return {
				type: 'step' as const,
				number: content.value.number,
				items: content.value.items.map((item) => {
					if (item.type === 'text') {
						return { type: 'text' as const, value: item.value };
					}
					if (item.type === 'ingredient') {
						const ing = parsedRecipe.ingredients[item.index];
						return {
							type: 'ingredient' as const,
							index: item.index,
							name: ingredient_display_name(ing),
							quantity: ing.quantity ? quantity_display(ing.quantity) : null
						};
					}
					if (item.type === 'cookware') {
						const cw = parsedRecipe.cookware[item.index];
						return {
							type: 'cookware' as const,
							index: item.index,
							name: cookware_display_name(cw),
							quantity: cw.quantity ? quantity_display(cw.quantity) : null
						};
					}
					if (item.type === 'timer') {
						const timer = parsedRecipe.timers[item.index];
						return {
							type: 'timer' as const,
							index: item.index,
							name: timer.name,
							quantity: timer.quantity ? quantity_display(timer.quantity) : null
						};
					}
					// inlineQuantity
					const qty = parsedRecipe.inlineQuantities[item.index];
					return {
						type: 'inlineQuantity' as const,
						index: item.index,
						quantity: quantity_display(qty)
					};
				})
			};
		})
	}));

	return {
		recipe: {
			title: recipeTitle,
			description: parsedRecipe.description,
			tags: Array.from(parsedRecipe.tags),
			author: parsedRecipe.author,
			source: parsedRecipe.source,
			servings: parsedRecipe.servings,
			time: parsedRecipe.time,
			ingredients: ingredientsDisplay,
			cookware: cookwareDisplay,
			sections: sectionsDisplay,
			imageUrl: `/api/recipes/${params.slug}/image`
		},
		scale,
		slug: params.slug
	};
};
