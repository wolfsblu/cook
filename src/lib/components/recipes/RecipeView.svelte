<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import type { ImageRef, RecipeDisplay, StepDisplay, ActiveTimer } from '$lib/types/recipe';
	import { CookingPotIcon } from '@lucide/svelte';
	import { parseTimerQuantity } from '$lib/utils/timer';
	import { playAlertSound } from '$lib/utils/audio';
	import RecipeHeader from './RecipeHeader.svelte';
	import RecipeIngredients from './RecipeIngredients.svelte';
	import RecipeCookware from './RecipeCookware.svelte';
	import RecipeSteps from './RecipeSteps.svelte';
	import ServingsControl from './ServingsControl.svelte';
	import CookControlBar from './cook/CookControlBar.svelte';
	import ActiveTimersPanel from './cook/ActiveTimersPanel.svelte';
	import AddToShoppingListButton from '$lib/components/shopping/AddToShoppingListButton.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		recipe: RecipeDisplay;
		scale: number;
		slug: string;
		image?: ImageRef | null;
		stepImages?: Record<string, ImageRef | null>;
		inShoppingList?: boolean;
		listedScale?: number | null;
	}

	const {
		recipe,
		scale,
		slug,
		image = null,
		stepImages = {},
		inShoppingList = false,
		listedScale = null
	}: Props = $props();

	// URL-derived state
	const cookMode = $derived(page.url.searchParams.has('cook'));

	// Get step from URL or default to 1
	function getStepFromURL(): number {
		const stepParam = page.url.searchParams.get('step');
		return stepParam ? parseInt(stepParam, 10) || 1 : 1;
	}

	// The URL is the source of truth for the current step -- every navigation
	// control writes to it -- so this derives from the URL rather than keeping a
	// copy in $state and syncing it back with an effect.
	const currentStep = $derived(getStepFromURL());

	// Ephemeral hover state
	let hoveredIngredientIndex = $state<number | null>(null);
	let hoveredCookwareIndex = $state<number | null>(null);

	// Timer state
	let activeTimers = $state<ActiveTimer[]>([]);
	let audioEnabled = $state(true);
	let showTimersPanel = $state(false);

	// Timer tick effect
	$effect(() => {
		if (activeTimers.length === 0) return;

		const interval = setInterval(() => {
			let shouldAlert = false;
			activeTimers = activeTimers.map((timer) => {
				if (timer.status !== 'running' || timer.remainingSeconds <= 0) return timer;
				const newRemaining = timer.remainingSeconds - 1;
				if (newRemaining === 0) shouldAlert = true;
				return { ...timer, remainingSeconds: newRemaining };
			});
			if (shouldAlert && audioEnabled) playAlertSound();
		}, 1000);

		return () => clearInterval(interval);
	});

	// Flatten steps for index calculation
	const allSteps = $derived(
		recipe.sections.flatMap((section) =>
			section.content.filter((c): c is StepDisplay => c.type === 'step')
		)
	);

	const totalSteps = $derived(allSteps.length);

	// Get current step's ingredient/cookware indices
	const currentStepData = $derived(allSteps[currentStep - 1]);

	// $derived.by, not $derived(() => ...). The latter stores the function
	// itself, so every call site rebuilt the Set from scratch instead of
	// reading a memoized value.
	const currentStepIngredientIndices = $derived.by(() => {
		if (!cookMode || !currentStepData) return null;
		return new Set(
			currentStepData.items.filter((item) => item.type === 'ingredient').map((item) => item.index)
		);
	});

	const currentStepCookwareIndices = $derived.by(() => {
		if (!cookMode || !currentStepData) return null;
		return new Set(
			currentStepData.items.filter((item) => item.type === 'cookware').map((item) => item.index)
		);
	});

	// Active timer indices (for highlighting in steps)
	const activeTimerIndices = $derived(
		new Set(
			activeTimers
				.map((t) => t.id)
				.map((id) => {
					const parts = id.split('-');
					return parseInt(parts[parts.length - 1]);
				})
		)
	);

	function handleScale(newScale: number) {
		const url = new URL(page.url);
		url.searchParams.set('scale', String(newScale));
		goto(url.toString(), { replaceState: true });
	}

	function toggleCookMode() {
		const url = new URL(page.url);
		if (cookMode) {
			url.searchParams.delete('cook');
			url.searchParams.delete('step');
			// Clear timers when exiting cook mode
			activeTimers = [];
			showTimersPanel = false;
		} else {
			url.searchParams.set('cook', '');
			url.searchParams.set('step', '1');
		}
		goto(url.toString(), { replaceState: true });
	}

	function goToStep(step: number) {
		const url = new URL(page.url);
		url.searchParams.set('step', String(step));
		goto(url.toString(), { replaceState: true, noScroll: true });
	}

	function goToPreviousStep() {
		if (currentStep > 1) {
			goToStep(currentStep - 1);
		}
	}

	function goToNextStep() {
		if (currentStep < totalSteps) {
			goToStep(currentStep + 1);
		}
	}

	function finishCooking() {
		toggleCookMode();
	}

	// Timer controls
	function startTimer(index: number, name: string, quantity: string, stepNumber: number) {
		const totalSeconds = parseTimerQuantity(quantity);
		if (totalSeconds <= 0) return;

		const id = `timer-${stepNumber}-${index}`;

		// Don't add duplicate timers
		if (activeTimers.some((t) => t.id === id)) return;

		activeTimers = [
			...activeTimers,
			{
				id,
				name: name || `Timer (${quantity})`,
				totalSeconds,
				remainingSeconds: totalSeconds,
				status: 'running',
				stepNumber
			}
		];

		// Auto-show panel when first timer starts
		if (activeTimers.length === 1) {
			showTimersPanel = true;
		}
	}

	function pauseTimer(id: string) {
		activeTimers = activeTimers.map((t) => (t.id === id ? { ...t, status: 'paused' as const } : t));
	}

	function resumeTimer(id: string) {
		activeTimers = activeTimers.map((t) =>
			t.id === id ? { ...t, status: 'running' as const } : t
		);
	}

	function cancelTimer(id: string) {
		activeTimers = activeTimers.filter((t) => t.id !== id);
	}

	function toggleAudio() {
		audioEnabled = !audioEnabled;
	}

	function toggleTimersPanel() {
		showTimersPanel = !showTimersPanel;
	}

	// Keyboard navigation
	function handleKeydown(e: KeyboardEvent) {
		if (!cookMode) return;

		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			goToPreviousStep();
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			goToNextStep();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			if (showTimersPanel) {
				showTimersPanel = false;
			} else {
				toggleCookMode();
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<article class="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 {cookMode ? 'pb-28' : ''}">
	<RecipeHeader {recipe} {image} />

	<div class="flex flex-wrap items-center justify-between gap-4">
		<ServingsControl baseServings={recipe.servings} {scale} onscale={handleScale} />
		<div class="flex flex-wrap items-center gap-2">
			<AddToShoppingListButton {slug} {scale} inList={inShoppingList} {listedScale} />
			<Button variant={cookMode ? 'ghost' : 'primary'} onclick={toggleCookMode}>
				<CookingPotIcon class="size-4" />
				{cookMode ? 'Exit cook mode' : 'Start cooking'}
			</Button>
		</div>
	</div>

	<div class="grid gap-6 lg:grid-cols-[300px_1fr]">
		<aside class="space-y-4 lg:sticky lg:top-20 lg:self-start">
			<RecipeIngredients
				ingredients={recipe.ingredients}
				hoveredIndex={hoveredIngredientIndex}
				activeIndices={currentStepIngredientIndices}
				onhover={(i) => (hoveredIngredientIndex = i)}
			/>
			<RecipeCookware
				cookware={recipe.cookware}
				hoveredIndex={hoveredCookwareIndex}
				activeIndices={currentStepCookwareIndices}
				onhover={(i) => (hoveredCookwareIndex = i)}
			/>
		</aside>

		<main>
			<RecipeSteps
				sections={recipe.sections}
				{stepImages}
				{cookMode}
				{currentStep}
				{hoveredIngredientIndex}
				{hoveredCookwareIndex}
				activeIngredientIndices={currentStepIngredientIndices}
				activeCookwareIndices={currentStepCookwareIndices}
				{activeTimerIndices}
				onhoverIngredient={(i) => (hoveredIngredientIndex = i)}
				onhoverCookware={(i) => (hoveredCookwareIndex = i)}
				onstartTimer={startTimer}
			/>
		</main>
	</div>
</article>

{#if cookMode}
	<CookControlBar
		{currentStep}
		{totalSteps}
		activeTimerCount={activeTimers.length}
		onprevious={goToPreviousStep}
		onnext={goToNextStep}
		onfinish={finishCooking}
		ontoggletimers={toggleTimersPanel}
	/>
{/if}

{#if showTimersPanel}
	<ActiveTimersPanel
		timers={activeTimers}
		{audioEnabled}
		onclose={() => (showTimersPanel = false)}
		ontoggleaudio={toggleAudio}
		onpause={pauseTimer}
		onresume={resumeTimer}
		oncancel={cancelTimer}
	/>
{/if}
