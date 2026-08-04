<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		/** The ingredient name as the CLI emitted it. */
		itemName: string;
		categories: string[];
		/** Where the action should send the browser back to. */
		returnTo: string;
	}

	const { itemName, categories, returnTo }: Props = $props();
</script>

<!--
	Posts to the aisles route rather than to a local action, so the file-writing
	and its validation live in one place. The action redirects back to `returnTo`,
	which re-runs this page's load: the shopping list's cache key includes the
	aisle file's stamp, so the item comes back under its new heading. Without
	JavaScript this is a plain POST and a 303; with it, enhance follows the
	redirect via goto.
-->
<form method="POST" action="/aisles?/assign" use:enhance class="flex shrink-0 items-center gap-1.5">
	<input type="hidden" name="name" value={itemName} />
	<input type="hidden" name="returnTo" value={returnTo} />

	<!-- A native select: this is a real POST form and the Bits UI select does not
	     contribute a form value. -->
	<select
		name="category"
		class="field h-8 w-auto py-0 text-xs capitalize"
		aria-label="Aisle for {itemName}"
	>
		{#each categories as category (category)}
			<option value={category}>{category}</option>
		{/each}
	</select>

	<Button type="submit" size="sm" variant="ghost" class="h-8 px-2 text-xs">Assign</Button>
</form>
