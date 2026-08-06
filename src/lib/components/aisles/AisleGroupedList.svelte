<script lang="ts">
	import type { AisleEntryView } from '../../../routes/aisles/ingredients/+page.server';
	import Card from '$lib/components/ui/Card.svelte';
	import AisleEntryTable from './AisleEntryTable.svelte';

	interface Props {
		entries: AisleEntryView[];
		/** Aisles in file order, which is the order they group in. */
		categories: string[];
		onedit: (entry: AisleEntryView) => void;
	}

	const { entries, categories, onedit }: Props = $props();

	const byCategory = $derived.by(() => {
		const map: Record<string, AisleEntryView[]> = {};
		for (const category of categories) map[category] = [];
		for (const entry of entries) (map[entry.category] ??= []).push(entry);
		return map;
	});

	function href(category: string): string {
		return `/aisles/ingredients?category=${encodeURIComponent(category)}`;
	}
</script>

<div class="space-y-6">
	{#each categories as category (category)}
		{@const group = byCategory[category] ?? []}
		<section>
			<div class="mb-2 flex items-baseline justify-between gap-3">
				<h3 class="text-fg font-semibold">
					<a href={href(category)} class="capitalize hover:underline">{category}</a>
					<span class="text-fg-subtle ml-1 text-sm font-normal tabular-nums">{group.length}</span>
				</h3>
			</div>

			<Card variant="outline" class="px-4">
				{#if group.length > 0}
					<AisleEntryTable entries={group} showCategory={false} {onedit} />
				{:else}
					<p class="text-fg-subtle py-3 text-sm">
						Nothing here yet — assign ingredients from the
						<a href="/aisles/unassigned" class="link">Unassigned</a> tab.
					</p>
				{/if}
			</Card>
		</section>
	{/each}
</div>
