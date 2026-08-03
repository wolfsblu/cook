<script lang="ts">
	import { enhance } from '$app/forms';
	import { InfoIcon, PlusIcon, RefrigeratorIcon } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import type { PantryItemView } from './+page.server';
	import PantryItemDialog from '$lib/components/pantry/PantryItemDialog.svelte';
	import PantryRow from '$lib/components/pantry/PantryRow.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Page from '$lib/components/ui/Page.svelte';

	const { data }: PageProps = $props();

	type Filter = 'all' | 'low' | 'expiring';
	let filter = $state<Filter>('all');

	let dialogOpen = $state(false);
	let editing = $state<PantryItemView | null>(null);
	let dialogSection = $state('');

	function itemsIn(section: string): PantryItemView[] {
		return data.items.filter((item) => {
			if (item.section !== section) return false;
			if (filter === 'low') return item.runningLow && !item.disabled;
			if (filter === 'expiring') return item.expiringSoon && !item.disabled;
			return true;
		});
	}

	function openAdd(section: string) {
		editing = null;
		dialogSection = section;
		dialogOpen = true;
	}

	function openEdit(item: PantryItemView) {
		editing = item;
		dialogSection = item.section;
		dialogOpen = true;
	}

	const visibleCount = $derived(data.sections.reduce((sum, s) => sum + itemsIn(s).length, 0));
</script>

<svelte:head>
	<title>Pantry</title>
</svelte:head>

<Page title="Pantry">
	{#snippet actions()}
		<form method="POST" action="?/addSection" use:enhance class="flex items-center gap-2">
			<input
				name="name"
				class="field w-40"
				placeholder="New section"
				aria-label="New section name"
				required
			/>
			<Button type="submit" variant="outline" size="sm">Add</Button>
		</form>
	{/snippet}

	<Card variant="flat" class="mb-6 flex items-start gap-3 p-4">
		<InfoIcon class="text-fg-subtle mt-0.5 size-5 shrink-0" />
		<p class="text-fg-muted text-sm">
			Anything stocked here is subtracted from your
			<a href="/shopping" class="link">shopping list</a> automatically. Items you keep but have run out
			of can be switched off rather than deleted, so they stay as a reminder.
		</p>
	</Card>

	<div class="mb-4 flex flex-wrap items-center gap-2">
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

	{#if data.sections.length === 0}
		<EmptyState
			icon={RefrigeratorIcon}
			title="Your pantry is empty"
			description="Add a section such as fridge, pantry or spices to start tracking what you have."
		/>
	{:else if visibleCount === 0 && filter !== 'all'}
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
		<div class="grid gap-4 md:grid-cols-2">
			{#each data.sections as section (section)}
				{@const items = itemsIn(section)}
				<Card variant="outline" class="p-4">
					<div class="mb-2 flex items-center justify-between gap-2">
						<h2 class="text-fg text-lg font-semibold capitalize">{section}</h2>
						<Button variant="ghost" size="sm" onclick={() => openAdd(section)}>
							<PlusIcon class="size-4" />
							Add
						</Button>
					</div>

					{#if items.length === 0}
						<p class="text-fg-subtle py-2 text-sm">Nothing here yet.</p>
					{:else}
						<ul class="divide-border divide-y">
							{#each items as item (item.name)}
								<PantryRow {item} onedit={openEdit} />
							{/each}
						</ul>
					{/if}
				</Card>
			{/each}
		</div>
	{/if}
</Page>

<PantryItemDialog bind:open={dialogOpen} item={editing} section={dialogSection} />
