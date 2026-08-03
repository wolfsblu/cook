<script lang="ts">
	import { onMount } from 'svelte';
	import { ShoppingCartIcon } from '@lucide/svelte';
	import { shoppingListStore } from '$lib/stores/shopping-list.svelte';
	import SelectedRecipesList from '$lib/components/shopping/SelectedRecipesList.svelte';
	import ShoppingListDisplay from '$lib/components/shopping/ShoppingListDisplay.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Page from '$lib/components/ui/Page.svelte';

	onMount(() => {
		shoppingListStore.load();
	});
</script>

<svelte:head>
	<title>Shopping list</title>
</svelte:head>

<Page title="Shopping">
	{#if shoppingListStore.errorMessage}
		<Card variant="outline" class="border-danger bg-danger-soft text-danger-soft-fg mb-6 p-4">
			<p class="font-semibold">Could not generate the shopping list</p>
			<p class="mt-1 text-sm">{shoppingListStore.errorMessage}</p>
		</Card>
	{/if}

	{#if shoppingListStore.recipes.length === 0 && !shoppingListStore.isLoading}
		<EmptyState
			icon={ShoppingCartIcon}
			title="Your shopping list is empty"
			description="Open a recipe and add it to build a combined list, with quantities merged across recipes."
		>
			{#snippet actions()}
				<Button href="/">Browse recipes</Button>
			{/snippet}
		</EmptyState>
	{:else}
		<div class="grid gap-6 lg:grid-cols-[22rem_1fr]">
			<aside>
				<SelectedRecipesList
					recipes={shoppingListStore.recipes}
					onupdatescale={(slug, scale) => shoppingListStore.updateScale(slug, scale)}
					onremove={(slug) => shoppingListStore.removeRecipe(slug)}
					onclear={() => shoppingListStore.clear()}
				/>
			</aside>

			<div>
				<ShoppingListDisplay
					shoppingList={shoppingListStore.list}
					loading={shoppingListStore.isLoading}
				/>
			</div>
		</div>
	{/if}
</Page>
