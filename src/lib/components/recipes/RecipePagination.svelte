<script lang="ts">
	import { page } from '$app/state';
	import { ChevronLeftIcon, ChevronRightIcon } from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { pageHref, pageWindow } from '$lib/utils/pagination';

	/**
	 * Page links for the recipe list.
	 *
	 * Plain links rather than goto(): back/forward then works, the header's
	 * preload-on-hover fetches the next page before it is clicked, and the
	 * control still works without JavaScript.
	 *
	 * The numbers are a sliding window with no first/last anchors, so the row
	 * keeps a constant width instead of growing and shrinking around ellipses.
	 */
	type Props = {
		pageNumber: number;
		totalPages: number;
	};

	const { pageNumber, totalPages }: Props = $props();

	const pages = $derived(pageWindow(pageNumber, totalPages));
	const href = $derived((n: number) => pageHref(page.url.searchParams, n));
</script>

{#if totalPages > 1}
	<nav aria-label="Pagination" class="flex items-center gap-1">
		<Button
			size="sm"
			variant="ghost"
			class="px-2"
			href={pageNumber > 1 ? href(pageNumber - 1) : undefined}
			disabled={pageNumber === 1}
			aria-label="Previous page"
		>
			<ChevronLeftIcon class="size-4" />
		</Button>

		<span class="text-fg-muted px-1 text-sm tabular-nums sm:hidden">
			{pageNumber} / {totalPages}
		</span>

		<span class="hidden items-center gap-1 sm:flex">
			{#each pages as n (n)}
				<Button
					size="sm"
					variant={n === pageNumber ? 'primary' : 'ghost'}
					class="min-w-8 px-2 tabular-nums"
					href={href(n)}
					aria-label="Page {n}"
					aria-current={n === pageNumber ? 'page' : undefined}
				>
					{n}
				</Button>
			{/each}
		</span>

		<Button
			size="sm"
			variant="ghost"
			class="px-2"
			href={pageNumber < totalPages ? href(pageNumber + 1) : undefined}
			disabled={pageNumber === totalPages}
			aria-label="Next page"
		>
			<ChevronRightIcon class="size-4" />
		</Button>
	</nav>
{/if}
