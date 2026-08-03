<script lang="ts">
	import type { IngredientDisplay } from '$lib/types/recipe';
	import Card from '$lib/components/ui/Card.svelte';
	import { highlightClass, resolveHighlight } from './highlight';

	interface Props {
		ingredients: IngredientDisplay[];
		hoveredIndex: number | null;
		activeIndices: Set<number> | null;
		onhover: (index: number | null) => void;
	}

	const { ingredients, hoveredIndex, activeIndices, onhover }: Props = $props();
</script>

{#if ingredients.length > 0}
	<Card variant="outline" class="p-4">
		<h2 class="text-fg mb-3 text-lg font-semibold">Ingredients</h2>
		<ul class="space-y-1">
			{#each ingredients as ingredient (ingredient.index)}
				{@const state = resolveHighlight({
					hovered: hoveredIndex === ingredient.index,
					active: activeIndices?.has(ingredient.index) ?? false
				})}
				<!-- Hover cross-highlights the matching mention in the steps. It is a
				     pointer affordance only, so it carries no role or tabindex: the
				     ingredient text is already in the document for keyboard and
				     screen reader users. -->
				<li
					class="flex items-center justify-between gap-2 rounded-sm px-2 py-1 transition-colors duration-150 {highlightClass(
						state
					)}"
					onmouseenter={() => onhover(ingredient.index)}
					onmouseleave={() => onhover(null)}
				>
					<span>
						<span class="font-medium">{ingredient.name}</span>
						{#if ingredient.note}
							<span class="text-fg-subtle text-sm italic"> ({ingredient.note})</span>
						{/if}
					</span>
					{#if ingredient.quantity}
						<span class="text-fg-muted text-right whitespace-nowrap tabular-nums">
							{ingredient.quantity}
						</span>
					{/if}
				</li>
			{/each}
		</ul>
	</Card>
{/if}
