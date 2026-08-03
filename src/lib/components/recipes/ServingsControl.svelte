<script lang="ts">
	interface Props {
		baseServings: number | string | null | undefined;
		scale: number;
		onscale: (newScale: number) => void;
	}

	const { baseServings, scale, onscale }: Props = $props();

	let editing = $state(false);
	let inputValue = $state('');
	let inputRef: HTMLInputElement | null = $state(null);

	const numericBase = $derived(
		typeof baseServings === 'number'
			? baseServings
			: typeof baseServings === 'string'
				? parseFloat(baseServings) || null
				: null
	);

	const displayValue = $derived(numericBase ? Math.round(numericBase * scale) : `${scale}×`);

	function startEditing() {
		editing = true;
		inputValue = numericBase ? String(Math.round(numericBase * scale)) : String(scale);
		// Focus after DOM updates
		setTimeout(() => inputRef?.select(), 0);
	}

	function commit() {
		const parsed = parseFloat(inputValue);
		if (!isNaN(parsed) && parsed > 0) {
			const newScale = numericBase ? parsed / numericBase : parsed;
			if (newScale !== scale) {
				onscale(newScale);
			}
		}
		editing = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			commit();
		} else if (e.key === 'Escape') {
			editing = false;
		}
	}
</script>

<div class="flex items-center gap-2">
	<span class="text-surface-600-400">
		{numericBase ? 'Servings:' : 'Scale:'}
	</span>

	{#if editing}
		<input
			bind:this={inputRef}
			bind:value={inputValue}
			type="number"
			min="1"
			step="1"
			class="input w-20 px-2 py-1 text-center"
			onblur={commit}
			onkeydown={handleKeydown}
		/>
	{:else}
		<button class="btn preset-tonal-primary px-3 py-1 font-medium" onclick={startEditing}>
			{displayValue}
		</button>
	{/if}
</div>
