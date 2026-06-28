import type { Letter, EvaluatedRow, TileStatus, KeyMap } from '../types';

export function toLetter(char: string): Letter {
	if (char.length !== 1) {
		throw new Error(`Expected single char, got: "${char}"`);
	}

	return char.toUpperCase() as Letter;
}

const STATUS_PRIORITY: Record<TileStatus, number> = {
	correct: 3,
	present: 2,
	absent: 1,
	filled: 0,
	empty: 0,
};


export function buildKeyMap(guesses: EvaluatedRow[]): KeyMap {
	const map: KeyMap = {};

	for (const row of guesses) {
		for (const { letter, status } of row) {
			const current = map[letter];

			if (!current || STATUS_PRIORITY[status] > STATUS_PRIORITY[current]) {
				map[letter] = status;
			}
		}
	}

	return map;
}
