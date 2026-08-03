<script lang="ts">
	import { XIcon } from '@lucide/svelte';
	import { badge, type BadgeTone } from './Badge.svelte';

	/** A badge with a remove control, replacing the bare "×" glyph. */
	type Props = {
		label: string;
		tone?: BadgeTone;
		onremove?: () => void;
	};

	const { label, tone = 'accent', onremove }: Props = $props();
</script>

<span class={badge({ tone, class: 'pr-1' })}>
	{label}
	{#if onremove}
		<button
			type="button"
			onclick={onremove}
			class="hover:bg-fg/10 rounded-full p-0.5 transition-colors duration-150"
			aria-label="Remove {label}"
		>
			<XIcon class="size-3" />
		</button>
	{/if}
</span>
