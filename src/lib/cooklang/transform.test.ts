import { describe, expect, it } from 'vitest';
import { transformShoppingList } from './transform';
import type { CookCLIShoppingList } from './types';

/**
 * The quantity shapes below were copied from real `cook shopping-list -f json`
 * output (cookcli 0.19.3) run against the bundled recipes, not invented. The
 * previous code cast these to structures that contradicted their own type
 * declaration, and the casts hid the mismatch from the typechecker.
 */

const num = (value: number) => ({
	type: 'number' as const,
	value: { type: 'regular' as const, value }
});

describe('transformShoppingList', () => {
	it('formats a plain quantity with its unit', () => {
		const cli: CookCLIShoppingList = [
			{
				category: 'tinned goods and baking',
				items: [{ name: 'flour', quantity: [{ unit: 'g', value: num(250) }] }]
			}
		];

		expect(transformShoppingList(cli, 1).categories[0].items[0]).toMatchObject({
			displayName: 'Flour',
			quantity: '250 g'
		});
	});

	it('omits the unit when there is none', () => {
		const cli: CookCLIShoppingList = [
			{
				category: 'milk and dairy',
				items: [{ name: 'eggs', quantity: [{ unit: null, value: num(6) }] }]
			}
		];

		expect(transformShoppingList(cli, 1).categories[0].items[0].quantity).toBe('6');
	});

	it('passes through text amounts such as "pinch"', () => {
		const cli: CookCLIShoppingList = [
			{
				category: 'dried herbs and spices',
				items: [
					{ name: 'salt', quantity: [{ unit: null, value: { type: 'text', value: 'pinch' } }] }
				]
			}
		];

		expect(transformShoppingList(cli, 1).categories[0].items[0].quantity).toBe('pinch');
	});

	it('renders a range', () => {
		const cli: CookCLIShoppingList = [
			{
				category: 'fruit and veg',
				items: [
					{
						name: 'tomatoes',
						quantity: [
							{
								unit: null,
								value: {
									type: 'range',
									value: { from: { type: 'regular', value: 2 }, to: { type: 'regular', value: 3 } }
								}
							}
						]
					}
				]
			}
		];

		expect(transformShoppingList(cli, 1).categories[0].items[0].quantity).toBe('2-3');
	});

	it('joins multiple quantities that could not be merged', () => {
		const cli: CookCLIShoppingList = [
			{
				category: 'other',
				items: [
					{
						name: 'milk',
						quantity: [
							{ unit: 'cups', value: num(2) },
							{ unit: 'tsp', value: num(1) }
						]
					}
				]
			}
		];

		expect(transformShoppingList(cli, 1).categories[0].items[0].quantity).toBe('2 cups and 1 tsp');
	});

	it('reports no quantity for an unquantified ingredient', () => {
		// `@lemon` and `@black pepper{}` both come back with an empty array.
		const cli: CookCLIShoppingList = [
			{ category: 'fruit and veg', items: [{ name: 'lemon', quantity: [] }] }
		];

		expect(transformShoppingList(cli, 1).categories[0].items[0].quantity).toBeNull();
	});

	it('trims trailing zeros from fractional amounts', () => {
		const cli: CookCLIShoppingList = [
			{
				category: 'tinned goods and baking',
				items: [{ name: 'yeast', quantity: [{ unit: 'g', value: num(1.6) }] }]
			}
		];

		expect(transformShoppingList(cli, 1).categories[0].items[0].quantity).toBe('1.6 g');
	});

	it('counts items across categories and sorts within them', () => {
		const cli: CookCLIShoppingList = [
			{
				category: 'fruit and veg',
				items: [
					{ name: 'onion', quantity: [{ unit: null, value: num(1) }] },
					{ name: 'apple', quantity: [{ unit: null, value: num(2) }] }
				]
			},
			{ category: 'other', items: [{ name: 'semolina', quantity: [] }] }
		];

		const result = transformShoppingList(cli, 3);

		expect(result.totalItems).toBe(3);
		expect(result.recipeCount).toBe(3);
		expect(result.categories[0].items.map((i) => i.displayName)).toEqual(['Apple', 'Onion']);
	});
});
