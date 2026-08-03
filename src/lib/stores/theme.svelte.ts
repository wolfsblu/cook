import { browser } from '$app/environment';

type Mode = 'light' | 'dark';

function createModeStore() {
	let mode = $state<Mode>('light');

	// Initialize mode from localStorage
	if (browser) {
		const stored = localStorage.getItem('mode') as Mode | null;
		if (stored) {
			mode = stored;
			applyMode(stored);
		} else {
			applyMode('light');
		}
	}

	function applyMode(newMode: Mode) {
		if (!browser) return;

		// Skeleton UI uses both data-mode attribute and color-scheme property
		document.documentElement.setAttribute('data-mode', newMode);
		document.documentElement.style.colorScheme = newMode;
	}

	return {
		get current() {
			return mode;
		},
		toggle() {
			mode = mode === 'light' ? 'dark' : 'light';
			if (browser) {
				localStorage.setItem('mode', mode);
				applyMode(mode);
			}
		},
		set(newMode: Mode) {
			mode = newMode;
			if (browser) {
				localStorage.setItem('mode', mode);
				applyMode(mode);
			}
		}
	};
}

export const modeStore = createModeStore();
