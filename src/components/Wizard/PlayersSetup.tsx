import React, { useRef, useState } from 'react';
import { Plus, X, Users } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { formatChips, formatMoney } from '../../utils/tournament';

/** Inscripción rápida antes de empezar (también se puede anotar gente durante el torneo). */
export const PlayersSetup: React.FC = () => {
    const players = useGameStore(s => s.players);
    const playerHistory = useGameStore(s => s.playerHistory);
    const buyIn = useGameStore(s => s.buyIn);
    const startingStack = useGameStore(s => s.startingStack);
    const prizePool = useGameStore(s => s.prizePool);
    const { addPlayer, deletePlayer } = useGameStore.getState();
    const [name, setName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const taken = new Set(players.map(p => p.name.toLowerCase()));
    const available = playerHistory.filter(n => !taken.has(n.toLowerCase()));
    const isDuplicate = taken.has(name.trim().toLowerCase());

    const add = (n: string) => {
        const clean = n.trim();
        if (!clean || taken.has(clean.toLowerCase())) return;
        addPlayer(clean);
        setName('');
        inputRef.current?.focus();
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Jugadores</h2>
                    <p className="text-xs text-gray-500 mt-1">
                        Cada uno entra con {formatChips(startingStack)} fichas por {formatMoney(buyIn)}. Podés sumar más durante el torneo.
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Pozo inicial</div>
                    <div className="text-2xl font-black text-primary font-mono">{formatMoney(prizePool)}</div>
                </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); add(name); }} className="flex gap-2">
                <input
                    ref={inputRef}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre y Enter"
                    aria-label="Nombre del jugador"
                    autoFocus
                    className="flex-1 h-12 rounded-xl border border-white/10 bg-black/30 px-4 text-base text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                />
                <Button type="submit" className="h-12" disabled={!name.trim() || isDuplicate}>
                    <Plus className="w-5 h-5" /> Agregar
                </Button>
            </form>
            {isDuplicate && <p className="text-xs text-accent -mt-3">Ya está anotado.</p>}

            {available.length > 0 && (
                <div>
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Jugadores habituales</div>
                    <div className="flex flex-wrap gap-2">
                        {available.map(n => (
                            <button key={n} onClick={() => add(n)} className="text-sm px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:border-primary/60 hover:text-white transition-colors">
                                + {n}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-black/20 border border-white/5 rounded-2xl p-4 min-h-32">
                {players.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center text-gray-500 py-6 gap-2">
                        <Users className="w-8 h-8 opacity-40" />
                        <span className="text-sm">Todavía no hay nadie anotado.</span>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {players.map((p, i) => (
                            <span key={p.id} className="flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-sm text-white">
                                <span className="text-[10px] font-mono text-primary">{i + 1}</span>
                                {p.name}
                                <button onClick={() => deletePlayer(p.id)} aria-label={`Quitar a ${p.name}`} className="w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
