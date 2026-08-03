<script lang="ts">
	import { Select } from 'bits-ui';
	import { CheckIcon, ChevronDownIcon } from '@lucide/svelte';

	type Option = { value: string; label: string };

	type Props = {
		value: string;
		options: Option[];
		label: string;
		class?: string;
		onchange?: (value: string) => void;
	};

	let { value = $bindable(), options, label, class: className, onchange }: Props = $props();

	const selectedLabel = $derived(options.find((o) => o.value === value)?.label ?? '');
</script>

<Select.Root type="single" bind:value onValueChange={onchange} items={options}>
	<Select.Trigger
		aria-label={label}
		class="field flex items-center justify-between gap-2 {className ?? ''}"
	>
		{selectedLabel}
		<ChevronDownIcon class="text-fg-subtle size-4 shrink-0" />
	</Select.Trigger>

	<Select.Portal>
		<Select.Content
			sideOffset={4}
			class="bg-surface border-border shadow-pop z-50 min-w-[var(--bits-select-anchor-width)] rounded-md border p-1"
		>
			{#each options as option (option.value)}
				<Select.Item
					value={option.value}
					label={option.label}
					class="data-highlighted:bg-accent-soft data-highlighted:text-accent-soft-fg flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm"
				>
					{#snippet children({ selected })}
						{option.label}
						{#if selected}
							<CheckIcon class="text-accent size-4" />
						{/if}
					{/snippet}
				</Select.Item>
			{/each}
		</Select.Content>
	</Select.Portal>
</Select.Root>
