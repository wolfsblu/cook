/**
 * Highlight colours for ingredients, cookware and timers.
 *
 * These used to be decided per component, and the components disagreed:
 * RecipeIngredients hovered in primary and marked the active step in secondary,
 * while RecipeCookware hovered in secondary and marked the active step in
 * tertiary. Same interaction, different colours, depending on what you were
 * pointing at.
 *
 * The rule here keys on *state* rather than on entity type, so hovering an
 * ingredient and hovering a pan look the same.
 */
export type HighlightState =
	/** Pointer is on this item, or on its counterpart elsewhere in the page. */
	| 'hover'
	/** Item belongs to the step being cooked right now. */
	| 'active'
	/** Item has a timer running. */
	| 'timing'
	| 'none';

const CLASSES: Record<HighlightState, string> = {
	hover: 'bg-accent-soft text-accent-soft-fg',
	active: 'bg-accent2-soft text-accent2-soft-fg',
	timing: 'bg-warn-soft text-warn-soft-fg',
	none: ''
};

export function highlightClass(state: HighlightState): string {
	return CLASSES[state];
}

/**
 * Resolve the state from the flags call sites actually have.
 * Active outranks hover: while cooking, "this is in the current step" is the
 * more important signal.
 */
export function resolveHighlight(options: {
	hovered?: boolean;
	active?: boolean;
	timing?: boolean;
}): HighlightState {
	if (options.timing) return 'timing';
	if (options.active) return 'active';
	if (options.hovered) return 'hover';
	return 'none';
}
