<script lang="ts">
	import { FolderIcon, FolderOpenIcon } from '@lucide/svelte';

	interface Props {
		categories: string[];
		/** Entry count per category. */
		counts: Record<string, number>;
		total: number;
		/** The category being browsed, or null for "All aisles". */
		selected: string | null;
	}

	const { categories, counts, total, selected }: Props = $props();

	// Plain links rather than goto(), as the pantry folders do: back/forward
	// works and the URL is shareable.
	function href(category: string | null): string {
		return category ? `/aisles?category=${encodeURIComponent(category)}` : '/aisles';
	}

	const entry =
		'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors whitespace-nowrap';

	const active = 'bg-accent-soft text-accent-soft-fg font-medium';
	const idle = 'text-fg hover:bg-surface-muted';
</script>

<nav aria-label="Aisles" class="min-w-0">
	<!-- Below `lg` a sideways-scrolling strip of chips, so a long aisle list
	     never pushes the page wider than the viewport. -->
	<ul
		class="no-scrollbar flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-x-visible lg:pb-0"
	>
		<li class="shrink-0">
			<a
				href={href(null)}
				aria-current={selected === null ? 'page' : undefined}
				class="{entry} {selected === null ? active : idle}"
			>
				<FolderOpenIcon class="size-4 shrink-0" />
				<span class="truncate">All aisles</span>
				<span class="ml-auto pl-2 text-xs tabular-nums opacity-70">{total}</span>
			</a>
		</li>

		<li class="border-border hidden lg:my-1 lg:block lg:border-t" aria-hidden="true"></li>

		{#each categories as category (category)}
			<li class="shrink-0">
				<a
					href={href(category)}
					aria-current={selected === category ? 'page' : undefined}
					class="{entry} {selected === category ? active : idle}"
				>
					<FolderIcon class="size-4 shrink-0" />
					<span class="truncate capitalize">{category}</span>
					<span class="ml-auto pl-2 text-xs tabular-nums opacity-70">{counts[category] ?? 0}</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>
