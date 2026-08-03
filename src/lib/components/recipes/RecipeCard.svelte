<script lang="ts">
	import { ClockIcon, ImageIcon, UsersIcon } from '@lucide/svelte';
	import type { RecipeCardModel } from '$lib/types/recipe';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { card } from '$lib/components/ui/Card.svelte';

	interface Props {
		recipe: RecipeCardModel;
	}

	const { recipe }: Props = $props();

	let imgError = $state(false);
	const showImage = $derived(recipe.image !== null && !imgError);

	const timeDisplay = $derived(recipe.timeMinutes ? `${recipe.timeMinutes} min` : null);
</script>

<a
	href={recipe.href}
	class={card({ interactive: true, class: 'group flex flex-col overflow-hidden' })}
>
	<div class="relative">
		{#if showImage && recipe.image}
			<img
				src={recipe.image.src}
				srcset={recipe.image.srcset}
				width={recipe.image.width}
				height={recipe.image.height}
				onerror={() => (imgError = true)}
				loading="lazy"
				decoding="async"
				class="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
				alt={recipe.title}
			/>
		{:else}
			<div
				class="bg-surface-muted text-fg-subtle flex aspect-[4/3] w-full flex-col items-center justify-center gap-2"
			>
				<ImageIcon class="size-8" />
				<span class="text-xs">No image</span>
			</div>
		{/if}

		{#if recipe.servings || timeDisplay}
			<div class="absolute top-2 right-2 left-2 flex items-start justify-between gap-2">
				{#if recipe.servings}
					<Badge tone="overlay">
						<UsersIcon class="size-3" />
						{recipe.servings}
					</Badge>
				{:else}
					<span></span>
				{/if}

				{#if timeDisplay}
					<Badge tone="overlay">
						<ClockIcon class="size-3" />
						{timeDisplay}
					</Badge>
				{/if}
			</div>
		{/if}
	</div>

	<div class="flex flex-1 flex-col gap-2 p-3">
		<h2 class="text-fg leading-snug font-medium">{recipe.title}</h2>

		{#if recipe.tags.length > 0 || recipe.course}
			<div class="mt-auto flex flex-wrap items-center gap-1">
				{#each recipe.tags.slice(0, 3) as tag (tag)}
					<Badge>{tag}</Badge>
				{/each}
				{#if recipe.tags.length > 3}
					<span class="text-fg-subtle text-xs">+{recipe.tags.length - 3}</span>
				{/if}
				{#if recipe.course}
					<span class="text-fg-subtle ml-auto text-xs capitalize">{recipe.course}</span>
				{/if}
			</div>
		{/if}
	</div>
</a>
