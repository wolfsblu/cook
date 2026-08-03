<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { ArrowDownIcon, ArrowUpIcon, FunnelIcon } from '@lucide/svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import RecipePagination from './RecipePagination.svelte';

	/**
	 * Sort controls, the filter trigger and the page links. Search used to live
	 * here too; it now sits in the app header, where it is reachable from every
	 * page, and this row sits directly beneath it.
	 */
	type Props = {
		isDrawerOpen: boolean;
		activeFilterCount?: number;
		pageNumber?: number;
		totalPages?: number;
	};

	let {
		isDrawerOpen = $bindable(),
		activeFilterCount = 0,
		pageNumber = 1,
		totalPages = 1
	}: Props = $props();

	const SORT_OPTIONS = [
		{ value: 'name', label: 'Name' },
		{ value: 'time', label: 'Time' },
		{ value: 'servings', label: 'Servings' }
	];

	let sortField = $state(page.url.searchParams.get('sort') || 'name');
	let sortOrder = $state<'asc' | 'desc'>(
		(page.url.searchParams.get('order') || 'asc') as 'asc' | 'desc'
	);

	function updateUrl() {
		const params = new URLSearchParams(page.url.searchParams);

		// Re-sorting reshuffles the whole list, so page 3 of the old order means
		// nothing in the new one.
		params.delete('page');

		if (sortField !== 'name') params.set('sort', sortField);
		else params.delete('sort');

		if (sortOrder !== 'asc') params.set('order', sortOrder);
		else params.delete('order');

		const query = params.toString();
		goto(query ? `?${query}` : '/', { keepFocus: true, noScroll: true });
	}

	function toggleSortOrder() {
		sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		updateUrl();
	}
</script>

<div class="flex flex-wrap items-center gap-2">
	<Button variant="outline" onclick={() => (isDrawerOpen = true)}>
		<FunnelIcon class="size-4" />
		Filters
		{#if activeFilterCount > 0}
			<Badge tone="accent">{activeFilterCount}</Badge>
		{/if}
	</Button>

	<div class="ml-auto flex flex-wrap items-center gap-2">
		<RecipePagination {pageNumber} {totalPages} />

		<Select
			bind:value={sortField}
			options={SORT_OPTIONS}
			label="Sort by"
			class="w-36"
			onchange={updateUrl}
		/>
		<IconButton
			variant="outline"
			label={sortOrder === 'asc' ? 'Sort ascending' : 'Sort descending'}
			onclick={toggleSortOrder}
		>
			{#if sortOrder === 'asc'}
				<ArrowUpIcon class="size-4" />
			{:else}
				<ArrowDownIcon class="size-4" />
			{/if}
		</IconButton>
	</div>
</div>
