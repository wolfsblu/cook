<script lang="ts">
	import { enhance } from '$app/forms';
	import { PlusIcon } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import AisleCategoryDialog from '$lib/components/aisles/AisleCategoryDialog.svelte';
	import AisleOrderCard from '$lib/components/aisles/AisleOrderCard.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';

	const { data }: PageProps = $props();

	let renameOpen = $state(false);
	let renaming = $state('');

	function openRename(name: string) {
		renaming = name;
		renameOpen = true;
	}
</script>

<div class="max-w-2xl space-y-6">
	<Card variant="outline" class="p-4">
		<h2 class="text-fg font-semibold">Add an aisle</h2>
		<p class="text-fg-muted mt-1 mb-3 text-sm">
			An aisle is a heading your <a href="/shopping" class="link">shopping list</a> groups under, such
			as “fruit and veg” or “dairy”.
		</p>

		<form method="POST" action="?/addCategory" use:enhance class="flex items-stretch gap-2">
			<input name="name" class="field" placeholder="frozen" aria-label="New aisle name" required />
			<Button type="submit" variant="outline" class="h-auto shrink-0">
				<PlusIcon class="size-4" />
				Add
			</Button>
		</form>
	</Card>

	{#if data.categories.length > 0}
		<AisleOrderCard categories={data.categories} counts={data.counts} onrename={openRename} />
	{/if}
</div>

<AisleCategoryDialog bind:open={renameOpen} original={renaming} />
