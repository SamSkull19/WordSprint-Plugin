/**
 * frontend/src/lib/settings.ts
 *
 * Reads `fontFamily` and `tileShape` from `window.wordsprintConfig`
 * (injected by wp_localize_script in class-wordsprint-shortcode.php)
 * and applies them as CSS custom properties on the game root element.
 *
 * CSS variables set:
 *   --ws-font-family   → used in Tile.tsx and Keyboard.tsx
 *   --ws-tile-radius   → used in Tile.tsx
 */

import type { TileShape } from '../types';

// Font stacks — must mirror FONT_OPTIONS in admin/src/lib/api.ts
const FONT_STACKS: Record<string, string> = {
    system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    inter: "'Inter', sans-serif",
    roboto: "'Roboto', sans-serif",
    lato: "'Lato', sans-serif",
    montserrat: "'Montserrat', sans-serif",
    merriweather: "'Merriweather', serif",
    playfair: "'Playfair Display', serif",
    sourcecodepro: "'Source Code Pro', monospace",
};

// Tile border-radius per shape
const TILE_RADIUS: Record<TileShape, string> = {
    rounded: '8px',
    square: '2px',
};

// Google Fonts loader (only non-system fonts need it)
const GOOGLE_FONTS_URL =
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Roboto:wght@400;700' +
    '&family=Lato:wght@400;700&family=Montserrat:wght@400;700' +
    '&family=Merriweather:wght@400;700&family=Playfair+Display:wght@400;700' +
    '&family=Source+Code+Pro:wght@400;700&display=swap';

function ensureGoogleFonts() {
    if (document.getElementById('wordsprint-google-fonts')) return;
    const link = document.createElement('link');
    link.id = 'wordsprint-google-fonts';
    link.rel = 'stylesheet';
    link.href = GOOGLE_FONTS_URL;
    document.head.appendChild(link);
}

// Public API

/**
 * Apply font-family and tile-shape CSS vars to the game root element.
 * Call this once in frontend/src/index.tsx after the root element is found.
 */
export function applyGameSettings(rootEl: HTMLElement): void {
    const cfg = window.wordsprintConfig;

    // Font family
    const fontKey = cfg?.fontFamily ?? 'system';
    const fontStack = FONT_STACKS[fontKey] ?? FONT_STACKS.system;

    if (fontKey !== 'system') {
        ensureGoogleFonts();
    }

    rootEl.style.setProperty('--ws-font-family', fontStack);

    // Tile shape
    const shape = (cfg?.tileShape ?? 'rounded') as TileShape;
    const radius = TILE_RADIUS[shape] ?? TILE_RADIUS.rounded;
    rootEl.style.setProperty('--ws-tile-radius', radius);
}