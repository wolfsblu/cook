<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Slider } from '@skeletonlabs/skeleton-svelte';
	import { getAvailableTags, getAvailableCourses } from '$lib/utils/recipe-filters';
	import { parseFilterParams, buildFilterUrl } from '$lib/utils/url-params';
	import Sidebar from '$lib/components/ui/Sidebar.svelte';
	import TagCombobox from '$lib/components/recipes/TagCombobox.svelte';

	type Props = {
		isOpen: boolean;
		allRecipes: any[];
	};

	let { isOpen = $bindable(), allRecipes }: Props = $props();

	// Get available filter options
	const availableTags = $derived(getAvailableTags(allRecipes));
	const availableCourses = $derived(getAvailableCourses(allRecipes));

	// Initialize filter state from URL
	const urlFilters = $derived(parseFilterParams(page.url.searchParams));
	let selectedTags = $state<string[]>([...urlFilters.tags]);
	let selectedCourse = $state<string | null>(urlFilters.course);

	// Constants for slider ranges
	const TIME_MAX = 180; // 3 hours
	const SERVINGS_MAX = 12;

	// Time range as array [min, max] for dual-thumb slider
	let timeRange = $state<number[]>([
		urlFilters.timeRange.min,
		urlFilters.timeRange.max === Infinity ? TIME_MAX : urlFilters.timeRange.max
	]);

	// Servings range as array [min, max] for dual-thumb slider
	let servingsRange = $state<number[]>([
		urlFilters.servingsRange.min,
		urlFilters.servingsRange.max === Infinity ? SERVINGS_MAX : urlFilters.servingsRange.max
	]);

	// Reset filters when drawer opens (sync with URL)
	$effect(() => {
		if (isOpen) {
			const current = parseFilterParams(page.url.searchParams);
			selectedTags = [...current.tags];
			selectedCourse = current.course;
			timeRange = [
				current.timeRange.min,
				current.timeRange.max === Infinity ? TIME_MAX : current.timeRange.max
			];
			servingsRange = [
				current.servingsRange.min,
				current.servingsRange.max === Infinity ? SERVINGS_MAX : current.servingsRange.max
			];
		}
	});

	function applyFilters() {
		const searchQuery = page.url.searchParams.get('q') || '';
		const sortField = page.url.searchParams.get('sort') || 'name';
		const sortOrder = (page.url.searchParams.get('order') || 'asc') as 'asc' | 'desc';

		const filters = {
			tags: selectedTags,
			course: selectedCourse,
			timeRange: {
				min: timeRange[0],
				max: timeRange[1] >= TIME_MAX ? Infinity : timeRange[1]
			},
			servingsRange: {
				min: servingsRange[0],
				max: servingsRange[1] >= SERVINGS_MAX ? Infinity : servingsRange[1]
			}
		};

		const url = buildFilterUrl(searchQuery, filters, sortField, sortOrder);
		goto(url);
		isOpen = false;
	}

	function clearFilters() {
		selectedTags = [];
		selectedCourse = null;
		timeRange = [0, TIME_MAX];
		servingsRange = [0, SERVINGS_MAX];
	}

	function close() {
		isOpen = false;
	}
</script>

<!-- Grid-based drawer layout - fills parent container -->
<div class="grid h-full grid-cols-[auto_1fr]">
	<Sidebar title="Filter Recipes" position="left" onclose={close}>
		{#snippet children()}
			<div class="space-y-6">
				<!-- Tags Filter -->
				{#if availableTags.length > 0}
					<div>
						<h3 class="mb-2 font-medium">Tags</h3>
						<TagCombobox bind:selectedTags {availableTags} />
					</div>
				{/if}

				<!-- Course Filter -->
				{#if availableCourses.length > 0}
					<div>
						<h3 class="mb-2 font-medium">Course</h3>
						<select bind:value={selectedCourse} class="input w-full">
							<option value={null}>Any course</option>
							{#each availableCourses as course}
								<option value={course}>{course}</option>
							{/each}
						</select>
					</div>
				{/if}

				<!-- Time Range Filter -->
				<div>
					<div class="mb-3 flex items-center justify-between">
						<h3 class="font-medium">Cooking Time</h3>
						<span class="text-surface-600-400 text-sm">
							{timeRange[0]}–{timeRange[1] >= TIME_MAX ? '180+' : timeRange[1]} min
						</span>
					</div>
					<Slider
						value={timeRange}
						onValueChange={(v) => (timeRange = v.value)}
						min={0}
						max={TIME_MAX}
						step={5}
					>
						<Slider.Control>
							<Slider.Track>
								<Slider.Range />
							</Slider.Track>
							<Slider.Thumb index={0}>
								<Slider.HiddenInput />
							</Slider.Thumb>
							<Slider.Thumb index={1}>
								<Slider.HiddenInput />
							</Slider.Thumb>
						</Slider.Control>
					</Slider>
				</div>

				<!-- Servings Range Filter -->
				<div>
					<div class="mb-3 flex items-center justify-between">
						<h3 class="font-medium">Servings</h3>
						<span class="text-surface-600-400 text-sm">
							{servingsRange[0]}–{servingsRange[1] >= SERVINGS_MAX ? '12+' : servingsRange[1]}
						</span>
					</div>
					<Slider
						value={servingsRange}
						onValueChange={(v) => (servingsRange = v.value)}
						min={0}
						max={SERVINGS_MAX}
						step={1}
					>
						<Slider.Control>
							<Slider.Track>
								<Slider.Range />
							</Slider.Track>
							<Slider.Thumb index={0}>
								<Slider.HiddenInput />
							</Slider.Thumb>
							<Slider.Thumb index={1}>
								<Slider.HiddenInput />
							</Slider.Thumb>
						</Slider.Control>
					</Slider>
				</div>
			</div>
		{/snippet}

		{#snippet footer()}
			<div class="flex gap-2">
				<button type="button" onclick={clearFilters} class="btn preset-tonal-surface flex-1">
					Clear
				</button>
				<button type="button" onclick={applyFilters} class="btn preset-filled-primary-500 flex-1">
					Apply Filters
				</button>
			</div>
		{/snippet}
	</Sidebar>

	<!-- Backdrop -->
	<button type="button" class="bg-black/50" onclick={close} aria-label="Close filter drawer"
	></button>
</div>
