<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { ChefHatIcon, MoonIcon, SearchIcon, SunIcon, XIcon } from '@lucide/svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import { themeStore } from '$lib/stores/theme.svelte';

	/**
	 * Sticky header with the brand, global recipe search and the theme toggle.
	 * The app previously had no header at all.
	 *
	 * Search is a real GET form so it works without JavaScript; the debounced
	 * navigation below is an enhancement on top of that, not a replacement.
	 */
	let query = $state(page.url.searchParams.get('q') ?? '');
	let input = $state<HTMLInputElement | null>(null);
	let timer: ReturnType<typeof setTimeout> | null = null;

	// Follow external navigation (back button, clearing filters) without
	// clobbering what is being typed.
	$effect(() => {
		const fromUrl = page.url.searchParams.get('q') ?? '';
		if (document.activeElement !== input) query = fromUrl;
	});

	function navigate(value: string) {
		const params = new URLSearchParams(page.url.searchParams);
		if (value) params.set('q', value);
		else params.delete('q');

		const search = params.toString();
		goto(search ? `/?${search}` : '/', {
			keepFocus: true,
			noScroll: true,
			replaceState: true
		});
	}

	function onInput() {
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => navigate(query), 250);
	}

	function clear() {
		query = '';
		navigate('');
		input?.focus();
	}

	function onKeydown(event: KeyboardEvent) {
		// "/" focuses search, the way it does almost everywhere else.
		if (event.key === '/' && document.activeElement !== input) {
			const target = event.target as HTMLElement | null;
			if (target?.matches('input, textarea, [contenteditable]')) return;
			event.preventDefault();
			input?.focus();
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

<header
	class="border-border bg-canvas/85 supports-[backdrop-filter]:bg-canvas/75 sticky top-0 z-30 border-b backdrop-blur-md"
>
	<div class="flex items-center gap-3 px-4 py-3 sm:px-6">
		<a href="/" class="flex items-center gap-2 md:hidden" aria-label="cooklang-web, go to recipes">
			<ChefHatIcon class="text-accent size-6" />
		</a>

		<form method="GET" action="/" class="relative min-w-0 flex-1 sm:max-w-md">
			<SearchIcon
				class="text-fg-subtle pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
			/>
			<input
				bind:this={input}
				bind:value={query}
				oninput={onInput}
				type="search"
				name="q"
				placeholder="Search recipes"
				aria-label="Search recipes"
				class="field pr-9 pl-9"
			/>
			{#if query}
				<button
					type="button"
					onclick={clear}
					class="text-fg-subtle hover:text-fg absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 transition-colors duration-150"
					aria-label="Clear search"
				>
					<XIcon class="size-4" />
				</button>
			{/if}
		</form>

		<div class="ml-auto">
			<IconButton
				label={themeStore.isDark ? 'Switch to light theme' : 'Switch to dark theme'}
				onclick={() => themeStore.toggle()}
			>
				{#if themeStore.isDark}
					<SunIcon class="size-4" />
				{:else}
					<MoonIcon class="size-4" />
				{/if}
			</IconButton>
		</div>
	</div>
</header>
