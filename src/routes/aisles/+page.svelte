<script lang="ts">
	import { page } from '$app/state';
	import { InfoIcon, PlusIcon, SignpostIcon } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import type { AisleEntryView } from './+page.server';
	import AisleCategoryDialog from '$lib/components/aisles/AisleCategoryDialog.svelte';
	import AisleCategoryList from '$lib/components/aisles/AisleCategoryList.svelte';
	import AisleDuplicateWarning from '$lib/components/aisles/AisleDuplicateWarning.svelte';
	import AisleEntryDialog from '$lib/components/aisles/AisleEntryDialog.svelte';
	import AisleEntryTable from '$lib/components/aisles/AisleEntryTable.svelte';
	import AisleOrderCard from '$lib/components/aisles/AisleOrderCard.svelte';
	import AisleUnassignedList from '$lib/components/aisles/AisleUnassignedList.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Page from '$lib/components/ui/Page.svelte';

	/** How many unassigned ingredients the overview shows before linking on. */
	const OVERVIEW_LIMIT = 8;

	const { data }: PageProps = $props();

	let entryDialogOpen = $state(false);
	let editing = $state<AisleEntryView | null>(null);
	let dialogCategory = $state('');

	let renameDialogOpen = $state(false);
	let renaming = $state('');

	/** The aisle being browsed, or null for the overview. */
	const category = $derived.by(() => {
		const requested = page.url.searchParams.get('category');
		// An aisle that no longer exists falls back to the overview rather than
		// showing an empty pane for something that cannot be selected. Renaming
		// one leaves exactly that stale link behind.
		return requested && data.categories.includes(requested) ? requested : null;
	});

	const unassignedView = $derived(page.url.searchParams.get('view') === 'unassigned');

	const counts = $derived.by(() => {
		const byCategory: Record<string, number> = {};
		for (const name of data.categories) byCategory[name] = 0;
		for (const entry of data.entries) {
			byCategory[entry.category] = (byCategory[entry.category] ?? 0) + 1;
		}
		return byCategory;
	});

	const visibleEntries = $derived(
		category === null ? data.entries : data.entries.filter((entry) => entry.category === category)
	);

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

	function openRename(name: string) {
		renaming = name;
		renameDialogOpen = true;
	}
</script>

<svelte:head>
	<title>Aisles</title>
</svelte:head>

<Page title="Aisles">
	<Card variant="flat" class="mb-6 flex items-start gap-3 p-4">
		<InfoIcon class="text-fg-subtle mt-0.5 size-5 shrink-0" />
		<p class="text-fg-muted text-sm">
			Your <a href="/shopping" class="link">shopping list</a> is grouped by these aisles, in this order.
			Ingredients are matched by exact name, so list every spelling you use — “onions” only lands here
			if it is written here.
		</p>
	</Card>

	<div class="grid gap-6 lg:grid-cols-[15rem_1fr]">
		<!-- min-w-0 so the aisle strip can scroll sideways instead of widening the
		     page: a grid item defaults to min-width:auto. -->
		<aside class="min-w-0 lg:sticky lg:top-20 lg:self-start">
			<AisleCategoryList
				categories={data.categories}
				{counts}
				total={data.entries.length}
				unassignedCount={data.coverage.unassigned.length}
				selected={category}
				unassigned={unassignedView}
			/>
		</aside>

		<div class="min-w-0">
			{#if data.categories.length === 0}
				<Card variant="outline" class="px-4">
					<EmptyState
						icon={SignpostIcon}
						title="No aisles yet"
						description="Add an aisle such as fruit and veg, or dairy, to start grouping your shopping list."
					/>
				</Card>
			{:else if unassignedView}
				<AisleUnassignedList
					items={data.coverage.unassigned}
					categories={data.categories}
					returnTo="/aisles?view=unassigned"
				/>
			{:else if category === null}
				<div class="space-y-6">
					{#if data.duplicates.length > 0}
						<AisleDuplicateWarning duplicates={data.duplicates} />
					{/if}

					<AisleOrderCard categories={data.categories} {counts} onrename={openRename} />

					<AisleUnassignedList
						items={data.coverage.unassigned}
						categories={data.categories}
						limit={OVERVIEW_LIMIT}
						returnTo="/aisles"
					/>
				</div>
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
						<AisleEntryTable entries={visibleEntries} showCategory={false} onedit={openEdit} />
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
			{/if}
		</div>
	</div>
</Page>

<AisleEntryDialog
	bind:open={entryDialogOpen}
	entry={editing}
	category={dialogCategory}
	categories={data.categories}
/>

<AisleCategoryDialog bind:open={renameDialogOpen} original={renaming} />
