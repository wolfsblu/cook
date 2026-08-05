<script lang="ts">
	import { enhance } from '$app/forms';
	import { ChevronDownIcon, ChevronUpIcon, PencilIcon, Trash2Icon } from '@lucide/svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';

	interface Props {
		categories: string[];
		counts: Record<string, number>;
		onrename: (category: string) => void;
	}

	const { categories, counts, onrename }: Props = $props();
</script>

<!--
	The Manage tab's core control: this list is the order the shopping list
	groups by, which is the reason to edit the file at all. Reordering stays a
	pair of up/down forms rather than drag-and-drop so it works without
	JavaScript, in keeping with the rest of the page.
-->
<Card variant="outline" class="p-4">
	<h2 class="text-fg font-semibold">Aisle order</h2>
	<p class="text-fg-muted mt-1 mb-3 text-sm">
		Your <a href="/shopping" class="link">shopping list</a> groups in this order. Arrange it the way you
		walk the shop.
	</p>

	<ol class="divide-border divide-y">
		{#each categories as category, index (category)}
			<li class="flex items-center gap-2 py-1.5">
				<div class="flex shrink-0 flex-col">
					<form method="POST" action="?/moveCategory" use:enhance>
						<input type="hidden" name="name" value={category} />
						<input type="hidden" name="direction" value="up" />
						<IconButton type="submit" size="sm" label="Move {category} up" disabled={index === 0}>
							<ChevronUpIcon class="size-4" />
						</IconButton>
					</form>

					<form method="POST" action="?/moveCategory" use:enhance>
						<input type="hidden" name="name" value={category} />
						<input type="hidden" name="direction" value="down" />
						<IconButton
							type="submit"
							size="sm"
							label="Move {category} down"
							disabled={index === categories.length - 1}
						>
							<ChevronDownIcon class="size-4" />
						</IconButton>
					</form>
				</div>

				<span class="text-fg-subtle w-6 shrink-0 text-right text-sm tabular-nums">
					{index + 1}
				</span>

				<a
					href="/aisles?category={encodeURIComponent(category)}"
					class="text-fg min-w-0 flex-1 truncate font-medium capitalize hover:underline"
				>
					{category}
				</a>

				<span class="text-fg-muted shrink-0 text-xs tabular-nums">
					{counts[category] ?? 0}
				</span>

				<IconButton size="sm" label="Rename {category}" onclick={() => onrename(category)}>
					<PencilIcon class="size-4" />
				</IconButton>

				<form method="POST" action="?/removeCategory" use:enhance>
					<input type="hidden" name="name" value={category} />
					<IconButton
						type="submit"
						size="sm"
						variant="dangerSoft"
						label="Remove {category}"
						disabled={(counts[category] ?? 0) > 0}
					>
						<Trash2Icon class="size-4" />
					</IconButton>
				</form>
			</li>
		{/each}
	</ol>
</Card>
