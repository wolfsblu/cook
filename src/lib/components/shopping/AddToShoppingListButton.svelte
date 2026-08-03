<script lang="ts">
	import { ShoppingCart, X } from '@lucide/svelte';
	import { shoppingListStore } from '$lib/stores/shopping-list.svelte';
	import type { RecipeSelection } from '$lib/types/shopping-list';

	interface Props {
		recipe: Omit<RecipeSelection, 'scale'>; // Recipe without scale (we'll add it)
	}

	let { recipe }: Props = $props();

	let inList = $derived(shoppingListStore.hasRecipe(recipe.slug));

	async function add() {
		await shoppingListStore.addRecipe({
			...recipe,
			scale: 1
		});
	}

	async function remove() {
		await shoppingListStore.removeRecipe(recipe.slug);
	}
</script>

{#if inList}
	<button class="btn preset-tonal-error" onclick={remove}>
		<X size={20} />
		Remove from Shopping List
	</button>
{:else}
	<button class="btn preset-filled-primary-500" onclick={add}>
		<ShoppingCart size={20} />
		Add to Shopping List
	</button>
{/if}
