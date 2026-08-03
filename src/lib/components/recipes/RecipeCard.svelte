<script lang="ts">
	import type { CooklangRecipe } from '@cooklang/cooklang';
	import { UsersIcon, ClockIcon, ImageIcon } from '@lucide/svelte';

	interface Props {
		recipe: {
			filename: string;
			content: string;
			markup: string;
			report: string;
			parsed: CooklangRecipe;
			imageUrl?: string;
		};
	}

	const { recipe }: Props = $props();

	let imgError = $state(false);
	const showImage = $derived(recipe.imageUrl && !imgError);

	const url = $derived(`/${recipe.filename}`);

	// Format time for display
	const timeDisplay = $derived(() => {
		if (!recipe.parsed.time) return null;
		if (typeof recipe.parsed.time === 'number') {
			return `${recipe.parsed.time}m`;
		}
		const total = (recipe.parsed.time.prep_time || 0) + (recipe.parsed.time.cook_time || 0);
		return total > 0 ? `${total}m` : null;
	});
</script>

<a
	href={url}
	class="card preset-filled-surface-100-900 border-surface-200-800 card-hover divide-surface-200-800 flex flex-col divide-y overflow-hidden border shadow-lg"
>
	<header class="relative">
		{#if showImage}
			<img
				src={recipe.imageUrl}
				onerror={() => (imgError = true)}
				class="aspect-21/9 w-full object-cover"
				alt="banner"
			/>
		{:else}
			<div
				class="bg-surface-200-800 flex aspect-21/9 w-full flex-col items-center justify-center gap-2"
			>
				<ImageIcon class="stroke-surface-800-200 size-12" />
				<span class="text-surface-800-200 text-sm">No image available</span>
			</div>
		{/if}

		<!-- Servings overlay -->
		{#if recipe.parsed.servings}
			<div
				class="bg-surface-900/80 absolute top-2 left-2 flex items-center gap-1 rounded rounded-tl-lg px-2 py-1 text-xs text-white"
			>
				<UsersIcon class="size-3" />
				<span>{recipe.parsed.servings}</span>
			</div>
		{/if}

		<!-- Time overlay -->
		{#if timeDisplay()}
			<div
				class="bg-surface-900/80 absolute top-2 right-2 flex items-center gap-1 rounded rounded-tr-lg px-2 py-1 text-xs text-white"
			>
				<ClockIcon class="size-3" />
				<span>{timeDisplay()}</span>
			</div>
		{/if}
	</header>

	<article class="flex-1 space-y-2 p-2">
		<h1 class="h6">{recipe.parsed.title || recipe.filename.replace('.cook', '')}</h1>
	</article>

	{#if recipe.parsed.tags.size > 0 || recipe.parsed.course}
		<footer class="flex items-center justify-between gap-2 p-2">
			{#if recipe.parsed.tags.size > 0}
				<div class="flex min-w-0 flex-1 gap-1 overflow-x-auto">
					{#each Array.from(recipe.parsed.tags) as tag}
						<span class="badge preset-filled-surface-200-800 text-xs whitespace-nowrap">{tag}</span>
					{/each}
				</div>
			{:else}
				<span></span>
			{/if}
			{#if recipe.parsed.course}
				<small class="whitespace-nowrap capitalize opacity-60">{recipe.parsed.course}</small>
			{/if}
		</footer>
	{/if}
</a>
