import { createRoot } from '@wordpress/element';
import App from './App';
import { applyTheme, captureAdminPalette, getStoredTheme, type ThemePalette } from './lib/theme';
import { applyGameSettings } from './lib/settings'; // ← new
import './style.css';

document.addEventListener('DOMContentLoaded', () => {
	const root = document.getElementById('wordsprint-root');
	if (!root) return;

	const appearance = window.wordsprintConfig?.appearance;
	if (appearance) {
		captureAdminPalette(appearance as unknown as ThemePalette);
	}

	applyTheme(getStoredTheme(), root);
	applyGameSettings(root);

	createRoot(root).render(<App />);
});