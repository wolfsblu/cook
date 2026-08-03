import { describe, expect, it } from 'vitest';
import {
	compareQuantities,
	daysUntilExpiry,
	formatQuantity,
	isExpiringSoon,
	isLow,
	parseQuantity
} from './quantity';

describe('parseQuantity', () => {
	it('splits amount and unit on %', () => {
		expect(parseQuantity('500%g')).toEqual({ amount: 500, unit: 'g' });
		expect(parseQuantity('1%L')).toEqual({ amount: 1, unit: 'L' });
	});

	it('reads a bare count as unitless', () => {
		expect(parseQuantity('6')).toEqual({ amount: 6, unit: null });
	});

	it('accepts fractions', () => {
		expect(parseQuantity('1/2%cup')).toEqual({ amount: 0.5, unit: 'cup' });
	});

	it('returns null for text amounts and empty input', () => {
		expect(parseQuantity('pinch')).toBeNull();
		expect(parseQuantity('a jar')).toBeNull();
		expect(parseQuantity(null)).toBeNull();
		expect(parseQuantity('1/0')).toBeNull();
	});
});

describe('formatQuantity', () => {
	it('renders amount and unit separately', () => {
		expect(formatQuantity('500%g')).toBe('500 g');
		expect(formatQuantity('6')).toBe('6');
	});

	it('passes unparseable values through unchanged', () => {
		expect(formatQuantity('pinch')).toBe('pinch');
	});
});

describe('compareQuantities', () => {
	it('compares within a unit', () => {
		expect(compareQuantities('500%g', '200%g')).toBeGreaterThan(0);
		expect(compareQuantities('100%g', '200%g')).toBeLessThan(0);
	});

	it('converts across a dimension', () => {
		expect(compareQuantities('1%kg', '500%g')).toBeGreaterThan(0);
		expect(compareQuantities('1%L', '1000%ml')).toBe(0);
	});

	it('refuses to compare different dimensions', () => {
		expect(compareQuantities('500%g', '500%ml')).toBeNull();
	});

	it('refuses to compare a unit against a bare count', () => {
		// This is the case the Cook CLI warns about for `@salt{pinch}` against a
		// pantry stocking `salt = "500%g"`.
		expect(compareQuantities('500%g', '2')).toBeNull();
	});

	it('refuses unknown units', () => {
		expect(compareQuantities('2%bunches', '1%bunches')).toBeNull();
	});
});

describe('isLow', () => {
	it('is false without a threshold', () => {
		expect(isLow({ quantity: '10%g', low: null })).toBe(false);
	});

	it('is true at or below the threshold', () => {
		expect(isLow({ quantity: '100%g', low: '200%g' })).toBe(true);
		expect(isLow({ quantity: '200%g', low: '200%g' })).toBe(true);
	});

	it('is false above the threshold', () => {
		expect(isLow({ quantity: '500%g', low: '200%g' })).toBe(false);
	});

	it('never claims low on a unit mismatch', () => {
		expect(isLow({ quantity: 'pinch', low: '200%g' })).toBe(false);
		expect(isLow({ quantity: '500%ml', low: '200%g' })).toBe(false);
	});
});

describe('expiry', () => {
	const now = new Date('2026-08-03T12:00:00Z');

	it('counts whole days ahead', () => {
		expect(daysUntilExpiry({ expire: '2026-08-10' }, now)).toBe(7);
		expect(daysUntilExpiry({ expire: '2026-08-03' }, now)).toBe(0);
	});

	it('goes negative once past', () => {
		expect(daysUntilExpiry({ expire: '2026-08-01' }, now)).toBe(-2);
	});

	it('returns null when undated or unparseable', () => {
		expect(daysUntilExpiry({ expire: null }, now)).toBeNull();
		expect(daysUntilExpiry({ expire: 'soon' }, now)).toBeNull();
	});

	it('flags anything within a week, including expired', () => {
		expect(isExpiringSoon({ expire: '2026-08-10' }, now)).toBe(true);
		expect(isExpiringSoon({ expire: '2026-08-01' }, now)).toBe(true);
		expect(isExpiringSoon({ expire: '2026-09-01' }, now)).toBe(false);
	});
});
