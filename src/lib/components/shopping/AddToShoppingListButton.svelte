<script lang="ts">
	import { ShoppingCartIcon, XIcon } from '@lucide/svelte';
	import { shoppingListStore } from '$lib/stores/shopping-list.svelte';
	import type { RecipeSelection } from '$lib/types/shopping-list';
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		recipe: Omit<RecipeSelection, 'scale'>;
	}

	let { recipe }: Props = $props();

	const inList = $derived(shoppingListStore.hasRecipe(recipe.slug));
</script>

{#if inList}
	<Button variant="dangerSoft" onclick={() => shoppingListStore.removeRecipe(recipe.slug)}>
		<XIcon class="size-4" />
		Remove from list
	</Button>
{:else}
	<Button
		variant="soft"
		onclick={() => shoppingListStore.addRecipe({ ...recipe, scale: 1 })}
		loading={shoppingListStore.isLoading}
	>
		<ShoppingCartIcon class="size-4" />
		Add to list
	</Button>
{/if}
