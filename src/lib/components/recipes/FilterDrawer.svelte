<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/ui/Button.svelte';
	import Drawer from '$lib/components/ui/Drawer.svelte';
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte';
	import RangeSlider from '$lib/components/ui/RangeSlider.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { buildFilterUrl, parseFilterParams } from '$lib/utils/url-params';

	type Props = {
		isOpen: boolean;
		/** Facets come from the whole library, not the filtered view. */
		allTags: string[];
		allCourses: string[];
	};

	let { isOpen = $bindable(), allTags, allCourses }: Props = $props();

	/** Slider ceilings; at the top of the range the filter means "no upper bound". */
	const TIME_MAX = 180;
	const SERVINGS_MAX = 12;

	let selectedTags = $state<string[]>([]);
	let selectedCourse = $state('');
	let timeRange = $state<number[]>([0, TIME_MAX]);
	let servingsRange = $state<number[]>([0, SERVINGS_MAX]);

	const courseOptions = $derived([
		{ value: '', label: 'Any course' },
		...allCourses.map((course) => ({ value: course, label: course }))
	]);

	// Sync from the URL whenever the drawer opens, so it always reflects the
	// filters currently applied rather than whatever was last typed into it.
	$effect(() => {
		if (!isOpen) return;

		const current = parseFilterParams(page.url.searchParams);
		selectedTags = [...current.tags];
		selectedCourse = current.course ?? '';
		timeRange = [
			current.timeRange.min,
			current.timeRange.max === Infinity ? TIME_MAX : current.timeRange.max
		];
		servingsRange = [
			current.servingsRange.min,
			current.servingsRange.max === Infinity ? SERVINGS_MAX : current.servingsRange.max
		];
	});

	function apply() {
		const url = buildFilterUrl(
			page.url.searchParams.get('q') || '',
			{
				tags: selectedTags,
				course: selectedCourse || null,
				timeRange: {
					min: timeRange[0],
					max: timeRange[1] >= TIME_MAX ? Infinity : timeRange[1]
				},
				servingsRange: {
					min: servingsRange[0],
					max: servingsRange[1] >= SERVINGS_MAX ? Infinity : servingsRange[1]
				}
			},
			page.url.searchParams.get('sort') || 'name',
			(page.url.searchParams.get('order') || 'asc') as 'asc' | 'desc'
		);

		goto(url);
		isOpen = false;
	}

	function clear() {
		selectedTags = [];
		selectedCourse = '';
		timeRange = [0, TIME_MAX];
		servingsRange = [0, SERVINGS_MAX];
	}
</script>

<Drawer bind:open={isOpen} title="Filter recipes">
	<div class="space-y-6">
		{#if allTags.length > 0}
			<div>
				<h3 class="text-fg mb-2 text-sm font-medium">Tags</h3>
				<MultiSelect bind:selected={selectedTags} options={allTags} label="Tags" />
			</div>
		{/if}

		{#if allCourses.length > 0}
			<div>
				<h3 class="text-fg mb-2 text-sm font-medium">Course</h3>
				<Select bind:value={selectedCourse} options={courseOptions} label="Course" />
			</div>
		{/if}

		<div>
			<div class="mb-2 flex items-center justify-between">
				<h3 class="text-fg text-sm font-medium">Cooking time</h3>
				<span class="text-fg-muted text-sm tabular-nums">
					{timeRange[0]}–{timeRange[1] >= TIME_MAX ? '180+' : timeRange[1]} min
				</span>
			</div>
			<RangeSlider bind:value={timeRange} min={0} max={TIME_MAX} step={5} label="Cooking time" />
		</div>

		<div>
			<div class="mb-2 flex items-center justify-between">
				<h3 class="text-fg text-sm font-medium">Servings</h3>
				<span class="text-fg-muted text-sm tabular-nums">
					{servingsRange[0]}–{servingsRange[1] >= SERVINGS_MAX ? '12+' : servingsRange[1]}
				</span>
			</div>
			<RangeSlider
				bind:value={servingsRange}
				min={0}
				max={SERVINGS_MAX}
				step={1}
				label="Servings"
			/>
		</div>
	</div>

	{#snippet footer()}
		<div class="flex gap-2">
			<Button variant="ghost" block onclick={clear}>Clear</Button>
			<Button block onclick={apply}>Apply</Button>
		</div>
	{/snippet}
</Drawer>
