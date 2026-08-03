<script lang="ts">
	import { UsersIcon } from '@lucide/svelte';

	/**
	 * The scale control, rendered as one row of the Details list.
	 *
	 * It used to sit in an action row of its own above the content grid. It lives
	 * in `RecipeMeta`'s `<dl>` now, so it emits a `<dt>`/`<dd>` pair matching the
	 * rows around it rather than a standalone flex box.
	 */
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

<div class="flex items-center justify-between gap-3 py-1.5 first:pt-0">
	<dt class="text-fg-muted flex items-center gap-2">
		<UsersIcon class="size-4 shrink-0" />
		{numericBase ? 'Servings' : 'Scale'}
	</dt>
	<dd>
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
			<!-- A soft pill rather than plain text like the sibling rows: this is the
			     one value in the box you can change, and it has to look it. -->
			<button
				type="button"
				class="bg-accent-soft text-accent-soft-fg hover:bg-accent-soft/70 rounded-md px-3 py-1 font-medium tabular-nums transition-colors duration-150"
				onclick={startEditing}
			>
				{displayValue}
			</button>
		{/if}
	</dd>
</div>
