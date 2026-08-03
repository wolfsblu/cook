<script lang="ts">
	import { ListChecksIcon } from '@lucide/svelte';
	import type { ShoppingListDisplay } from '$lib/types/shopping-list';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';

	interface Props {
		shoppingList: ShoppingListDisplay | null;
		loading?: boolean;
	}

	let { shoppingList, loading = false }: Props = $props();

	/**
	 * Ticking items off is intentionally client-only. It is transient state
	 * about one shopping trip, not something worth writing to the recipe
	 * directory, and it resets whenever the generated list changes.
	 */
	let checked = $state(new Set<string>());
	let checkedFor = $state('');

	const listSignature = $derived(
		shoppingList?.categories.map((c) => `${c.name}:${c.items.length}`).join('|') ?? ''
	);

	$effect(() => {
		// Reset when the generated list changes, so ticks never carry over onto
		// a different set of items.
		if (checkedFor !== listSignature) {
			checkedFor = listSignature;
			checked = new Set();
		}
	});

	function toggle(key: string) {
		const next = new Set(checked);
		if (next.has(key)) next.delete(key);
		else next.add(key);
		checked = next;
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
				<section>
					<h3 class="text-fg mb-2 flex items-center gap-2 font-semibold">
						{category.displayName}
						<Badge>{category.items.length}</Badge>
					</h3>

					<ul class="space-y-0.5">
						{#each category.items as item (item.name)}
							{@const key = `${category.name}/${item.name}`}
							{@const isChecked = checked.has(key)}
							<li>
								<label
									class="hover:bg-surface-muted flex cursor-pointer items-baseline gap-3 rounded-sm px-2 py-1 transition-colors duration-150"
								>
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
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		</div>
	{/if}
</Card>
