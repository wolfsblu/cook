<script lang="ts">
	import { page } from '$app/state';
	import { SearchXIcon } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import FilterDrawer from '$lib/components/recipes/FilterDrawer.svelte';
	import RecipeCard from '$lib/components/recipes/RecipeCard.svelte';
	import RecipeFilters from '$lib/components/recipes/RecipeFilters.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Page from '$lib/components/ui/Page.svelte';
	import { applyFilters, sortRecipes } from '$lib/utils/recipe-filters';
	import { parseFilterParams } from '$lib/utils/url-params';

	const { data }: PageProps = $props();

	let isDrawerOpen = $state(false);

	const filters = $derived(parseFilterParams(page.url.searchParams));
	const sortField = $derived(page.url.searchParams.get('sort') || 'name');
	const sortOrder = $derived((page.url.searchParams.get('order') || 'asc') as 'asc' | 'desc');

	const displayRecipes = $derived(
		sortRecipes(applyFilters(data.recipes, filters), sortField, sortOrder)
	);

	const activeFilterCount = $derived(
		(filters.tags.length > 0 ? 1 : 0) +
			(filters.course !== null ? 1 : 0) +
			(filters.timeRange.min > 0 || filters.timeRange.max !== Infinity ? 1 : 0) +
			(filters.servingsRange.min > 0 || filters.servingsRange.max !== Infinity ? 1 : 0)
	);

	const hasQuery = $derived(Boolean(data.searchQuery) || activeFilterCount > 0);
</script>

<svelte:head>
	<title>Recipes</title>
</svelte:head>

<Page wide>
	<div class="mb-6">
		<RecipeFilters bind:isDrawerOpen {activeFilterCount} />
	</div>

	{#if displayRecipes.length === 0}
		<EmptyState
			icon={SearchXIcon}
			title="No recipes found"
			description={hasQuery
				? 'Nothing matches the current search and filters.'
				: 'No recipes were found in the recipe directory.'}
		>
			{#snippet actions()}
				{#if hasQuery}
					<Button href="/" variant="outline">Clear search and filters</Button>
				{/if}
			{/snippet}
		</EmptyState>
	{:else}
		<div
			class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
		>
			{#each displayRecipes as recipe (recipe.slug)}
				<RecipeCard {recipe} />
			{/each}
		</div>
	{/if}
</Page>

<FilterDrawer bind:isOpen={isDrawerOpen} allTags={data.allTags} allCourses={data.allCourses} />
