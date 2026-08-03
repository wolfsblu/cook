<script lang="ts">
	import { CookingPotIcon } from '@lucide/svelte';
	import AddToShoppingListButton from '$lib/components/shopping/AddToShoppingListButton.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	/**
	 * The recipe's actions, as a speed dial pinned to the bottom right.
	 *
	 * These used to be a row of their own between the header and the content
	 * grid, which cost every reader a band of vertical space for two buttons
	 * wanted only occasionally. "Start cooking" is the one that shows; the
	 * shopping action rises out of it on hover.
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
	The offset clears the mobile tab bar, which is `sticky bottom-0` and so sits
	in the layout flow -- a fixed element gets no room from it automatically. The
	bar is `md:hidden`, hence the plain offset from `md` up.
-->
<div
	class="group fixed right-4 bottom-(--fab-bottom) z-30 md:right-6 md:bottom-6"
	style="--fab-bottom: calc(4.5rem + env(safe-area-inset-bottom))"
>
	<!--
		Absolute rather than a flex row above the button, so the container's box is
		just the visible FAB: a laid-out but transparent button would sit over the
		corner of the page swallowing clicks. Hover still counts here, since the
		pointer being over a descendant matches `:hover` on the ancestor wherever
		that descendant happens to be painted.

		`can-hover` guards the whole collapse. A touch browser has no hover to
		expand with, so there both buttons simply stand stacked.
	-->
	<div
		class="can-hover:pointer-events-none can-hover:translate-y-2 can-hover:opacity-0 can-hover:group-focus-within:pointer-events-auto can-hover:group-focus-within:translate-y-0 can-hover:group-focus-within:opacity-100 can-hover:group-hover:pointer-events-auto can-hover:group-hover:translate-y-0 can-hover:group-hover:opacity-100 absolute right-0 bottom-full mb-3 transition duration-150"
	>
		<AddToShoppingListButton
			{slug}
			{scale}
			inList={inShoppingList}
			{listedScale}
			class="shadow-pop h-12 rounded-full px-5 whitespace-nowrap"
		/>
	</div>

	<Button class="shadow-pop h-14 rounded-full px-6 text-base" onclick={onstartcooking}>
		<CookingPotIcon class="size-5" />
		Start cooking
	</Button>
</div>
