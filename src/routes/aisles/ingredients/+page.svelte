<script lang="ts">
	import { page } from '$app/state';
	import { PlusIcon, SignpostIcon } from '@lucide/svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { PageProps } from './$types';
	import type { AisleEntryView } from './+page.server';
	import AisleBulkBar from '$lib/components/aisles/AisleBulkBar.svelte';
	import AisleCategoryList from '$lib/components/aisles/AisleCategoryList.svelte';
	import AisleDuplicateWarning from '$lib/components/aisles/AisleDuplicateWarning.svelte';
	import AisleEntryDialog from '$lib/components/aisles/AisleEntryDialog.svelte';
	import AisleEntryTable from '$lib/components/aisles/AisleEntryTable.svelte';
	import AisleGroupedList from '$lib/components/aisles/AisleGroupedList.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';

	const { data }: PageProps = $props();

	let entryDialogOpen = $state(false);
	let editing = $state<AisleEntryView | null>(null);
	let dialogCategory = $state('');

	/** The aisle being browsed, or null for "All aisles". */
	const category = $derived.by(() => {
		const requested = page.url.searchParams.get('category');
		// An aisle that no longer exists falls back to the overview rather than
		// showing an empty pane for something that cannot be selected. Renaming
		// one leaves exactly that stale link behind.
		return requested && data.categories.includes(requested) ? requested : null;
	});

	const visibleEntries = $derived(data.entries.filter((entry) => entry.category === category));

	/** Aisles a selected entry can be moved to: any but the one it is already in. */
	const moveTargets = $derived(data.categories.filter((name) => name !== category));

	// Selected entry names in the single-aisle view, shared with the bulk bar.
	const selected = new SvelteSet<string>();

	// Switching aisles drops a selection that belonged to the one we left. A
	// plain tracker rather than $state: it only compares against `category`, and
	// the effect re-runs off that.
	let selectionAisle: string | null = null;
	$effect(() => {
		if (category !== selectionAisle) {
			selectionAisle = category;
			selected.clear();
		}
	});

	function openAdd() {
		editing = null;
		dialogCategory = category ?? data.categories[0] ?? '';
		entryDialogOpen = true;
	}

	function openEdit(entry: AisleEntryView) {
		editing = entry;
		dialogCategory = entry.category;
		entryDialogOpen = true;
	}
</script>

{#if data.duplicates.length > 0}
	<div class="mb-6">
		<AisleDuplicateWarning duplicates={data.duplicates} />
	</div>
{/if}

{#if data.categories.length === 0}
	<Card variant="outline" class="px-4">
		<EmptyState
			icon={SignpostIcon}
			title="No aisles yet"
			description="Add an aisle such as fruit and veg, or dairy, to start grouping your shopping list."
		>
			{#snippet actions()}
				<Button href="/aisles">Manage aisles</Button>
			{/snippet}
		</EmptyState>
	</Card>
{:else}
	<div class="grid gap-6 lg:grid-cols-[15rem_1fr]">
		<!-- min-w-0 so the aisle strip can scroll sideways instead of widening the
		     page: a grid item defaults to min-width:auto. -->
		<aside class="min-w-0 lg:sticky lg:top-20 lg:self-start">
			<AisleCategoryList
				categories={data.categories}
				counts={data.counts}
				total={data.total}
				selected={category}
			/>
		</aside>

		<div class="min-w-0">
			{#if category === null}
				<AisleGroupedList entries={data.entries} categories={data.categories} onedit={openEdit} />
			{:else}
				<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
					<h2 class="text-fg text-lg font-semibold">
						<span class="capitalize">{category}</span>
						<span class="text-fg-subtle text-sm font-normal tabular-nums">
							{visibleEntries.length}
							{visibleEntries.length === 1 ? 'ingredient' : 'ingredients'}
						</span>
					</h2>

					<Button size="sm" onclick={openAdd}>
						<PlusIcon class="size-4" />
						Add ingredient
					</Button>
				</div>

				<Card variant="outline" class="px-4">
					{#if visibleEntries.length > 0}
						<AisleEntryTable
							entries={visibleEntries}
							showCategory={false}
							onedit={openEdit}
							selectable
							{selected}
							formId="aisle-bulk-edit"
						/>
					{:else}
						<EmptyState
							icon={SignpostIcon}
							title="Nothing in {category} yet"
							description="Add the ingredients you find in this aisle and they will be grouped here on your shopping list."
						>
							{#snippet actions()}
								<Button variant="outline" onclick={openAdd}>
									<PlusIcon class="size-4" />
									Add ingredient
								</Button>
							{/snippet}
						</EmptyState>
					{/if}
				</Card>

				<AisleBulkBar
					formId="aisle-bulk-edit"
					action="?/bulkMove"
					count={selected.size}
					onclear={() => selected.clear()}
					onsubmitted={() => selected.clear()}
				>
					{#snippet controls()}
						<input type="hidden" name="from" value={category} />
						{#if moveTargets.length > 0}
							<select
								name="category"
								class="field w-auto capitalize"
								aria-label="Move selected to aisle"
							>
								{#each moveTargets as name (name)}
									<option value={name}>{name}</option>
								{/each}
							</select>
							<Button type="submit" size="sm" variant="soft" formaction="?/bulkMove">Move</Button>
						{/if}
						<Button type="submit" size="sm" variant="dangerSoft" formaction="?/bulkRemove">
							Remove
						</Button>
					{/snippet}
				</AisleBulkBar>
			{/if}
		</div>
	</div>
{/if}

<AisleEntryDialog
	bind:open={entryDialogOpen}
	entry={editing}
	category={dialogCategory}
	categories={data.categories}
/>
