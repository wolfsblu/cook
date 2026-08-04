<script lang="ts">
	import { enhance } from '$app/forms';
	import { Dialog } from 'bits-ui';
	import {
		CircleHelpIcon,
		FolderIcon,
		FolderOpenIcon,
		FolderPlusIcon,
		PlusIcon,
		XIcon
	} from '@lucide/svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';

	interface Props {
		categories: string[];
		/** Entry count per category. */
		counts: Record<string, number>;
		total: number;
		unassignedCount: number;
		/** The category being browsed, or null. */
		selected: string | null;
		/** True when the unassigned view is showing. */
		unassigned: boolean;
	}

	const { categories, counts, total, unassignedCount, selected, unassigned }: Props = $props();

	let addOpen = $state(false);

	// Plain links rather than goto(), as the pantry folders do: back/forward
	// works and the URL is shareable.
	function href(category: string | null): string {
		return category ? `/aisles?category=${encodeURIComponent(category)}` : '/aisles';
	}

	const entry =
		'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors whitespace-nowrap';

	const active = 'bg-accent-soft text-accent-soft-fg font-medium';
	const idle = 'text-fg hover:bg-surface-muted';
</script>

<nav aria-label="Aisles" class="min-w-0">
	<!-- Below `lg` a sideways-scrolling strip of chips, so a long aisle list
	     never pushes the page wider than the viewport. -->
	<ul
		class="no-scrollbar flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-x-visible lg:pb-0"
	>
		<li class="shrink-0">
			<a
				href={href(null)}
				aria-current={selected === null && !unassigned ? 'page' : undefined}
				class="{entry} {selected === null && !unassigned ? active : idle}"
			>
				<FolderOpenIcon class="size-4 shrink-0" />
				<span class="truncate">All aisles</span>
				<span class="ml-auto pl-2 text-xs tabular-nums opacity-70">{total}</span>
			</a>
		</li>

		<li class="shrink-0">
			<a
				href="/aisles?view=unassigned"
				aria-current={unassigned ? 'page' : undefined}
				class="{entry} {unassigned ? active : idle}"
			>
				<CircleHelpIcon class="size-4 shrink-0" />
				<span class="truncate">Unassigned</span>
				{#if unassignedCount > 0}
					<span class="ml-auto pl-2"><Badge tone="warn">{unassignedCount}</Badge></span>
				{:else}
					<span class="ml-auto pl-2 text-xs tabular-nums opacity-70">0</span>
				{/if}
			</a>
		</li>

		<li class="border-border hidden lg:my-1 lg:block lg:border-t" aria-hidden="true"></li>

		{#each categories as category (category)}
			<li class="shrink-0">
				<a
					href={href(category)}
					aria-current={selected === category ? 'page' : undefined}
					class="{entry} {selected === category ? active : idle}"
				>
					<FolderIcon class="size-4 shrink-0" />
					<span class="truncate capitalize">{category}</span>
					<span class="ml-auto pl-2 text-xs tabular-nums opacity-70">{counts[category] ?? 0}</span>
				</a>
			</li>
		{/each}

		<!-- On narrow screens the strip has no room beneath it for a form, so the
		     trailing chip opens one in a dialog instead. -->
		<li class="shrink-0 lg:hidden">
			<button
				type="button"
				onclick={() => (addOpen = true)}
				class="{entry} border-border text-fg-muted hover:text-fg hover:border-border-strong border border-dashed"
			>
				<FolderPlusIcon class="size-4 shrink-0" />
				New aisle
			</button>
		</li>
	</ul>

	<form
		method="POST"
		action="?/addCategory"
		use:enhance
		class="mt-2 hidden items-stretch gap-2 lg:flex"
	>
		<input name="name" class="field" placeholder="New aisle" aria-label="New aisle name" required />
		<!-- h-auto so the button stretches to the input's height instead of
		     keeping the size variant's fixed one. -->
		<Button type="submit" variant="outline" size="sm" class="h-auto shrink-0">
			<PlusIcon class="size-4" />
			Add
		</Button>
	</form>
</nav>

<Dialog.Root bind:open={addOpen}>
	<Dialog.Portal>
		<Dialog.Overlay class="bg-overlay anim-fade fixed inset-0 z-40" />

		<Dialog.Content
			class="bg-surface border-border shadow-pop anim-pop fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border p-6"
		>
			<div class="mb-4 flex items-start justify-between gap-2">
				<Dialog.Title class="text-fg text-lg font-semibold">New aisle</Dialog.Title>
				<Dialog.Close>
					{#snippet child({ props })}
						<IconButton {...props} size="sm" label="Close">
							<XIcon class="size-4" />
						</IconButton>
					{/snippet}
				</Dialog.Close>
			</div>

			<form
				method="POST"
				action="?/addCategory"
				use:enhance={() =>
					async ({ update }) => {
						await update();
						addOpen = false;
					}}
				class="space-y-4"
			>
				<div>
					<label for="aisle-new-category" class="text-fg mb-1 block text-sm font-medium">Name</label
					>
					<input id="aisle-new-category" name="name" class="field" placeholder="frozen" required />
				</div>

				<div class="flex justify-end gap-2">
					<Dialog.Close>
						{#snippet child({ props })}
							<Button {...props} type="button" variant="ghost">Cancel</Button>
						{/snippet}
					</Dialog.Close>
					<Button type="submit">Add aisle</Button>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
