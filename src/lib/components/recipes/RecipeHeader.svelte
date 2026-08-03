<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ImageRef, RecipeDisplay } from '$lib/types/recipe';
	import Badge from '$lib/components/ui/Badge.svelte';

	interface Props {
		recipe: RecipeDisplay;
		image?: ImageRef | null;
		/** The action bar, which shares the tag row from `sm` up. */
		actions?: Snippet;
	}

	const { recipe, image = null, actions }: Props = $props();

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

	<!--
		The actions share this row rather than taking one of their own, so the
		content grid starts as high up the page as it can. Below `sm` they drop
		beneath the tags, where there is no room to sit beside them.
	-->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		{#if recipe.tags.length > 0}
			<!-- One scrolling line, not a wrapping block: a heavily tagged recipe used
			     to push the whole page down a row at a time. -->
			<div class="no-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
				{#each recipe.tags as tag (tag)}
					<Badge class="shrink-0">{tag}</Badge>
				{/each}
			</div>
		{/if}

		{#if actions}
			<div class="shrink-0">{@render actions()}</div>
		{/if}
	</div>

	<!-- Servings, times, author and source live in RecipeMeta, beside the
	     ingredients, rather than as a run-together line of text here. -->
</header>
