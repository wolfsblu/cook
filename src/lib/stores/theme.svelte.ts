import { browser } from '$app/environment';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

function systemTheme(): ResolvedTheme {
	if (!browser) return 'light';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStored(): ThemePreference {
	if (!browser) return 'system';
	const stored = localStorage.getItem(STORAGE_KEY);
	return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

function apply(theme: ResolvedTheme) {
	if (!browser) return;
	document.documentElement.dataset.theme = theme;
}

function createThemeStore() {
	let preference = $state<ThemePreference>(readStored());
	let system = $state<ResolvedTheme>(systemTheme());

	if (browser) {
		// Follow the OS while the preference is "system".
		const query = window.matchMedia('(prefers-color-scheme: dark)');
		query.addEventListener('change', (event) => {
			system = event.matches ? 'dark' : 'light';
			if (preference === 'system') apply(system);
		});
	}

	const resolved = $derived<ResolvedTheme>(preference === 'system' ? system : preference);

	return {
		get preference() {
			return preference;
		},
		get resolved() {
			return resolved;
		},
		get isDark() {
			return resolved === 'dark';
		},
		set(next: ThemePreference) {
			preference = next;
			if (browser) {
				localStorage.setItem(STORAGE_KEY, next);
				apply(next === 'system' ? system : next);
			}
		},
		toggle() {
			this.set(resolved === 'dark' ? 'light' : 'dark');
		}
	};
}

export const themeStore = createThemeStore();
