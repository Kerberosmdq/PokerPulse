import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { MAX_PLAYERS, MIN_PLAYERS } from '../../poker/positions';
import { cn } from '../../utils/cn';

export const Chip: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; title?: string; className?: string }> = ({ active, onClick, children, title, className }) => (
    <button
        type="button"
        onClick={onClick}
        title={title}
        aria-pressed={active}
        className={cn(
            'h-9 px-3 rounded-lg text-xs font-bold border transition-colors whitespace-nowrap',
            active ? 'bg-primary text-black border-primary' : 'bg-white/[0.03] border-white/10 text-gray-300 hover:border-white/25 hover:text-white',
            className
        )}
    >
        {children}
    </button>
);

export const ControlRow: React.FC<{ label: string; children: React.ReactNode; extra?: React.ReactNode }> = ({ label, children, extra }) => (
    <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">{label}</div>
            {extra}
        </div>
        <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
);

export const PlayersStepper: React.FC<{ value: number; onChange: (n: number) => void }> = ({ value, onChange }) => (
    <div className="flex items-center gap-1 bg-black/30 border border-white/10 rounded-lg p-0.5 w-fit">
        <button type="button" aria-label="Menos jugadores" disabled={value <= MIN_PLAYERS} onClick={() => onChange(value - 1)} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-white/10 disabled:opacity-30">
            <Minus className="w-4 h-4" />
        </button>
        <span className="w-8 text-center font-mono font-black text-lg" aria-live="polite">{value}</span>
        <button type="button" aria-label="Más jugadores" disabled={value >= MAX_PLAYERS} onClick={() => onChange(value + 1)} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-white/10 disabled:opacity-30">
            <Plus className="w-4 h-4" />
        </button>
    </div>
);
