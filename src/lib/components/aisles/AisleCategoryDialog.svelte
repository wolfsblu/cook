<script lang="ts">
	import { enhance } from '$app/forms';
	import { Dialog } from 'bits-ui';
	import { XIcon } from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';

	interface Props {
		open: boolean;
		/** The aisle being renamed. */
		original: string;
	}

	let { open = $bindable(), original }: Props = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="bg-overlay anim-fade fixed inset-0 z-40" />

		<Dialog.Content
			class="bg-surface border-border shadow-pop anim-pop fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border p-6"
		>
			<div class="mb-4 flex items-start justify-between gap-2">
				<Dialog.Title class="text-fg text-lg font-semibold">Rename aisle</Dialog.Title>
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
				action="?/renameCategory"
				use:enhance={() =>
					async ({ update }) => {
						await update();
						open = false;
					}}
				class="space-y-4"
			>
				<input type="hidden" name="from" value={original} />

				<div>
					<label for="aisle-rename" class="text-fg mb-1 block text-sm font-medium">Name</label>
					<input id="aisle-rename" name="to" class="field" value={original} required />
					<p class="text-fg-subtle mt-1 text-xs">
						The ingredients in it stay where they are; only the heading changes.
					</p>
				</div>

				<div class="flex justify-end gap-2">
					<Dialog.Close>
						{#snippet child({ props })}
							<Button {...props} type="button" variant="ghost">Cancel</Button>
						{/snippet}
					</Dialog.Close>
					<Button type="submit">Rename</Button>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
