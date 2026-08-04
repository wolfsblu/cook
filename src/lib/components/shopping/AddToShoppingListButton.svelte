<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { CheckIcon, ShoppingCartIcon, XIcon } from '@lucide/svelte';
	import { formatScale } from '$lib/utils/scale';
	import Button from '$lib/components/ui/Button.svelte';

	/**
	 * Add, update or remove the current recipe.
	 *
	 * This previously read a client store that nothing on the recipe page ever
	 * populated, so it always rendered "Add" -- even for a recipe already in the
	 * list -- and clicking it re-added the recipe, silently resetting its scale
	 * to 1. It also hardcoded scale 1, ignoring the servings control right
	 * beside it. Membership now comes from the server load, and the live scale
	 * is submitted with the form.
	 */
	interface Props {
		slug: string;
		scale: number;
		inList: boolean;
		listedScale: number | null;
		/** Passed to the button, so callers can shape it to their layout. */
		class?: string;
		/** Drops the label below `sm`, so the action bar fits a narrow phone. */
		compact?: boolean;
	}

	const { slug, scale, inList, listedScale, class: className, compact = false }: Props = $props();

	const scaleDiffers = $derived(inList && listedScale !== null && listedScale !== scale);

	const label = $derived(
		inList && !scaleDiffers
			? 'Remove from list'
			: scaleDiffers
				? `Update to ${formatScale(scale)}×`
				: 'Add to list'
	);

	// The label is the accessible name whether or not it is on screen, so the
	// compact button is not an unlabelled icon.
	const labelClass = $derived(compact ? 'hidden sm:inline' : '');

	const submit =
		() =>
		async ({ update }: { update: () => Promise<void> }) => {
			await update();
			// The shopping count in the nav lives in the root layout.
			await invalidateAll();
		};
</script>

{#if inList && !scaleDiffers}
	<form method="POST" action="/shopping?/remove" use:enhance={submit}>
		<input type="hidden" name="slug" value={slug} />
		<Button type="submit" variant="dangerSoft" class={className} aria-label={label}>
			<XIcon class="size-4" />
			<span class={labelClass}>{label}</span>
		</Button>
	</form>
{:else}
	<form method="POST" action="/shopping?/add" use:enhance={submit}>
		<input type="hidden" name="slug" value={slug} />
		<input type="hidden" name="scale" value={scale} />
		<!-- Soft even in the update state: "Start cooking" is the page's primary
		     action, and two filled buttons side by side compete rather than
		     guide. The changed label and icon carry the signal. -->
		<Button type="submit" variant="soft" class={className} aria-label={label}>
			{#if scaleDiffers}
				<CheckIcon class="size-4" />
			{:else}
				<ShoppingCartIcon class="size-4" />
			{/if}
			<span class={labelClass}>{label}</span>
		</Button>
	</form>
{/if}
