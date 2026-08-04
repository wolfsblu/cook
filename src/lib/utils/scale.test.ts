import { describe, expect, it } from 'vitest';
import { formatScale, stepScaleDown, stepScaleUp } from './scale';

describe('formatScale', () => {
	it('shortens a repeating decimal', () => {
		// 8 servings of a recipe declaring 6.
		expect(formatScale(8 / 6)).toBe('1.33');
	});

	it('leaves a whole factor whole', () => {
		expect(formatScale(2)).toBe('2');
		expect(formatScale(1)).toBe('1');
	});

	it('keeps a half, and does not pad it', () => {
		expect(formatScale(1.5)).toBe('1.5');
		expect(formatScale(0.5)).toBe('0.5');
	});

	it('rounds rather than truncates', () => {
		expect(formatScale(5 / 3)).toBe('1.67');
	});

	it('falls back to 1 for a value that is not a number', () => {
		expect(formatScale(NaN)).toBe('1');
	});
});

describe('stepping', () => {
	it('snaps an awkward factor onto the grid', () => {
		expect(stepScaleUp(8 / 6)).toBe(1.5);
		expect(stepScaleDown(8 / 6)).toBe(1);
	});

	it('moves a whole step from a factor already on the grid', () => {
		expect(stepScaleUp(1.5)).toBe(2);
		expect(stepScaleDown(1.5)).toBe(1);
		expect(stepScaleUp(2)).toBe(2.5);
		expect(stepScaleDown(2)).toBe(1.5);
	});

	it('always moves, and only in the one direction', () => {
		for (const scale of [0.5, 1, 1.25, 1.3333333333333333, 2.75, 10]) {
			expect(stepScaleUp(scale)).toBeGreaterThan(scale);
			expect(stepScaleDown(scale)).toBeLessThan(scale);
		}
	});

	it('reaches the floor the control stops at', () => {
		expect(stepScaleDown(0.6)).toBe(0.5);
	});
});
