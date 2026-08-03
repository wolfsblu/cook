<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const badge = tv({
		base: 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
		variants: {
			tone: {
				neutral: 'bg-surface-muted text-fg-muted',
				accent: 'bg-accent-soft text-accent-soft-fg',
				accent2: 'bg-accent2-soft text-accent2-soft-fg',
				danger: 'bg-danger-soft text-danger-soft-fg',
				warn: 'bg-warn-soft text-warn-soft-fg',
				ok: 'bg-ok-soft text-ok-soft-fg',
				/* Sits on a photograph, so it keeps fixed ramp values rather than
				   following the theme: the image behind it is dark either way. */
				overlay: 'bg-neutral-950/70 text-neutral-0 backdrop-blur-sm'
			}
		},
		defaultVariants: { tone: 'neutral' }
	});

	export type BadgeTone = VariantProps<typeof badge>['tone'];
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = { tone?: BadgeTone; class?: string; children: Snippet };

	const { tone = 'neutral', class: className, children }: Props = $props();
</script>

<span class={badge({ tone, class: className })}>
	{@render children()}
</span>
