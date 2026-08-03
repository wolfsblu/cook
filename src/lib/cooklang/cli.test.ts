import { describe, expect, it } from 'vitest';
import { parseWarnings } from './cli';

const ESC = '';

describe('parseWarnings', () => {
	it('extracts a warning from colourised output', () => {
		// Captured from cookcli 0.19.3 with 2kg of flour stocked against a recipe
		// measured in grams. The CLI declines to subtract and says so here only.
		const stderr = `${ESC}[33m WARN${ESC}[0m Unit mismatch for 'flour': recipe needs 'g', pantry has 'kg'\n`;

		expect(parseWarnings(stderr)).toEqual([
			"Unit mismatch for 'flour': recipe needs 'g', pantry has 'kg'"
		]);
	});

	it('rejoins a warning wrapped onto an indented continuation line', () => {
		const stderr = `${ESC}[33m WARN${ESC}[0m Unit mismatch for 'flour': recipe needs 'g'\n    pantry has 'kg'\n`;

		expect(parseWarnings(stderr)).toEqual([
			"Unit mismatch for 'flour': recipe needs 'g' pantry has 'kg'"
		]);
	});

	it('collects several warnings and drops duplicates', () => {
		const stderr = [
			" WARN Unit mismatch for 'salt'",
			" WARN Unit mismatch for 'flour'",
			" WARN Unit mismatch for 'salt'"
		].join('\n');

		expect(parseWarnings(stderr)).toEqual([
			"Unit mismatch for 'salt'",
			"Unit mismatch for 'flour'"
		]);
	});

	it('ignores output with no warnings', () => {
		expect(parseWarnings('')).toEqual([]);
		expect(parseWarnings('Loading pantry from: /recipes/config/pantry.conf\n')).toEqual([]);
	});
});
