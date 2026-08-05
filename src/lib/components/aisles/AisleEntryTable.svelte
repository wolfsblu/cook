<script lang="ts">
	import type { SvelteSet } from 'svelte/reactivity';
	import type { AisleEntryView } from '../../../routes/aisles/+page.server';
	import AisleEntryRow from './AisleEntryRow.svelte';

	interface Props {
		entries: AisleEntryView[];
		/** Shown only in the "All aisles" view, where categories are mixed together. */
		showCategory: boolean;
		onedit: (entry: AisleEntryView) => void;
		/** When set, rows carry a checkbox that joins the bulk form. */
		selectable?: boolean;
		/** Selected entry names, shared with the bulk bar. Mutated on toggle. */
		selected?: SvelteSet<string>;
		/** The bulk form the checkboxes belong to, via their `form=` attribute. */
		formId?: string;
	}

	const { entries, showCategory, onedit, selectable = false, selected, formId }: Props = $props();

	const allSelected = $derived(
		selectable && selected !== undefined && entries.length > 0
			? entries.every((entry) => selected.has(entry.name))
			: false
	);

	function toggleAll() {
		if (!selected) return;
		if (allSelected) {
			for (const entry of entries) selected.delete(entry.name);
		} else {
			for (const entry of entries) selected.add(entry.name);
		}
	}
</script>

<!--
	Rows stay in file order, and the headers are deliberately not sortable. The
	pantry table sorts because its order means nothing; here the order shown is
	the order stored, and a sortable column would misrepresent what Save writes.
-->
<table class="w-full text-left">
	<thead>
		<tr class="border-border text-fg-muted border-b text-xs">
			{#if selectable}
				<th scope="col" class="w-px py-2 pr-2">
					<input
						type="checkbox"
						class="border-border text-accent focus:ring-accent size-4 rounded"
						checked={allSelected}
						onchange={toggleAll}
						aria-label="Select all"
					/>
				</th>
			{/if}
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
			<AisleEntryRow {entry} {showCategory} {onedit} {selectable} {selected} {formId} />
		{/each}
	</tbody>
</table>
