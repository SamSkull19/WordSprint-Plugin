export type Letter = string & { readonly __brand: 'Letter' };

export type TileStatus = 'correct' | 'present' | 'absent' | 'empty' | 'filled';

export type KeyMap = Partial<Record<Letter, TileStatus>>;

export interface EvaluatedTile {
	letter: Letter;
	status: TileStatus;
}

export type EvaluatedRow = [
	EvaluatedTile,
	EvaluatedTile,
	EvaluatedTile,
	EvaluatedTile,
	EvaluatedTile
];

export type GameState =
	| { status: 'idle' }
	| { status: 'loading' }
	| { status: 'playing'; gameId: string; guesses: EvaluatedRow[]; currentInput: Letter[] }
	| { status: 'won'; gameId: string; guesses: EvaluatedRow[]; turnsUsed: number; answer: string }
	| { status: 'lost'; gameId: string; guesses: EvaluatedRow[]; answer: string }
	| { status: 'error'; message: string };

export interface GameStats {
	played: number;
	wins: number;
	streak: number;
	maxStreak: number;
	distribution: Record<1 | 2 | 3 | 4 | 5 | 6, number>;
}

export interface NewGameResponse {
	game_id: string;
	word_length: number;
	max_guesses: number;
}

export interface GuessResponse {
	tiles: { letter: string; status: TileStatus }[];
	guesses_used: number;
	status: 'playing' | 'won' | 'lost';
	answer?: string;
}

export interface LeaderboardEntry {
	display_name: string;
	is_member: boolean;
	games_played: number;
	wins: number;
	win_rate: number;
	avg_guesses: number | null;
	last_played: string;
}

export type TileShape = 'rounded' | 'square';

export type TitleFontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

declare global {
	interface Window {
		wordsprintConfig: {
			root: string;
			namespace: string;
			nonce: string;
			isLoggedIn: boolean;
			displayName: string;
			appearance?: Record<string, string>;
			gameTitle?: string;
			fontFamily?: string;
			tileShape?: TileShape;
			titleFontFamily?: string;
			titleFontSize?: TitleFontSize;
		};
	}
}