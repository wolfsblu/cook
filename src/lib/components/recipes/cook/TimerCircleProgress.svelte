<script lang="ts">
	interface Props {
		progress: number; // 0-1, where 1 is complete
		size?: number;
		strokeWidth?: number;
		complete?: boolean;
	}

	const { progress, size = 48, strokeWidth = 4, complete = false }: Props = $props();

	const radius = $derived((size - strokeWidth) / 2);
	const circumference = $derived(2 * Math.PI * radius);
	const offset = $derived(circumference * (1 - progress));
</script>

<svg width={size} height={size} viewBox="0 0 {size} {size}" class="-rotate-90 transform">
	<!-- Background circle -->
	<circle
		cx={size / 2}
		cy={size / 2}
		r={radius}
		fill="none"
		stroke="currentColor"
		stroke-width={strokeWidth}
		class="text-surface-200-800"
	/>
	<!-- Progress circle -->
	<circle
		cx={size / 2}
		cy={size / 2}
		r={radius}
		fill="none"
		stroke="currentColor"
		stroke-width={strokeWidth}
		stroke-dasharray={circumference}
		stroke-dashoffset={offset}
		stroke-linecap="round"
		class="transition-all duration-300 {complete ? 'text-warning-500' : 'text-primary-500'}"
	/>
</svg>
