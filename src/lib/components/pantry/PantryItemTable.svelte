<script lang="ts" module>
	export type SortKey = 'name' | 'quantity' | 'location' | 'expires';
	export type SortDirection = 'asc' | 'desc';
</script>

<script lang="ts">
	import { ArrowDownIcon, ArrowUpIcon } from '@lucide/svelte';
	import type { PantryItemView } from '../../../routes/pantry/+page.server';
	import PantryRow from './PantryRow.svelte';

	interface Props {
		items: PantryItemView[];
		/** Shown only in the "All items" view, where folders are mixed together. */
		showLocation: boolean;
		sort: SortKey;
		direction: SortDirection;
		onsort: (key: SortKey) => void;
		onedit: (item: PantryItemView) => void;
	}

	const { items, showLocation, sort, direction, onsort, onedit }: Props = $props();

	function ariaSort(key: SortKey) {
		if (sort !== key) return 'none' as const;
		return direction === 'asc' ? ('ascending' as const) : ('descending' as const);
	}
</script>

{#snippet header(key: SortKey, label: string)}
	<button
		type="button"
		onclick={() => onsort(key)}
		class="hover:text-fg flex w-full items-center gap-1 py-2 font-medium transition-colors"
	>
		{label}
		{#if sort === key}
			{#if direction === 'asc'}
				<ArrowUpIcon class="size-3" />
			{:else}
				<ArrowDownIcon class="size-3" />
			{/if}
		{/if}
	</button>
{/snippet}

<!-- A real table: this is a details view with sortable column headers, so the
     header/cell relationship and aria-sort are worth the markup. Columns beyond
     the name collapse below `sm`, where their values fold into the name cell. -->
<table class="w-full text-left">
	<thead>
		<tr class="border-border text-fg-muted border-b text-xs">
			<th scope="col" aria-sort={ariaSort('name')} class="font-medium">
				{@render header('name', 'Name')}
			</th>
			<th
				scope="col"
				aria-sort={ariaSort('quantity')}
				class="hidden w-28 font-medium sm:table-cell"
			>
				{@render header('quantity', 'Quantity')}
			</th>
			{#if showLocation}
				<th
					scope="col"
					aria-sort={ariaSort('location')}
					class="hidden w-28 font-medium sm:table-cell"
				>
					{@render header('location', 'Location')}
				</th>
			{/if}
			<th scope="col" aria-sort={ariaSort('expires')} class="hidden w-28 font-medium sm:table-cell">
				{@render header('expires', 'Expires')}
			</th>
			<th scope="col" class="w-px"><span class="sr-only">Actions</span></th>
		</tr>
	</thead>

	<tbody class="divide-border divide-y">
		<!-- Keyed by folder and name together: names are only unique within a
		     folder, and the "All items" view mixes folders. -->
		{#each items as item (`${item.section}/${item.name}`)}
			<PantryRow {item} {showLocation} {onedit} />
		{/each}
	</tbody>
</table>
