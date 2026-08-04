/**
 * Shopping list generation.
 *
 * Aggregation is delegated to the Cook CLI, which merges quantities across
 * recipes, applies the aisle categories, and subtracts anything already
 * stocked in the pantry. Verified against cookcli 0.19.3: both config files
 * are auto-discovered from the base path, and pantry subtraction is
 * unconditional.
 */

import { createHash } from 'node:crypto';
import { CookCLIError, generateShoppingList } from '$lib/cooklang/cli.js';
import { transformShoppingList } from '$lib/cooklang/transform.js';
import type { ShoppingListDisplay } from '$lib/types/shopping-list.js';
import { getIndex } from '../recipes/index.js';
import { getAisleOrder, sortByAisle } from './aisle.js';
import { aisleStamp } from '../aisle/store.js';
import { pantryMtimeMs } from '../pantry/store.js';
import type { ResolvedSelection } from './store.js';

export interface GenerateResult {
	list: ShoppingListDisplay | null;
	/** Set when the list could not be produced; the page still renders. */
	error: string | null;
	/** True when the Cook CLI is missing, which is expected in development. */
	cliMissing: boolean;
	/**
	 * Non-fatal complaints from the CLI, shown to the user.
	 *
	 * Most often a pantry entry whose unit does not match the recipe's, e.g.
	 * 2kg of flour against a recipe calling for grams. cookcli 0.19.3 does not
	 * convert between them and quietly leaves the ingredient on the list, so
	 * without this the pantry looks broken.
	 */
	warnings: string[];
}

interface Memo {
	key: string;
	result: GenerateResult;
}

let memo: Memo | null = null;
let inflight: { key: string; promise: Promise<GenerateResult> } | null = null;

/**
 * Cache key covering everything the output depends on: the selections, the
 * recipes themselves, the aisle config, and the pantry. A pantry edit changes
 * its mtime, so stock changes invalidate the list without any explicit wiring.
 *
 * The aisle config contributes a stamp rather than a bare mtime, because
 * assigning an aisle from this very page writes the file and redirects
 * straight back here. On a mount with one-second mtime resolution that write
 * can be invisible, and the page would re-render the list it was meant to
 * regroup.
 */
async function cacheKey(selections: readonly ResolvedSelection[]): Promise<string> {
	const [index, aisle, pantryMtime] = await Promise.all([
		getIndex(),
		aisleStamp(),
		pantryMtimeMs()
	]);

	return createHash('sha1')
		.update(JSON.stringify(selections.map((s) => [s.slug, s.scale])))
		.update(String(index.maxMtimeMs))
		.update(aisle)
		.update(String(pantryMtime))
		.digest('hex');
}

async function run(selections: readonly ResolvedSelection[]): Promise<GenerateResult> {
	if (selections.length === 0) {
		return { list: null, error: null, cliMissing: false, warnings: [] };
	}

	try {
		const { list, warnings } = await generateShoppingList(
			selections.map((selection) => ({ relPath: selection.relPath, scale: selection.scale }))
		);

		const display = transformShoppingList(list, selections.length);
		const order = await getAisleOrder();

		return {
			list: { ...display, categories: sortByAisle(display.categories, order) },
			error: null,
			cliMissing: false,
			warnings
		};
	} catch (error) {
		if (error instanceof CookCLIError) {
			// ENOENT surfaces as a spawn failure; treat it as "not installed"
			// rather than a server error, so development without the binary
			// degrades to an explanation instead of a 500.
			const missing = /Failed to execute Cook CLI/.test(error.message);
			console.error('Shopping list generation failed:', error.message, error.stderr ?? '');

			return {
				list: null,
				cliMissing: missing,
				warnings: [],
				error: missing
					? 'The cook CLI is not available, so the combined list cannot be generated.'
					: `${error.message}${error.stderr ? ` (${error.stderr.trim()})` : ''}`
			};
		}

		console.error('Shopping list generation failed:', error);
		return {
			list: null,
			cliMissing: false,
			warnings: [],
			error: error instanceof Error ? error.message : 'Failed to generate the shopping list'
		};
	}
}

/**
 * Generate the list, reusing the previous result while nothing it depends on
 * has changed. Each call would otherwise spawn a subprocess -- the old store
 * re-ran it after every add, remove and scale change.
 */
export async function getShoppingList(
	selections: readonly ResolvedSelection[]
): Promise<GenerateResult> {
	const key = await cacheKey(selections);

	if (memo?.key === key) return memo.result;
	if (inflight?.key === key) return inflight.promise;

	const promise = run(selections).then((result) => {
		memo = { key, result };
		return result;
	});

	inflight = { key, promise };
	try {
		return await promise;
	} finally {
		if (inflight?.key === key) inflight = null;
	}
}
