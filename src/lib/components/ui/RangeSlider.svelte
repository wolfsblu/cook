<script lang="ts">
	import { Slider } from 'bits-ui';

	/**
	 * Dual-thumb range slider.
	 *
	 * Commits on release rather than on every drag frame: the filter drawer
	 * turns these values into a navigation, and firing that per frame would
	 * queue a request for every pixel of travel.
	 */
	type Props = {
		value: number[];
		min: number;
		max: number;
		step?: number;
		label: string;
		oncommit?: (value: number[]) => void;
	};

	let { value = $bindable(), min, max, step = 1, label, oncommit }: Props = $props();
</script>

<Slider.Root
	type="multiple"
	bind:value
	{min}
	{max}
	{step}
	onValueCommit={oncommit}
	aria-label={label}
	class="relative flex w-full touch-none items-center py-2 select-none"
>
	{#snippet children({ thumbItems })}
		<span class="bg-surface-sunk relative h-1.5 w-full grow rounded-full">
			<Slider.Range class="bg-accent absolute h-full rounded-full" />
		</span>

		{#each thumbItems as { index } (index)}
			<Slider.Thumb
				{index}
				class="border-accent bg-surface focus-visible:ring-ring hover:shadow-pop block size-4 cursor-grab rounded-full border-2 shadow-sm transition-shadow active:cursor-grabbing"
			/>
		{/each}
	{/snippet}
</Slider.Root>
