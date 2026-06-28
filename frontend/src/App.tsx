import { useEffect, useState } from '@wordpress/element';
import { useWordSprint, DEFAULT_STATS } from './hooks/useWordSprint';
import { useLocalStorage } from './hooks/useLocalStorage';
import { buildKeyMap } from './lib/engine';
import { buildShareText, copyToClipboard } from './lib/share';
import { applyTheme, getStoredTheme, type ThemeMode } from './lib/theme';
import Board from './components/Board';
import Keyboard from './components/Keyboard';
import Leaderboard from './components/Leaderboard';
import type { GameStats } from './types';

const WIN_MESSAGES: Record<number, string> = {
	1: 'Genius!',
	2: 'Magnificent!',
	3: 'Impressive!',
	4: 'Splendid!',
	5: 'Great!',
	6: 'Phew!',
};

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

// Title size map — must mirror TITLE_SIZE_OPTIONS in admin/src/lib/api.ts
const TITLE_SIZE_PX: Record<string, string> = {
	xs: '11px',
	sm: '13px',
	md: '16px',
	lg: '22px',
	xl: '30px',
};

export default function App() {
	const { state, typeLetter, deleteLetter, submit, reset } = useWordSprint();
	const [stats, setStats] = useLocalStorage<GameStats>('wordsprint-stats', DEFAULT_STATS);
	const [toast, setToast] = useState('');
	const [showLeaderboard, setShowLeaderboard] = useState(false);
	const [themeMode, setThemeMode] = useState<ThemeMode>(() => getStoredTheme());

	// Title text, font & size from admin settings
	const gameTitle = window.wordsprintConfig?.gameTitle || 'Wordsprint';

	const titleFontStack =
		FONT_STACKS[window.wordsprintConfig?.titleFontFamily ?? 'system'] ?? FONT_STACKS.system;

	const titleFontSize =
		TITLE_SIZE_PX[window.wordsprintConfig?.titleFontSize ?? 'xs'] ?? TITLE_SIZE_PX.xs;

	// Theme toggle
	const toggleTheme = () => {
		const next: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
		const root = document.getElementById('wordsprint-root');
		if (root) {
			applyTheme(next, root);
		}
		setThemeMode(next);
	};

	const [animatingRowIndex, setAnimatingRowIndex] = useState<number | null>(null);
	const [lastAnimatedGuessCount, setLastAnimatedGuessCount] = useState(0);

	const guesses = state.status === 'playing' || state.status === 'won' || state.status === 'lost' ? state.guesses : [];
	const currentInput = state.status === 'playing' ? state.currentInput : [];

	// Seed counter on restore so old rows don't re-animate
	useEffect(() => {
		if (
			(state.status === 'playing' || state.status === 'won' || state.status === 'lost') &&
			lastAnimatedGuessCount === 0 &&
			state.guesses.length > 0
		) {
			setLastAnimatedGuessCount(state.guesses.length);
		}
	}, [state.status]);

	const keyMapGuesses = animatingRowIndex !== null ? guesses.slice(0, animatingRowIndex) : guesses;
	const keyMap = buildKeyMap(keyMapGuesses);

	const showToast = (msg: string, ms = 1800) => {
		setToast(msg);
		setTimeout(() => setToast(''), ms);
	};

	useEffect(() => {
		if (guesses.length > 0 && guesses.length !== lastAnimatedGuessCount) {
			setAnimatingRowIndex(guesses.length - 1);
			setLastAnimatedGuessCount(guesses.length);
		}
	}, [guesses.length]);

	useEffect(() => {
		if (state.status !== 'won' && state.status !== 'lost') return;
		if (animatingRowIndex !== null) return;

		if (state.status === 'won') {
			showToast(WIN_MESSAGES[state.turnsUsed] ?? 'Nice!', 2000);
			setStats({
				played: stats.played + 1,
				wins: stats.wins + 1,
				streak: stats.streak + 1,
				maxStreak: Math.max(stats.maxStreak, stats.streak + 1),
				distribution: {
					...stats.distribution,
					[state.turnsUsed as 1 | 2 | 3 | 4 | 5 | 6]:
						stats.distribution[state.turnsUsed as 1 | 2 | 3 | 4 | 5 | 6] + 1,
				},
			});
		}
		else {
			showToast(state.answer, 3000);
			setStats({ ...stats, played: stats.played + 1, streak: 0 });
		}
	}, [state.status, animatingRowIndex]);

	useEffect(() => {
		if (state.status === 'error') showToast(state.message, 3000);
	}, [state.status]);

	const handleRowFlipComplete = () => setAnimatingRowIndex(null);

	const [shareCopied, setShareCopied] = useState(false);

	const handleShare = () => {
		if (state.status !== 'won' && state.status !== 'lost') return;
		const shareText = buildShareText({
			guesses: state.guesses,
			turnsUsed: state.status === 'won' ? state.turnsUsed : null,
		});
		copyToClipboard(shareText).then((succeeded) => {
			if (succeeded) {
				setShareCopied(true);
				setTimeout(() => setShareCopied(false), 2000);
			}
			else {
				showToast("Couldn't copy — try again", 2000);
			}
		});
	};

	const handleSubmit = () => {
		if (state.status !== 'playing') return;
		if (state.currentInput.length < 5) { showToast('Not enough letters'); return; }
		submit();
	};

	const handleReset = () => {
		setShowLeaderboard(false);
		setAnimatingRowIndex(null);
		setLastAnimatedGuessCount(0);
		setShareCopied(false);
		reset();
	};

	const isBusy = state.status === 'idle' || state.status === 'loading';

	return (
		<div className="flex flex-col items-center mx-auto min-h-dvh w-full max-w-125 px-4 pb-8">
			<header className="flex w-full flex-col gap-2 border-b border-border py-3 mb-6">

				<div className="flex items-center justify-between gap-5">
					<h1
						className="font-bold tracking-[4px] uppercase"
						style={{
							fontFamily: titleFontStack,
							fontSize: titleFontSize,
							lineHeight: 1.2,
						}}
					>
						{gameTitle}
					</h1>

					<div className="flex items-center gap-3">
						<div className="flex gap-3 text-[0.85rem] text-muted">
							<span>🏆 {stats.wins}</span>
							<span>🔥 {stats.streak}</span>
						</div>

						<button
							className="flex h-10 w-10 items-center justify-center rounded border border-border bg-transparent text-muted transition-colors hover:bg-surface hover:text-text touch-manipulation sm:h-11 sm:w-11"
							onClick={toggleTheme}
							aria-label={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
							title={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
						>
							{
								themeMode === 'dark' ? (
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<circle cx="12" cy="12" r="4" />
										<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
									</svg>
								) : (
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
									</svg>
								)
							}
						</button>
					</div>
				</div>

				{ /* Leaderboard / New Game buttons */}
				<div className="flex gap-2">
					<button
						className="flex-1 rounded border border-border bg-transparent px-3 py-2 text-xs text-muted transition-colors hover:bg-surface hover:text-text touch-manipulation sm:flex-none sm:px-3 sm:py-2.5"
						onClick={() => setShowLeaderboard((v) => !v)}
					>
						{showLeaderboard ? 'Hide leaderboard' : 'Leaderboard'}
					</button>

					<button
						className="flex-1 rounded border border-border bg-transparent px-3 py-2 text-xs text-muted transition-colors hover:bg-surface hover:text-text touch-manipulation sm:flex-none sm:px-3 sm:py-2.5"
						onClick={handleReset}
						disabled={isBusy}
					>
						New game
					</button>
				</div>
			</header>

			{
				toast && (
					<div
						role="alert"
						className="fixed top-17.5 left-1/2 z-100 -translate-x-1/2 animate-fadeInOut rounded-md bg-white px-5 py-2 text-sm font-semibold uppercase tracking-wide text-bg"
					>
						{toast}
					</div>
				)
			}

			{
				showLeaderboard ? (
					<main className="flex w-full flex-1 flex-col gap-4 py-4">
						<Leaderboard />
					</main>
				) : (
					<main className="flex w-full flex-1 flex-col items-center justify-center gap-6">
						{isBusy && <p className="text-sm text-muted">Loading game…</p>}

						{
							!isBusy && state.status !== 'error' && (
								<Board
									guesses={guesses}
									currentInput={currentInput}
									animatingRowIndex={animatingRowIndex}
									onRowFlipComplete={handleRowFlipComplete}
								/>
							)
						}

						{
							(state.status === 'won' || state.status === 'lost') && animatingRowIndex === null && (
								<div className="flex gap-3">
									<button
										className="rounded border border-border bg-transparent px-5 py-2.5 text-sm font-bold tracking-wide text-text transition-[opacity,transform] hover:bg-surface active:scale-[0.97] touch-manipulation"
										onClick={handleShare}
									>
										{shareCopied ? 'Copied! ✓' : 'Share result'}
									</button>
									<button
										className="rounded bg-correct px-6 py-2.5 text-sm font-bold tracking-wide text-white transition-[opacity,transform] hover:opacity-90 active:scale-[0.97] touch-manipulation"
										onClick={handleReset}
									>
										Play again →
									</button>
								</div>
							)
						}

						{
							!isBusy && state.status !== 'error' && (
								<Keyboard
									keyMap={keyMap}
									onLetter={typeLetter}
									onDelete={deleteLetter}
									onSubmit={handleSubmit}
								/>
							)
						}
					</main>
				)
			}
		</div>
	);
}