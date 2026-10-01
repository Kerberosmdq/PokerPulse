import React from 'react';
import { RANKS, gridHand, type HandKey } from '../../poker/cards';
import type { Chart } from '../../poker/advisor';
import { ACTION_STYLE } from './actionStyles';
import { cn } from '../../utils/cn';

/** Etiqueta compacta de la celda: "AK" + "s"/"o" chiquita; las parejas sin sufijo. */
const CellLabel: React.FC<{ hand: HandKey }> = ({ hand }) => {
    const pair = hand.length === 2;
    return (
        <span className="leading-none tracking-tighter">
            {hand[0]}{hand[1]}
            {!pair && <span className="opacity-70" style={{ fontSize: '0.75em' }}>{hand[2]}</span>}
        </span>
    );
};

interface HandGridProps {
    chart: Chart;
    selected?: HandKey | null;
    onSelect?: (hand: HandKey) => void;
    /** Resaltar manos (p. ej. la mano del jugador) */
    className?: string;
}

/**
 * Cuadrícula 13 × 13 de manos iniciales coloreada por acción. Arriba a la derecha las manos del
 * mismo palo, abajo a la izquierda las de distinto palo y en la diagonal las parejas.
 */
export const HandGrid: React.FC<HandGridProps> = ({ chart, selected, onSelect, className }) => (
    <div
        role="grid"
        aria-label="Tabla de manos iniciales"
        className={cn('grid gap-[2px] select-none @container', className)}
        style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}
    >
        {RANKS.map((_, row) => RANKS.map((__, col) => {
            const hand = gridHand(row, col);
            const action = chart[hand] ?? 'fold';
            const style = ACTION_STYLE[action];
            const isSelected = selected === hand;
            return (
                <button
                    key={hand}
                    type="button"
                    role="gridcell"
                    aria-label={`${hand}: ${style.label}`}
                    aria-selected={isSelected}
                    onClick={() => onSelect?.(hand)}
                    className={cn(
                        'aspect-square rounded-[3px] flex items-center justify-center font-bold font-mono transition-transform',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                        isSelected ? 'scale-[1.18] z-10 ring-2 ring-white shadow-[0_0_14px_rgba(255,255,255,0.45)]' : 'hover:scale-[1.08] hover:z-10',
                        row === col && !isSelected && 'ring-1 ring-inset ring-white/15'
                    )}
                    style={{ backgroundColor: style.bg, color: style.text, fontSize: 'clamp(7px, 2.35cqw, 13px)' }}
                >
                    <CellLabel hand={hand} />
                </button>
            );
        }))}
    </div>
);
