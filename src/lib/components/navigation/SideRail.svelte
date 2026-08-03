<script lang="ts">
	import { page } from '$app/state';
	import { ChefHatIcon } from '@lucide/svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { NAV_LINKS } from './links';

	/**
	 * Desktop navigation: an icon rail from `md`, widening to show labels at
	 * `xl`. Hidden on mobile, where the bottom tab bar takes over.
	 */
	type Props = { shoppingCount?: number };

	const { shoppingCount = 0 }: Props = $props();

	function isActive(href: string): boolean {
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}
</script>

<nav
	class="border-border bg-surface sticky top-0 hidden h-dvh w-(--spacing-rail) shrink-0 flex-col border-r py-4 md:flex xl:w-(--spacing-sidebar)"
	aria-label="Main"
>
	<a
		href="/"
		class="mb-6 flex items-center gap-3 px-5 xl:px-4"
		aria-label="cooklang-web, go to recipes"
	>
		<ChefHatIcon class="text-accent size-7 shrink-0" />
		<span class="text-fg hidden text-lg font-semibold tracking-tight xl:inline">Recipes</span>
	</a>

	<ul class="flex flex-col gap-1 px-2">
		{#each NAV_LINKS as link (link.href)}
			{@const active = isActive(link.href)}
			<li>
				<a
					href={link.href}
					aria-current={active ? 'page' : undefined}
					title={link.label}
					class="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150 xl:px-3 {active
						? 'bg-accent-soft text-accent-soft-fg'
						: 'text-fg-muted hover:bg-surface-muted hover:text-fg'}"
				>
					<link.icon class="size-5 shrink-0" />
					<span class="hidden xl:inline">{link.label}</span>

					{#if link.href === '/shopping' && shoppingCount > 0}
						<Badge tone="accent" class="ml-auto hidden xl:inline-flex">{shoppingCount}</Badge>
					{/if}
				</a>
			</li>
		{/each}
	</ul>
</nav>
