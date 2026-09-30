import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { cn } from '../../utils/cn';
import { formatChips, getLevelNumber } from '../../utils/tournament';

export const BlindsList: React.FC = () => {
    const blindsStructure = useGameStore(s => s.blindsStructure);
    const currentLevelIndex = useGameStore(s => s.currentLevelIndex);
    const currentRef = useRef<HTMLDivElement>(null);

    // Mantener visible el nivel en curso (desplazando solo el panel, no la página)
    useEffect(() => {
        const el = currentRef.current;
        const container = el?.closest<HTMLElement>('[data-scroll-container]');
        if (!el || !container) return;
        // El contenedor es `relative`, así que offsetTop es relativo a él
        container.scrollTo({ top: el.offsetTop - container.clientHeight / 3, behavior: 'smooth' });
    }, [currentLevelIndex]);

    return (
        <div className="space-y-1">
            {blindsStructure.map((level, index) => {
                const isCurrent = index === currentLevelIndex;
                const isPast = index < currentLevelIndex;
                const isBreak = level.type === 'break';

                return (
                    <div
                        key={level.id}
                        ref={isCurrent ? currentRef : undefined}
                        aria-current={isCurrent ? 'step' : undefined}
                        className={cn(
                            'flex justify-between items-center px-2.5 py-2 rounded-lg text-sm border border-transparent',
                            isCurrent && !isBreak && 'bg-primary/15 border-primary/60 text-white',
                            isCurrent && isBreak && 'bg-warning/15 border-warning/60 text-warning',
                            !isCurrent && isPast && 'text-gray-600',
                            !isCurrent && !isPast && (isBreak ? 'text-warning/70' : 'text-gray-300'),
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <span className="font-mono w-6 text-[11px] opacity-60">{isBreak ? '☕' : getLevelNumber(blindsStructure, index)}</span>
                            {isBreak ? (
                                <span className="font-bold tracking-wider uppercase text-xs">Descanso</span>
                            ) : (
                                <span className={cn('font-bold tabular', isPast && 'line-through decoration-white/20')}>
                                    {formatChips(level.smallBlind)} / {formatChips(level.bigBlind)}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-xs tabular">
                            {!isBreak && level.ante > 0 && <span className={isPast ? '' : 'text-accent'}>A {formatChips(level.ante)}</span>}
                            <span className="opacity-60 w-8 text-right">{level.duration}m</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
