import { describe, expect, it } from 'vitest';
import { sortByAisle } from './aisle';

/**
 * Section names taken from the real recipes/config/aisle.conf. The previous
 * ordering map used "produce / dairy / meat / pantry / spices", none of which
 * appear in that file, so it silently did nothing.
 */
const REAL_ORDER = new Map<string, number>([
	['fruit and veg', 0],
	['milk and dairy', 1],
	['meat and seafood', 2],
	['breads and baked goods', 3],
	['tinned goods and baking', 4],
	['packaged goods, pasta and sauces', 5],
	['dried herbs and spices', 6],
	['oils and dressings', 7]
]);

const named = (...names: string[]) => names.map((name) => ({ name }));

describe('sortByAisle', () => {
	it('orders categories as they appear in the config', () => {
		const sorted = sortByAisle(
			named('oils and dressings', 'fruit and veg', 'meat and seafood'),
			REAL_ORDER
		);

		expect(sorted.map((c) => c.name)).toEqual([
			'fruit and veg',
			'meat and seafood',
			'oils and dressings'
		]);
	});

	it('always puts "other" last', () => {
		const sorted = sortByAisle(named('other', 'fruit and veg'), REAL_ORDER);
		expect(sorted.map((c) => c.name)).toEqual(['fruit and veg', 'other']);
	});

	it('places unknown categories after known ones but before "other"', () => {
		const sorted = sortByAisle(named('other', 'frozen', 'fruit and veg'), REAL_ORDER);
		expect(sorted.map((c) => c.name)).toEqual(['fruit and veg', 'frozen', 'other']);
	});

	it('matches case-insensitively', () => {
		const sorted = sortByAisle(named('Oils And Dressings', 'FRUIT AND VEG'), REAL_ORDER);
		expect(sorted.map((c) => c.name)).toEqual(['FRUIT AND VEG', 'Oils And Dressings']);
	});

	it('falls back to alphabetical when the config is empty', () => {
		const sorted = sortByAisle(named('zucchini aisle', 'apple aisle'), new Map());
		expect(sorted.map((c) => c.name)).toEqual(['apple aisle', 'zucchini aisle']);
	});

	it('does not mutate its input', () => {
		const input = named('other', 'fruit and veg');
		sortByAisle(input, REAL_ORDER);
		expect(input.map((c) => c.name)).toEqual(['other', 'fruit and veg']);
	});
});
