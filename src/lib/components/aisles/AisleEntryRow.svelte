<script lang="ts">
	import { enhance } from '$app/forms';
	import { PencilIcon, Trash2Icon } from '@lucide/svelte';
	import type { SvelteSet } from 'svelte/reactivity';
	import type { AisleEntryView } from '../../../routes/aisles/ingredients/+page.server';
	import Badge from '$lib/components/ui/Badge.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';

	interface Props {
		entry: AisleEntryView;
		showCategory: boolean;
		onedit: (entry: AisleEntryView) => void;
		selectable?: boolean;
		selected?: SvelteSet<string>;
		formId?: string;
	}

	const { entry, showCategory, onedit, selectable = false, selected, formId }: Props = $props();

	const checked = $derived(selected?.has(entry.name) ?? false);

	function toggle(on: boolean) {
		if (!selected) return;
		if (on) selected.add(entry.name);
		else selected.delete(entry.name);
	}
</script>

<tr class="hover:bg-surface-muted/60 transition-colors" data-testid="aisle-entry">
	{#if selectable}
		<td class="py-2 pr-2 align-top">
			<!-- The real bulk-form input: associated with the sticky bar's form by
			     id, so it submits even though it lives out here in the row. -->
			<input
				type="checkbox"
				name="name"
				value={entry.name}
				form={formId}
				{checked}
				onchange={(event) => toggle(event.currentTarget.checked)}
				class="border-border text-accent focus:ring-accent mt-1 size-4 rounded"
				aria-label="Select {entry.name}"
			/>
		</td>
	{/if}

	<td class="py-2 pr-2">
		<div class="min-w-0">
			<div class="flex flex-wrap items-center gap-2">
				<!-- Capitalized for display only. The file keeps the name as written,
				     because the CLI matches it against ingredient names verbatim. -->
				<span class="truncate font-medium capitalize">{entry.name}</span>

				{#if entry.duplicate}
					<Badge tone="danger">Duplicate</Badge>
				{/if}
			</div>

			<div class="text-fg-muted flex flex-wrap gap-x-3 text-xs">
				<!-- Below `sm` the columns are hidden, so their values live here instead. -->
				{#if entry.aliases.length > 0}
					<span class="sm:hidden">also {entry.aliases.join(', ')}</span>
				{/if}
				{#if showCategory}
					<span class="capitalize sm:hidden">{entry.category}</span>
				{/if}
				{#if entry.comment}
					<span>{entry.comment}</span>
				{/if}
			</div>
		</div>
	</td>

	<td class="text-fg-muted hidden py-2 pr-2 align-top text-sm sm:table-cell">
		{entry.aliases.join(', ')}
	</td>

	{#if showCategory}
		<td class="text-fg-muted hidden py-2 pr-2 align-top text-sm capitalize sm:table-cell">
			{entry.category}
		</td>
	{/if}

	<td class="py-2">
		<div class="flex shrink-0 items-center justify-end gap-1">
			<IconButton size="sm" label="Edit {entry.name}" onclick={() => onedit(entry)}>
				<PencilIcon class="size-4" />
			</IconButton>

			<form method="POST" action="?/remove" use:enhance>
				<input type="hidden" name="category" value={entry.category} />
				<input type="hidden" name="name" value={entry.name} />
				<IconButton type="submit" size="sm" variant="dangerSoft" label="Remove {entry.name}">
					<Trash2Icon class="size-4" />
				</IconButton>
			</form>
		</div>
	</td>
</tr>
