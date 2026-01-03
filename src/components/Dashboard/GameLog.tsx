import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Share2 } from 'lucide-react';
import { Button } from '../ui/Button';

export const GameLog: React.FC = () => {
    const { gameLog, gameState } = useGameStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [gameLog]);

    const handleExport = () => {
        // Basic export logic for now
        const text = gameLog.map(l => `[${new Date(l.timestamp).toLocaleTimeString()}] ${l.description}`).join('\n');
        navigator.clipboard.writeText(text);
        alert('¡Log copiado al portapapeles!');
    };

    return (
        <div className="h-full flex flex-col relative">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-gray-400 font-bold uppercase text-xs tracking-widest">Registro de Partida</h3>
                {gameState === 'finished' && (
                    <Button size="sm" variant="ghost" onClick={handleExport} className="h-6 text-xs">
                        <Share2 className="w-3 h-3 mr-1" /> Compartir
                    </Button>
                )}
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto space-y-1 text-xs font-mono text-gray-400 custom-scrollbar pr-2"
            >
                {gameLog.length === 0 && <div className="text-gray-600 italic">No hay eventos aún...</div>}
                {gameLog.map((entry) => (
                    <div key={entry.id} className="flex gap-2 hover:bg-surface-light/50 p-1 rounded">
                        <span className="text-gray-600 shrink-0">
                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={
                            entry.action === 'BUST_OUT' ? 'text-accent' :
                                entry.action === 'REBUY' ? 'text-secondary' :
                                    entry.action === 'LEVEL_UP' ? 'text-primary' :
                                        'text-gray-300'
                        }>
                            {entry.description}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
