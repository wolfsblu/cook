<script lang="ts">
	interface Props {
		name: string;
		quantity: string | null;
		index: number;
		highlighted: boolean;
		active: boolean;
		onhover: (index: number | null) => void;
	}

	const { name, quantity, index, highlighted, active, onhover }: Props = $props();
</script>

<span
	role="button"
	tabindex="0"
	class="cookware cursor-pointer rounded px-1 transition-colors {highlighted
		? 'preset-tonal-secondary'
		: active
			? 'preset-tonal-tertiary'
			: ''}"
	onmouseenter={() => onhover(index)}
	onmouseleave={() => onhover(null)}
>
	<span class="font-medium">{name}</span>
	{#if quantity}
		<span class="text-surface-600-400 text-sm">({quantity})</span>
	{/if}
</span>
