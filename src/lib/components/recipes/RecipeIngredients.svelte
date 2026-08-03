<script lang="ts">
	import type { IngredientDisplay } from '$lib/types/recipe';

	interface Props {
		ingredients: IngredientDisplay[];
		hoveredIndex: number | null;
		activeIndices: Set<number> | null;
		onhover: (index: number | null) => void;
	}

	const { ingredients, hoveredIndex, activeIndices, onhover }: Props = $props();
</script>

{#if ingredients.length > 0}
	<div class="card preset-outlined-surface-200-800 p-4">
		<h2 class="h4 mb-3">Ingredients</h2>
		<ul class="space-y-2">
			{#each ingredients as ingredient (ingredient.index)}
				{@const isHovered = hoveredIndex === ingredient.index}
				{@const isActive = activeIndices?.has(ingredient.index) ?? false}
				<li
					class="flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 transition-colors {isHovered
						? 'preset-tonal-primary'
						: isActive
							? 'preset-tonal-secondary'
							: ''}"
					onmouseenter={() => onhover(ingredient.index)}
					onmouseleave={() => onhover(null)}
					role="listitem"
				>
					<span>
						<span class="font-medium">{ingredient.name}</span>
						{#if ingredient.note}
							<span class="text-surface-500-500 text-sm italic"> ({ingredient.note})</span>
						{/if}
					</span>
					{#if ingredient.quantity}
						<span class="text-surface-600-400 text-right whitespace-nowrap"
							>{ingredient.quantity}</span
						>
					{/if}
				</li>
			{/each}
		</ul>
	</div>
{/if}
