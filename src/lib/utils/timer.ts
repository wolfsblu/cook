/**
 * Parse timer quantity string to seconds
 * Supports: "5 minutes", "30 seconds", "1 hour", "1h 30m", bare numbers (assumed minutes)
 */
export function parseTimerQuantity(quantity: string | null): number {
	if (!quantity) return 0;

	const patterns = [
		{ regex: /(\d+)\s*h(?:our)?s?/i, multiplier: 3600 },
		{ regex: /(\d+)\s*m(?:in(?:ute)?s?)?/i, multiplier: 60 },
		{ regex: /(\d+)\s*s(?:ec(?:ond)?s?)?/i, multiplier: 1 }
	];

	let totalSeconds = 0;
	for (const { regex, multiplier } of patterns) {
		const match = quantity.match(regex);
		if (match) totalSeconds += parseInt(match[1]) * multiplier;
	}

	// Fallback: bare number assumed to be minutes
	if (totalSeconds === 0) {
		const num = parseFloat(quantity);
		if (!isNaN(num)) totalSeconds = num * 60;
	}

	return Math.round(totalSeconds);
}

/**
 * Format seconds as human-readable time string
 * Returns "H:MM:SS" for hours, "M:SS" for minutes
 */
export function formatTimeRemaining(seconds: number): string {
	if (seconds < 0) seconds = 0;

	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = seconds % 60;

	if (h > 0) {
		return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	}
	return `${m}:${String(s).padStart(2, '0')}`;
}
