<script lang="ts">
	import type { PageProps } from './$types';
	import RecipeView from '$lib/components/recipes/RecipeView.svelte';

	const { data }: PageProps = $props();
</script>

<RecipeView recipe={data.recipe} scale={data.scale} slug={data.slug} />
