<script lang="ts">
	import { CookingPotIcon } from '@lucide/svelte';
	import AddToShoppingListButton from '$lib/components/shopping/AddToShoppingListButton.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	/**
	 * What you can do with the recipe, as one bar on the tag row.
	 *
	 * These were a loose row of buttons before, and briefly a speed-dial FAB,
	 * which hid the shopping action behind a hover the pointer kept losing.
	 * Grouping them in a bordered strip says they belong together and keeps both
	 * a single click away. Servings is not here: it is a property of the recipe
	 * rather than an action, and it reads better in the Details box beside the
	 * ingredients it rescales.
	 */
	interface Props {
		slug: string;
		scale: number;
		inShoppingList: boolean;
		listedScale: number | null;
		onstartcooking: () => void;
	}

	const { slug, scale, inShoppingList, listedScale, onstartcooking }: Props = $props();
</script>

<!--
	Padded rather than flush segments: the buttons keep their own radius, so the
	focus ring is never clipped by the strip's rounded corners. `inline-flex` so
	the bar is the width of what it holds instead of a mostly-empty rule across
	the page, and `overflow-x-auto` as the safety valve on a narrow phone.
-->
<div
	class="border-border bg-surface no-scrollbar inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border p-1"
>
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
