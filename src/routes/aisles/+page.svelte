<script lang="ts">
	import type { PageProps } from './$types';
	import AisleCategoryDialog from '$lib/components/aisles/AisleCategoryDialog.svelte';
	import AisleOrderCard from '$lib/components/aisles/AisleOrderCard.svelte';

	const { data }: PageProps = $props();

	let renameOpen = $state(false);
	let renaming = $state('');

	function openRename(name: string) {
		renaming = name;
		renameOpen = true;
	}
</script>

<AisleOrderCard categories={data.categories} counts={data.counts} onrename={openRename} />

<AisleCategoryDialog bind:open={renameOpen} original={renaming} />
