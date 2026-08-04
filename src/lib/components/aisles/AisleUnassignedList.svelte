<script lang="ts">
	import { enhance } from '$app/forms';
	import { CircleCheckIcon } from '@lucide/svelte';
	import type { AisleCoverageItem } from '$lib/server/aisle/coverage';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';

	interface Props {
		items: AisleCoverageItem[];
		categories: string[];
		/** How many to show. Omit for all of them. */
		limit?: number;
		/** Where the assign action should send the browser back to. */
		returnTo: string;
	}

	const { items, categories, limit, returnTo }: Props = $props();

	const shown = $derived(limit === undefined ? items : items.slice(0, limit));
	const hidden = $derived(items.length - shown.length);
</script>

<Card variant="outline" class="p-4">
	<h2 class="text-fg font-semibold">Unassigned ingredients</h2>
	<p class="text-fg-muted mt-1 mb-3 text-sm">
		These appear in your recipes but not in any aisle, so they land under “Other” at the bottom of
		the shopping list.
	</p>

	{#if items.length === 0}
		<EmptyState
			icon={CircleCheckIcon}
			title="Every ingredient has an aisle"
			description="Nothing in your recipes falls through to “Other”."
		/>
	{:else}
		<ul class="divide-border divide-y">
			{#each shown as item (item.name)}
				<li class="flex flex-wrap items-center gap-x-3 gap-y-2 py-2">
					<div class="min-w-0 flex-1">
						<span class="text-fg font-medium capitalize">{item.name}</span>
						<span class="text-fg-subtle ml-2 text-xs tabular-nums">
							{item.recipeCount}
							{item.recipeCount === 1 ? 'recipe' : 'recipes'}
						</span>
						<div class="text-fg-muted truncate text-xs">
							{item.recipes.map((recipe) => recipe.title).join(', ')}
						</div>
					</div>

					{#if item.suggestedAliasOf}
						<!-- The far better fix for a plural. Adding "onions" as its own
						     entry works, but the file then grows a second line for every
						     spelling of everything. -->
						<form method="POST" action="?/assign" use:enhance class="shrink-0">
							<input type="hidden" name="name" value={item.name} />
							<input type="hidden" name="aliasOf" value={item.suggestedAliasOf} />
							<input type="hidden" name="category" value={categories[0] ?? ''} />
							<input type="hidden" name="returnTo" value={returnTo} />
							<Button type="submit" size="sm" variant="soft">
								Same as {item.suggestedAliasOf}
							</Button>
						</form>
					{/if}

					<form method="POST" action="?/assign" use:enhance class="flex shrink-0 gap-2">
						<input type="hidden" name="name" value={item.name} />
						<input type="hidden" name="returnTo" value={returnTo} />
						<!-- A native select: this is a real POST form and the Bits UI
						     select does not contribute a form value. -->
						<select
							name="category"
							class="field w-auto capitalize"
							aria-label="Aisle for {item.name}"
						>
							{#each categories as category (category)}
								<option value={category}>{category}</option>
							{/each}
						</select>
						<Button type="submit" size="sm" variant="outline" class="h-auto shrink-0">
							Assign
						</Button>
					</form>
				</li>
			{/each}
		</ul>

		{#if hidden > 0}
			<a href="/aisles?view=unassigned" class="link mt-3 inline-block text-sm">
				See all {items.length}
			</a>
		{/if}
	{/if}
</Card>
