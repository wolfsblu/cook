/**
 * Transform Cook CLI shopping list JSON output to display-ready format
 */

import type { CookCLIShoppingList, CookCLIQuantity, CookCLIQuantityValue } from './types.js';
import type {
	ShoppingListDisplay,
	ShoppingListCategory,
	ShoppingListItem
} from '$lib/types/shopping-list.js';

/**
 * Format a single quantity value to a display string
 */
function formatNumber(num: number): string {
	return num % 1 === 0 ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '');
}

function withUnit(text: string, unit: string | null): string {
	return unit ? `${text} ${unit}` : text;
}

function formatQuantityValue(value: CookCLIQuantityValue, unit: string | null): string {
	switch (value.type) {
		case 'number':
			return withUnit(formatNumber(value.value.value), unit);
		case 'range':
			return withUnit(
				`${formatNumber(value.value.from.value)}-${formatNumber(value.value.to.value)}`,
				unit
			);
		case 'text':
			// Unquantified amounts such as "pinch" or "drizzle" carry no unit.
			return value.value;
		default:
			return '';
	}
}

/**
 * Format an array of quantities to a display string
 * Handles multiple quantities like "2 cups and 1 tsp"
 */
function formatQuantities(quantities: CookCLIQuantity[]): string | null {
	if (quantities.length === 0) {
		return null;
	}

	const formatted = quantities
		.map((q) => formatQuantityValue(q.value, q.unit))
		.filter((s) => s.length > 0);

	if (formatted.length === 0) {
		return null;
	}

	if (formatted.length === 1) {
		return formatted[0];
	}

	// Join multiple quantities with "and"
	return formatted.join(' and ');
}

/**
 * Capitalize the first letter of a string
 */
function capitalize(str: string): string {
	if (!str) return str;
	return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Transform a category name to display name
 */
function getCategoryDisplayName(category: string): string {
	// Capitalize first letter
	return capitalize(category);
}

/**
 * Sort items alphabetically within a category
 */
function sortItems(items: ShoppingListItem[]): ShoppingListItem[] {
	return items.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

/**
 * Transform Cook CLI shopping list JSON to display-ready format
 *
 * @param cliOutput - Raw Cook CLI shopping list JSON
 * @param recipeCount - Number of recipes in the shopping list
 * @returns Transformed shopping list for display
 *
 * @example
 * const display = transformShoppingList(cliOutput, 2);
 * console.log(display.categories); // [{ name: 'produce', displayName: 'Produce', items: [...] }]
 */
export function transformShoppingList(
	cliOutput: CookCLIShoppingList,
	recipeCount: number
): ShoppingListDisplay {
	const categories: ShoppingListCategory[] = cliOutput.map((category) => {
		const items: ShoppingListItem[] = category.items.map((item) => ({
			name: item.name,
			displayName: capitalize(item.name),
			quantity: formatQuantities(item.quantity)
		}));

		return {
			name: category.category,
			displayName: getCategoryDisplayName(category.category),
			items: sortItems(items)
		};
	});

	// Calculate total items across all categories
	const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);

	return {
		// Left in CLI order. Ordering is applied by the caller against the aisle
		// config, which is the only thing that knows how the shop is laid out.
		categories,
		recipeCount,
		totalItems
	};
}
