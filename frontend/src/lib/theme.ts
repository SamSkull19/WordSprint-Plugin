export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'wordsprint-theme';

export interface ThemePalette {
	color_bg: string;
	color_surface: string;
	color_border: string;
	color_muted: string;
	color_correct: string;
	color_present: string;
	color_absent: string;
	color_text: string;
	color_key: string;
	color_key_text: string;
}

const CSS_VAR_MAP: Record<keyof ThemePalette, string> = {
	color_bg: '--color-bg',
	color_surface: '--color-surface',
	color_border: '--color-border',
	color_muted: '--color-muted',
	color_correct: '--color-correct',
	color_present: '--color-present',
	color_absent: '--color-absent',
	color_text: '--color-text',
	color_key: '--color-key',
	color_key_text: '--color-key-text',
};

export const LIGHT_PALETTE: ThemePalette = {
	color_bg: '#ffffff',
	color_surface: '#f6f6f7',
	color_border: '#d3d6da',
	color_muted: '#787c7e',
	color_correct: '#6aaa64',
	color_present: '#c9b458',
	color_absent: '#787c7e',
	color_text: '#1a1a1b',
	color_key: '#d3d6da',
	color_key_text: '#1a1a1b',
};

let cachedAdminPalette: ThemePalette | null = null;

export function captureAdminPalette(palette: ThemePalette): void {
	cachedAdminPalette = palette;
}

function getAdminPalette(): ThemePalette {
	return (
		cachedAdminPalette ?? {
			color_bg: '#121213',
			color_surface: '#1e1e1f',
			color_border: '#3a3a3c',
			color_muted: '#818384',
			color_correct: '#538d4e',
			color_present: '#b59f3b',
			color_absent: '#3a3a3c',
			color_text: '#ffffff',
			color_key: '#818384',
			color_key_text: '#ffffff',
		}
	);
}

export function getStoredTheme(): ThemeMode {
	try {
		const stored = window.localStorage.getItem(STORAGE_KEY);
		if (stored === 'light' || stored === 'dark') {
			return stored;
		}
	}
	catch {
		// localStorage unavailable — fall through to default.
	}
	return 'dark';
}

function storeTheme(mode: ThemeMode): void {
	try {
		window.localStorage.setItem(STORAGE_KEY, mode);
	}
	catch {
		// Best-effort only; the toggle still works for the current session.
	}
}


export function applyTheme(mode: ThemeMode, root: HTMLElement): void {
	const palette = mode === 'light' ? LIGHT_PALETTE : getAdminPalette();

	(Object.keys(CSS_VAR_MAP) as Array<keyof ThemePalette>).forEach((key) => {
		root.style.setProperty(CSS_VAR_MAP[key], palette[key]);
	});

	root.dataset.wordsprintTheme = mode;
	storeTheme(mode);
}
