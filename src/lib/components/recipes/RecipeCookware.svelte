<script lang="ts">
	import type { CookwareDisplay } from '$lib/types/recipe';
	import Card from '$lib/components/ui/Card.svelte';
	import { highlightClass, resolveHighlight } from './highlight';

	interface Props {
		cookware: CookwareDisplay[];
		hoveredIndex: number | null;
		activeIndices: Set<number> | null;
		onhover: (index: number | null) => void;
	}

	const { cookware, hoveredIndex, activeIndices, onhover }: Props = $props();
</script>

{#if cookware.length > 0}
	<Card variant="outline" class="p-4">
		<h2 class="text-fg mb-3 text-lg font-semibold">Cookware</h2>
		<ul class="space-y-1">
			{#each cookware as item (item.index)}
				{@const state = resolveHighlight({
					hovered: hoveredIndex === item.index,
					active: activeIndices?.has(item.index) ?? false
				})}
				<li
					class="flex items-center justify-between gap-2 rounded-sm px-2 py-1 transition-colors duration-150 {highlightClass(
						state
					)}"
					onmouseenter={() => onhover(item.index)}
					onmouseleave={() => onhover(null)}
				>
					<span>
						<span class="font-medium">{item.name}</span>
						{#if item.note}
							<span class="text-fg-subtle text-sm italic"> ({item.note})</span>
						{/if}
					</span>
					{#if item.quantity}
						<span class="text-fg-muted text-right whitespace-nowrap tabular-nums">
							{item.quantity}
						</span>
					{/if}
				</li>
			{/each}
		</ul>
	</Card>
{/if}
