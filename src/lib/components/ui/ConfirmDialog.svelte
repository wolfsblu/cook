<script lang="ts">
	import { AlertDialog } from 'bits-ui';
	import Button from './Button.svelte';

	/**
	 * Replaces the native confirm(), which ignored the app's visual language
	 * and blocked the main thread.
	 */
	type Props = {
		open: boolean;
		title: string;
		description: string;
		confirmLabel?: string;
		cancelLabel?: string;
		destructive?: boolean;
		onconfirm: () => void;
	};

	let {
		open = $bindable(),
		title,
		description,
		confirmLabel = 'Confirm',
		cancelLabel = 'Cancel',
		destructive = false,
		onconfirm
	}: Props = $props();
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Portal>
		<AlertDialog.Overlay class="bg-overlay anim-fade fixed inset-0 z-40" />

		<AlertDialog.Content
			class="bg-surface border-border shadow-pop anim-pop fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border p-6"
		>
			<AlertDialog.Title class="text-fg text-lg font-semibold">{title}</AlertDialog.Title>
			<AlertDialog.Description class="text-fg-muted mt-2 text-sm">
				{description}
			</AlertDialog.Description>

			<div class="mt-6 flex justify-end gap-2">
				<AlertDialog.Cancel>
					{#snippet child({ props })}
						<Button {...props} variant="ghost">{cancelLabel}</Button>
					{/snippet}
				</AlertDialog.Cancel>
				<AlertDialog.Action onclick={onconfirm}>
					{#snippet child({ props })}
						<Button {...props} variant={destructive ? 'danger' : 'primary'}>
							{confirmLabel}
						</Button>
					{/snippet}
				</AlertDialog.Action>
			</div>
		</AlertDialog.Content>
	</AlertDialog.Portal>
</AlertDialog.Root>
