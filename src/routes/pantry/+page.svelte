<script lang="ts">
	import { RefrigeratorIcon } from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Page from '$lib/components/ui/Page.svelte';
</script>

<svelte:head>
	<title>Pantry</title>
</svelte:head>

<Page title="Pantry">
	<EmptyState
		icon={RefrigeratorIcon}
		title="Pantry tracking is not built yet"
		description="Once it lands, anything you have in stock will be subtracted from your shopping list automatically."
	>
		{#snippet actions()}
			<Button href="/shopping" variant="outline">Go to shopping list</Button>
		{/snippet}
	</EmptyState>
</Page>
