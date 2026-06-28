const STORAGE_KEY = 'wordsprint-player';

interface StoredPlayer {
	uuid: string;
	displayName: string;
}

const ADJECTIVES = [
	'Swift', 'Clever', 'Brave', 'Quiet', 'Lucky', 'Mighty', 'Calm', 'Sharp',
	'Bold', 'Witty', 'Nimble', 'Sunny', 'Cosmic', 'Golden', 'Silver', 'Rapid',
];

const NOUNS = [
	'Falcon', 'Otter', 'Comet', 'Tiger', 'Panda', 'Wolf', 'Eagle', 'Fox',
	'Heron', 'Lynx', 'Raven', 'Dolphin', 'Badger', 'Hawk', 'Puma', 'Stag',
];

function generateName(): string {
	const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
	const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
	const number = Math.floor(Math.random() * 9000) + 100;

	return `${adjective} ${noun} ${number}`;
}

function generateUuid(): string {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return crypto.randomUUID();
	}

	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}


export function getOrCreatePlayer(): StoredPlayer {
	const config = window.wordsprintConfig;

	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (raw) {
			const parsed = JSON.parse(raw) as StoredPlayer;
			if (parsed?.uuid && parsed?.displayName) {
				if (config?.isLoggedIn && config.displayName) {
					return { ...parsed, displayName: config.displayName };
				}
				return parsed;
			}
		}
	}
	catch {
		// localStorage unavailable or corrupted value — fall through to creating a fresh identity.
	}

	const player: StoredPlayer = {
		uuid: generateUuid(),
		displayName: config?.isLoggedIn && config.displayName ? config.displayName : generateName(),
	};

	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
	}
	catch {
		// Best-effort only; game still works without persistence.
	}

	return player;
}
