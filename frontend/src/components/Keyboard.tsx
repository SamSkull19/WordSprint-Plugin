import type { CSSProperties } from 'react';
import { toLetter } from '../lib/engine';
import type { KeyMap, Letter, TileStatus } from '../types';

const ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
] as const;

interface KeyboardProps {
    keyMap: KeyMap;
    onLetter: (l: Letter) => void;
    onDelete: () => void;
    onSubmit: () => void;
}

const KEY_BASE =
    'flex-1 flex h-12 min-h-11 sm:h-[58px] basis-0 items-center justify-center rounded px-1 text-[0.85rem] sm:text-[0.9rem] font-bold uppercase cursor-pointer select-none transition-[background,transform] active:scale-[0.96] touch-manipulation [-webkit-tap-highlight-color:transparent]';

function keyStyle(status?: TileStatus): CSSProperties {
    if (status === 'correct') return { backgroundColor: 'var(--color-correct)', color: 'var(--color-text)' };
    if (status === 'present') return { backgroundColor: 'var(--color-present)', color: 'var(--color-text)' };
    if (status === 'absent') return { backgroundColor: 'var(--color-absent)', color: 'var(--color-text)' };
    return { backgroundColor: 'var(--color-key)', color: 'var(--color-key-text)' };
}

export default function Keyboard({ keyMap, onLetter, onDelete, onSubmit }: KeyboardProps) {
    const handleClick = (key: string) => {
        if (key === '⌫') { onDelete(); return; }
        if (key === 'ENTER') { onSubmit(); return; }
        onLetter(toLetter(key));
    };

    return (
        <div className="flex w-full max-w-125 flex-col items-stretch gap-1.5 sm:gap-2" aria-label="On-screen keyboard">
            {
                ROWS.map((row, i) => (
                    <div className="flex w-full gap-1 sm:gap-1.5" key={i}>
                        {
                            row.map((key) => {
                                const lkey = key.toLowerCase() as Letter;
                                const status = keyMap[lkey] ?? keyMap[key.toUpperCase() as Letter];
                                const isWide = key === 'ENTER' || key === '⌫';

                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        className={`${KEY_BASE}${isWide ? ' grow-[1.5] text-[0.65rem] sm:text-[0.7rem]' : ''}`}
                                        style={keyStyle(status)}
                                        onClick={() => handleClick(key)}
                                        aria-label={key === '⌫' ? 'Backspace' : key === 'ENTER' ? 'Enter' : key}
                                    >
                                        {key}
                                    </button>
                                );
                            })
                        }
                    </div>
                ))
            }
        </div>
    );
}
