<script lang="ts">
	import { Combobox } from 'bits-ui';
	import { CheckIcon, ChevronsUpDownIcon } from '@lucide/svelte';
	import Chip from './Chip.svelte';

	/**
	 * Multi-select combobox with a filterable list and chips for the current
	 * selection.
	 */
	type Props = {
		selected: string[];
		options: string[];
		placeholder?: string;
		label: string;
		/** Chips shown before collapsing the rest into a count. */
		maxVisible?: number;
	};

	let {
		selected = $bindable([]),
		options,
		placeholder = 'Search…',
		label,
		maxVisible = 5
	}: Props = $props();

	let search = $state('');

	const filtered = $derived(
		search ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase())) : options
	);

	const visible = $derived(selected.slice(0, maxVisible));
	const hiddenCount = $derived(Math.max(0, selected.length - maxVisible));

	function remove(tag: string) {
		selected = selected.filter((t) => t !== tag);
	}
</script>

<div class="w-full">
	<Combobox.Root
		type="multiple"
		bind:value={selected}
		onOpenChange={(open) => {
			if (!open) search = '';
		}}
	>
		<div class="relative">
			<Combobox.Input
				aria-label={label}
				{placeholder}
				oninput={(e) => (search = e.currentTarget.value)}
				class="field pr-9"
			/>
			<Combobox.Trigger
				class="text-fg-subtle hover:text-fg absolute inset-y-0 right-0 flex items-center px-2 transition-colors"
				aria-label="Toggle {label} options"
			>
				<ChevronsUpDownIcon class="size-4" />
			</Combobox.Trigger>
		</div>

		<Combobox.Portal>
			<Combobox.Content
				sideOffset={4}
				class="bg-surface border-border shadow-pop z-50 max-h-64 w-[var(--bits-combobox-anchor-width)] overflow-y-auto rounded-md border p-1"
			>
				{#each filtered as option (option)}
					<Combobox.Item
						value={option}
						label={option}
						class="data-highlighted:bg-accent-soft data-highlighted:text-accent-soft-fg flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm"
					>
						{#snippet children({ selected: isSelected })}
							{option}
							{#if isSelected}
								<CheckIcon class="text-accent size-4" />
							{/if}
						{/snippet}
					</Combobox.Item>
				{:else}
					<p class="text-fg-subtle px-2 py-1.5 text-sm">No matches</p>
				{/each}
			</Combobox.Content>
		</Combobox.Portal>
	</Combobox.Root>

	{#if visible.length > 0}
		<div class="mt-2 flex flex-wrap gap-1.5">
			{#each visible as tag (tag)}
				<Chip label={tag} onremove={() => remove(tag)} />
			{/each}
			{#if hiddenCount > 0}
				<span class="text-fg-subtle self-center text-xs">and {hiddenCount} more</span>
			{/if}
		</div>
	{/if}
</div>
