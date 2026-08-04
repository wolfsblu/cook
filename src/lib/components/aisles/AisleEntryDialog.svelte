<script lang="ts">
	import { enhance } from '$app/forms';
	import { Dialog } from 'bits-ui';
	import { XIcon } from '@lucide/svelte';
	import type { AisleEntry } from '$lib/server/aisle/format';
	import Button from '$lib/components/ui/Button.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';

	interface Props {
		open: boolean;
		/** The entry being edited, or null when adding a new one. */
		entry: AisleEntry | null;
		/** Aisle to preselect when adding. */
		category: string;
		/** Every aisle, so an ingredient can be moved between them. */
		categories: string[];
	}

	let { open = $bindable(), entry, category, categories }: Props = $props();

	const title = $derived(entry ? `Edit ${entry.name}` : 'Add ingredient');
	const currentCategory = $derived(entry?.category ?? category);
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="bg-overlay anim-fade fixed inset-0 z-40" />

		<Dialog.Content
			class="bg-surface border-border shadow-pop anim-pop fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border p-6"
		>
			<div class="mb-4 flex items-start justify-between gap-2">
				<Dialog.Title class="text-fg text-lg font-semibold">{title}</Dialog.Title>
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
				action="?/upsert"
				use:enhance={() =>
					async ({ update }) => {
						await update();
						open = false;
					}}
				class="space-y-4"
			>
				{#if entry}
					<input type="hidden" name="originalName" value={entry.name} />
					<input type="hidden" name="originalCategory" value={entry.category} />
					<!-- Round-tripped rather than edited: the action rewrites the whole
					     line, so an omitted comment would be dropped from the file. -->
					<input type="hidden" name="comment" value={entry.comment ?? ''} />
				{/if}

				<div>
					<label for="aisle-name" class="text-fg mb-1 block text-sm font-medium">Name</label>
					<input
						id="aisle-name"
						name="name"
						class="field"
						required
						value={entry?.name ?? ''}
						placeholder="onion"
					/>
					<p class="text-fg-subtle mt-1 text-xs">
						Spelled exactly as your recipes write it. This is the name that appears on the shopping
						list.
					</p>
				</div>

				<div>
					<label for="aisle-aliases" class="text-fg mb-1 block text-sm font-medium">
						Also called
					</label>
					<textarea
						id="aisle-aliases"
						name="aliases"
						class="field"
						rows="3"
						value={entry?.aliases.join('\n') ?? ''}
						placeholder="onions&#10;brown onion"
					></textarea>
					<p class="text-fg-subtle mt-1 text-xs">
						One per line. Ingredients are matched by exact name, so a recipe calling for
						<code>onions</code> only reaches this aisle if <code>onions</code> is listed here — put plurals
						and other spellings in this box rather than adding them as separate ingredients.
					</p>
				</div>

				<div>
					<label for="aisle-category" class="text-fg mb-1 block text-sm font-medium">Aisle</label>
					<!-- A native select, not ui/Select.svelte: this is a real POST form
					     and the Bits UI select does not contribute a form value. -->
					<select
						id="aisle-category"
						name="category"
						class="field capitalize"
						value={currentCategory}
					>
						{#each categories as name (name)}
							<option value={name}>{name}</option>
						{/each}
					</select>
				</div>

				<div class="flex justify-end gap-2 pt-2">
					<Dialog.Close>
						{#snippet child({ props })}
							<Button {...props} type="button" variant="ghost">Cancel</Button>
						{/snippet}
					</Dialog.Close>
					<Button type="submit">Save</Button>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
