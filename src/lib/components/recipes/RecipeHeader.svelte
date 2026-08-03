<script lang="ts">
	import type { ImageRef, RecipeDisplay } from '$lib/types/recipe';
	import Badge from '$lib/components/ui/Badge.svelte';

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

	<h1 class="text-fg text-3xl font-semibold tracking-tight sm:text-4xl">
		{recipe.title ?? 'Untitled Recipe'}
	</h1>

	{#if recipe.description}
		<p class="text-fg-muted">{recipe.description}</p>
	{/if}

	{#if recipe.tags.length > 0}
		<div class="flex flex-wrap gap-1.5">
			{#each recipe.tags as tag (tag)}
				<Badge>{tag}</Badge>
			{/each}
		</div>
	{/if}

	<div class="text-fg-muted flex flex-wrap gap-x-4 gap-y-1 text-sm">
		{#if recipe.source?.url}
			<a href={recipe.source.url} class="link" target="_blank" rel="noopener noreferrer">
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
					{#if recipe.time.prep_time}Prep {recipe.time.prep_time} min{/if}
					{#if recipe.time.prep_time && recipe.time.cook_time}·{/if}
					{#if recipe.time.cook_time}Cook {recipe.time.cook_time} min{/if}
				{/if}
			</span>
		{/if}
	</div>
</header>
