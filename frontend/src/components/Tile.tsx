import type { CSSProperties } from 'react';
import type { TileStatus } from '../types';

interface TileProps {
	letter?: string;
	status?: TileStatus;
	shouldFlip?: boolean;
	flipDelayMs?: number;
	onFlipEnd?: () => void;
}

const BASE =
	'w-[clamp(48px,15vw,62px)] h-[clamp(48px,15vw,62px)] flex items-center justify-center ' +
	'text-xl sm:text-2xl font-bold uppercase border-2 transition-colors select-none ' +
	'[backface-visibility:hidden] [border-radius:var(--ws-tile-radius,8px)] ' +
	'[font-family:var(--ws-font-family,inherit)]';

const STATUS_VARS: Record<TileStatus, CSSProperties> = {
	correct: { backgroundColor: 'var(--color-correct)', borderColor: 'var(--color-correct)', color: 'var(--color-text)' },
	present: { backgroundColor: 'var(--color-present)', borderColor: 'var(--color-present)', color: 'var(--color-text)' },
	absent:  { backgroundColor: 'var(--color-absent)',  borderColor: 'var(--color-absent)',  color: 'var(--color-text)' },
	filled:  { borderColor: 'var(--color-muted)' },
	empty:   { borderColor: 'var(--color-border)' },
};

export default function Tile( {
	letter      = '',
	status      = 'empty',
	shouldFlip  = false,
	flipDelayMs = 0,
	onFlipEnd,
}: TileProps ) {
	const className =
		`${ BASE }${ status === 'filled' ? ' animate-pop' : '' }${ shouldFlip ? ' animate-flip' : '' }`;

	const style: CSSProperties = {
		...STATUS_VARS[ status ],
		...( shouldFlip ? { animationDelay: `${ flipDelayMs }ms` } : {} ),
	};

	return (
		<div
			className={ className }
			style={ style }
			onAnimationEnd={ shouldFlip ? onFlipEnd : undefined }
		>
			{ letter }
		</div>
	);
}