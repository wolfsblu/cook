<script lang="ts">
	import { ShoppingCartIcon, TerminalIcon, TriangleAlertIcon } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import SelectedRecipesList from '$lib/components/shopping/SelectedRecipesList.svelte';
	import ShoppingListDisplay from '$lib/components/shopping/ShoppingListDisplay.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Page from '$lib/components/ui/Page.svelte';

	const { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Shopping list</title>
</svelte:head>

<Page title="Shopping">
	{#if data.selections.length === 0}
		<EmptyState
			icon={ShoppingCartIcon}
			title="Your shopping list is empty"
			description="Open a recipe and add it to build a combined list, with quantities merged across recipes and anything in your pantry subtracted."
		>
			{#snippet actions()}
				<Button href="/">Browse recipes</Button>
			{/snippet}
		</EmptyState>
	{:else}
		{#if data.error}
			<Card
				variant="outline"
				class="border-warn bg-warn-soft text-warn-soft-fg mb-6 flex items-start gap-3 p-4"
			>
				<TerminalIcon class="mt-0.5 size-5 shrink-0" />
				<div>
					<p class="font-semibold">
						{data.cliMissing ? 'Combined list unavailable' : 'Could not generate the list'}
					</p>
					<p class="mt-1 text-sm">{data.error}</p>
					{#if data.cliMissing}
						<p class="mt-1 text-sm">
							Your selected recipes are still listed; install the cook CLI to combine them.
						</p>
					{/if}
				</div>
			</Card>
		{/if}

		{#if data.warnings.length > 0}
			<Card
				variant="outline"
				class="border-warn bg-warn-soft text-warn-soft-fg mb-6 flex items-start gap-3 p-4"
			>
				<TriangleAlertIcon class="mt-0.5 size-5 shrink-0" />
				<div class="min-w-0">
					<p class="font-semibold">Some pantry items could not be applied</p>
					<ul class="mt-1 list-disc space-y-0.5 pl-4 text-sm">
						{#each data.warnings as warning (warning)}
							<li>{warning}</li>
						{/each}
					</ul>
					<p class="mt-2 text-sm">
						Stock is only subtracted when its unit matches the one the recipe uses; kilograms do not
						cover a recipe measured in grams. Edit the entry in your
						<a href="/pantry" class="link">pantry</a> to match, and it will be deducted.
					</p>
				</div>
			</Card>
		{/if}

		<div class="grid gap-6 lg:grid-cols-[22rem_1fr]">
			<aside>
				<SelectedRecipesList selections={data.selections} />
			</aside>

			<div>
				<ShoppingListDisplay shoppingList={data.list} />
			</div>
		</div>
	{/if}
</Page>
