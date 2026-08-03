<script lang="ts">
	import { Timer } from '@lucide/svelte';

	interface Props {
		name: string | null;
		quantity: string | null;
		index?: number;
		cookMode?: boolean;
		active?: boolean;
		onstart?: (index: number, name: string, quantity: string) => void;
	}

	const { name, quantity, index = 0, cookMode = false, active = false, onstart }: Props = $props();

	function handleClick() {
		if (cookMode && onstart && quantity) {
			onstart(index, name ?? 'Timer', quantity);
		}
	}
</script>

{#if cookMode}
	<button
		type="button"
		class="timer inline-flex items-center gap-1 rounded px-1 transition-colors {active
			? 'preset-tonal-warning'
			: 'preset-tonal-tertiary hover:preset-filled-tertiary'} cursor-pointer"
		onclick={handleClick}
		aria-label="Start timer: {name ?? ''} {quantity ?? ''}"
	>
		<Timer class="size-3" />
		{#if name}<span class="font-medium">{name}:</span>{/if}
		{#if quantity}<span>{quantity}</span>{/if}
	</button>
{:else}
	<span class="timer text-tertiary-600-400 italic">
		{#if name}<span class="font-medium">{name}:</span>{/if}
		{#if quantity}<span>{quantity}</span>{/if}
	</span>
{/if}
