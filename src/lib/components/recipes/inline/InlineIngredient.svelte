<script lang="ts">
	import { highlightClass, resolveHighlight } from '../highlight';

	interface Props {
		name: string;
		quantity: string | null;
		index: number;
		highlighted: boolean;
		active: boolean;
		onhover: (index: number | null) => void;
	}

	const { name, quantity, index, highlighted, active, onhover }: Props = $props();

	const state = $derived(resolveHighlight({ hovered: highlighted, active }));
</script>

<!--
	Hovering cross-highlights this ingredient in the sidebar list. That is a
	pointer nicety, not an action: there is nothing to activate. It previously
	carried role="button" and tabindex="0" with no click or key handler, which
	announced a button to screen readers and put an unusable stop in the tab
	order for every ingredient in the recipe.

	The static-interaction warning is suppressed rather than answered with a
	role: inventing one would describe this to assistive tech as something it
	can act on, which is exactly the problem being fixed. Nothing is lost
	without a pointer, because the ingredient is also listed in the sidebar.
-->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<span
	class="rounded-sm px-1 transition-colors duration-150 {highlightClass(state)}"
	onmouseenter={() => onhover(index)}
	onmouseleave={() => onhover(null)}
>
	<span class="font-medium">{name}</span>
	{#if quantity}
		<span class="text-fg-muted text-sm">({quantity})</span>
	{/if}
</span>
