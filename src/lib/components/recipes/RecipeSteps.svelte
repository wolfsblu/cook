<script lang="ts">
	import type { SectionDisplay, StepDisplay } from '$lib/types/recipe';
	import InlineIngredient from './inline/InlineIngredient.svelte';
	import InlineCookware from './inline/InlineCookware.svelte';
	import InlineTimer from './inline/InlineTimer.svelte';

	interface Props {
		sections: SectionDisplay[];
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

<div class="card preset-outlined-surface-200-800 p-4">
	<h2 class="h4 mb-4">Instructions</h2>

	{#each sections as section, sectionIndex}
		{#if section.name}
			<h3 class="h5 mt-6 mb-3">{section.name}</h3>
		{:else if sections.length > 1}
			<h3 class="h5 mt-6 mb-3">Section {sectionIndex + 1}</h3>
		{/if}

		<div class="space-y-4">
			{#each section.content as content}
				{#if content.type === 'text'}
					<p class="text-surface-600-400 italic">{content.value}</p>
				{:else}
					{@const status = getStepStatus(content.number)}
					<div
						data-step={content.number}
						class="flex gap-4 rounded-lg p-3 transition-all {status === 'completed'
							? 'opacity-50'
							: status === 'current' && cookMode
								? 'preset-tonal-primary ring-primary-500 ring-2'
								: status === 'upcoming'
									? 'opacity-70'
									: ''}"
					>
						<span class="min-w-1rem text-lg font-bold">
							{#if status === 'completed' && cookMode}
								<span class="text-success-500">✓</span>
							{:else}
								{content.number}.
							{/if}
						</span>
						<div class="flex-1">
							<p>
								{#each content.items as item}
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
											onstart={createTimerStartHandler(content.number)}
										/>
									{:else if item.type === 'inlineQuantity'}
										<span class="text-tertiary-600-400 italic">({item.quantity})</span>
									{/if}
								{/each}
							</p>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{/each}

	{#if cookMode && currentStep > totalSteps}
		<div class="preset-tonal-success mt-6 rounded-lg p-4 text-center">
			<p class="text-lg font-bold">Recipe Complete!</p>
		</div>
	{/if}
</div>
