import { describe, expect, it } from 'vitest';
import { formatScale } from './scale';

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
