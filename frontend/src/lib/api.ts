import apiFetch from '@wordpress/api-fetch';
import type { GuessResponse, NewGameResponse, LeaderboardEntry } from '../types';

const NAMESPACE = 'wordsprint/v1';

function getConfig() {
	return window.wordsprintConfig;
}

function buildUrl(endpoint: string): string {
	const { root, namespace } = getConfig();
	const cleanEndpoint = endpoint.replace(/^\//, '');
	const routePath = `${namespace}/${cleanEndpoint}`;

	if (root.includes('?')) {
		const [routeBase, extraQuery] = routePath.split('?');
		const url = `${root}${routeBase}`;
		return extraQuery ? `${url}&${extraQuery}` : url;
	}

	return `${root}${routePath}`;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const { nonce } = getConfig();

	const response = await fetch(buildUrl(path), {
		...options,
		headers: {
			'Content-Type': 'application/json',
			'X-WP-Nonce': nonce,
			...(options.headers ?? {}),
		},
	});

	const data = await response.json();

	if (!response.ok) {
		const message = typeof data?.message === 'string' ? data.message : 'Something went wrong.';
		throw new Error(message);
	}

	return data as T;
}

export function startNewGame(): Promise<NewGameResponse> {
	return request<NewGameResponse>('/game/new', { method: 'POST' });
}

export function submitGuess(
	gameId: string,
	guess: string,
	playerUuid: string,
	displayName: string,
	durationSeconds?: number
): Promise<GuessResponse> {
	return request<GuessResponse>(`/game/${gameId}/guess`, {
		method: 'POST',
		body: JSON.stringify({
			guess,
			player_uuid: playerUuid,
			display_name: displayName,
			duration_seconds: durationSeconds,
		}),
	});
}

export function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
	return request<LeaderboardEntry[]>('/leaderboard', { method: 'GET' });
}

export interface AppearanceSettings {
	color_bg: string;
	color_surface: string;
	color_border: string;
	color_muted: string;
	color_correct: string;
	color_present: string;
	color_absent: string;
	color_text: string;
	color_key: string;
	color_key_text: string;
}

export function getAppearance(): Promise<AppearanceSettings> {
	return apiFetch({ namespace: NAMESPACE, endpoint: '/admin/appearance', method: 'GET' });
}

export function saveAppearance(settings: AppearanceSettings): Promise<AppearanceSettings> {
	return apiFetch({ namespace: NAMESPACE, endpoint: '/admin/appearance', method: 'POST', data: settings });
}