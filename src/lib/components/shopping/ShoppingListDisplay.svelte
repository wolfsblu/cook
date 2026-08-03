<script lang="ts">
	import { Loader2 } from '@lucide/svelte';
	import type { ShoppingListDisplay } from '$lib/types/shopping-list';

	interface Props {
		shoppingList: ShoppingListDisplay | null;
		loading?: boolean;
	}

	let { shoppingList, loading = false }: Props = $props();
</script>

<div class="card preset-outlined-surface-200-800 space-y-4 p-4">
	{#if loading}
		<!-- Loading state -->
		<div class="flex items-center justify-center py-12">
			<Loader2 size={32} class="text-primary-500 animate-spin" />
			<span class="text-surface-600-400 ml-3">Generating shopping list...</span>
		</div>
	{:else if !shoppingList}
		<!-- Empty state -->
		<div class="py-12 text-center">
			<p class="text-surface-600-400">Add recipes to generate a shopping list</p>
		</div>
	{:else}
		<!-- Shopping list header -->
		<div class="flex items-start justify-between">
			<h1 class="h4">Shopping List</h1>
			<div class="text-surface-600-400 text-sm">
				{shoppingList.totalItems} items from {shoppingList.recipeCount}
				{shoppingList.recipeCount === 1 ? 'recipe' : 'recipes'}
			</div>
		</div>

		<!-- Categories -->
		<div class="space-y-6">
			{#each shoppingList.categories as category (category.name)}
				<div class="space-y-3">
					<h3 class="h4 flex items-center gap-2">
						{category.displayName}
						<span class="preset-tonal-surface rounded px-2 py-1 text-xs">
							{category.items.length}
						</span>
					</h3>
					<ul class="ml-2 space-y-2">
						{#each category.items as item (item.name)}
							<li class="flex items-baseline gap-2">
								<span class="text-primary-500">•</span>
								<span class="flex-1">
									{item.displayName}
									{#if item.quantity}
										<span class="text-surface-600-400">— {item.quantity}</span>
									{/if}
								</span>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>

		{#if shoppingList.categories.length === 0}
			<div class="py-8 text-center">
				<p class="text-surface-600-400">No ingredients found in selected recipes</p>
			</div>
		{/if}
	{/if}
</div>
