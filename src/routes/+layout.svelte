<script lang="ts">
	import { page } from '$app/state';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
    import NavigationBar from '$lib/components/navigation/NavigationBar.svelte';
	import { modeStore } from '$lib/stores/theme.svelte';

	let { children } = $props();

	// Initialize mode (accessing the store ensures it's initialized)
	$effect(() => {
		modeStore.current;
	});

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
	<div class="h-dvh grid grid-rows-[1fr_auto]">
		<main class="overflow-auto">
			{@render children()}
		</main>
		<nav>
			<NavigationBar />
		</nav>
	</div>
{/if}
