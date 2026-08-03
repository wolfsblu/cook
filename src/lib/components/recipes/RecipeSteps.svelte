<script lang="ts">
	import { CheckIcon } from '@lucide/svelte';
	import type { ImageRef, SectionDisplay, StepDisplay } from '$lib/types/recipe';
	import Card from '$lib/components/ui/Card.svelte';
	import InlineIngredient from './inline/InlineIngredient.svelte';
	import InlineCookware from './inline/InlineCookware.svelte';
	import InlineTimer from './inline/InlineTimer.svelte';

	interface Props {
		sections: SectionDisplay[];
		/**
		 * Illustrations keyed by step number, from cooklang's "Recipe.2.jpg"
		 * convention. Sparse: a recipe may illustrate only some of its steps.
		 */
		stepImages?: Record<string, ImageRef | null>;
		cookMode: boolean;
		currentStep: number;
		hoveredIngredientIndex: number | null;
		hoveredCookwareIndex: number | null;
		activeIngredientIndices: Set<number> | null;
		activeCookwareIndices: Set<number> | null;
		activeTimerIndices: Set<number>;
		onhoverIngredient: (index: number | null) => void;
		onhoverCookware: (index: number | null) => void;
		onstartTimer: (index: number, name: string, quantity: string, stepNumber: number) => void;
	}

	const {
		sections,
		stepImages = {},
		cookMode,
		currentStep,
		hoveredIngredientIndex,
		hoveredCookwareIndex,
		activeIngredientIndices,
		activeCookwareIndices,
		activeTimerIndices,
		onhoverIngredient,
		onhoverCookware,
		onstartTimer
	}: Props = $props();

	// Flatten all steps for sequential navigation
	const allSteps = $derived(
		sections.flatMap((section, sectionIndex) =>
			section.content
				.filter((c): c is StepDisplay => c.type === 'step')
				.map((step) => ({ step, sectionIndex, sectionName: section.name }))
		)
	);

	const totalSteps = $derived(allSteps.length);

	/**
	 * Absolute position of each step within the whole recipe.
	 *
	 * Cooklang restarts `number` at 1 in every section, so a recipe split into
	 * "First / Second / Third" has three steps all numbered 1. Cook mode counts
	 * globally, and the `Recipe.N.jpg` image convention is a running count over
	 * the whole recipe, so both need the ordinal rather than the section-local
	 * number. Using the section-local one showed step 1's photograph under
	 * every section and highlighted the wrong step while cooking.
	 */
	const stepOrdinals = $derived(
		new Map<StepDisplay, number>(allSteps.map(({ step }, index) => [step, index + 1]))
	);

	function getStepStatus(stepNumber: number): 'completed' | 'current' | 'upcoming' {
		if (!cookMode) return 'current';
		if (stepNumber < currentStep) return 'completed';
		if (stepNumber === currentStep) return 'current';
		return 'upcoming';
	}

	function createTimerStartHandler(stepNumber: number) {
		return (index: number, name: string, quantity: string) => {
			onstartTimer(index, name, quantity, stepNumber);
		};
	}

	// Scroll current step into view when it changes
	$effect(() => {
		if (cookMode && currentStep) {
			// Use requestAnimationFrame to ensure DOM is updated
			requestAnimationFrame(() => {
				const stepElement = document.querySelector(`[data-step="${currentStep}"]`);
				if (stepElement) {
					stepElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
				}
			});
		}
	});
</script>

<Card variant="outline" class="p-4">
	<h2 class="text-fg mb-4 text-lg font-semibold">Instructions</h2>

	{#each sections as section, sectionIndex (sectionIndex)}
		{#if section.name}
			<h3 class="text-fg mt-6 mb-3 text-base font-semibold">{section.name}</h3>
		{:else if sections.length > 1}
			<h3 class="text-fg mt-6 mb-3 text-base font-semibold">Section {sectionIndex + 1}</h3>
		{/if}

		<div class="space-y-3">
			{#each section.content as content, contentIndex (contentIndex)}
				{#if content.type === 'text'}
					<p class="text-fg-muted italic">{content.value}</p>
				{:else}
					{@const ordinal = stepOrdinals.get(content) ?? content.number}
					{@const status = getStepStatus(ordinal)}
					<div
						data-step={ordinal}
						class="flex gap-4 rounded-lg p-3 transition-all duration-150 {status === 'completed'
							? 'opacity-50'
							: status === 'current' && cookMode
								? 'bg-accent2-soft ring-accent2 ring-2'
								: status === 'upcoming'
									? 'opacity-70'
									: ''}"
					>
						<span class="min-w-6 text-lg font-semibold tabular-nums">
							{#if status === 'completed' && cookMode}
								<CheckIcon class="text-ok size-5" aria-label="Completed" />
							{:else}
								{ordinal}.
							{/if}
						</span>
						<div class="min-w-0 flex-1">
							<p>
								{#each content.items as item, itemIndex (itemIndex)}
									{#if item.type === 'text'}
										{item.value}
									{:else if item.type === 'ingredient'}
										<InlineIngredient
											name={item.name}
											quantity={item.quantity}
											index={item.index}
											highlighted={hoveredIngredientIndex === item.index}
											active={activeIngredientIndices?.has(item.index) ?? false}
											onhover={onhoverIngredient}
										/>
									{:else if item.type === 'cookware'}
										<InlineCookware
											name={item.name}
											quantity={item.quantity}
											index={item.index}
											highlighted={hoveredCookwareIndex === item.index}
											active={activeCookwareIndices?.has(item.index) ?? false}
											onhover={onhoverCookware}
										/>
									{:else if item.type === 'timer'}
										<InlineTimer
											name={item.name}
											quantity={item.quantity}
											index={item.index}
											{cookMode}
											active={activeTimerIndices.has(item.index)}
											onstart={createTimerStartHandler(ordinal)}
										/>
									{:else if item.type === 'inlineQuantity'}
										<span class="text-fg-subtle italic">({item.quantity})</span>
									{/if}
								{/each}
							</p>

							{#if stepImages[ordinal]}
								{@const stepImage = stepImages[ordinal]}
								{#if stepImage}
									<img
										src={stepImage.src}
										srcset={stepImage.srcset}
										width={stepImage.width}
										height={stepImage.height}
										loading="lazy"
										decoding="async"
										alt="Step {ordinal}"
										class="mt-3 max-w-full rounded-lg"
									/>
								{/if}
							{/if}
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{/each}

	{#if cookMode && currentStep > totalSteps}
		<div class="bg-ok-soft text-ok-soft-fg mt-6 rounded-lg p-4 text-center">
			<p class="text-lg font-semibold">Recipe complete</p>
		</div>
	{/if}
</Card>
