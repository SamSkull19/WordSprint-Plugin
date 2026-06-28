import { useCallback, useEffect, useReducer, useRef } from '@wordpress/element';
import type { EvaluatedRow, GameState, GameStats, Letter } from '../types';
import { toLetter } from '../lib/engine';
import { startNewGame, submitGuess } from '../lib/api';
import { getOrCreatePlayer } from '../lib/player';

// localStorage key
const SAVE_KEY = 'wordsprint-game-state';

// Persisted shape — only the fields we need to reconstruct UI on reload
interface SavedGame {
	gameId: string;
	guesses: EvaluatedRow[];
	currentInput: Letter[];
	status: 'playing' | 'won' | 'lost';
	turnsUsed?: number;
	answer?: string;
}

function saveGame(state: GameState): void {
	if (
		state.status !== 'playing' &&
		state.status !== 'won' &&
		state.status !== 'lost'
	) {
		return;
	}

	const payload: SavedGame = {
		gameId: (state as { gameId: string }).gameId,
		guesses: state.guesses,
		currentInput: state.status === 'playing' ? state.currentInput : [],
		status: state.status,
		turnsUsed: state.status === 'won' ? state.turnsUsed : undefined,
		answer: (state.status === 'won' || state.status === 'lost') ? state.answer : undefined,
	};

	try {
		localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
	}
	catch { /* quota / private-mode — silently continue */ }
}

function loadGame(): SavedGame | null {
	try {
		const raw = localStorage.getItem(SAVE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as SavedGame;
		// Basic sanity check
		if (
			typeof parsed.gameId !== 'string' ||
			!Array.isArray(parsed.guesses)
		) {
			return null;
		}
		return parsed;
	}
	catch {
		return null;
	}
}

function clearGame(): void {
	try {
		localStorage.removeItem(SAVE_KEY);
	}
	catch { /* ignore */ }
}

// Reducer (unchanged logic)
type Action =
	| { type: 'TYPE'; letter: Letter }
	| { type: 'DELETE' }
	| { type: 'LOADING' }
	| { type: 'STARTED'; gameId: string }
	| { type: 'RESTORE'; saved: SavedGame }
	| { type: 'GUESS_RESULT'; tiles: EvaluatedRow; status: 'playing' | 'won' | 'lost'; turnsUsed: number; answer?: string }
	| { type: 'ERROR'; message: string };

function reducer(state: GameState, action: Action): GameState {
	switch (action.type) {
		case 'LOADING':
			return { status: 'loading' };

		case 'STARTED':
			return { status: 'playing', gameId: action.gameId, guesses: [], currentInput: [] };

		case 'RESTORE': {
			const s = action.saved;
			if (s.status === 'won') {
				return {
					status: 'won',
					gameId: s.gameId,
					guesses: s.guesses,
					turnsUsed: s.turnsUsed ?? s.guesses.length,
					answer: s.answer ?? '',
				};
			}
			if (s.status === 'lost') {
				return {
					status: 'lost',
					gameId: s.gameId,
					guesses: s.guesses,
					answer: s.answer ?? '',
				};
			}
			return {
				status: 'playing',
				gameId: s.gameId,
				guesses: s.guesses,
				currentInput: s.currentInput,
			};
		}

		case 'ERROR':
			return { status: 'error', message: action.message };

		case 'TYPE': {
			if (state.status !== 'playing' || state.currentInput.length >= 5) {
				return state;
			}
			return { ...state, currentInput: [...state.currentInput, action.letter] };
		}

		case 'DELETE': {
			if (state.status !== 'playing') {
				return state;
			}
			return { ...state, currentInput: state.currentInput.slice(0, -1) };
		}

		case 'GUESS_RESULT': {
			if (state.status !== 'playing') {
				return state;
			}

			const guesses = [...state.guesses, action.tiles];

			if (action.status === 'won') {
				return { status: 'won', gameId: state.gameId, guesses, turnsUsed: action.turnsUsed, answer: action.answer ?? '' };
			}
			if (action.status === 'lost') {
				return { status: 'lost', gameId: state.gameId, guesses, answer: action.answer ?? '' };
			}
			return { ...state, guesses, currentInput: [] };
		}

		default:
			return state;
	}
}

// Hook
export function useWordSprint() {
	const [state, dispatch] = useReducer(reducer, { status: 'idle' });
	const startedAtRef = useRef<number | null>(null);
	const submittingRef = useRef(false);

	useEffect(() => {
		const saved = loadGame();

		if (saved) {
			dispatch({ type: 'RESTORE', saved });
		}
		else {
			dispatch({ type: 'LOADING' });
			startedAtRef.current = Date.now();

			startNewGame()
				.then((res) => dispatch({ type: 'STARTED', gameId: res.game_id }))
				.catch((err: Error) => dispatch({ type: 'ERROR', message: err.message }));
		}
	}, []);

	// Persist state after every change
	useEffect(() => {
		saveGame(state);
	}, [state]);

	// Start a new game (clears saved state first)
	const reset = useCallback(() => {
		clearGame();
		dispatch({ type: 'LOADING' });
		startedAtRef.current = Date.now();

		startNewGame()
			.then((res) => dispatch({ type: 'STARTED', gameId: res.game_id }))
			.catch((err: Error) => dispatch({ type: 'ERROR', message: err.message }));
	}, []);

	// Typing / deleting
	const typeLetter = useCallback((letter: Letter) => {
		dispatch({ type: 'TYPE', letter });
	}, []);

	const deleteLetter = useCallback(() => {
		dispatch({ type: 'DELETE' });
	}, []);

	// Submit guess
	const submit = useCallback(() => {
		if (state.status !== 'playing' || submittingRef.current) {
			return;
		}

		const guessWord = state.currentInput.join('');
		if (guessWord.length < 5) {
			return;
		}

		const player = getOrCreatePlayer();
		const duration = startedAtRef.current
			? Math.round((Date.now() - startedAtRef.current) / 1000)
			: undefined;

		submittingRef.current = true;

		submitGuess(state.gameId, guessWord, player.uuid, player.displayName, duration)
			.then((res) => {
				const tiles = res.tiles.map((t) => ({
					letter: toLetter(t.letter),
					status: t.status,
				})) as EvaluatedRow;

				dispatch({
					type: 'GUESS_RESULT',
					tiles,
					status: res.status,
					turnsUsed: res.guesses_used,
					answer: res.answer,
				});
			})
			.catch((err: Error) => dispatch({ type: 'ERROR', message: err.message }))
			.finally(() => {
				submittingRef.current = false;
			});
	}, [state]);

	// Keyboard listener
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.ctrlKey || e.metaKey || e.altKey) return;
			if (e.key === 'Enter') {
				submit();
				return;
			}
			if (e.key === 'Backspace') {
				deleteLetter();
				return;
			}
			if (/^[a-zA-Z]$/.test(e.key)) {
				typeLetter(e.key as Letter);
			}
		};

		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, [submit, deleteLetter, typeLetter]);

	return { state, typeLetter, deleteLetter, submit, reset };
}

export const DEFAULT_STATS: GameStats = {
	played: 0,
	wins: 0,
	streak: 0,
	maxStreak: 0,
	distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
};