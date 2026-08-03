<script lang="ts">
	import { TimerIcon } from '@lucide/svelte';
	import { highlightClass } from '../highlight';

	interface Props {
		name: string | null;
		quantity: string | null;
		index?: number;
		cookMode?: boolean;
		active?: boolean;
		onstart?: (index: number, name: string, quantity: string) => void;
	}

	const { name, quantity, index = 0, cookMode = false, active = false, onstart }: Props = $props();

	function start() {
		if (cookMode && onstart && quantity) {
			onstart(index, name ?? 'Timer', quantity);
		}
	}
</script>

{#if cookMode}
	<button
		type="button"
		class="inline-flex cursor-pointer items-center gap-1 rounded-sm px-1 transition-colors duration-150 {active
			? highlightClass('timing')
			: 'bg-surface-muted text-fg-muted hover:bg-warn-soft hover:text-warn-soft-fg'}"
		onclick={start}
		aria-label="Start timer{name ? `: ${name}` : ''}{quantity ? ` for ${quantity}` : ''}"
	>
		<TimerIcon class="size-3" />
		{#if name}<span class="font-medium">{name}:</span>{/if}
		{#if quantity}<span>{quantity}</span>{/if}
	</button>
{:else}
	<span class="text-fg-muted italic">
		{#if name}<span class="font-medium">{name}:</span>{/if}
		{#if quantity}<span>{quantity}</span>{/if}
	</span>
{/if}
