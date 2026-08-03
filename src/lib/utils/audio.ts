let audioContext: AudioContext | null = null;

/**
 * Play a simple alert sound using Web Audio API
 * Creates a two-tone beep pattern
 */
export function playAlertSound(): void {
	try {
		if (!audioContext) {
			audioContext = new AudioContext();
		}

		// Resume if suspended (browser autoplay policy)
		if (audioContext.state === 'suspended') {
			audioContext.resume();
		}

		const now = audioContext.currentTime;

		// First beep
		playTone(audioContext, 880, now, 0.15);
		// Second beep (slightly lower)
		playTone(audioContext, 660, now + 0.2, 0.15);
		// Third beep (back to high)
		playTone(audioContext, 880, now + 0.4, 0.2);
	} catch (e) {
		console.warn('Could not play alert sound:', e);
	}
}

function playTone(ctx: AudioContext, frequency: number, startTime: number, duration: number): void {
	const oscillator = ctx.createOscillator();
	const gainNode = ctx.createGain();

	oscillator.connect(gainNode);
	gainNode.connect(ctx.destination);

	oscillator.frequency.value = frequency;
	oscillator.type = 'sine';

	gainNode.gain.setValueAtTime(0.3, startTime);
	gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

	oscillator.start(startTime);
	oscillator.stop(startTime + duration);
}
