import { useEffect, useState } from '@wordpress/element';
import { Button, Notice } from '@wordpress/components';
import { getAppearance, saveAppearance, type AppearanceSettings } from '../../../frontend/src/lib/api';

const FIELDS: { key: keyof AppearanceSettings; label: string; description: string }[] = [
    { key: 'color_bg', label: 'Background', description: 'Main canvas background' },
    { key: 'color_surface', label: 'Surface', description: 'Card / tile base color' },
    { key: 'color_border', label: 'Border', description: 'Empty tile border' },
    { key: 'color_text', label: 'Text', description: 'Primary text color' },
    { key: 'color_muted', label: 'Muted text', description: 'Keyboard key default color' },
    { key: 'color_correct', label: 'Correct (green)', description: 'Right letter, right position' },
    { key: 'color_present', label: 'Present (yellow)', description: 'Right letter, wrong position' },
    { key: 'color_absent', label: 'Absent (grey)', description: 'Letter not in word' },
    { key: 'color_key', label: 'Key background', description: 'Keyboard key background color' },
    { key: 'color_key_text', label: 'Key text', description: 'Keyboard key text color' },
];

const DEFAULTS: AppearanceSettings = {
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
};

export default function AppearancePanel() {
    const [settings, setSettings] = useState<AppearanceSettings>(DEFAULTS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        getAppearance()
            .then(setSettings)
            .catch(() => setNotice({ type: 'error', message: 'Failed to load appearance settings.' }))
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (key: keyof AppearanceSettings, value: string) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        setSaving(true);
        setNotice(null);
        saveAppearance(settings)
            .then((saved) => {
                setSettings(saved);
                setNotice({ type: 'success', message: 'Appearance saved!' });
            })
            .catch(() => setNotice({ type: 'error', message: 'Failed to save. Please try again.' }))
            .finally(() => setSaving(false));
    };

    const handleReset = () => {
        setSettings(DEFAULTS);
    };

    if (loading) return <p>Loading…</p>;

    return (
        <div className="wordsprint-appearance">
            {
                notice && (
                    <Notice status={notice.type} isDismissible onRemove={() => setNotice(null)}>
                        {notice.message}
                    </Notice>
                )
            }

            <div className="wordsprint-appearance__grid">
                {
                    FIELDS.map(({ key, label, description }) => (
                        <div key={key} className="wordsprint-appearance__row">
                            <label className="wordsprint-appearance__label">
                                <span>{label}</span>
                                <small>{description}</small>
                            </label>
                            
                            <div className="wordsprint-appearance__swatch-wrap">
                                <input
                                    type="color"
                                    value={settings[key]}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    className="wordsprint-appearance__swatch"
                                />

                                <input
                                    type="text"
                                    value={settings[key]}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    maxLength={7}
                                    className="wordsprint-appearance__hex"
                                />
                            </div>
                        </div>
                    ))
                }
            </div>


            <div className="wordsprint-appearance__preview" style={{
                backgroundColor: settings.color_bg,
                color: settings.color_text,
                border: `2px solid ${settings.color_border}`,
            }}>
                <div className="wordsprint-appearance__preview-tiles">
                    {
                        (['color_correct', 'color_present', 'color_absent', 'color_surface'] as const).map((key, i) => (
                            <div key={key} className="wordsprint-appearance__preview-tile" style={{
                                backgroundColor: settings[key],
                                border: `2px solid ${settings.color_border}`,
                                color: settings.color_text,
                            }}>
                                {['W', '?', 'X', ''][i]}
                            </div>
                        ))
                    }
                </div>

                <p style={{ color: settings.color_muted, fontSize: '12px', margin: '8px 0 0' }}>
                    Preview · muted text
                </p>
            </div>

            <div className="wordsprint-appearance__actions">
                <Button variant="primary" onClick={handleSave} isBusy={saving} disabled={saving}>
                    Save appearance
                </Button>

                <Button variant="tertiary" onClick={handleReset}>
                    Reset to defaults
                </Button>
            </div>
        </div>
    );
}