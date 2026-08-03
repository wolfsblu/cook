<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	/**
	 * One definition per visual role. The previous codebase spelled the same
	 * button two ways (`preset-filled-primary` and `preset-filled-primary-500`)
	 * because every call site wrote its own class string.
	 */
	export const button = tv({
		base: 'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50',
		variants: {
			variant: {
				primary: 'bg-accent text-accent-fg hover:bg-accent-hover',
				soft: 'bg-accent-soft text-accent-soft-fg hover:bg-accent-soft/70',
				ghost: 'bg-surface-muted text-fg hover:bg-border',
				outline: 'border border-border bg-surface text-fg hover:border-border-strong',
				danger: 'bg-danger text-danger-fg hover:bg-danger/90',
				dangerSoft: 'bg-danger-soft text-danger-soft-fg hover:bg-danger-soft/70'
			},
			size: {
				sm: 'h-8 px-3 text-sm',
				md: 'h-10 px-4 text-sm',
				lg: 'h-12 px-6 text-base'
			},
			block: { true: 'w-full' }
		},
		defaultVariants: { variant: 'primary', size: 'md' }
	});

	export type ButtonVariant = VariantProps<typeof button>['variant'];
	export type ButtonSize = VariantProps<typeof button>['size'];
</script>

<script lang="ts">
	import { LoaderCircleIcon } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

	type Props = {
		variant?: ButtonVariant;
		size?: ButtonSize;
		block?: boolean;
		loading?: boolean;
		/** Renders an anchor instead of a button. */
		href?: string;
		class?: string;
		children: Snippet;
	} & Omit<HTMLButtonAttributes & HTMLAnchorAttributes, 'class' | 'href'>;

	const {
		variant = 'primary',
		size = 'md',
		block = false,
		loading = false,
		href,
		class: className,
		children,
		...rest
	}: Props = $props();

	const classes = $derived(button({ variant, size, block, class: className }));
</script>

{#if href}
	<a {href} class={classes} {...rest}>
		{@render children()}
	</a>
{:else}
	<!-- disabled comes after the spread: otherwise a `disabled` in rest would
	     overwrite it and a loading button would stay clickable. -->
	<button class={classes} {...rest} disabled={loading || (rest as HTMLButtonAttributes).disabled}>
		{#if loading}
			<LoaderCircleIcon class="size-4 animate-spin" aria-hidden="true" />
		{/if}
		{@render children()}
	</button>
{/if}
