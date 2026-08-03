<script lang="ts">
	import { CookingPotIcon } from '@lucide/svelte';
	import AddToShoppingListButton from '$lib/components/shopping/AddToShoppingListButton.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ServingsControl from './ServingsControl.svelte';

	/**
	 * Everything you can do to the recipe, in one bar under the header.
	 *
	 * The controls were a loose row of buttons before, and briefly a speed-dial
	 * FAB, which hid the shopping action behind a hover the pointer kept losing.
	 * Grouping them in a bordered strip says they belong together and keeps every
	 * one of them a single click away.
	 */
	interface Props {
		slug: string;
		scale: number;
		baseServings: number | null;
		inShoppingList: boolean;
		listedScale: number | null;
		onscale: (newScale: number) => void;
		onstartcooking: () => void;
	}

	const { slug, scale, baseServings, inShoppingList, listedScale, onscale, onstartcooking }: Props =
		$props();
</script>

<!--
	Padded rather than flush segments: the buttons keep their own radius, so the
	focus ring is never clipped by the strip's rounded corners. `inline-flex` so
	the bar is the width of what it holds instead of a mostly-empty rule across
	the page, and `overflow-x-auto` as the safety valve on a narrow phone.
-->
<div
	class="border-border bg-surface inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border p-1"
>
	<ServingsControl {baseServings} {scale} {onscale} />

	<!-- Separates what the recipe *is* from what you can do with it. -->
	<span class="bg-border mx-1 h-6 w-px shrink-0" aria-hidden="true"></span>

	<AddToShoppingListButton
		{slug}
		{scale}
		inList={inShoppingList}
		{listedScale}
		compact
		class="h-9 shrink-0"
	/>

	<Button class="h-9 shrink-0" onclick={onstartcooking}>
		<CookingPotIcon class="size-4" />
		Start cooking
	</Button>
</div>
