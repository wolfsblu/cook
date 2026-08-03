<script lang="ts">
	import { Play, Pause, X } from '@lucide/svelte';
	import type { ActiveTimer } from '$lib/types/recipe';
	import { formatTimeRemaining } from '$lib/utils/timer';
	import TimerCircleProgress from './TimerCircleProgress.svelte';

	interface Props {
		timer: ActiveTimer;
		onpause: (id: string) => void;
		onresume: (id: string) => void;
		oncancel: (id: string) => void;
	}

	const { timer, onpause, onresume, oncancel }: Props = $props();

	const progress = $derived(
		timer.totalSeconds > 0 ? (timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds : 0
	);
	const isComplete = $derived(timer.remainingSeconds <= 0);
	const isPaused = $derived(timer.status === 'paused');
</script>

<div
	class="card preset-outlined-surface-200-800 p-3 {isComplete
		? 'preset-tonal-warning animate-pulse'
		: ''}"
>
	<div class="flex items-center gap-3">
		<TimerCircleProgress {progress} complete={isComplete} />

		<div class="min-w-0 flex-1">
			<p class="truncate font-medium">{timer.name}</p>
			<p class="font-mono text-2xl {isComplete ? 'text-warning-600-400' : ''}">
				{formatTimeRemaining(timer.remainingSeconds)}
			</p>
			<p class="text-surface-500-500 text-xs">Step {timer.stepNumber}</p>
		</div>

		<div class="flex flex-col gap-1">
			{#if !isComplete}
				{#if isPaused}
					<button
						type="button"
						class="btn btn-sm preset-tonal-surface"
						onclick={() => onresume(timer.id)}
						aria-label="Resume timer"
					>
						<Play class="size-4" />
					</button>
				{:else}
					<button
						type="button"
						class="btn btn-sm preset-tonal-surface"
						onclick={() => onpause(timer.id)}
						aria-label="Pause timer"
					>
						<Pause class="size-4" />
					</button>
				{/if}
			{/if}
			<button
				type="button"
				class="btn btn-sm preset-tonal-error"
				onclick={() => oncancel(timer.id)}
				aria-label="Cancel timer"
			>
				<X class="size-4" />
			</button>
		</div>
	</div>
</div>
