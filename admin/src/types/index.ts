export interface WordRow {
	id: number;
	word: string;
	is_active: boolean;
	times_played: number;
	times_won: number;
	created_at: string;
}

export interface WordsListResponse {
	words: WordRow[];
	total: number;
	page: number;
	per_page: number;
	total_pages: number;
}

export interface BulkImportResult {
	added: string[];
	skipped: { word: string; reason: string }[];
	added_count: number;
	skipped_count: number;
}

export interface MostMissedWord {
	word: string;
	times_played: number;
	times_won: number;
	win_rate: number;
}

export interface StatsResponse {
	games_played: number;
	wins: number;
	win_rate: number;
	avg_guesses: number | null;
	most_missed: MostMissedWord[];
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

declare global {
	interface Window {
		wordsprintAdminConfig: {
			root: string;
			nonce: string;
		};
	}
}
