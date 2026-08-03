<script lang="ts">
	import {
		Combobox,
		type ComboboxRootProps,
		useListCollection
	} from '@skeletonlabs/skeleton-svelte';

	interface Props {
		selectedTags: string[];
		availableTags: string[];
	}

	let { selectedTags = $bindable([]), availableTags }: Props = $props();

	// Filter state
	let filterText = $state('');

	// All items derived from props
	const allItems = $derived(availableTags.map((tag) => ({ label: tag, value: tag })));

	// Filtered items
	const items = $derived(
		filterText
			? allItems.filter((item) => item.value.toLowerCase().includes(filterText.toLowerCase()))
			: allItems
	);

	const collection = $derived(
		useListCollection({
			items: items,
			itemToString: (item) => item.label,
			itemToValue: (item) => item.value
		})
	);

	// Computed properties for display
	const visibleSelectedTags = $derived(selectedTags.slice(0, 5));
	const hiddenCount = $derived(Math.max(0, selectedTags.length - 5));

	const onOpenChange = () => {
		filterText = '';
	};

	const onInputValueChange: ComboboxRootProps['onInputValueChange'] = (event) => {
		filterText = event.inputValue;
	};

	const onValueChange: ComboboxRootProps['onValueChange'] = (event) => {
		selectedTags = event.value;
	};
</script>

<div class="w-full">
	<Combobox
		placeholder="Search tags..."
		{collection}
		{onOpenChange}
		{onInputValueChange}
		value={selectedTags}
		{onValueChange}
		multiple
	>
		<Combobox.Control>
			<Combobox.Input />
			<Combobox.Trigger />
		</Combobox.Control>
		<Combobox.Positioner class="!z-20">
			<Combobox.Content>
				{#each items as item (item.value)}
					<Combobox.Item {item}>
						<Combobox.ItemText>{item.label}</Combobox.ItemText>
						<Combobox.ItemIndicator />
					</Combobox.Item>
				{/each}
			</Combobox.Content>
		</Combobox.Positioner>
	</Combobox>

	<!-- Display selected tags (first 5) + "X more" indicator -->
	{#if visibleSelectedTags.length > 0}
		<div class="mt-2 flex flex-wrap gap-2">
			{#each visibleSelectedTags as tag (tag)}
				<button
					type="button"
					onclick={() => {
						selectedTags = selectedTags.filter((t) => t !== tag);
					}}
					class="chip preset-filled-primary-500 group flex items-center gap-1"
				>
					<span class="max-w-[150px] truncate">{tag}</span>
					<span class="opacity-70 group-hover:opacity-100">×</span>
				</button>
			{/each}
			{#if hiddenCount > 0}
				<span class="badge preset-tonal-surface text-xs">and {hiddenCount} more</span>
			{/if}
		</div>
	{/if}
</div>
