<script lang="ts">
	import { LoaderCircleIcon } from '@lucide/svelte';

	type Props = { label?: string; class?: string };

	const { label = 'Loading', class: className }: Props = $props();
</script>

<span class="text-fg-muted inline-flex items-center gap-2 {className ?? ''}" role="status">
	<LoaderCircleIcon class="size-4 animate-spin" aria-hidden="true" />
	<span class="sr-only">{label}</span>
</span>
