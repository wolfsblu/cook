<script lang="ts">
	import { page } from '$app/state';
	import { CircleHelpIcon, FolderIcon, InfoIcon, SlidersHorizontalIcon } from '@lucide/svelte';
	import type { LayoutProps } from './$types';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Page from '$lib/components/ui/Page.svelte';

	const { data, children }: LayoutProps = $props();

	// Route-backed tabs: plain links, so back/forward and no-JS both work, and the
	// active one is decided by the pathname rather than a query param -- browsing
	// a single aisle (?category=) keeps "Ingredients" selected. Managing the
	// aisles comes first because everything else here is grouped by them.
	const tabs = [
		{ href: '/aisles', label: 'Manage aisles', icon: SlidersHorizontalIcon },
		{ href: '/aisles/ingredients', label: 'Ingredients', icon: FolderIcon },
		{ href: '/aisles/unassigned', label: 'Unassigned', icon: CircleHelpIcon }
	];

	const current = $derived(page.url.pathname);

	const base =
		'-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors sm:px-4';
	const active = 'border-accent text-fg';
	const idle = 'border-transparent text-fg-muted hover:text-fg hover:border-border';
</script>

<Page title="Aisles">
	<Card variant="flat" class="mb-4 flex items-start gap-3 p-4">
		<InfoIcon class="text-fg-subtle mt-0.5 size-5 shrink-0" />
		<p class="text-fg-muted text-sm">
			Your <a href="/shopping" class="link">shopping list</a> is grouped by these aisles, in this order.
			Ingredients are matched by exact name, so list every spelling you use — “onions” only lands here
			if it is written here.
		</p>
	</Card>

	<nav aria-label="Aisle tabs" class="border-border mb-6 flex gap-1 overflow-x-auto border-b">
		{#each tabs as tab (tab.href)}
			{@const isActive = current === tab.href}
			<a
				href={tab.href}
				aria-current={isActive ? 'page' : undefined}
				class="{base} {isActive ? active : idle}"
			>
				<tab.icon class="size-4 shrink-0" />
				{tab.label}
				{#if tab.href === '/aisles/unassigned' && data.unassignedCount > 0}
					<Badge tone="warn">{data.unassignedCount}</Badge>
				{/if}
			</a>
		{/each}
	</nav>

	{@render children()}
</Page>
