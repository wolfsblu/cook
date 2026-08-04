<script lang="ts">
	import { enhance } from '$app/forms';
	import { TriangleAlertIcon } from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';

	interface Props {
		duplicates: { term: string; categories: string[] }[];
	}

	const { duplicates }: Props = $props();
</script>

<!--
	The CLI reads this file leniently: it keeps whichever entry came first, warns
	on stderr and carries on. Without this card the only symptom is an ingredient
	stuck in an aisle you did not put it in, with nothing on the page to explain
	why.
-->
<Card
	variant="outline"
	class="border-warn bg-warn-soft text-warn-soft-fg flex items-start gap-3 p-4"
>
	<TriangleAlertIcon class="mt-0.5 size-5 shrink-0" />

	<div class="min-w-0 flex-1">
		<p class="font-semibold">
			{duplicates.length === 1 ? 'An ingredient is' : `${duplicates.length} ingredients are`} in more
			than one aisle
		</p>
		<p class="mt-1 text-sm">
			Only the first aisle listed in the file is used. Pick the one to keep and the others are
			dropped.
		</p>

		<ul class="mt-3 space-y-2">
			{#each duplicates as duplicate (duplicate.term)}
				<li class="flex flex-wrap items-center gap-2">
					<span class="font-medium capitalize">{duplicate.term}</span>
					{#each duplicate.categories as category (category)}
						<form method="POST" action="?/resolveDuplicate" use:enhance>
							<input type="hidden" name="term" value={duplicate.term} />
							<input type="hidden" name="keepCategory" value={category} />
							<Button type="submit" size="sm" variant="outline" class="capitalize">
								Keep in {category}
							</Button>
						</form>
					{/each}
				</li>
			{/each}
		</ul>
	</div>
</Card>
