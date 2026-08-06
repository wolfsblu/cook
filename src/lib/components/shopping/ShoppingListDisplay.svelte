<script lang="ts">
	import { ListChecksIcon } from '@lucide/svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { UNCATEGORIZED, type ShoppingListDisplay } from '$lib/types/shopping-list';
	import ShoppingAislePicker from './ShoppingAislePicker.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';

	interface Props {
		shoppingList: ShoppingListDisplay | null;
		loading?: boolean;
		/** Aisles offered for anything the config could not place. */
		aisleCategories?: string[];
		returnTo?: string;
	}

	let {
		shoppingList,
		loading = false,
		aisleCategories = [],
		returnTo = '/shopping'
	}: Props = $props();

	/**
	 * Ticking items off is intentionally client-only. It is transient state
	 * about one shopping trip, not something worth writing to the recipe
	 * directory, and it resets whenever the generated list changes.
	 */
	// SvelteSet rather than Set: this is reactive state, and a plain Set would
	// not notify on mutation, forcing a wholesale replacement on every tick.
	const checked = new SvelteSet<string>();
	let checkedFor = $state('');

	const listSignature = $derived(
		shoppingList?.categories.map((c) => `${c.name}:${c.items.length}`).join('|') ?? ''
	);

	$effect(() => {
		// Reset when the generated list changes, so ticks never carry over onto
		// a different set of items.
		if (checkedFor !== listSignature) {
			checkedFor = listSignature;
			checked.clear();
		}
	});

	function toggle(key: string) {
		if (checked.has(key)) checked.delete(key);
		else checked.add(key);
	}
</script>

<Card variant="outline" class="p-4">
	{#if loading}
		<div class="flex items-center justify-center gap-3 py-12">
			<Spinner label="Generating shopping list" />
			<span class="text-fg-muted">Generating shopping list…</span>
		</div>
	{:else if !shoppingList || shoppingList.categories.length === 0}
		<EmptyState
			icon={ListChecksIcon}
			title="Nothing to buy yet"
			description="Add recipes to generate a shopping list."
		/>
	{:else}
		<div class="mb-4 flex items-start justify-between gap-2">
			<h2 class="text-fg text-lg font-semibold">Shopping list</h2>
			<span class="text-fg-muted text-sm">
				{shoppingList.totalItems} items from {shoppingList.recipeCount}
				{shoppingList.recipeCount === 1 ? 'recipe' : 'recipes'}
			</span>
		</div>

		<div class="space-y-6">
			{#each shoppingList.categories as category (category.name)}
				{@const placeable = category.name === UNCATEGORIZED && aisleCategories.length > 0}
				<section>
					<h3 class="text-fg mb-2 flex items-center gap-2 font-semibold">
						{category.displayName}
						<Badge>{category.items.length}</Badge>
					</h3>

					{#if placeable}
						<p class="text-fg-muted mb-2 text-sm">
							Not in your <a href="/aisles/unassigned" class="link">aisles</a> yet. Give each one an aisle
							and it
							will be grouped with the rest next time.
						</p>
					{/if}

					<ul class="space-y-0.5">
						{#each category.items as item (item.name)}
							{@const key = `${category.name}/${item.name}`}
							{@const isChecked = checked.has(key)}
							<li
								class="hover:bg-surface-muted flex items-center gap-2 rounded-sm pr-2 transition-colors duration-150"
							>
								<!-- The picker is a sibling of the label, never inside it: a
								     select nested in a label ticks the checkbox on every click
								     that opens the dropdown. -->
								<label class="flex flex-1 cursor-pointer items-baseline gap-3 px-2 py-1">
									<input
										type="checkbox"
										checked={isChecked}
										onchange={() => toggle(key)}
										class="text-accent focus-visible:ring-ring border-border-strong size-4 shrink-0 self-center rounded-sm"
									/>
									<span class={isChecked ? 'text-fg-subtle line-through' : ''}>
										{item.displayName}
										{#if item.quantity}
											<span class="text-fg-muted tabular-nums">— {item.quantity}</span>
										{/if}
									</span>
								</label>

								{#if placeable}
									<ShoppingAislePicker
										itemName={item.name}
										categories={aisleCategories}
										{returnTo}
									/>
								{/if}
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		</div>
	{/if}
</Card>
