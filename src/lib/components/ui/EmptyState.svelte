<script lang="ts">
	import type { Component, Snippet } from 'svelte';

	/**
	 * The single empty-state treatment. There used to be three: bare centred
	 * text, an outlined card, and centred text inside another card.
	 */
	type Props = {
		icon?: Component<{ class?: string }>;
		title: string;
		description?: string;
		/** Actions, typically a Button or two. */
		actions?: Snippet;
	};

	const { icon: Icon, title, description, actions }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
	{#if Icon}
		<Icon class="text-fg-subtle size-10" />
	{/if}

	<p class="text-fg text-lg font-medium">{title}</p>

	{#if description}
		<p class="text-fg-muted max-w-prose text-sm">{description}</p>
	{/if}

	{#if actions}
		<div class="mt-2 flex flex-wrap items-center justify-center gap-2">
			{@render actions()}
		</div>
	{/if}
</div>
