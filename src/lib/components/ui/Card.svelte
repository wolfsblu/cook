<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const card = tv({
		base: 'rounded-lg border bg-surface',
		variants: {
			variant: {
				raised: 'border-border shadow-card',
				outline: 'border-border',
				flat: 'border-transparent bg-surface-muted'
			},
			interactive: {
				true: 'transition-shadow transition-colors duration-150 hover:border-border-strong hover:shadow-pop'
			}
		},
		defaultVariants: { variant: 'raised' }
	});

	export type CardVariant = VariantProps<typeof card>['variant'];
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		variant?: CardVariant;
		interactive?: boolean;
		class?: string;
		children: Snippet;
	};

	const { variant = 'raised', interactive = false, class: className, children }: Props = $props();
</script>

<div class={card({ variant, interactive, class: className })}>
	{@render children()}
</div>
