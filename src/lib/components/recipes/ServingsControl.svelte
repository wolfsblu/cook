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

<!-- Fixed heights throughout: this is one segment of the action bar, and a
     control half a step shorter than the buttons beside it reads as a mistake. -->
<div class="flex shrink-0 items-center gap-2 pr-1 pl-2">
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
			class="field h-9 w-20 py-0 text-center tabular-nums"
			onblur={commit}
			onkeydown={handleKeydown}
		/>
	{:else}
		<button
			type="button"
			class="bg-accent-soft text-accent-soft-fg hover:bg-accent-soft/70 inline-flex h-9 items-center rounded-md px-3 text-sm font-medium tabular-nums transition-colors duration-150"
			onclick={startEditing}
		>
			{displayValue}
		</button>
	{/if}
</div>
