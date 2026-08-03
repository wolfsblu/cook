<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * The single page container. The three pages previously used three
	 * different idioms, so gutters and max widths did not line up between them.
	 */
	type Props = {
		title?: string;
		/** Content aligned to the right of the title, e.g. a primary action. */
		actions?: Snippet;
		/** Widen for content that benefits from it, such as the recipe grid. */
		wide?: boolean;
		class?: string;
		children: Snippet;
	};

	const { title, actions, wide = false, class: className, children }: Props = $props();
</script>

<div
	class="mx-auto w-full px-4 py-6 sm:px-6 {wide ? 'max-w-[110rem]' : 'max-w-6xl'} {className ?? ''}"
>
	{#if title || actions}
		<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
			{#if title}
				<h1 class="text-fg text-2xl font-semibold tracking-tight">{title}</h1>
			{/if}
			{#if actions}
				<div class="flex flex-wrap items-center gap-2">{@render actions()}</div>
			{/if}
		</div>
	{/if}

	{@render children()}
</div>
