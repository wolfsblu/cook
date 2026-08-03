<script lang="ts">
	import { MinusIcon, PlusIcon, Trash2Icon } from '@lucide/svelte';
	import type { RecipeSelection } from '$lib/types/shopping-list';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';

	interface Props {
		recipes: RecipeSelection[];
		onupdatescale: (slug: string, scale: number) => Promise<void> | void;
		onremove: (slug: string) => Promise<void> | void;
		onclear?: () => Promise<void> | void;
	}

	let { recipes, onupdatescale, onremove, onclear }: Props = $props();

	let confirmingClear = $state(false);
</script>

<Card variant="outline" class="space-y-4 p-4">
	<div class="flex items-center justify-between gap-2">
		<h2 class="text-fg text-lg font-semibold">Recipes ({recipes.length})</h2>
		{#if onclear && recipes.length > 0}
			<Button variant="dangerSoft" size="sm" onclick={() => (confirmingClear = true)}>
				<Trash2Icon class="size-4" />
				Clear all
			</Button>
		{/if}
	</div>

	<ul class="divide-border divide-y">
		{#each recipes as recipe (recipe.slug)}
			<li class="flex items-center justify-between gap-2 py-2 first:pt-0">
				<div class="min-w-0 flex-1">
					<a href="/recipe/{recipe.slug}" class="link block truncate text-sm">
						{recipe.title}
					</a>
					{#if recipe.servings}
						<span class="text-fg-muted text-xs">{recipe.servings} servings</span>
					{/if}
				</div>

				<div class="flex shrink-0 items-center gap-2">
					<div class="border-border flex items-center gap-1 rounded-md border px-1 py-0.5">
						<IconButton
							size="sm"
							label="Halve {recipe.title}"
							onclick={() => onupdatescale(recipe.slug, recipe.scale - 0.5)}
							disabled={recipe.scale <= 0.5}
						>
							<MinusIcon class="size-3.5" />
						</IconButton>
						<span class="min-w-10 text-center text-sm tabular-nums">{recipe.scale}×</span>
						<IconButton
							size="sm"
							label="Increase {recipe.title}"
							onclick={() => onupdatescale(recipe.slug, recipe.scale + 0.5)}
						>
							<PlusIcon class="size-3.5" />
						</IconButton>
					</div>

					<IconButton
						variant="dangerSoft"
						label="Remove {recipe.title}"
						onclick={() => onremove(recipe.slug)}
					>
						<Trash2Icon class="size-4" />
					</IconButton>
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
	onconfirm={() => onclear?.()}
/>
