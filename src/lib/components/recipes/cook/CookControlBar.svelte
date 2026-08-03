<script lang="ts">
	import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, TimerIcon, XIcon } from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';

	interface Props {
		currentStep: number;
		totalSteps: number;
		activeTimerCount: number;
		onprevious: () => void;
		onnext: () => void;
		onfinish: () => void;
		ontoggletimers: () => void;
	}

	const {
		currentStep,
		totalSteps,
		activeTimerCount,
		onprevious,
		onnext,
		onfinish,
		ontoggletimers
	}: Props = $props();

	const isFirstStep = $derived(currentStep === 1);
	const isLastStep = $derived(currentStep === totalSteps);
	const progressPercent = $derived(totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0);
</script>

<div
	class="bg-surface border-border shadow-pop fixed right-0 bottom-0 left-0 z-30 border-t"
	style="padding-bottom: env(safe-area-inset-bottom)"
>
	<div
		class="bg-surface-sunk h-1"
		role="progressbar"
		aria-label="Cooking progress"
		aria-valuenow={currentStep}
		aria-valuemin={1}
		aria-valuemax={totalSteps}
	>
		<div
			class="bg-accent h-full transition-all duration-300"
			style="width: {progressPercent}%"
		></div>
	</div>

	<div class="flex items-center justify-between gap-4 px-4 py-3">
		<Button variant="ghost" onclick={onprevious} disabled={isFirstStep}>
			<ChevronLeftIcon class="size-5" />
			<span class="hidden sm:inline">Previous</span>
		</Button>

		<div class="flex items-center gap-3">
			<IconButton label="Exit cook mode" onclick={onfinish}>
				<XIcon class="size-5" />
			</IconButton>

			<span class="text-sm font-medium tabular-nums">
				Step {currentStep} of {totalSteps}
			</span>

			<span class="relative">
				<IconButton
					label={activeTimerCount > 0
						? `Show ${activeTimerCount} active timer${activeTimerCount === 1 ? '' : 's'}`
						: 'Show timers'}
					variant={activeTimerCount > 0 ? 'primary' : 'ghost'}
					onclick={ontoggletimers}
				>
					<TimerIcon class="size-5" />
				</IconButton>
				{#if activeTimerCount > 0}
					<span
						class="bg-warn text-warn-fg pointer-events-none absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-[0.625rem] font-semibold"
						aria-hidden="true"
					>
						{activeTimerCount}
					</span>
				{/if}
			</span>
		</div>

		{#if isLastStep}
			<Button onclick={onfinish}>
				<CheckIcon class="size-5" />
				<span class="hidden sm:inline">Finish</span>
			</Button>
		{:else}
			<Button onclick={onnext}>
				<span class="hidden sm:inline">Next</span>
				<ChevronRightIcon class="size-5" />
			</Button>
		{/if}
	</div>
</div>
