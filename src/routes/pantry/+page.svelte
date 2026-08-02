<script lang="ts">
	import { RefrigeratorIcon } from '@lucide/svelte';
</script>

<svelte:head>
	<title>Pantry</title>
</svelte:head>

<div class="container mx-auto px-4 py-6">
	<div class="card preset-outlined-surface-200-800 flex flex-col items-center gap-3 p-8 text-center">
		<RefrigeratorIcon class="text-surface-600-400 size-10" />
		<p class="text-surface-600-400">Pantry tracking is not built yet.</p>
		<p class="text-sm">
			Once it lands, stocked items will be subtracted from your
			<a href="/shopping" class="anchor">shopping list</a> automatically.
		</p>
	</div>
</div>
