import { useState } from '@wordpress/element';
import { TabPanel } from '@wordpress/components';
import WordsList from './components/WordsList';
import BulkImport from './components/BulkImport';
import StatsPanel from './components/StatsPanel';
import LeaderboardPanel from './components/LeaderboardPanel';
import ShortcodeBadge from './components/ShortcodeBadge';
import AppearancePanel from './components/AppearancePanel';
import SettingsPanel from './components/SettingsPanel';

const TAB_STORAGE_KEY = 'wordsprint-admin-tab';

const TABS = [
    { name: 'words', title: 'Words', className: 'tab-words' },
    { name: 'bulk', title: 'Bulk Import', className: 'tab-bulk' },
    { name: 'stats', title: 'Stats', className: 'tab-stats' },
    { name: 'leaderboard', title: 'Leaderboard', className: 'tab-leaderboard' },
    { name: 'appearance', title: 'Appearance', className: 'tab-appearance' },
    { name: 'settings', title: 'Settings', className: 'tab-settings' },
];

export default function App() {
    const [refreshKey, setRefreshKey] = useState(0);

    const savedTab = localStorage.getItem(TAB_STORAGE_KEY) ?? 'words';
    const initialTab = TABS.find((t) => t.name === savedTab)?.name ?? 'words';

    const handleTabSelect = (tabName: string) => {
        localStorage.setItem(TAB_STORAGE_KEY, tabName);
    };

    return (
        <div className="wordsprint-admin">
            <div className="wordsprint-admin__header">
                <h1>WordSprint</h1>
                <ShortcodeBadge shortcode="wordsprint" />
            </div>

            <p className="description">
                Manage the word pool players draw from, review play stats, and see the leaderboard.
            </p>

            <TabPanel
                className="wordsprint-admin__tabs"
                tabs={TABS}
                initialTabName={initialTab}
                onSelect={handleTabSelect}
            >
                {
                    (tab) => {
                        if (tab.name === 'words') return <WordsList key={refreshKey} />;
                        if (tab.name === 'bulk') return <BulkImport onImported={() => setRefreshKey((k) => k + 1)} />;
                        if (tab.name === 'stats') return <StatsPanel />;
                        if (tab.name === 'appearance') return <AppearancePanel />;
                        if (tab.name === 'settings') return <SettingsPanel />;
                        return <LeaderboardPanel />;
                    }
                }
            </TabPanel>
        </div>
    );
}