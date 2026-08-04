/**
 * Displaying a scale factor.
 *
 * The scale is derived by dividing a wanted servings count by the recipe's
 * declared one, so it is routinely a number with no exact decimal form: 8
 * servings of a recipe for 6 is 1.3333333333333333. That is the right value to
 * scale and store with -- rounding it would put the quantities slightly out --
 * but it is not a thing to show anyone.
 */

/** Decimals kept. Two tells 1.33x from 1.5x, which is as fine as anyone cooks. */
const DECIMALS = 2;

/**
 * A scale factor as text, without the `×`.
 *
 * Trailing zeros are dropped by `String`, so a round factor stays "2" rather
 * than becoming "2.00" and looking like a measurement.
 */
export function formatScale(scale: number): string {
	if (!Number.isFinite(scale)) return '1';

	const factor = 10 ** DECIMALS;
	return String(Math.round(scale * factor) / factor);
}

/** The stepper's grid. Halves are how anyone talks about doubling a recipe. */
const STEP = 0.5;

/**
 * The next step down, snapped to the grid rather than subtracted from where the
 * scale happens to be.
 *
 * A scale set from a servings count rarely lands on a half, and stepping from
 * 1.3333 by half would only produce 0.8333 -- a worse number than the one being
 * stepped away from. Snapping means the stepper always leaves a round factor
 * behind, whatever it started from.
 */
export function stepScaleDown(scale: number): number {
	return (Math.ceil(scale / STEP) - 1) * STEP;
}

/** The next step up, snapped to the same grid. */
export function stepScaleUp(scale: number): number {
	return (Math.floor(scale / STEP) + 1) * STEP;
}
