<script lang="ts">
	import { Volume2, VolumeX } from '@lucide/svelte';
	import type { ActiveTimer } from '$lib/types/recipe';
	import TimerCard from './TimerCard.svelte';
	import Sidebar from '$lib/components/ui/Sidebar.svelte';

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

<div class="fixed top-0 right-0 bottom-0 z-40">
	<Sidebar title="Active Timers" position="right" {onclose}>
		{#snippet headerActions()}
			<button
				type="button"
				class="btn btn-sm preset-tonal-surface"
				onclick={ontoggleaudio}
				aria-label={audioEnabled ? 'Mute alerts' : 'Unmute alerts'}
			>
				{#if audioEnabled}
					<Volume2 class="size-4" />
				{:else}
					<VolumeX class="size-4" />
				{/if}
			</button>
		{/snippet}

		{#snippet children()}
			{#if timers.length === 0}
				<p class="text-surface-500-500 py-8 text-center">
					No active timers.<br />
					<span class="text-sm">Click a timer in a recipe step to start one.</span>
				</p>
			{:else}
				{#each timers as timer (timer.id)}
					<TimerCard {timer} {onpause} {onresume} {oncancel} />
				{/each}
			{/if}
		{/snippet}
	</Sidebar>
</div>
