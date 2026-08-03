<script lang="ts">
	import { page } from '$app/state';
	import type { PageProps } from './$types';
	import RecipeCard from '$lib/components/recipes/RecipeCard.svelte';
	import RecipeFilters from '$lib/components/recipes/RecipeFilters.svelte';
	import FilterDrawer from '$lib/components/recipes/FilterDrawer.svelte';
	import { applyFilters, sortRecipes } from '$lib/utils/recipe-filters';
	import { parseFilterParams } from '$lib/utils/url-params';

	const { data }: PageProps = $props();

	// Drawer state
	let isDrawerOpen = $state(false);

	// Parse filters from URL
	const filters = $derived(parseFilterParams(page.url.searchParams));
	const sortField = $derived(page.url.searchParams.get('sort') || 'name');
	const sortOrder = $derived((page.url.searchParams.get('order') || 'asc') as 'asc' | 'desc');

	// Apply filters and sort
	const filteredRecipes = $derived(applyFilters(data.recipes, filters));
	const displayRecipes = $derived(sortRecipes(filteredRecipes, sortField, sortOrder));

	// Check if any filters are active
	const hasActiveFilters = $derived(
		filters.tags.length > 0 ||
			filters.course !== null ||
			filters.timeRange.min > 0 ||
			filters.timeRange.max !== Infinity ||
			filters.servingsRange.min > 0 ||
			filters.servingsRange.max !== Infinity
	);
</script>

<div class="grid h-full">
	<!-- Main content -->
	<div class="col-start-1 row-start-1 overflow-auto">
		<!-- Search Bar and Sort -->
		<RecipeFilters bind:isDrawerOpen />

		{#if displayRecipes.length === 0}
			<div class="px-4 py-12 text-center">
				<p class="text-surface-600-400 text-lg">No recipes found</p>
				{#if data.searchQuery || hasActiveFilters}
					<a href="/" class="btn preset-filled-primary-500 mt-4">Clear filters</a>
				{/if}
			</div>
		{:else}
			<!-- Recipe Grid -->
			<div
				class="grid grid-cols-1 gap-6 px-3 pb-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
			>
				{#each displayRecipes as recipe (recipe.slug)}
					<RecipeCard {recipe} />
				{/each}
			</div>
		{/if}
	</div>

	<!-- Filter drawer overlay - same grid cell, higher z-index -->
	{#if isDrawerOpen}
		<div class="z-40 col-start-1 row-start-1">
			<FilterDrawer
				bind:isOpen={isDrawerOpen}
				allTags={data.allTags}
				allCourses={data.allCourses}
			/>
		</div>
	{/if}
</div>
