<script lang="ts">
	import { Switch } from 'bits-ui';

	type Props = { checked: boolean; label: string };

	let { checked = $bindable(), label }: Props = $props();
</script>

<Switch.Root
	bind:checked
	aria-label={label}
	class="data-[state=checked]:bg-accent bg-border focus-visible:ring-ring inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-150"
>
	<Switch.Thumb
		class="bg-neutral-0 pointer-events-none block size-5 translate-x-0.5 rounded-full shadow-sm transition-transform duration-150 data-[state=checked]:translate-x-[1.375rem]"
	/>
</Switch.Root>
