import apiFetch from '@wordpress/api-fetch';
import type {
	BulkImportResult,
	LeaderboardEntry,
	StatsResponse,
	WordRow,
	WordsListResponse,
} from '../types';

const NAMESPACE = 'wordsprint/v1';

function getRootUrl(): string {
	return window.wordsprintAdminConfig.root;
}

function getNonce(): string {
	return window.wordsprintAdminConfig.nonce;
}

apiFetch.use( ( options, next ) => {
	return next( {
		...options,
		headers: {
			...options.headers,
			'X-WP-Nonce': getNonce(),
		},
	} );
} );

apiFetch.use( ( options, next ) => {
	if ( options.url ) return next( options );
	const root = getRootUrl().replace( /\/$/, '' );
	const ns   = options.namespace ?? NAMESPACE;
	const ep   = ( options.endpoint ?? '' ).replace( /^\//, '' );
	return next( {
		...options,
		url: `${ root }/${ ns }/${ ep }`,
	} );
} );

export function listWords( params: { search?: string; page?: number; per_page?: number } ): Promise<WordsListResponse> {
	const query = new URLSearchParams();
	if ( params.search ) query.set( 'search', params.search );
	if ( params.page ) query.set( 'page', String( params.page ) );
	if ( params.per_page ) query.set( 'per_page', String( params.per_page ) );
	return apiFetch( { namespace: NAMESPACE, endpoint: `/admin/words?${ query.toString() }`, method: 'GET' } );
}

export function createWord( word: string ): Promise<WordRow> {
	return apiFetch( { namespace: NAMESPACE, endpoint: '/admin/words', method: 'POST', data: { word } } );
}

export function bulkImportWords( words: string ): Promise<BulkImportResult> {
	return apiFetch( { namespace: NAMESPACE, endpoint: '/admin/words/bulk', method: 'POST', data: { words } } );
}

export function updateWord(
	id: number,
	changes: Partial<Pick<WordRow, 'word' | 'is_active'>>
): Promise<{ id: number; updated: string[] }> {
	return apiFetch( { namespace: NAMESPACE, endpoint: `/admin/words/${ id }`, method: 'PUT', data: changes } );
}

export function deleteWord( id: number ): Promise<{ id: number; deleted: boolean }> {
	return apiFetch( { namespace: NAMESPACE, endpoint: `/admin/words/${ id }`, method: 'DELETE' } );
}

export function getStats(): Promise<StatsResponse> {
	return apiFetch( { namespace: NAMESPACE, endpoint: '/admin/stats', method: 'GET' } );
}

export function getLeaderboard(): Promise<LeaderboardEntry[]> {
	return apiFetch( { namespace: NAMESPACE, endpoint: '/leaderboard', method: 'GET' } );
}

// Shared font options (used for both tile font and title font)
export const FONT_OPTIONS: { value: string; label: string; stack: string }[] = [
	{ value: 'system',        label: 'System default',   stack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
	{ value: 'inter',         label: 'Inter',             stack: "'Inter', sans-serif" },
	{ value: 'roboto',        label: 'Roboto',            stack: "'Roboto', sans-serif" },
	{ value: 'lato',          label: 'Lato',              stack: "'Lato', sans-serif" },
	{ value: 'montserrat',    label: 'Montserrat',        stack: "'Montserrat', sans-serif" },
	{ value: 'merriweather',  label: 'Merriweather',      stack: "'Merriweather', serif" },
	{ value: 'playfair',      label: 'Playfair Display',  stack: "'Playfair Display', serif" },
	{ value: 'sourcecodepro', label: 'Source Code Pro',   stack: "'Source Code Pro', monospace" },
];


// Title size options
export type TitleFontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const TITLE_SIZE_OPTIONS: { value: TitleFontSize; label: string; px: string }[] = [
	{ value: 'xs', label: 'XS', px: '11px' },
	{ value: 'sm', label: 'SM', px: '13px' },
	{ value: 'md', label: 'MD', px: '16px' },
	{ value: 'lg', label: 'LG', px: '22px' },
	{ value: 'xl', label: 'XL', px: '30px' },
];

// Game settings
export type TileShape = 'rounded' | 'square';

export interface GameSettings {
	game_title:        string;
	font_family:       string;
	tile_shape:        TileShape;
	title_font_family: string;
	title_font_size:   TitleFontSize;
}

export function getSettings(): Promise<GameSettings> {
	return apiFetch( { namespace: NAMESPACE, endpoint: '/admin/settings', method: 'GET' } );
}

export function saveSettings( settings: GameSettings ): Promise<GameSettings> {
	return apiFetch( { namespace: NAMESPACE, endpoint: '/admin/settings', method: 'POST', data: settings } );
}

export function bulkDeleteWords( ids: number[] ): Promise<{ deleted_count: number; ids: number[] }> {
	return apiFetch( { namespace: NAMESPACE, endpoint: '/admin/words/bulk-delete', method: 'POST', data: { ids } } );
}

export function buildExportUrl( params: { format: 'csv' | 'txt'; filter?: string; ids?: number[] } ): string {
	const root = getRootUrl().replace( /\/$/, '' );
	const query = new URLSearchParams();
	query.set( 'format', params.format );
	if ( params.filter ) query.set( 'filter', params.filter );
	if ( params.ids?.length ) query.set( 'ids', params.ids.join( ',' ) );
	return `${ root }/${ NAMESPACE }/admin/words/export?${ query.toString() }`;
}

export function triggerDownload( url: string ): void {
	const a = document.createElement( 'a' );
	a.href = url;
	a.download = '';
	document.body.appendChild( a );
	a.click();
	document.body.removeChild( a );
}