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

	// Same states, same colours as an ingredient. These two used to disagree:
	// hover was primary here and secondary there.
	const state = $derived(resolveHighlight({ hovered: highlighted, active }));
</script>

<!-- Decorative hover only; see InlineIngredient for why there is no role here. -->
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
