<script lang="ts">
	import { onMount } from 'svelte';
	import { shoppingListStore } from '$lib/stores/shopping-list.svelte';
	import SelectedRecipesList from '$lib/components/shopping/SelectedRecipesList.svelte';
	import ShoppingListDisplay from '$lib/components/shopping/ShoppingListDisplay.svelte';

	onMount(() => {
		shoppingListStore.load();
	});

	async function handleUpdateScale(slug: string, scale: number) {
		await shoppingListStore.updateScale(slug, scale);
	}

	async function handleRemove(slug: string) {
		await shoppingListStore.removeRecipe(slug);
	}

	async function handleClear() {
		await shoppingListStore.clear();
	}
</script>

<div class="container mx-auto space-y-6 px-4 py-6">
	{#if shoppingListStore.isLoading}
		<div class="card preset-outlined-surface-200-800 p-8 text-center">
			<p class="text-surface-600-400">Loading shopping list...</p>
		</div>
	{:else if shoppingListStore.recipes.length === 0}
		<div class="card preset-outlined-surface-200-800 space-y-2 p-8 text-center">
			<p class="text-surface-600-400">No recipes in your shopping list.</p>
			<p>
				<a href="/" class="anchor">Browse recipes</a>
				and click "Add to Shopping List" to get started.
			</p>
		</div>
	{:else}
		<div class="grid gap-6 lg:grid-cols-[400px_1fr]">
			<aside>
				<SelectedRecipesList
					recipes={shoppingListStore.recipes}
					onupdatescale={handleUpdateScale}
					onremove={handleRemove}
					onclear={handleClear}
				/>
			</aside>

			<main>
				<ShoppingListDisplay
					shoppingList={shoppingListStore.list}
					loading={shoppingListStore.isLoading}
				/>
			</main>
		</div>
	{/if}

	{#if shoppingListStore.errorMessage}
		<div class="card preset-filled-error p-4">
			<p class="font-semibold">Error</p>
			<p class="text-sm">{shoppingListStore.errorMessage}</p>
		</div>
	{/if}
</div>
