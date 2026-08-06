<script lang="ts">
	import { enhance } from '$app/forms';
	import { GripVerticalIcon, PencilIcon, PlusIcon, Trash2Icon } from '@lucide/svelte';
	import { flip } from 'svelte/animate';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';

	interface Props {
		categories: string[];
		counts: Record<string, number>;
		onrename: (category: string) => void;
	}

	const { categories, counts, onrename }: Props = $props();

	// The displayed order. `working` holds an optimistic copy while a drag or key
	// move is in flight and until its save round-trips; the rest of the time the
	// list simply follows the server via `categories`. Reading the prop only
	// inside this $derived keeps the state prop-driven with no manual resync.
	let working = $state<string[] | null>(null);
	const order = $derived(working ?? categories);

	let listEl: HTMLOListElement;
	let reorderForm: HTMLFormElement;
	let orderInput: HTMLInputElement;

	type Drag = { name: string; grabOffsetY: number; pointerY: number; left: number; width: number };
	let drag = $state<Drag | null>(null);

	function same(a: string[], b: string[]): boolean {
		return a.length === b.length && a.every((value, index) => value === b[index]);
	}

	/** Save the new order. A category is one line, so it cannot hold a newline. */
	function save(next: string[]) {
		orderInput.value = next.join('\n');
		reorderForm.requestSubmit();
	}

	function startDrag(event: PointerEvent, name: string) {
		// Primary button / touch / pen only; ignore right- and middle-clicks.
		if (event.button !== 0) return;
		const li = (event.currentTarget as HTMLElement).closest('li');
		if (!li) return;

		event.preventDefault();
		const rect = li.getBoundingClientRect();
		working = [...order];
		drag = {
			name,
			grabOffsetY: event.clientY - rect.top,
			pointerY: event.clientY,
			left: rect.left,
			width: rect.width
		};

		window.addEventListener('pointermove', onMove, { passive: false });
		window.addEventListener('pointerup', endDrag);
		window.addEventListener('pointercancel', endDrag);
	}

	function onMove(event: PointerEvent) {
		if (!drag) return;
		event.preventDefault();
		drag = { ...drag, pointerY: event.clientY };

		// Insert before the first other row whose middle sits below the pointer.
		const rows = [...listEl.querySelectorAll<HTMLElement>('li[data-name]')].filter(
			(row) => row.dataset.name !== drag!.name
		);
		let insertAt = 0;
		for (const row of rows) {
			const rect = row.getBoundingClientRect();
			if (event.clientY > rect.top + rect.height / 2) insertAt++;
			else break;
		}

		const next = order.filter((name) => name !== drag!.name);
		next.splice(insertAt, 0, drag.name);
		if (!same(next, order)) working = next;
	}

	function endDrag() {
		if (!drag) return;
		window.removeEventListener('pointermove', onMove);
		window.removeEventListener('pointerup', endDrag);
		window.removeEventListener('pointercancel', endDrag);
		drag = null;

		// Nothing moved: drop the optimistic copy and follow the server again.
		if (working && !same(working, categories)) save(working);
		else working = null;
	}

	/** Keyboard reordering from the focused handle, so this works without a pointer. */
	function nudge(name: string, delta: number) {
		const from = order.indexOf(name);
		const to = from + delta;
		if (from === -1 || to < 0 || to >= order.length) return;
		const next = [...order];
		[next[from], next[to]] = [next[to], next[from]];
		working = next;
		save(next);
	}

	function onKey(event: KeyboardEvent, name: string) {
		if (event.key === 'ArrowUp') {
			event.preventDefault();
			nudge(name, -1);
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			nudge(name, 1);
		}
	}

	function href(name: string): string {
		return `/aisles/ingredients?category=${encodeURIComponent(name)}`;
	}

	/** Spelled out: a bare number here read as an unexplained code. */
	function ingredients(name: string): string {
		const count = counts[name] ?? 0;
		return `${count} ${count === 1 ? 'ingredient' : 'ingredients'}`;
	}
</script>

