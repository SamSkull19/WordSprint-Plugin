import type { EvaluatedRow, TileStatus } from '../types';

const STATUS_EMOJI: Record<TileStatus, string> = {
	correct: '🟩',
	present: '🟨',
	absent: '⬛',
	filled: '⬜',
	empty: '⬜',
};

interface ShareResultOptions {
	guesses: EvaluatedRow[];
	turnsUsed: number | null;
	maxGuesses?: number;
	url?: string;
}

export function buildShareText({ guesses, turnsUsed, maxGuesses = 6, url }: ShareResultOptions): string {
	const scoreLabel = turnsUsed !== null ? `${turnsUsed}/${maxGuesses}` : `X/${maxGuesses}`;
	const grid = guesses
		.map((row) => row.map((tile) => STATUS_EMOJI[tile.status]).join(''))
		.join('\n');

	const lines = [`WordSprint ${scoreLabel}`, '', grid];

	if (url) {
		lines.push('', url);
	}

	return lines.join('\n');
}


export async function copyToClipboard(text: string): Promise<boolean> {
	if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		}
		catch {
			// Fall through to the legacy fallback below.
		}
	}

	try {
		const textarea = document.createElement('textarea');
		textarea.value = text;
		textarea.setAttribute('readonly', '');
		textarea.style.position = 'fixed';
		textarea.style.opacity = '0';
		textarea.style.left = '-9999px';
		document.body.appendChild(textarea);
		textarea.select();
		const succeeded = document.execCommand('copy');
		document.body.removeChild(textarea);
		return succeeded;
	}
	catch {
		return false;
	}
}
