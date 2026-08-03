import { describe, expect, it } from 'vitest';
import { assignSlugs, slugForRelPath, slugifySegment } from './slug';

describe('slugifySegment', () => {
	it('lowercases and hyphenates', () => {
		expect(slugifySegment('Easy Pancakes')).toBe('easy-pancakes');
	});

	it('folds diacritics rather than turning them into separators', () => {
		expect(slugifySegment('Crème Brûlée')).toBe('creme-brulee');
	});

	it('keeps leading digits', () => {
		expect(slugifySegment('2 Day Plan')).toBe('2-day-plan');
	});

	it('collapses runs of punctuation and trims the edges', () => {
		expect(slugifySegment('  Spaghetti -- Bolognese!  ')).toBe('spaghetti-bolognese');
	});

	it('never returns an empty string', () => {
		expect(slugifySegment('---')).toBe('recipe');
		expect(slugifySegment('')).toBe('recipe');
		expect(slugifySegment('日本語')).toBe('recipe');
	});
});

describe('slugForRelPath', () => {
	it('drops the .cook extension', () => {
		expect(slugForRelPath('lamb-chops.cook')).toBe('lamb-chops');
	});

	it('preserves directory structure as URL segments', () => {
		expect(slugForRelPath('Breakfast/Easy Pancakes.cook')).toBe('breakfast/easy-pancakes');
		expect(slugForRelPath('Shared/Pizza Dough.cook')).toBe('shared/pizza-dough');
	});

	it('accepts backslash separators', () => {
		expect(slugForRelPath('Breakfast\\Easy Pancakes.cook')).toBe('breakfast/easy-pancakes');
	});

	it('produces slugs that need no URL encoding', () => {
		const slug = slugForRelPath('Breakfast/Chocolate Toast Delight.cook');
		expect(encodeURI(slug)).toBe(slug);
	});

	it('only strips the extension from the final segment', () => {
		expect(slugForRelPath('my.cook.recipes/Thing.cook')).toBe('my-cook-recipes/thing');
	});
});

describe('assignSlugs', () => {
	it('gives every path a unique slug', () => {
		const paths = ['Red Beans.cook', 'red-beans.cook', 'RED BEANS.cook'];
		const { slugs } = assignSlugs(paths);

		expect(new Set(slugs.values()).size).toBe(3);
	});

	it('suffixes collisions and reports them', () => {
		const { slugs, collisions } = assignSlugs(['Red Beans.cook', 'red-beans.cook']);

		expect(slugs.get('Red Beans.cook')).toBe('red-beans');
		expect(slugs.get('red-beans.cook')).toBe('red-beans-2');
		expect(collisions).toHaveLength(1);
		expect(collisions[0]).toMatchObject({ preferred: 'red-beans', slug: 'red-beans-2' });
	});

	it('is deterministic regardless of input order', () => {
		const paths = ['b/Thing.cook', 'a/Thing.cook', 'Red Beans.cook', 'red-beans.cook'];

		const forward = assignSlugs(paths);
		const reversed = assignSlugs([...paths].reverse());

		expect([...forward.slugs.entries()].sort()).toEqual([...reversed.slugs.entries()].sort());
	});

	it('leaves non-colliding paths on their preferred slug', () => {
		const { slugs, collisions } = assignSlugs([
			'lamb-chops.cook',
			'Breakfast/Easy Pancakes.cook',
			'Shared/Guacamole.cook'
		]);

		expect(slugs.get('lamb-chops.cook')).toBe('lamb-chops');
		expect(slugs.get('Breakfast/Easy Pancakes.cook')).toBe('breakfast/easy-pancakes');
		expect(collisions).toHaveLength(0);
	});
});
