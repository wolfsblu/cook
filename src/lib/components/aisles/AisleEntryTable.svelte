<script lang="ts">
	import type { AisleEntryView } from '../../../routes/aisles/+page.server';
	import AisleEntryRow from './AisleEntryRow.svelte';

	interface Props {
		entries: AisleEntryView[];
		/** Shown only in the "All aisles" view, where categories are mixed together. */
		showCategory: boolean;
		onedit: (entry: AisleEntryView) => void;
	}

	const { entries, showCategory, onedit }: Props = $props();
</script>

<!--
	Rows stay in file order, and the headers are deliberately not sortable. The
	pantry table sorts because its order means nothing; here the order shown is
	the order stored, and a sortable column would misrepresent what Save writes.
-->
<table class="w-full text-left">
	<thead>
		<tr class="border-border text-fg-muted border-b text-xs">
			<th scope="col" class="py-2 font-medium">Name</th>
			<th scope="col" class="hidden w-1/3 py-2 font-medium sm:table-cell">Also called</th>
			{#if showCategory}
				<th scope="col" class="hidden w-40 py-2 font-medium sm:table-cell">Aisle</th>
			{/if}
			<th scope="col" class="w-px"><span class="sr-only">Actions</span></th>
		</tr>
	</thead>

	<tbody class="divide-border divide-y">
		<!-- Keyed by aisle and name together: a name is only unique within an
		     aisle, and a duplicate across two aisles is exactly what this page
		     exists to show. -->
		{#each entries as entry (`${entry.category}/${entry.name}`)}
			<AisleEntryRow {entry} {showCategory} {onedit} />
		{/each}
	</tbody>
</table>
