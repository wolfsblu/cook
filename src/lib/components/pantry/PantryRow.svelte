<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		EyeIcon,
		EyeOffIcon,
		PackageIcon,
		PackageOpenIcon,
		PencilIcon,
		Trash2Icon
	} from '@lucide/svelte';
	import type { PantryItemView } from '../../../routes/pantry/+page.server';
	import Badge from '$lib/components/ui/Badge.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';

	interface Props {
		item: PantryItemView;
		showLocation: boolean;
		onedit: (item: PantryItemView) => void;
	}

	const { item, showLocation, onedit }: Props = $props();

	const expiryLabel = $derived.by(() => {
		if (item.daysLeft === null) return null;
		if (item.daysLeft < 0) return `Expired ${-item.daysLeft}d ago`;
		if (item.daysLeft === 0) return 'Expires today';
		return `${item.daysLeft}d left`;
	});
</script>

<tr class="hover:bg-surface-muted/60 transition-colors" data-testid="pantry-item">
	<td class="py-2 pr-2">
		<div class="flex min-w-0 items-center gap-2">
			<!-- An open box reads as the greyed-out file: kept in the list, not stocked. -->
			{#if item.disabled}
				<PackageOpenIcon class="text-fg-subtle size-4 shrink-0" />
			{:else}
				<PackageIcon class="text-fg-subtle size-4 shrink-0" />
			{/if}

			<div class="min-w-0 {item.disabled ? 'opacity-60' : ''}">
				<div class="flex flex-wrap items-center gap-2">
					<!-- Capitalized for display only; the file keeps the name as written,
					     because the CLI matches it against ingredient names verbatim. -->
					<span class="truncate font-medium capitalize">{item.name}</span>

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
					<!-- Below `sm` the columns are hidden, so their values live here instead. -->
					{#if item.displayQuantity}
						<span class="tabular-nums sm:hidden">{item.displayQuantity}</span>
					{/if}
					{#if showLocation}
						<span class="capitalize sm:hidden">{item.section}</span>
					{/if}
					{#if item.low}
						<span class="tabular-nums">low at {item.low}</span>
					{/if}
					{#if item.disabled}
						<span>not stocked</span>
					{/if}
				</div>
			</div>
		</div>
	</td>

	<td
		class="text-fg-muted hidden py-2 pr-2 align-top text-sm tabular-nums sm:table-cell {item.disabled
			? 'opacity-60'
			: ''}"
	>
		{item.displayQuantity ?? ''}
	</td>

	{#if showLocation}
		<td
			class="text-fg-muted hidden py-2 pr-2 align-top text-sm capitalize sm:table-cell {item.disabled
				? 'opacity-60'
				: ''}"
		>
			{item.section}
		</td>
	{/if}

	<td
		class="text-fg-muted hidden py-2 pr-2 align-top text-sm tabular-nums sm:table-cell {item.disabled
			? 'opacity-60'
			: ''}"
	>
		<!-- The stored ISO date, not a localized one: this is rendered on the
		     server too, and a client-locale format would not match. -->
		{item.expire ?? ''}
	</td>

	<td class="py-2">
		<div class="flex shrink-0 items-center justify-end gap-1">
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
	</td>
</tr>
