import { useEffect, useState } from '@wordpress/element';
import { Button, Notice, TextControl, SelectControl, RadioControl } from '@wordpress/components';
import {
    getSettings,
    saveSettings,
    type GameSettings,
    type TitleFontSize,
    FONT_OPTIONS,
    TITLE_SIZE_OPTIONS,
} from '../lib/api';

// Google Fonts (loaded once, cached by browser)
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


// Defaults
const DEFAULT_SETTINGS: GameSettings = {
    game_title: '',
    font_family: 'system',
    tile_shape: 'rounded',
    title_font_family: 'system',
    title_font_size: 'xs',
};

// Helpers
function getFontStack(value: string): string {
    return FONT_OPTIONS.find((f) => f.value === value)?.stack ?? FONT_OPTIONS[0].stack;
}

function getTitlePx(value: TitleFontSize): string {
    return TITLE_SIZE_OPTIONS.find((s) => s.value === value)?.px ?? '11px';
}

// Component
export default function SettingsPanel() {
    const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        ensureGoogleFonts();
        getSettings()
            .then((saved) => setSettings({ ...DEFAULT_SETTINGS, ...saved }))
            .catch(() => setNotice({ type: 'error', message: 'Failed to load settings.' }))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = () => {
        setSaving(true);
        setNotice(null);
        saveSettings(settings)
            .then((saved) => {
                setSettings({ ...DEFAULT_SETTINGS, ...saved });
                setNotice({ type: 'success', message: 'Settings saved!' });
            })
            .catch(() => setNotice({ type: 'error', message: 'Failed to save. Please try again.' }))
            .finally(() => setSaving(false));
    };

    const update = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) =>
        setSettings((prev) => ({ ...prev, [key]: value }));

    if (loading) return <p>Loading…</p>;

    // Derived preview values
    const tileFont = getFontStack(settings.font_family);
    const tileRadius = settings.tile_shape === 'rounded' ? '8px' : '2px';
    const titleFont = getFontStack(settings.title_font_family);
    const titleFontPx = getTitlePx(settings.title_font_size);
    const previewTitle = settings.game_title.trim() || 'WORDSPRINT';

    return (
        <div className="wordsprint-settings">
            {notice && (
                <Notice status={notice.type} isDismissible onRemove={() => setNotice(null)}>
                    {notice.message}
                </Notice>
            )}

            <h2 style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#50575e' }}>
                Game Title
            </h2>

            <div className="wordsprint-settings__field">
                <TextControl
                    label="Title text"
                    value={settings.game_title}
                    onChange={(val) => update('game_title', val)}
                    placeholder="Wordsprint"
                    help='Displayed in the header on the frontend. Leave blank to use "Wordsprint".'
                    maxLength={80}
                />
            </div>

            { /* ── Title font family ── */}
            <div className="wordsprint-settings__field" style={{ marginTop: '16px' }}>
                <SelectControl
                    label="Title font"
                    value={settings.title_font_family}
                    options={FONT_OPTIONS.map((f) => ({ label: f.label, value: f.value }))}
                    onChange={(val) => update('title_font_family', val)}
                    help="Font applied to the game title in the header."
                />
            </div>

            { /* ── Title font size ── */}
            <div className="wordsprint-settings__field" style={{ marginTop: '16px' }}>
                <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: '13px' }}>Title size</p>

                { /* size button strip */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {TITLE_SIZE_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => update('title_font_size', opt.value)}
                            style={{
                                padding: '5px 14px',
                                borderRadius: '4px',
                                border: `2px solid ${settings.title_font_size === opt.value ? '#2271b1' : '#c3c4c7'}`,
                                background: settings.title_font_size === opt.value ? '#2271b1' : '#fff',
                                color: settings.title_font_size === opt.value ? '#fff' : '#1d2327',
                                fontWeight: 600,
                                fontSize: '13px',
                                cursor: 'pointer',
                                transition: 'all 0.12s ease',
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                <p style={{ marginTop: '6px', fontSize: '12px', color: '#757575' }}>
                    Selected: <em>{settings.title_font_size.toUpperCase()}</em> — {titleFontPx}
                </p>
            </div>

            { /* ── Live title preview ── */}
            <div
                style={{
                    marginTop: '16px',
                    marginBottom: '28px',
                    padding: '16px 20px',
                    border: '1px solid #dcdcde',
                    borderRadius: '6px',
                    background: '#1e1e1f',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <span
                    style={{
                        fontFamily: titleFont,
                        fontSize: titleFontPx,
                        fontWeight: 700,
                        letterSpacing: '4px',
                        color: '#ffffff',
                        textTransform: 'uppercase',
                        transition: 'font-size 0.15s ease, font-family 0.15s ease',
                    }}
                >
                    {previewTitle}
                </span>
            </div>

            <h2 style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#50575e' }}>
                Tiles &amp; Keyboard
            </h2>

            <div className="wordsprint-settings__field">
                <SelectControl
                    label="Tile &amp; keyboard font"
                    value={settings.font_family}
                    options={FONT_OPTIONS.map((f) => ({ label: f.label, value: f.value }))}
                    onChange={(val) => update('font_family', val)}
                    help="Applied to tile letters and the on-screen keyboard on the frontend."
                />

                { /* font preview strip */}
                <div
                    style={{
                        marginTop: '10px',
                        padding: '10px 14px',
                        border: '1px solid #dcdcde',
                        borderRadius: '4px',
                        fontFamily: tileFont,
                        fontSize: '18px',
                        fontWeight: 700,
                        letterSpacing: '4px',
                        color: '#1d2327',
                        background: '#f9f9f9',
                        display: 'inline-block',
                    }}
                >
                    ABCDE
                </div>

                <p style={{ marginTop: '6px', fontSize: '12px', color: '#757575' }}>
                    Preview — <em>{FONT_OPTIONS.find((f) => f.value === settings.font_family)?.label}</em>
                </p>
            </div>

            { /* ── Tile shape ── */}
            <div className="wordsprint-settings__field" style={{ marginTop: '20px' }}>
                <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: '13px' }}>Tile shape</p>

                <RadioControl
                    label=""
                    selected={settings.tile_shape}
                    options={[
                        { label: 'Rounded', value: 'rounded' },
                        { label: 'Square', value: 'square' },
                    ]}
                    onChange={(val) => update('tile_shape', val as GameSettings['tile_shape'])}
                />

                { /* tile shape preview */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    {['W', 'O', 'R', 'D', 'S'].map((letter) => (
                        <div
                            key={letter}
                            style={{
                                width: '46px',
                                height: '46px',
                                borderRadius: tileRadius,
                                border: '2px solid #538d4e',
                                background: '#538d4e',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '18px',
                                fontFamily: tileFont,
                                transition: 'border-radius 0.2s ease',
                            }}
                        >
                            {letter}
                        </div>
                    ))}
                </div>

                <p style={{ marginTop: '6px', fontSize: '12px', color: '#757575' }}>
                    Preview — border-radius: <em>{tileRadius}</em>
                </p>
            </div>

            { /* ── Actions ── */}
            <div className="wordsprint-settings__actions" style={{ marginTop: '28px' }}>
                <Button variant="primary" onClick={handleSave} isBusy={saving} disabled={saving}>
                    Save settings
                </Button>
            </div>
        </div>
    );
}