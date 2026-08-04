<script lang="ts">
	import { enhance } from '$app/forms';
	import { MinusIcon, PlusIcon, Trash2Icon } from '@lucide/svelte';
	import type { ResolvedSelection } from '$lib/server/shopping/store';
	import { formatScale } from '$lib/utils/scale';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';

	interface Props {
		selections: ResolvedSelection[];
	}

	const { selections }: Props = $props();

	let confirmingClear = $state(false);
	let clearForm = $state<HTMLFormElement | null>(null);
</script>

<Card variant="outline" class="space-y-3 p-4">
	<div class="flex items-center justify-between gap-2">
		<h2 class="text-fg text-lg font-semibold">Recipes ({selections.length})</h2>

		{#if selections.length > 0}
			<form method="POST" action="?/clear" use:enhance bind:this={clearForm}>
				<Button
					type="button"
					variant="dangerSoft"
					size="sm"
					onclick={() => (confirmingClear = true)}
				>
					<Trash2Icon class="size-4" />
					Clear all
				</Button>
			</form>
		{/if}
	</div>

	<ul class="divide-border divide-y">
		{#each selections as selection (selection.slug)}
			<li class="space-y-1.5 py-2 first:pt-0">
				<!-- A line of its own, so the title is not truncated to whatever the
				     stepper and the remove button leave over. -->
				<a href="/recipe/{selection.slug}" class="link block text-sm font-medium">
					{selection.title}
				</a>

				<div class="flex items-center gap-2">
					{#if selection.servings}
						<span class="text-fg-muted text-xs">
							{Math.round(selection.servings * selection.scale)} servings
						</span>
					{/if}

					<!-- `ml-auto` rather than `justify-between`: the controls stay right
					     regardless of whether the recipe declares any servings. -->
					<div class="ml-auto flex shrink-0 items-center gap-2">
						<div class="border-border flex items-center gap-1 rounded-md border px-1 py-0.5">
							<form method="POST" action="?/setScale" use:enhance>
								<input type="hidden" name="slug" value={selection.slug} />
								<input type="hidden" name="scale" value={selection.scale - 0.5} />
								<IconButton
									type="submit"
									size="sm"
									label="Decrease {selection.title}"
									disabled={selection.scale <= 0.5}
								>
									<MinusIcon class="size-3.5" />
								</IconButton>
							</form>

							<span class="min-w-10 text-center text-sm tabular-nums">
								{formatScale(selection.scale)}×
							</span>

							<form method="POST" action="?/setScale" use:enhance>
								<input type="hidden" name="slug" value={selection.slug} />
								<input type="hidden" name="scale" value={selection.scale + 0.5} />
								<IconButton type="submit" size="sm" label="Increase {selection.title}">
									<PlusIcon class="size-3.5" />
								</IconButton>
							</form>
						</div>

						<form method="POST" action="?/remove" use:enhance>
							<input type="hidden" name="slug" value={selection.slug} />
							<IconButton type="submit" variant="dangerSoft" label="Remove {selection.title}">
								<Trash2Icon class="size-4" />
							</IconButton>
						</form>
					</div>
				</div>
			</li>
		{/each}
	</ul>
</Card>

<ConfirmDialog
	bind:open={confirmingClear}
	title="Clear shopping list?"
	description="Every recipe will be removed from the list. This cannot be undone."
	confirmLabel="Clear all"
	destructive
	onconfirm={() => clearForm?.requestSubmit()}
/>
