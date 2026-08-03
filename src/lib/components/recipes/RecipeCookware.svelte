<script lang="ts">
	import type { CookwareDisplay } from '$lib/types/recipe';

	interface Props {
		cookware: CookwareDisplay[];
		hoveredIndex: number | null;
		activeIndices: Set<number> | null;
		onhover: (index: number | null) => void;
	}

	const { cookware, hoveredIndex, activeIndices, onhover }: Props = $props();
</script>

{#if cookware.length > 0}
	<div class="card preset-outlined-surface-200-800 p-4">
		<h2 class="h4 mb-3">Cookware</h2>
		<ul class="space-y-2">
			{#each cookware as item (item.index)}
				{@const isHovered = hoveredIndex === item.index}
				{@const isActive = activeIndices?.has(item.index) ?? false}
				<li
					class="flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 transition-colors {isHovered
						? 'preset-tonal-secondary'
						: isActive
							? 'preset-tonal-tertiary'
							: ''}"
					onmouseenter={() => onhover(item.index)}
					onmouseleave={() => onhover(null)}
					role="listitem"
				>
					<span>
						<span class="font-medium">{item.name}</span>
						{#if item.note}
							<span class="text-surface-500-500 text-sm italic"> ({item.note})</span>
						{/if}
					</span>
					{#if item.quantity}
						<span class="text-surface-600-400 text-right whitespace-nowrap">{item.quantity}</span>
					{/if}
				</li>
			{/each}
		</ul>
	</div>
{/if}
