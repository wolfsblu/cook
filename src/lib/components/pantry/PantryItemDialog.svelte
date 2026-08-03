<script lang="ts">
	import { enhance } from '$app/forms';
	import { Dialog } from 'bits-ui';
	import { XIcon } from '@lucide/svelte';
	import type { PantryItem } from '$lib/server/pantry/format';
	import Button from '$lib/components/ui/Button.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';

	interface Props {
		open: boolean;
		/** The item being edited, or null when adding a new one. */
		item: PantryItem | null;
		section: string;
	}

	let { open = $bindable(), item, section }: Props = $props();

	const title = $derived(item ? `Edit ${item.name}` : 'Add item');
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
				<input type="hidden" name="section" value={item?.section ?? section} />
				{#if item}
					<input type="hidden" name="originalName" value={item.name} />
				{/if}

				<div>
					<label for="pantry-name" class="text-fg mb-1 block text-sm font-medium">Name</label>
					<input
						id="pantry-name"
						name="name"
						class="field"
						required
						value={item?.name ?? ''}
						placeholder="olive oil"
					/>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="pantry-quantity" class="text-fg mb-1 block text-sm font-medium">
							Quantity
						</label>
						<input
							id="pantry-quantity"
							name="quantity"
							class="field"
							value={item?.quantity ?? ''}
							placeholder="750%ml"
						/>
					</div>

					<div>
						<label for="pantry-low" class="text-fg mb-1 block text-sm font-medium"> Low at </label>
						<input
							id="pantry-low"
							name="low"
							class="field"
							value={item?.low ?? ''}
							placeholder="200%ml"
						/>
					</div>
				</div>

				<p class="text-fg-subtle text-xs">
					Written <code>amount%unit</code>, e.g. <code>500%g</code>, <code>1%L</code>, or just
					<code>6</code> for a count. Use the same unit your recipes use — stock in kilograms is not matched
					against a recipe measured in grams.
				</p>

				<div>
					<label for="pantry-expire" class="text-fg mb-1 block text-sm font-medium">
						Expires
					</label>
					<input
						id="pantry-expire"
						name="expire"
						type="date"
						class="field"
						value={item?.expire ?? ''}
					/>
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
