<script lang="ts">
	import { UsersIcon, ClockIcon, ImageIcon } from '@lucide/svelte';
	import type { RecipeCardModel } from '$lib/types/recipe';

	interface Props {
		recipe: RecipeCardModel;
	}

	const { recipe }: Props = $props();

	let imgError = $state(false);
	const showImage = $derived(recipe.image !== null && !imgError);

	const timeDisplay = $derived(recipe.timeMinutes ? `${recipe.timeMinutes}m` : null);
</script>

<a
	href={recipe.href}
	class="card preset-filled-surface-100-900 border-surface-200-800 card-hover divide-surface-200-800 flex flex-col divide-y overflow-hidden border shadow-lg"
>
	<header class="relative">
		{#if showImage && recipe.image}
			<img
				src={recipe.image.src}
				srcset={recipe.image.srcset}
				width={recipe.image.width}
				height={recipe.image.height}
				onerror={() => (imgError = true)}
				loading="lazy"
				decoding="async"
				class="aspect-[4/3] w-full object-cover"
				alt={recipe.title}
			/>
		{:else}
			<div
				class="bg-surface-200-800 flex aspect-[4/3] w-full flex-col items-center justify-center gap-2"
			>
				<ImageIcon class="stroke-surface-800-200 size-12" />
				<span class="text-surface-800-200 text-sm">No image available</span>
			</div>
		{/if}

		<!-- Servings overlay -->
		{#if recipe.servings}
			<div
				class="bg-surface-900/80 absolute top-2 left-2 flex items-center gap-1 rounded rounded-tl-lg px-2 py-1 text-xs text-white"
			>
				<UsersIcon class="size-3" />
				<span>{recipe.servings}</span>
			</div>
		{/if}

		<!-- Time overlay -->
		{#if timeDisplay}
			<div
				class="bg-surface-900/80 absolute top-2 right-2 flex items-center gap-1 rounded rounded-tr-lg px-2 py-1 text-xs text-white"
			>
				<ClockIcon class="size-3" />
				<span>{timeDisplay}</span>
			</div>
		{/if}
	</header>

	<article class="flex-1 space-y-2 p-2">
		<h2 class="h6">{recipe.title}</h2>
	</article>

	{#if recipe.tags.length > 0 || recipe.course}
		<footer class="flex items-center justify-between gap-2 p-2">
			{#if recipe.tags.length > 0}
				<div class="flex min-w-0 flex-1 gap-1 overflow-x-auto">
					{#each recipe.tags as tag (tag)}
						<span class="badge preset-filled-surface-200-800 text-xs whitespace-nowrap">{tag}</span>
					{/each}
				</div>
			{:else}
				<span></span>
			{/if}
			{#if recipe.course}
				<small class="whitespace-nowrap capitalize opacity-60">{recipe.course}</small>
			{/if}
		</footer>
	{/if}
</a>
