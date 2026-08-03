<script lang="ts">
	interface Props {
		baseServings: number | string | null | undefined;
		scale: number;
		onscale: (newScale: number) => void;
	}

	const { baseServings, scale, onscale }: Props = $props();

	let editing = $state(false);
	let inputValue = $state('');
	let inputRef = $state<HTMLInputElement | null>(null);

	const numericBase = $derived(
		typeof baseServings === 'number'
			? baseServings
			: typeof baseServings === 'string'
				? parseFloat(baseServings) || null
				: null
	);

	const displayValue = $derived(numericBase ? Math.round(numericBase * scale) : `${scale}×`);

	// Select the field once it exists, rather than guessing at the timing with
	// setTimeout(…, 0) as this previously did.
	$effect(() => {
		if (editing) inputRef?.select();
	});

	function startEditing() {
		editing = true;
		inputValue = numericBase ? String(Math.round(numericBase * scale)) : String(scale);
	}

	function commit() {
		const parsed = parseFloat(inputValue);
		if (!isNaN(parsed) && parsed > 0) {
			const newScale = numericBase ? parsed / numericBase : parsed;
			if (newScale !== scale) onscale(newScale);
		}
		editing = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') commit();
		else if (event.key === 'Escape') editing = false;
	}
</script>

<div class="flex items-center gap-2">
	<span class="text-fg-muted text-sm">
		{numericBase ? 'Servings' : 'Scale'}
	</span>

	{#if editing}
		<input
			bind:this={inputRef}
			bind:value={inputValue}
			type="number"
			min="1"
			step="1"
			aria-label={numericBase ? 'Servings' : 'Scale'}
			class="field w-20 py-1 text-center tabular-nums"
			onblur={commit}
			onkeydown={handleKeydown}
		/>
	{:else}
		<button
			type="button"
			class="bg-accent-soft text-accent-soft-fg hover:bg-accent-soft/70 rounded-md px-3 py-1 font-medium tabular-nums transition-colors duration-150"
			onclick={startEditing}
		>
			{displayValue}
		</button>
	{/if}
</div>
