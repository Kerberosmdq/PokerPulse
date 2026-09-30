import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { chipsToColorUp, formatChips, formatShort } from '../../utils/tournament';
import { cn } from '../../utils/cn';

export const PokerChip: React.FC<{ color: string; value: number; size?: number; className?: string }> = ({ color, value, size = 44, className }) => {
    const edge = color.toLowerCase() === '#000000' || color.toLowerCase() === '#111111' ? '#3a3a3a' : color;
    return (
        <div className={cn('relative rounded-full shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.5)]', className)} style={{ width: size, height: size }}>
            <div
                className="absolute inset-0 rounded-full border-dashed"
                style={{ borderColor: edge, borderWidth: size * 0.13, backgroundColor: '#1a1a1a', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)' }}
            />
            <div className="absolute rounded-full flex items-center justify-center" style={{ inset: size * 0.2, backgroundColor: edge }}>
                <div className="w-[88%] h-[88%] rounded-full bg-[#141414] flex items-center justify-center border border-white/10">
                    <span className="font-black text-white tracking-tighter" style={{ fontSize: Math.max(7, size * 0.22) }}>{formatShort(value)}</span>
                </div>
            </div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/15 to-transparent pointer-events-none" />
        </div>
    );
};

export const ChipList: React.FC = () => {
    const chipValues = useGameStore(s => s.chipValues);
    const blindsStructure = useGameStore(s => s.blindsStructure);
    const currentLevelIndex = useGameStore(s => s.currentLevelIndex);

    const sortedChips = [...chipValues].filter(c => c.value > 0).sort((a, b) => a.value - b.value);
    const obsolete = new Set(chipsToColorUp(chipValues, blindsStructure, currentLevelIndex).map(c => c.value));

    // Franja horizontal: con muchas denominaciones se achican para no pasar de dos filas
    const many = sortedChips.length > 7;

    return (
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
            {sortedChips.map((chip) => {
                const retire = obsolete.has(chip.value);
                return (
                    <div
                        key={`${chip.color}-${chip.value}`}
                        className={cn(
                            'flex items-center gap-2 rounded-full border pl-1 pr-3 py-1',
                            retire ? 'border-dashed border-white/10 opacity-45' : 'bg-surface-light/40 border-white/5'
                        )}
                        title={retire ? 'Ya no hace falta: se puede retirar en el próximo descanso' : undefined}
                    >
                        <PokerChip color={chip.color} value={chip.value} size={many ? 26 : 32} />
                        <div className="leading-tight">
                            <div className={cn('font-bold text-white font-mono tabular', many ? 'text-xs' : 'text-sm')}>{formatChips(chip.value)}</div>
                            {retire && <div className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Retirar</div>}
                        </div>
                    </div>
                );
            })}
            {sortedChips.length === 0 && <span className="text-xs text-gray-500">Sin fichas configuradas</span>}
        </div>
    );
};