<!--
	The Manage tab's core control: this list is the order the shopping list groups
	by, which is the reason to edit the file at all. Reordering is drag-and-drop
	on one pointer path (mouse, touch and pen alike) with keyboard arrows on the
	focused handle as an accessible, no-pointer fallback.
-->
<Card variant="outline" class="p-4">
	<h2 class="text-fg font-semibold">Aisles</h2>
	<p class="text-fg-muted mt-1 mb-3 text-sm">
		Your <a href="/shopping" class="link">shopping list</a> groups under these headings, in this order.
		Drag a handle to arrange them the way you walk the shop.
	</p>

	<form method="POST" action="?/addCategory" use:enhance class="mb-3 flex items-stretch gap-2">
		<input
			name="name"
			class="field"
			placeholder="Add an aisle, e.g. frozen"
			aria-label="New aisle name"
			required
		/>
		<Button type="submit" variant="outline" class="h-auto shrink-0">
			<PlusIcon class="size-4" />
			Add
		</Button>
	</form>

	{#if order.length === 0}
		<p class="text-fg-subtle py-3 text-sm">No aisles yet — add your first one above.</p>
	{/if}

	<ol bind:this={listEl} class="divide-border divide-y">
		{#each order as name (name)}
			<li
				data-name={name}
				animate:flip={{ duration: 180 }}
				class="flex items-center gap-1 py-1.5 {drag?.name === name ? 'opacity-0' : ''}"
			>
				<button
					type="button"
					onpointerdown={(event) => startDrag(event, name)}
					onkeydown={(event) => onKey(event, name)}
					class="text-fg-subtle hover:text-fg hover:bg-surface-muted focus-visible:ring-accent -ml-1 flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none active:cursor-grabbing"
					aria-label="Reorder {name}. Drag, or use the arrow keys."
				>
					<GripVerticalIcon class="size-4" />
				</button>

				<a
					href={href(name)}
					class="text-fg ml-1 min-w-0 flex-1 truncate font-medium capitalize hover:underline"
				>
					{name}
				</a>

				<span class="text-fg-muted shrink-0 text-xs tabular-nums">{ingredients(name)}</span>

				<IconButton size="sm" label="Rename {name}" onclick={() => onrename(name)}>
					<PencilIcon class="size-4" />
				</IconButton>

				<!-- The reason Remove is disabled goes on the form: a disabled button
				     never gets the hover that would show its own tooltip. -->
				<form
					method="POST"
					action="?/removeCategory"
					use:enhance
					title={(counts[name] ?? 0) > 0
						? 'Move or remove its ingredients before deleting this aisle'
						: undefined}
				>
					<input type="hidden" name="name" value={name} />
					<IconButton
						type="submit"
						size="sm"
						variant="dangerSoft"
						label="Remove {name}"
						disabled={(counts[name] ?? 0) > 0}
					>
						<Trash2Icon class="size-4" />
					</IconButton>
				</form>
			</li>
		{/each}
	</ol>

	<!-- The whole new order is saved in one field on drop or key move. Once the
	     save round-trips, drop the optimistic copy so the list follows the
	     server's order (which now matches) again. -->
	<form
		bind:this={reorderForm}
		method="POST"
		action="?/reorderCategories"
		use:enhance={() =>
			async ({ update }) => {
				await update();
				working = null;
			}}
		class="hidden"
	>
		<input bind:this={orderInput} type="hidden" name="order" />
	</form>
</Card>

{#if drag}
	<!-- A preview that follows the finger while the list reflows underneath. -->
	<div
		class="pointer-events-none fixed z-50"
		style="left: {drag.left}px; top: {drag.pointerY - drag.grabOffsetY}px; width: {drag.width}px;"
	>
		<div
			class="bg-surface border-border shadow-pop flex items-center gap-1 rounded-md border px-1 py-1.5"
		>
			<span class="text-fg-subtle flex size-8 shrink-0 items-center justify-center">
				<GripVerticalIcon class="size-4" />
			</span>
			<span class="text-fg ml-1 min-w-0 flex-1 truncate font-medium capitalize">{drag.name}</span>
			<span class="text-fg-muted mr-2 shrink-0 text-xs tabular-nums">{ingredients(drag.name)}</span>
		</div>
	</div>
{/if}
