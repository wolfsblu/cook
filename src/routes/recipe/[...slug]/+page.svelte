<script lang="ts">
	import type { PageProps } from './$types';
	import RecipeView from '$lib/components/recipes/RecipeView.svelte';

	const { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.recipe.title ?? 'Recipe'}</title>
</svelte:head>

<RecipeView
	recipe={data.recipe}
	image={data.image}
	stepImages={data.stepImages}
	scale={data.scale}
	slug={data.slug}
	inShoppingList={data.inShoppingList}
	listedScale={data.listedScale}
/>
