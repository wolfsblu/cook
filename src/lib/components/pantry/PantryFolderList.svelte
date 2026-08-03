<script lang="ts">
	import { enhance } from '$app/forms';
	import { Dialog } from 'bits-ui';
	import { FolderIcon, FolderOpenIcon, FolderPlusIcon, PlusIcon, XIcon } from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';

	interface Props {
		sections: string[];
		/** Item count per section, including items that are not stocked. */
		counts: Record<string, number>;
		total: number;
		/** The section being browsed, or null for "All items". */
		selected: string | null;
	}

	const { sections, counts, total, selected }: Props = $props();

	let addOpen = $state(false);

	// Plain links rather than goto(): back/forward then works, and the URL is
	// shareable. Same reasoning as the recipe list's filter params.
	function href(section: string | null): string {
		return section ? `/pantry?folder=${encodeURIComponent(section)}` : '/pantry';
	}

	const entry =
		'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors whitespace-nowrap';
</script>

<nav aria-label="Pantry folders" class="min-w-0">
	<!-- Below `lg` this is a sideways-scrolling strip of chips, so a long folder
	     list never pushes the page wider than the viewport. -->
	<ul
		class="no-scrollbar flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-x-visible lg:pb-0"
	>
		<li class="shrink-0">
			<a
				href={href(null)}
				aria-current={selected === null ? 'page' : undefined}
				class="{entry} {selected === null
					? 'bg-accent-soft text-accent-soft-fg font-medium'
					: 'text-fg hover:bg-surface-muted'}"
			>
				<FolderOpenIcon class="size-4 shrink-0" />
				<span class="truncate">All items</span>
				<span class="ml-auto pl-2 text-xs tabular-nums opacity-70">{total}</span>
			</a>
		</li>

		<li class="border-border hidden lg:my-1 lg:block lg:border-t" aria-hidden="true"></li>

		{#each sections as section (section)}
			<li class="shrink-0">
				<a
					href={href(section)}
					aria-current={selected === section ? 'page' : undefined}
					class="{entry} {selected === section
						? 'bg-accent-soft text-accent-soft-fg font-medium'
						: 'text-fg hover:bg-surface-muted'}"
				>
					<FolderIcon class="size-4 shrink-0" />
					<span class="truncate capitalize">{section}</span>
					<span class="ml-auto pl-2 text-xs tabular-nums opacity-70">{counts[section] ?? 0}</span>
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
				New folder
			</button>
		</li>
	</ul>

	<form
		method="POST"
		action="?/addSection"
		use:enhance
		class="mt-2 hidden items-stretch gap-2 lg:flex"
	>
		<input
			name="name"
			class="field"
			placeholder="New folder"
			aria-label="New folder name"
			required
		/>
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
				<Dialog.Title class="text-fg text-lg font-semibold">New folder</Dialog.Title>
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
				action="?/addSection"
				use:enhance={() =>
					async ({ update }) => {
						await update();
						addOpen = false;
					}}
				class="space-y-4"
			>
				<div>
					<label for="pantry-new-folder" class="text-fg mb-1 block text-sm font-medium">Name</label>
					<input id="pantry-new-folder" name="name" class="field" placeholder="freezer" required />
				</div>

				<div class="flex justify-end gap-2">
					<Dialog.Close>
						{#snippet child({ props })}
							<Button {...props} type="button" variant="ghost">Cancel</Button>
						{/snippet}
					</Dialog.Close>
					<Button type="submit">Add folder</Button>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
