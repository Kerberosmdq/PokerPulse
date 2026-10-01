import React from 'react';
import { POSITION_INFO, positionOf } from '../../poker/positions';
import { cn } from '../../utils/cn';

interface MiniTableProps {
    players: number;
    dealerSeat: number;
    /** Asiento resaltado (el jugador o la posición elegida) */
    highlightSeat?: number;
    onSeatClick?: (seat: number) => void;
    /** Texto en el centro del paño */
    center?: React.ReactNode;
    className?: string;
}

/**
 * Mesa ovalada con los asientos en sentido horario (el asiento 0 abajo al centro) y la
 * posición de cada uno según dónde está el dealer.
 */
export const MiniTable: React.FC<MiniTableProps> = ({ players, dealerSeat, highlightSeat, onSeatClick, center, className }) => (
    <div className={cn('relative w-full aspect-[1.75/1]', className)}>
        <div className="absolute inset-[16%_12%] rounded-[50%] bg-gradient-to-b from-emerald-900/50 to-emerald-950/60 border-[6px] border-[#2b2117] shadow-[inset_0_0_30px_rgba(0,0,0,0.6),0_10px_30px_rgba(0,0,0,0.5)] flex items-center justify-center">
            {center && <div className="text-center px-2">{center}</div>}
        </div>

        {Array.from({ length: players }, (_, seat) => {
            const angle = Math.PI / 2 + (seat / players) * 2 * Math.PI;
            const x = 50 + 44 * Math.cos(angle);
            const y = 50 + 40 * Math.sin(angle);
            const position = positionOf(players, dealerSeat, seat);
            const info = POSITION_INFO[position];
            const isHighlight = seat === highlightSeat;
            const isDealer = seat === dealerSeat;
            const isBlind = position === 'SB' || position === 'BB';

            return (
                <button
                    key={seat}
                    type="button"
                    onClick={() => onSeatClick?.(seat)}
                    disabled={!onSeatClick}
                    aria-label={`Asiento ${seat + 1}: ${info.name}${isDealer ? ', dealer' : ''}`}
                    aria-pressed={isHighlight}
                    className={cn(
                        'absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 disabled:cursor-default',
                        onSeatClick && 'cursor-pointer'
                    )}
                    style={{ left: `${x}%`, top: `${y}%` }}
                >
                    <span
                        className={cn(
                            'relative w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 flex items-center justify-center text-[10px] sm:text-xs font-black transition-all',
                            isHighlight
                                ? 'bg-primary text-black border-white scale-110 shadow-[0_0_18px_color-mix(in_oklab,var(--color-primary)_60%,transparent)]'
                                : isBlind
                                    ? 'bg-surface-light text-warning border-warning/40'
                                    : 'bg-surface-light text-gray-200 border-white/15'
                        )}
                    >
                        {info.short}
                        {isDealer && (
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-black text-[10px] font-black flex items-center justify-center border border-gray-300 shadow">
                                D
                            </span>
                        )}
                    </span>
                </button>
            );
        })}
    </div>
);
