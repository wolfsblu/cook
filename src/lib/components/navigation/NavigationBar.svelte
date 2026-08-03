<script lang="ts">
	import { page } from '$app/state';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { NAV_LINKS } from './links';

	/**
	 * Bottom tab bar. Shown only below the `md` breakpoint now -- it used to be
	 * the navigation at every width, including on wide desktop screens.
	 */
	type Props = { shoppingCount?: number };

	const { shoppingCount = 0 }: Props = $props();

	function isActive(href: string): boolean {
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}
</script>

<!--
	Sticky, not just the last row of the layout grid: without this the tab bar
	sits at the end of the content and scrolls out of reach on any page taller
	than the viewport, which is every page on a phone.
-->
<nav
	class="border-border bg-surface/90 sticky bottom-0 z-30 border-t backdrop-blur-md md:hidden"
	style="padding-bottom: env(safe-area-inset-bottom)"
	aria-label="Main"
>
	<ul class="flex">
		{#each NAV_LINKS as link (link.href)}
			{@const active = isActive(link.href)}
			<li class="flex-1">
				<a
					href={link.href}
					aria-current={active ? 'page' : undefined}
					class="relative flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors duration-150 {active
						? 'text-accent'
						: 'text-fg-muted hover:text-fg'}"
				>
					<span class="relative">
						<link.icon class="size-5" />
						{#if link.href === '/shopping' && shoppingCount > 0}
							<Badge
								tone="accent"
								class="absolute -top-1.5 -right-2.5 min-w-4 justify-center px-1 py-0 text-[0.625rem]"
							>
								{shoppingCount}
							</Badge>
						{/if}
					</span>
					{link.label}
				</a>
			</li>
		{/each}
	</ul>
</nav>
