<script lang="ts">
	/**
	 * Scale the recipe by editing the number of servings.
	 *
	 * `baseServings` must be what the file declares, *not* `recipe.servings` from
	 * the scaled parse: cooklang applies the scale to the servings metadata as
	 * well as to the quantities, so feeding the scaled figure back in squares the
	 * scale on every edit and the number appears to jump at random.
	 *
	 * Edits apply as they are typed. The recipe is rescaled by the parser on the
	 * server -- cooklang has fixed quantities that deliberately do not scale, so
	 * multiplying the rendered amounts in the browser would quietly get those
	 * wrong -- and a short debounce keeps that to one request per pause rather
	 * than one per keystroke.
	 */
	interface Props {
		baseServings: number | null;
		scale: number;
		onscale: (newScale: number) => void;
	}

	const { baseServings, scale, onscale }: Props = $props();

	const DEBOUNCE_MS = 250;

	const uid = $props.id();

	/**
	 * What the field shows while it is being typed in. Null the rest of the time,
	 * so the field follows the scale that actually came back from the server --
	 * including a scale the server clamped, or one set from elsewhere.
	 */
	let draft = $state<string | null>(null);
	let timer: ReturnType<typeof setTimeout> | undefined;

	const servings = $derived(baseServings ? Math.round(baseServings * scale) : null);
	const value = $derived(draft ?? String(servings ?? scale));

	$effect(() => () => clearTimeout(timer));

	function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
		draft = event.currentTarget.value;

		const parsed = parseFloat(draft);
		if (!Number.isFinite(parsed) || parsed <= 0) return;

		// Without a declared servings count there is nothing to divide by, so the
		// field edits the scale factor itself.
		const next = baseServings ? parsed / baseServings : parsed;

		clearTimeout(timer);
		timer = setTimeout(() => {
			if (next !== scale) onscale(next);
		}, DEBOUNCE_MS);
	}
</script>

<!-- Fixed height: this is one segment of the action bar, and a control half a
     step shorter than the buttons beside it reads as a mistake. -->
<div class="flex shrink-0 items-center gap-2 pr-1 pl-2">
	<label for={uid} class="text-fg-muted text-sm">
		{baseServings ? 'Servings' : 'Scale'}
	</label>

	<input
		id={uid}
		{value}
		type="number"
		min={baseServings ? 1 : 0.1}
		step={baseServings ? 1 : 0.1}
		inputmode="decimal"
		class="field h-9 w-20 py-0 text-center tabular-nums"
		oninput={handleInput}
		onblur={() => (draft = null)}
	/>
</div>
