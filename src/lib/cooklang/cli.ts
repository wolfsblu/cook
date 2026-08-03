/**
 * Cook CLI wrapper for executing shopping list generation
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { config } from '$lib/server/config.js';
import type { CookCLIShoppingList } from './types.js';

/**
 * A recipe to include in a shopping list.
 *
 * `relPath` is the path relative to the recipe directory, not a bare filename.
 * The CLI resolves recipes relative to its base path, so passing a basename
 * silently loses every recipe that lives in a subdirectory.
 */
export interface RecipeInput {
	relPath: string;
	scale: number;
}

/**
 * Error thrown when Cook CLI execution fails
 */
export class CookCLIError extends Error {
	constructor(
		message: string,
		public readonly stderr?: string,
		public readonly exitCode?: number
	) {
		super(message);
		this.name = 'CookCLIError';
	}
}

/**
 * Get the absolute recipe path
 */
export function getRecipePath(): string {
	return path.resolve(config.RECIPE_PATH);
}

/**
 * Build the CLI arguments for shopping list generation
 * Example: ["shopping-list", "recipe1.cook:2", "recipe2.cook", "-f", "json"]
 */
function buildCLIArgs(recipes: RecipeInput[]): string[] {
	// --base-path is explicit rather than relying on the subprocess cwd, and it
	// is also what makes the CLI discover <base>/config/aisle.conf and
	// <base>/config/pantry.conf. Both are applied automatically: categories come
	// from aisle.conf, and ingredients already stocked in pantry.conf are
	// subtracted from the result.
	const args: string[] = ['shopping-list', '--base-path', config.RECIPE_PATH];

	for (const recipe of recipes) {
		args.push(recipe.scale !== 1 ? `${recipe.relPath}:${recipe.scale}` : recipe.relPath);
	}

	args.push('-f', 'json');

	return args;
}

/**
 * A successful run, plus anything the CLI complained about on the way.
 *
 * Warnings matter here: when a pantry entry cannot be matched to a recipe's
 * ingredient the CLI declines to subtract it and says so on stderr. Discarding
 * that leaves the user staring at an item they know they have in stock with no
 * explanation.
 */
export interface CookCLIResult {
	list: CookCLIShoppingList;
	warnings: string[];
}

/**
 * ANSI colour codes. Matching the ESC control character is the entire point of
 * this pattern, so the control-character lint rule has nothing useful to say.
 */
// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;]*m/g;

/**
 * Pull the human-readable part out of the CLI's `WARN ...` lines.
 *
 * A real example, which is what makes these worth surfacing:
 *   WARN Unit mismatch for 'flour': recipe needs 'g', pantry has 'kg'
 *
 * The CLI colours its output and wraps continuations onto indented following
 * lines, so escapes are stripped and wrapped lines rejoined before matching.
 */
export function parseWarnings(stderr: string): string[] {
	const warnings: string[] = [];
	let current: string | null = null;

	const flush = () => {
		const text = current?.trim();
		if (text && !warnings.includes(text)) warnings.push(text);
		current = null;
	};

	for (const raw of stderr.replace(ANSI, '').split(/\r?\n/)) {
		const match = raw.match(/\bWARN\b\s*(.*)/);

		if (match) {
			flush();
			current = match[1];
			continue;
		}

		// An indented line with no marker of its own continues the previous
		// warning. Checking for the marker first matters because the CLI indents
		// the warnings themselves, so treating every indented line as a
		// continuation would fold them all into one.
		if (current !== null && /^[ \t]+\S/.test(raw)) {
			current += ` ${raw.trim()}`;
			continue;
		}

		flush();
	}

	flush();
	return warnings;
}

/**
 * Execute Cook CLI command and return parsed JSON output
 */
async function executeCookCLI(args: string[]): Promise<CookCLIResult> {
	return new Promise((resolve, reject) => {
		const recipePath = getRecipePath();

		// Spawn the Cook CLI process
		const proc = spawn(config.COOK_CLI_PATH, args, {
			cwd: recipePath,
			env: process.env
		});

		let stdout = '';
		let stderr = '';

		// Collect stdout
		proc.stdout.on('data', (data) => {
			stdout += data.toString();
		});

		// Collect stderr
		proc.stderr.on('data', (data) => {
			stderr += data.toString();
		});

		// Set timeout
		const timeout = setTimeout(() => {
			proc.kill('SIGTERM');
			reject(
				new CookCLIError(`Cook CLI execution timed out after ${config.COOK_CLI_TIMEOUT}ms`, stderr)
			);
		}, config.COOK_CLI_TIMEOUT);

		// Handle process completion
		proc.on('close', (code) => {
			clearTimeout(timeout);

			if (code !== 0) {
				reject(new CookCLIError(`Cook CLI exited with code ${code}`, stderr, code || undefined));
				return;
			}

			// Parse JSON output
			try {
				const parsed = JSON.parse(stdout) as CookCLIShoppingList;
				resolve({ list: parsed, warnings: parseWarnings(stderr) });
			} catch (error) {
				reject(
					new CookCLIError(
						`Failed to parse Cook CLI JSON output: ${error instanceof Error ? error.message : 'Unknown error'}`,
						stderr
					)
				);
			}
		});

		// Handle process errors (e.g., command not found)
		proc.on('error', (error) => {
			clearTimeout(timeout);
			reject(
				new CookCLIError(
					`Failed to execute Cook CLI: ${error.message}. Is Cook CLI installed and in PATH?`,
					stderr
				)
			);
		});
	});
}

/**
 * Generate a shopping list from multiple recipes
 *
 * @param recipes - Recipes with paths relative to the recipe directory
 * @returns Promise resolving to Cook CLI shopping list JSON output
 * @throws {CookCLIError} If CLI execution fails
 *
 * @example
 * const list = await generateShoppingList([
 *   { relPath: 'Breakfast/Easy Pancakes.cook', scale: 2 },
 *   { relPath: 'lamb-chops.cook', scale: 1 }
 * ]);
 */
export async function generateShoppingList(recipes: RecipeInput[]): Promise<CookCLIResult> {
	if (recipes.length === 0) {
		return { list: [], warnings: [] };
	}

	return executeCookCLI(buildCLIArgs(recipes));
}
