import { describe, expect, it } from 'vitest';
import { coverageFor, type CoverageRecipe } from './coverage';
import { parseAisle } from './format';

const recipe = (slug: string, ...ingredientNames: string[]): CoverageRecipe => ({
	slug,
	title: slug,
	ingredientNames
});

const DOC = parseAisle('[fruit and veg]\nonion\ntomato\n\n[dairy]\nbutter | unsalted butter\n');

const names = (coverage: ReturnType<typeof coverageFor>) =>
	coverage.unassigned.map((item) => item.name);

describe('coverageFor', () => {
	it('counts an ingredient matched by its canonical name as assigned', () => {
		const coverage = coverageFor([recipe('soup', 'onion')], DOC);

		expect(coverage.unassigned).toEqual([]);
		expect(coverage.assignedCount).toBe(1);
		expect(coverage.totalCount).toBe(1);
	});

	it('counts an ingredient matched by an alias as assigned', () => {
		expect(coverageFor([recipe('cake', 'unsalted butter')], DOC).unassigned).toEqual([]);
	});

	it('matches case-insensitively', () => {
		expect(coverageFor([recipe('soup', 'Onion', 'TOMATO')], DOC).unassigned).toEqual([]);
	});

	it('treats a plural as unassigned, because the CLI does', () => {
		// Asserted deliberately. Stemming this away here would claim coverage the
		// shopping list does not have -- "onions" really does land in "other".
		expect(names(coverageFor([recipe('soup', 'onions')], DOC))).toEqual(['onions']);
	});

	it('suggests the canonical name a plural should be an alias of', () => {
		const coverage = coverageFor([recipe('soup', 'onions', 'tomatoes', 'kohlrabi')], DOC);

		expect(
			Object.fromEntries(coverage.unassigned.map((item) => [item.name, item.suggestedAliasOf]))
		).toEqual({ onions: 'onion', tomatoes: 'tomato', kohlrabi: null });
	});

	it('sorts by recipe count, then by name', () => {
		const coverage = coverageFor(
			[recipe('a', 'saffron', 'yuzu'), recipe('b', 'yuzu'), recipe('c', 'ajwain')],
			DOC
		);

		expect(names(coverage)).toEqual(['yuzu', 'ajwain', 'saffron']);
	});

	it('caps the sample of using recipes but keeps counting', () => {
		const coverage = coverageFor(
			['a', 'b', 'c', 'd'].map((slug) => recipe(slug, 'yuzu')),
			DOC
		);

		expect(coverage.unassigned[0].recipeCount).toBe(4);
		expect(coverage.unassigned[0].recipes.map((r) => r.slug)).toEqual(['a', 'b', 'c']);
	});

	it('lists aisle entries no recipe mentions', () => {
		const coverage = coverageFor([recipe('soup', 'onion')], DOC);

		expect(coverage.unusedEntries).toEqual([
			{ name: 'tomato', category: 'fruit and veg' },
			{ name: 'butter', category: 'dairy' }
		]);
	});

	it('reports everything unassigned against an empty config', () => {
		const coverage = coverageFor([recipe('soup', 'onion')], parseAisle(''));

		expect(names(coverage)).toEqual(['onion']);
		expect(coverage.assignedCount).toBe(0);
	});

	it('reports nothing for an empty library', () => {
		const coverage = coverageFor([], DOC);

		expect(coverage.unassigned).toEqual([]);
		expect(coverage.totalCount).toBe(0);
		expect(coverage.unusedEntries).toHaveLength(3);
	});
});
