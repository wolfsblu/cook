/**
 * Type definitions for Cook CLI JSON output
 * Based on the output from: cook shopping-list recipe.cook -f json
 */

/**
 * A numeric literal from Cook CLI. Numbers are always wrapped in their own
 * tagged object, so a plain quantity nests two levels deep:
 *
 *   {"unit":"ml","value":{"type":"number","value":{"type":"regular","value":500.0}}}
 *
 * Shape verified against cookcli 0.19.3 output for the bundled recipes.
 */
export interface CookCLINumber {
	type: 'regular' | 'fraction';
	value: number;
}

/**
 * Quantity value types from Cook CLI.
 *
 * A discriminated union rather than a widened `value` field: the previous
 * shape forced `as` casts at every read site, and those casts disagreed with
 * the declaration they were casting away from.
 */
export type CookCLIQuantityValue =
	| { type: 'number'; value: CookCLINumber }
	| { type: 'range'; value: { from: CookCLINumber; to: CookCLINumber } }
	| { type: 'text'; value: string };

/**
 * Quantity structure from Cook CLI
 */
export interface CookCLIQuantity {
	unit: string | null;
	value: CookCLIQuantityValue;
}

/**
 * Shopping list item from Cook CLI
 */
export interface CookCLIShoppingItem {
	name: string;
	/**
	 * Can hold multiple quantities (e.g. "2 cups and 1 tsp"), and is empty for
	 * ingredients written without one (`@lemon`, `@black pepper{}`).
	 */
	quantity: CookCLIQuantity[];
}

/**
 * Shopping list category from Cook CLI
 */
export interface CookCLIShoppingCategory {
	category: string; // e.g., "produce", "dairy", "other"
	items: CookCLIShoppingItem[];
}

/**
 * Complete shopping list output from Cook CLI
 */
export type CookCLIShoppingList = CookCLIShoppingCategory[];
