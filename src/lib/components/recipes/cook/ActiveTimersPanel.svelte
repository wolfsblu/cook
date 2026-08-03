<script lang="ts">
	import { TimerIcon, Volume2Icon, VolumeXIcon, XIcon } from '@lucide/svelte';
	import { fly } from 'svelte/transition';
	import type { ActiveTimer } from '$lib/types/recipe';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import TimerCard from './TimerCard.svelte';

	/**
	 * Deliberately not a modal dialog: cooking continues while this is open, so
	 * it must not trap focus or block the steps behind it.
	 */
	interface Props {
		timers: ActiveTimer[];
		audioEnabled: boolean;
		onclose: () => void;
		ontoggleaudio: () => void;
		onpause: (id: string) => void;
		onresume: (id: string) => void;
		oncancel: (id: string) => void;
	}

	const { timers, audioEnabled, onclose, ontoggleaudio, onpause, onresume, oncancel }: Props =
		$props();
</script>

<aside
	class="bg-surface border-border shadow-pop fixed inset-y-0 right-0 z-40 flex w-80 max-w-full flex-col border-l"
	aria-label="Active timers"
	transition:fly={{ x: 320, duration: 200 }}
>
	<header class="border-border flex items-center justify-between gap-2 border-b px-4 py-3">
		<h2 class="text-fg text-base font-semibold">Active Timers</h2>
		<div class="flex items-center gap-1">
			<IconButton
				size="sm"
				label={audioEnabled ? 'Mute alerts' : 'Unmute alerts'}
				onclick={ontoggleaudio}
			>
				{#if audioEnabled}
					<Volume2Icon class="size-4" />
				{:else}
					<VolumeXIcon class="size-4" />
				{/if}
			</IconButton>
			<IconButton size="sm" label="Close timers" onclick={onclose}>
				<XIcon class="size-4" />
			</IconButton>
		</div>
	</header>

	<div class="flex-1 space-y-3 overflow-y-auto p-4">
		{#if timers.length === 0}
			<EmptyState
				icon={TimerIcon}
				title="No active timers"
				description="Tap a timer in a recipe step to start one."
			/>
		{:else}
			{#each timers as timer (timer.id)}
				<TimerCard {timer} {onpause} {onresume} {oncancel} />
			{/each}
		{/if}
	</div>
</aside>
