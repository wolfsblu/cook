<script lang="ts">
	import { PauseIcon, PlayIcon, XIcon } from '@lucide/svelte';
	import type { ActiveTimer } from '$lib/types/recipe';
	import { formatTimeRemaining } from '$lib/utils/timer';
	import Card from '$lib/components/ui/Card.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';
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

<Card
	variant="outline"
	class="p-3 {isComplete ? 'bg-warn-soft text-warn-soft-fg border-warn animate-pulse' : ''}"
>
	<div class="flex items-center gap-3">
		<TimerCircleProgress {progress} complete={isComplete} />

		<div class="min-w-0 flex-1">
			<p class="truncate font-medium">{timer.name}</p>
			<p class="text-2xl tabular-nums" aria-live={isComplete ? 'assertive' : 'off'}>
				{formatTimeRemaining(timer.remainingSeconds)}
			</p>
			<p class="text-fg-subtle text-xs">Step {timer.stepNumber}</p>
		</div>

		<div class="flex flex-col gap-1">
			{#if !isComplete}
				{#if isPaused}
					<IconButton size="sm" label="Resume {timer.name}" onclick={() => onresume(timer.id)}>
						<PlayIcon class="size-4" />
					</IconButton>
				{:else}
					<IconButton size="sm" label="Pause {timer.name}" onclick={() => onpause(timer.id)}>
						<PauseIcon class="size-4" />
					</IconButton>
				{/if}
			{/if}
			<IconButton
				size="sm"
				variant="dangerSoft"
				label="Cancel {timer.name}"
				onclick={() => oncancel(timer.id)}
			>
				<XIcon class="size-4" />
			</IconButton>
		</div>
	</div>
</Card>
