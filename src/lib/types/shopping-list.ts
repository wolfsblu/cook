/**
 * Display types for the shopping list.
 *
 * Recipe selections are a server concern and live in
 * $lib/server/shopping/store.ts; they are no longer modelled here, because the
 * client no longer owns that state.
 */

/** A single ingredient line. */
export interface ShoppingListItem {
	/** Lowercase name as the CLI emits it; used as a key. */
	name: string;
	displayName: string;
	/** Formatted amount, e.g. "250 g" or "2 cups and 1 tsp". Null when unquantified. */
	quantity: string | null;
}

/** A shop aisle, e.g. "fruit and veg". */
export interface ShoppingListCategory {
	name: string;
	displayName: string;
	items: ShoppingListItem[];
}

export interface ShoppingListDisplay {
	categories: ShoppingListCategory[];
	recipeCount: number;
	totalItems: number;
}
