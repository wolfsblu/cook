<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { button, type ButtonVariant } from './Button.svelte';

	/**
	 * An icon-only button. `label` is required rather than optional: an icon
	 * with no accessible name is invisible to a screen reader, and several
	 * buttons in this app previously shipped that way.
	 */
	type Props = {
		label: string;
		variant?: ButtonVariant;
		size?: 'sm' | 'md';
		class?: string;
		children: Snippet;
	} & Omit<HTMLButtonAttributes, 'class' | 'aria-label'>;

	const {
		label,
		variant = 'ghost',
		size = 'md',
		class: className,
		children,
		...rest
	}: Props = $props();

	const classes = $derived(
		button({
			variant,
			class: [size === 'sm' ? 'size-8' : 'size-9', 'shrink-0 p-0', className]
				.filter(Boolean)
				.join(' ')
		})
	);
</script>

<button type="button" class={classes} aria-label={label} title={label} {...rest}>
	{@render children()}
</button>
