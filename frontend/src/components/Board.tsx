import { useRef } from '@wordpress/element';
import type { EvaluatedRow, Letter } from '../types';
import Tile from './Tile';

const ROWS = 6;
const COLS = 5;

const FLIP_STAGGER_MS = 250;

interface BoardProps {
	guesses: EvaluatedRow[];
	currentInput: Letter[];
	animatingRowIndex?: number | null;
	onRowFlipComplete?: () => void;
}

export default function Board({ guesses, currentInput, animatingRowIndex = null, onRowFlipComplete }: BoardProps) {
	const completedRef = useRef<{ rowIdx: number; count: number }>({ rowIdx: -1, count: 0 });

	return (
		<div className="mx-auto grid grid-rows-6 gap-1.5" role="grid" aria-label="WordSprint board">
			{
				Array.from({ length: ROWS }, (_, rowIdx) => {
					const guess = guesses[rowIdx];

					if (guess) {
						const isAnimatingRow = rowIdx === animatingRowIndex;

						const handleTileFlipEnd = () => {
							if (completedRef.current.rowIdx !== rowIdx) {
								completedRef.current = { rowIdx, count: 0 };
							}

							completedRef.current.count += 1;

							if (completedRef.current.count >= COLS) {
								onRowFlipComplete?.();
							}
						};

						return (
							<div className="grid grid-cols-5 gap-1.5" key={rowIdx} role="row">
								{
									guess.map((tile, colIdx) => (
										<Tile
											key={colIdx}
											letter={tile.letter}
											status={tile.status}
											shouldFlip={isAnimatingRow}
											flipDelayMs={colIdx * FLIP_STAGGER_MS}
											onFlipEnd={isAnimatingRow ? handleTileFlipEnd : undefined}
										/>
									))
								}
							</div>
						);
					}

					if (rowIdx === guesses.length) {
						return (
							<div className="grid grid-cols-5 gap-1.5" key={rowIdx} role="row">
								{
									Array.from({ length: COLS }, (_col, colIdx) => {
										const letter = currentInput[colIdx];
										return (
											<Tile
												key={colIdx}
												letter={letter ?? ''}
												status={letter ? 'filled' : 'empty'}
											/>
										);
									})
								}
							</div>
						);
					}

					return (
						<div className="grid grid-cols-5 gap-1.5" key={rowIdx} role="row">
							{
								Array.from({ length: COLS }, (_col, colIdx) => (
									<Tile key={colIdx} />
								))
							}
						</div>
					);
				})
			}
		</div>
	);
}
