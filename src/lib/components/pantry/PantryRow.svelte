<script lang="ts">
	import { enhance } from '$app/forms';
	import { EyeIcon, EyeOffIcon, PencilIcon, Trash2Icon } from '@lucide/svelte';
	import type { PantryItemView } from '../../../routes/pantry/+page.server';
	import Badge from '$lib/components/ui/Badge.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';

	interface Props {
		item: PantryItemView;
		onedit: (item: PantryItemView) => void;
	}

	const { item, onedit }: Props = $props();

	const expiryLabel = $derived.by(() => {
		if (item.daysLeft === null) return null;
		if (item.daysLeft < 0) return `Expired ${-item.daysLeft}d ago`;
		if (item.daysLeft === 0) return 'Expires today';
		return `${item.daysLeft}d left`;
	});
</script>

<li
	class="flex items-center gap-3 py-2 {item.disabled ? 'opacity-50' : ''}"
	data-testid="pantry-item"
>
	<div class="min-w-0 flex-1">
		<div class="flex flex-wrap items-center gap-2">
			<span class="truncate font-medium">{item.name}</span>

			{#if item.runningLow && !item.disabled}
				<Badge tone="warn">Low</Badge>
			{/if}

			{#if expiryLabel && !item.disabled}
				<Badge tone={item.daysLeft !== null && item.daysLeft < 0 ? 'danger' : 'warn'}>
					{expiryLabel}
				</Badge>
			{/if}
		</div>

		<div class="text-fg-muted flex flex-wrap gap-x-3 text-xs">
			{#if item.displayQuantity}
				<span class="tabular-nums">{item.displayQuantity}</span>
			{/if}
			{#if item.low}
				<span class="tabular-nums">low at {item.low}</span>
			{/if}
			{#if item.disabled}
				<span>not stocked</span>
			{/if}
		</div>
	</div>

	<div class="flex shrink-0 items-center gap-1">
		<form method="POST" action="?/toggle" use:enhance>
			<input type="hidden" name="section" value={item.section} />
			<input type="hidden" name="name" value={item.name} />
			<IconButton
				type="submit"
				size="sm"
				label={item.disabled ? `Stock ${item.name}` : `Mark ${item.name} as not stocked`}
			>
				{#if item.disabled}
					<EyeOffIcon class="size-4" />
				{:else}
					<EyeIcon class="size-4" />
				{/if}
			</IconButton>
		</form>

		<IconButton size="sm" label="Edit {item.name}" onclick={() => onedit(item)}>
			<PencilIcon class="size-4" />
		</IconButton>

		<form method="POST" action="?/remove" use:enhance>
			<input type="hidden" name="section" value={item.section} />
			<input type="hidden" name="name" value={item.name} />
			<IconButton type="submit" size="sm" variant="dangerSoft" label="Remove {item.name}">
				<Trash2Icon class="size-4" />
			</IconButton>
		</form>
	</div>
</li>
