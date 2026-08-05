<script lang="ts">
	import { enhance } from '$app/forms';
	import { XIcon } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	/**
	 * The sticky action bar for a bulk selection. It *is* the `<form>` the row
	 * checkboxes associate with by id (via their `form=` attribute), so the
	 * checkboxes can live in the list while the destination select and submit
	 * buttons live down here -- no nested forms, and it still posts without JS.
	 *
	 * The form is always in the DOM (only its visibility is toggled), so a
	 * checkbox ticked before anything else is reliably owned by it rather than
	 * waiting for the bar to mount.
	 *
	 * Selection state is owned by the caller: `count` drives the label and the
	 * "appear only when something is picked" behaviour, `onclear` empties it, and
	 * `onsubmitted` runs after a successful enhanced submit so the caller can
	 * reset. Without JS none of those fire, but the native checkboxes still
	 * submit and the form still posts.
	 */
	type Props = {
		/** Matches the `form=` on every row checkbox. */
		formId: string;
		/** Default form action, e.g. "?/bulkAssign". */
		action: string;
		count: number;
		onclear: () => void;
		onsubmitted?: () => void;
		/** Destination select + submit button(s), and any hidden inputs. */
		controls: Snippet;
	};

	const { formId, action, count, onclear, onsubmitted, controls }: Props = $props();
</script>

<form
	id={formId}
	method="POST"
	{action}
	use:enhance={() =>
		async ({ update }) => {
			await update();
			onsubmitted?.();
		}}
	class="border-border bg-surface/90 sticky bottom-16 z-40 -mx-4 mt-4 border-t px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 md:bottom-0 {count >
	0
		? 'flex flex-wrap items-center gap-2'
		: 'hidden'}"
	style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom))"
>
	<span class="text-fg text-sm font-medium tabular-nums">{count} selected</span>
	<button
		type="button"
		onclick={onclear}
		class="text-fg-muted hover:text-fg inline-flex items-center gap-1 text-sm transition-colors"
	>
		<XIcon class="size-4" />
		Clear
	</button>

	<div class="ml-auto flex flex-wrap items-center gap-2">
		{@render controls()}
	</div>
</form>
