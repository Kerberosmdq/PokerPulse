import React, { useMemo, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shuffle, Copy, Minus, Plus } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { toast } from '../../store/toastStore';
import type { Player } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { cn } from '../../utils/cn';
import { shuffle } from '../../utils/tournament';
import { soundManager } from '../../utils/audio';

interface Seat { player: Player; table: number; seat: number }

/**
 * Reparte a los jugadores en la menor cantidad de mesas posible y equilibradas (la diferencia
 * entre mesas es de a lo sumo un jugador).
 */
const drawSeats = (players: Player[], seatsPerTable: number): Seat[] => {
    const tables = Math.max(1, Math.ceil(players.length / seatsPerTable));
    const byTable: Player[][] = Array.from({ length: tables }, () => []);
    shuffle(players).forEach((p, i) => byTable[i % tables].push(p));
    return byTable.flatMap((list, t) => {
        // Asientos al azar dentro de la mesa (no siempre 1..n seguidos)
        const seatNumbers = shuffle(Array.from({ length: seatsPerTable }, (_, i) => i + 1)).slice(0, list.length).sort((a, b) => a - b);
        return shuffle(list).map((player, i) => ({ player, table: t + 1, seat: seatNumbers[i] }));
    });
};

export const SeatingDraw: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const players = useGameStore(s => s.players);
    const seatsPerTable = useGameStore(s => s.seatsPerTable);
    const { assignSeats, setTournamentSettings } = useGameStore.getState();
    const alive = useMemo(() => players.filter(p => p.status !== 'busted'), [players]);

    const saved: Seat[] = useMemo(() => alive
        .filter(p => p.table !== undefined && p.seat !== undefined)
        .map(p => ({ player: p, table: p.table!, seat: p.seat! })), [alive]);

    const [preview, setPreview] = useState<Seat[] | null>(null);
    const [isShuffling, setIsShuffling] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

    const seats = preview ?? saved;
    const hasUnseated = alive.some(p => p.table === undefined);
    const tables = [...new Set(seats.map(s => s.table))].sort((a, b) => a - b);

    const handleDraw = () => {
        setIsShuffling(true);
        soundManager.playCardShuffle();
        let count = 0;
        intervalRef.current = setInterval(() => {
            const result = drawSeats(alive, seatsPerTable);
            setPreview(result);
            if (++count >= 10) {
                clearInterval(intervalRef.current!);
                setIsShuffling(false);
                setPreview(null);
                assignSeats(result.map(s => ({ id: s.player.id, table: s.table, seat: s.seat })));
                soundManager.playSuccess();
            }
        }, 100);
    };

    const handleCopy = async () => {
        const text = tables.map(t => {
            const list = seats.filter(s => s.table === t).sort((a, b) => a.seat - b.seat);
            return `Mesa ${t}\n${list.map(s => `  ${s.seat}. ${s.player.name}`).join('\n')}`;
        }).join('\n\n');
        try {
            await navigator.clipboard.writeText(text);
            toast.success('Asientos copiados');
        } catch {
            toast.error('No se pudo copiar');
        }
    };

    return (
        <Modal onClose={onClose} size="xl" title="Sorteo de asientos" description={`${alive.length} jugadores en juego`} accent="primary">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    Asientos por mesa
                    <div className="flex items-center gap-1 bg-black/30 border border-white/10 rounded-lg p-0.5">
                        <button aria-label="Menos asientos" disabled={seatsPerTable <= 2 || isShuffling} onClick={() => setTournamentSettings({ seatsPerTable: seatsPerTable - 1 })} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/10 disabled:opacity-30"><Minus className="w-3.5 h-3.5" /></button>
                        <span className="w-6 text-center font-mono font-bold text-white">{seatsPerTable}</span>
                        <button aria-label="Más asientos" disabled={seatsPerTable >= 10 || isShuffling} onClick={() => setTournamentSettings({ seatsPerTable: seatsPerTable + 1 })} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/10 disabled:opacity-30"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                    <span className="text-xs text-gray-500">→ {Math.max(1, Math.ceil(alive.length / seatsPerTable))} mesa(s)</span>
                </div>
                <div className="flex gap-2">
                    {seats.length > 0 && !isShuffling && (
                        <Button variant="outline" size="sm" onClick={handleCopy}><Copy className="w-3.5 h-3.5" /> Copiar</Button>
                    )}
                    <Button size="sm" onClick={handleDraw} disabled={isShuffling || alive.length < 2}>
                        <Shuffle className={cn('w-4 h-4', isShuffling && 'animate-spin')} />
                        {saved.length > 0 ? 'Volver a sortear' : 'Sortear'}
                    </Button>
                </div>
            </div>

            {alive.length < 2 && <p className="text-center text-sm text-gray-500 py-10">Se necesitan al menos 2 jugadores en juego.</p>}

            {alive.length >= 2 && seats.length === 0 && (
                <div className="text-center py-12 space-y-3">
                    <PokerTable seats={[]} seatsPerTable={seatsPerTable} />
                    <p className="text-sm text-gray-500">Tocá <b className="text-white">Sortear</b> para asignar mesa y asiento a cada jugador.</p>
                </div>
            )}

            {seats.length > 0 && (
                <div className={cn('grid gap-6', tables.length > 1 && 'md:grid-cols-2')}>
                    {tables.map(t => (
                        <div key={t}>
                            {tables.length > 1 && <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Mesa {t}</h3>}
                            <PokerTable seats={seats.filter(s => s.table === t)} seatsPerTable={seatsPerTable} />
                        </div>
                    ))}
                </div>
            )}

            {!isShuffling && saved.length > 0 && hasUnseated && (
                <p className="text-xs text-warning mt-4 text-center">Hay jugadores nuevos sin asiento: volvé a sortear para incluirlos.</p>
            )}
        </Modal>
    );
};

const PokerTable: React.FC<{ seats: Seat[]; seatsPerTable: number }> = ({ seats, seatsPerTable }) => {
    const bySeat = new Map(seats.map(s => [s.seat, s.player]));
    return (
        <div className="relative w-full max-w-2xl mx-auto aspect-[2.1/1] my-8">
            <div className="absolute inset-[12%] rounded-full bg-gradient-to-b from-green-900/40 to-green-950/40 border-[10px] border-[#2a2218] shadow-[0_0_40px_rgba(0,0,0,0.7),inset_0_0_40px_rgba(0,0,0,0.6)]" />
            {Array.from({ length: seatsPerTable }, (_, i) => {
                const seatNum = i + 1;
                const angle = (i / seatsPerTable) * 2 * Math.PI - Math.PI / 2;
                const player = bySeat.get(seatNum);
                return (
                    <div
                        key={seatNum}
                        className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                        style={{ left: `${50 + 44 * Math.cos(angle)}%`, top: `${50 + 42 * Math.sin(angle)}%` }}
                    >
                        <div className={cn(
                            'w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center font-bold relative transition-colors',
                            player ? (player.status === 'away' ? 'bg-surface-light border-warning/60 text-warning' : 'bg-surface-light border-primary/60 text-white') : 'bg-black/40 border-white/5 text-gray-700'
                        )}>
                            {player ? player.name.charAt(0).toUpperCase() : seatNum}
                            {player && (
                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-black text-[10px] font-black flex items-center justify-center border border-black">{seatNum}</span>
                            )}
                        </div>
                        {player && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-1 bg-black/80 px-2 py-0.5 rounded-full text-[11px] font-bold text-white max-w-[90px] truncate border border-white/10"
                            >
                                {player.name}
                            </motion.div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
