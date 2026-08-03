<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { CheckIcon, ShoppingCartIcon, XIcon } from '@lucide/svelte';
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
		/** Passed to the button, so callers can shape it -- the FAB wants a pill. */
		class?: string;
	}

	const { slug, scale, inList, listedScale, class: className }: Props = $props();

	const scaleDiffers = $derived(inList && listedScale !== null && listedScale !== scale);

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
		<Button type="submit" variant="dangerSoft" class={className}>
			<XIcon class="size-4" />
			Remove from list
		</Button>
	</form>
{:else}
	<form method="POST" action="/shopping?/add" use:enhance={submit}>
		<input type="hidden" name="slug" value={slug} />
		<input type="hidden" name="scale" value={scale} />
		<!-- Soft even in the update state: "Start cooking" is the page's primary
		     action, and two filled buttons side by side compete rather than
		     guide. The changed label and icon carry the signal. -->
		<Button type="submit" variant="soft" class={className}>
			{#if scaleDiffers}
				<CheckIcon class="size-4" />
				Update to {scale}×
			{:else}
				<ShoppingCartIcon class="size-4" />
				Add to list
			{/if}
		</Button>
	</form>
{/if}
