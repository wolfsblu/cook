<script lang="ts">
	import type { PageProps } from './$types';
	import AisleUnassignedList from '$lib/components/aisles/AisleUnassignedList.svelte';

	const { data }: PageProps = $props();
</script>

<AisleUnassignedList items={data.unassigned} categories={data.categories} />
