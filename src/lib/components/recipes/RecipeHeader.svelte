<script lang="ts">
	import type { ImageRef, RecipeDisplay } from '$lib/types/recipe';

	interface Props {
		recipe: RecipeDisplay;
		image?: ImageRef | null;
	}

	const { recipe, image = null }: Props = $props();

	let imgError = $state(false);
	const showImage = $derived(image !== null && !imgError);
</script>

<header class="space-y-4">
	{#if showImage && image}
		<img
			src={image.src}
			srcset={image.srcset}
			width={image.width}
			height={image.height}
			onerror={() => (imgError = true)}
			fetchpriority="high"
			decoding="async"
			alt={recipe.title ?? 'Recipe'}
			class="aspect-[21/9] w-full rounded-lg object-cover"
		/>
	{/if}

	<h1 class="h1">{recipe.title ?? 'Untitled Recipe'}</h1>

	{#if recipe.description}
		<p class="text-surface-600-400">{recipe.description}</p>
	{/if}

	{#if recipe.tags.length > 0}
		<div class="flex flex-wrap gap-2">
			{#each recipe.tags as tag (tag)}
				<span class="badge preset-filled-surface-200-800">{tag}</span>
			{/each}
		</div>
	{/if}

	<div class="text-surface-600-400 flex flex-wrap gap-4 text-sm">
		{#if recipe.source?.url}
			<a href={recipe.source.url} class="anchor" target="_blank" rel="noopener">
				{recipe.source.name ?? 'Source'}
			</a>
		{:else if recipe.source?.name}
			<span>{recipe.source.name}</span>
		{/if}

		{#if recipe.author?.name}
			<span>by {recipe.author.name}</span>
		{/if}

		{#if recipe.time}
			<span>
				{#if typeof recipe.time === 'number'}
					{recipe.time} min
				{:else}
					{#if recipe.time.prep_time}Prep: {recipe.time.prep_time} min{/if}
					{#if recipe.time.prep_time && recipe.time.cook_time}
						·
					{/if}
					{#if recipe.time.cook_time}Cook: {recipe.time.cook_time} min{/if}
				{/if}
			</span>
		{/if}
	</div>
</header>
