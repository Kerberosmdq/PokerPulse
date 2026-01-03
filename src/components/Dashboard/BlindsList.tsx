import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { cn } from '../ui/Button';

export const BlindsList: React.FC = () => {
    const { blindsStructure, currentLevelIndex } = useGameStore();

    return (
        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            {blindsStructure.map((level, index) => {
                const isCurrent = index === currentLevelIndex;
                const isPast = index < currentLevelIndex;

                return (
                    <div
                        key={level.id}
                        className={cn(
                            'flex justify-between items-center p-2 rounded text-sm transition-colors',
                            {
                                'bg-primary/20 border border-primary text-white': isCurrent && level.type !== 'break',
                                'bg-yellow-500/20 border border-yellow-500 text-yellow-400': isCurrent && level.type === 'break',
                                'text-gray-500': isPast,
                                'text-gray-300': !isCurrent && !isPast && level.type !== 'break',
                                'text-yellow-500/70': !isCurrent && !isPast && level.type === 'break',
                            }
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <span className="font-mono w-6 text-xs opacity-50">#{index + 1}</span>
                            {level.type === 'break' ? (
                                <span className="font-bold tracking-wider uppercase">DESCANSO</span>
                            ) : (
                                <span className="font-bold">
                                    {level.smallBlind.toLocaleString()} / {level.bigBlind.toLocaleString()}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                            {level.type === 'level' && level.ante > 0 && <span className="text-accent">Ante {level.ante}</span>}
                            <span className="opacity-70">{level.duration}m</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
