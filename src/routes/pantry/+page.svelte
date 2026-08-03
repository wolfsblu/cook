<script lang="ts">
	import { page } from '$app/state';
	import { InfoIcon, PlusIcon, RefrigeratorIcon } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import type { PantryItemView } from './+page.server';
	import PantryFolderList from '$lib/components/pantry/PantryFolderList.svelte';
	import PantryItemDialog from '$lib/components/pantry/PantryItemDialog.svelte';
	import PantryItemTable, {
		type SortDirection,
		type SortKey
	} from '$lib/components/pantry/PantryItemTable.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Page from '$lib/components/ui/Page.svelte';

	const { data }: PageProps = $props();

	type Filter = 'all' | 'low' | 'expiring';
	let filter = $state<Filter>('all');

	// Sort stays out of the URL: switching folders navigates within the same
	// route, so the component is not remounted and the choice survives anyway.
	let sort = $state<SortKey>('name');
	let direction = $state<SortDirection>('asc');

	let dialogOpen = $state(false);
	let editing = $state<PantryItemView | null>(null);
	let dialogSection = $state('');

	/** The folder being browsed, or null for "All items". */
	const folder = $derived.by(() => {
		const requested = page.url.searchParams.get('folder');
		// A folder that no longer exists falls back to the root rather than
		// showing an empty pane for something that cannot be selected.
		return requested && data.sections.includes(requested) ? requested : null;
	});

	const counts = $derived.by(() => {
		const bySection: Record<string, number> = {};
		for (const section of data.sections) bySection[section] = 0;
		for (const item of data.items) bySection[item.section] = (bySection[item.section] ?? 0) + 1;
		return bySection;
	});

	function matchesFilter(item: PantryItemView): boolean {
		if (filter === 'low') return item.runningLow && !item.disabled;
		if (filter === 'expiring') return item.expiringSoon && !item.disabled;
		return true;
	}

	/**
	 * Items with no quantity or no expiry date sink to the bottom either way:
	 * reversing the sort should not promote the rows that have nothing to sort by.
	 */
	function byNumber(a: number | null, b: number | null, flip: number): number {
		if (a === null && b === null) return 0;
		if (a === null) return 1;
		if (b === null) return -1;
		return flip * (a - b);
	}

	function compare(a: PantryItemView, b: PantryItemView): number {
		const flip = direction === 'asc' ? 1 : -1;
		switch (sort) {
			case 'quantity':
				return byNumber(a.sortAmount, b.sortAmount, flip) || a.name.localeCompare(b.name);
			case 'location':
				return flip * a.section.localeCompare(b.section) || a.name.localeCompare(b.name);
			case 'expires':
				return byNumber(a.daysLeft, b.daysLeft, flip) || a.name.localeCompare(b.name);
			default:
				return flip * a.name.localeCompare(b.name);
		}
	}

	const visibleItems = $derived(
		data.items
			.filter((item) => (folder === null || item.section === folder) && matchesFilter(item))
			.sort(compare)
	);

	function onsort(key: SortKey) {
		if (sort === key) {
			direction = direction === 'asc' ? 'desc' : 'asc';
		} else {
			sort = key;
			direction = 'asc';
		}
	}

	function openAdd() {
		editing = null;
		dialogSection = folder ?? data.sections[0] ?? '';
		dialogOpen = true;
	}

	function openEdit(item: PantryItemView) {
		editing = item;
		dialogSection = item.section;
		dialogOpen = true;
	}
</script>

<svelte:head>
	<title>Pantry</title>
</svelte:head>

<Page title="Pantry">
	<Card variant="flat" class="mb-6 flex items-start gap-3 p-4">
		<InfoIcon class="text-fg-subtle mt-0.5 size-5 shrink-0" />
		<p class="text-fg-muted text-sm">
			Anything stocked here is subtracted from your
			<a href="/shopping" class="link">shopping list</a> automatically. Items you keep but have run out
			of can be switched off rather than deleted, so they stay as a reminder.
		</p>
	</Card>

	<div class="grid gap-6 lg:grid-cols-[15rem_1fr]">
		<!-- min-w-0 so the folder strip can scroll sideways instead of widening
		     the page: a grid item defaults to min-width:auto. -->
		<aside class="min-w-0 lg:sticky lg:top-20 lg:self-start">
			<PantryFolderList
				sections={data.sections}
				{counts}
				total={data.items.length}
				selected={folder}
			/>
		</aside>

		<div class="min-w-0">
			{#if data.sections.length === 0}
				<Card variant="outline" class="px-4">
					<EmptyState
						icon={RefrigeratorIcon}
						title="Your pantry is empty"
						description="Add a folder such as fridge, pantry or spices to start tracking what you have."
					/>
				</Card>
			{:else}
				<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
					<h2 class="text-fg text-lg font-semibold">
						<!-- capitalize is for folder names as written in the file; the
						     literal label is already spelled the way it should read. -->
						<span class={folder ? 'capitalize' : ''}>{folder ?? 'All items'}</span>
						<span class="text-fg-subtle text-sm font-normal tabular-nums">
							{visibleItems.length}
							{visibleItems.length === 1 ? 'item' : 'items'}
						</span>
					</h2>

					<Button size="sm" onclick={openAdd}>
						<PlusIcon class="size-4" />
						Add item
					</Button>
				</div>

				<div class="mb-2 flex flex-wrap items-center gap-2">
					<Button
						variant={filter === 'all' ? 'primary' : 'ghost'}
						size="sm"
						onclick={() => (filter = 'all')}
					>
						All
					</Button>
					<Button
						variant={filter === 'low' ? 'primary' : 'ghost'}
						size="sm"
						onclick={() => (filter = 'low')}
					>
						Low stock
						{#if data.lowCount > 0}<Badge tone="warn">{data.lowCount}</Badge>{/if}
					</Button>
					<Button
						variant={filter === 'expiring' ? 'primary' : 'ghost'}
						size="sm"
						onclick={() => (filter = 'expiring')}
					>
						Expiring soon
						{#if data.expiringCount > 0}<Badge tone="warn">{data.expiringCount}</Badge>{/if}
					</Button>
				</div>

				<Card variant="outline" class="px-4">
					{#if visibleItems.length > 0}
						<PantryItemTable
							items={visibleItems}
							showLocation={folder === null}
							{sort}
							{direction}
							{onsort}
							onedit={openEdit}
						/>
					{:else if filter !== 'all'}
						<EmptyState
							icon={RefrigeratorIcon}
							title={filter === 'low' ? 'Nothing is running low' : 'Nothing is expiring soon'}
							description="Set a “low at” threshold or an expiry date on an item to track it here."
						>
							{#snippet actions()}
								<Button variant="outline" onclick={() => (filter = 'all')}>Show everything</Button>
							{/snippet}
						</EmptyState>
					{:else}
						<EmptyState
							icon={RefrigeratorIcon}
							title={folder ? `Nothing in ${folder} yet` : 'Nothing in your pantry yet'}
							description="Add what you keep on hand and it will be deducted from your shopping list."
						>
							{#snippet actions()}
								<Button variant="outline" onclick={openAdd}>
									<PlusIcon class="size-4" />
									Add item
								</Button>
							{/snippet}
						</EmptyState>
					{/if}
				</Card>
			{/if}
		</div>
	</div>
</Page>

<PantryItemDialog
	bind:open={dialogOpen}
	item={editing}
	section={dialogSection}
	sections={data.sections}
/>
