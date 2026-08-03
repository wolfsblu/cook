<script lang="ts">
	import { page } from '$app/state';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import NavigationBar from '$lib/components/navigation/NavigationBar.svelte';

	let { children } = $props();

	// Check if we're in cook mode
	const isCookMode = $derived(page.url.searchParams.has('cook'));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if isCookMode}
	<div class="h-dvh">
		<main class="h-full overflow-auto">
			{@render children()}
		</main>
	</div>
{:else}
	<div class="grid h-dvh grid-rows-[1fr_auto]">
		<main class="overflow-auto">
			{@render children()}
		</main>
		<nav>
			<NavigationBar />
		</nav>
	</div>
{/if}
