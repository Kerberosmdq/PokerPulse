import React, { useEffect, useRef } from 'react';
import { Copy } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { toast } from '../../store/toastStore';

const ACTION_COLORS: Record<string, string> = {
    BUST_OUT: 'text-accent',
    DELETE_PLAYER: 'text-accent',
    REBUY: 'text-secondary',
    ADDON: 'text-secondary',
    LEVEL_UP: 'text-primary',
    LEVEL_CHANGE: 'text-primary',
    BREAK: 'text-warning',
    ADD_PLAYER: 'text-gray-200',
};

// Eventos del reloj que ensucian el registro sin aportar
const HIDDEN_ACTIONS = new Set(['TIMER_START', 'TIMER_PAUSE']);

export const GameLog: React.FC = () => {
    const gameLog = useGameStore(s => s.gameLog);
    const scrollRef = useRef<HTMLDivElement>(null);
    const visible = gameLog.filter(e => !HIDDEN_ACTIONS.has(e.action));

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [visible.length]);

    const handleCopy = async () => {
        const text = gameLog.map(l => `[${new Date(l.timestamp).toLocaleTimeString()}] ${l.description}`).join('\n');
        try {
            await navigator.clipboard.writeText(text);
            toast.success('Registro copiado al portapapeles');
        } catch {
            toast.error('No se pudo copiar el registro');
        }
    };

    return (
        <div className="h-full flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-gray-500 font-bold uppercase text-xs tracking-[0.2em]">Registro</h3>
                {gameLog.length > 0 && (
                    <button onClick={handleCopy} className="text-[10px] text-gray-500 hover:text-white uppercase tracking-wider font-bold flex items-center gap-1">
                        <Copy className="w-3 h-3" /> Copiar
                    </button>
                )}
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-0.5 text-xs font-mono pr-2 min-h-0">
                {visible.length === 0 && <div className="text-gray-600 italic">Todavía no hay eventos.</div>}
                {visible.map((entry) => (
                    <div key={entry.id} className="flex gap-2 px-1 py-0.5 rounded hover:bg-white/[0.03]">
                        <span className="text-gray-600 shrink-0 tabular">
                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={ACTION_COLORS[entry.action] ?? 'text-gray-400'}>{entry.description}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
