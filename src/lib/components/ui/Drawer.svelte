<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { XIcon } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import IconButton from './IconButton.svelte';

	/**
	 * A slide-in panel built on Bits UI's Dialog, which brings the focus trap,
	 * scroll lock and Escape handling that the hand-rolled version lacked --
	 * that one used a bare <button> as its backdrop and a window keydown
	 * listener.
	 *
	 * Animation is CSS, driven by Bits' own data-state attributes, rather than
	 * Svelte `transition:` directives. With forceMount plus a transition, Bits
	 * keeps `inert` on the content while it waits for an animation that never
	 * arrives, which silently disables every one of those behaviours.
	 */
	type Props = {
		open: boolean;
		title: string;
		side?: 'left' | 'right';
		children: Snippet;
		footer?: Snippet;
	};

	let { open = $bindable(), title, side = 'left', children, footer }: Props = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="bg-overlay anim-fade fixed inset-0 z-40" />

		<Dialog.Content
			class="bg-surface border-border fixed inset-y-0 z-50 flex w-80 max-w-full flex-col {side ===
			'left'
				? 'anim-slide-left left-0 border-r'
				: 'anim-slide-right right-0 border-l'}"
		>
			<header class="border-border flex items-center justify-between gap-2 border-b px-4 py-3">
				<Dialog.Title class="text-fg text-base font-semibold">{title}</Dialog.Title>
				<Dialog.Close>
					{#snippet child({ props })}
						<IconButton {...props} label="Close {title}" size="sm">
							<XIcon class="size-4" />
						</IconButton>
					{/snippet}
				</Dialog.Close>
			</header>

			<div class="flex-1 overflow-y-auto p-4">
				{@render children()}
			</div>

			{#if footer}
				<footer class="border-border border-t p-4">
					{@render footer()}
				</footer>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
