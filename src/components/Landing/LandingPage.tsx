import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { Play, Trophy, Users, Clock, Trash2, Calendar, Coins, Award, Tv, Smartphone, Shuffle } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { ConfirmModal } from '../ui/ConfirmModal';
import { formatMoney, placeMedal } from '../../utils/tournament';
import { getPlayerRecords, loadHistory, saveHistory, sortHistory } from '../../utils/history';
import type { TournamentHistoryEntry } from '../../types';

const FEATURES = [
    { icon: Clock, color: 'text-primary', title: 'Reloj de ciegas', text: 'Niveles, descansos, anuncios por voz y generador automático de estructuras.' },
    { icon: Users, color: 'text-secondary', title: 'Jugadores y pozo', text: 'Entradas, re-entradas, add-ons y eliminaciones con el pozo siempre al día.' },
    { icon: Trophy, color: 'text-warning', title: 'Premios', text: 'Reparto por porcentajes y podio armado solo según el orden de eliminación.' },
    { icon: Tv, color: 'text-secondary', title: 'Modo TV', text: 'Pantalla grande para la tele o un segundo monitor, sincronizada en vivo.' },
    { icon: Smartphone, color: 'text-primary', title: 'Control remoto', text: 'Manejá el reloj y los jugadores desde el celular escaneando un QR.' },
    { icon: Shuffle, color: 'text-accent', title: 'Sorteo de asientos', text: 'Mesas equilibradas automáticamente, sin importar cuántos sean.' },
];

const container: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.12 } } };
const item: Variants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } };

export const LandingPage: React.FC = () => {
    const pendingPlayers = useGameStore(s => s.players.length);
    const { setGameState, resetGame } = useGameStore.getState();
    const [history, setHistory] = useState<TournamentHistoryEntry[]>(() => sortHistory(loadHistory()));
    const [confirm, setConfirm] = useState<{ type: 'entry'; entry: TournamentHistoryEntry } | { type: 'all' } | null>(null);

    const records = useMemo(() => getPlayerRecords(history).slice(0, 8), [history]);
    const accumulated = history.reduce((sum, x) => sum + x.prizePool, 0);
    const maxPrizePool = history.reduce((max, x) => Math.max(max, x.prizePool), 0);

    const applyDelete = () => {
        if (!confirm) return;
        const updated = confirm.type === 'all' ? [] : history.filter(x => x.id !== confirm.entry.id);
        setHistory(updated);
        saveHistory(updated);
        setConfirm(null);
    };

    return (
        <div className="min-h-screen flex flex-col items-center py-16 md:py-20 px-4">
            <motion.div className="flex flex-col items-center max-w-5xl w-full text-center gap-14" variants={container} initial="hidden" animate="visible">
                <div className="flex flex-col items-center gap-4">
                    <motion.div variants={item}>
                        <Logo className="w-36 h-36 md:w-44 md:h-44" />
                    </motion.div>
                    <motion.h1 variants={item} className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-secondary">
                        NEXPULSE
                    </motion.h1>
                    <motion.p variants={item} className="text-lg md:text-xl text-gray-400 max-w-xl">
                        El reloj y gestor de torneos para tus partidas de póker en casa.
                    </motion.p>
                </div>

                <motion.div variants={item} className="flex flex-col sm:flex-row gap-3 items-center">
                    <Button onClick={() => setGameState('setup')} size="lg" className="rounded-full px-10 h-16 text-lg glow-primary">
                        <Play className="w-6 h-6 fill-current" />
                        {pendingPlayers > 0 ? 'Continuar configuración' : 'Nuevo torneo'}
                    </Button>
                    {pendingPlayers > 0 && (
                        <Button variant="ghost" onClick={resetGame} className="rounded-full">
                            Empezar de cero ({pendingPlayers} anotados)
                        </Button>
                    )}
                </motion.div>

                <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                    {FEATURES.map(({ icon: Icon, color, title, text }) => (
                        <div key={title} className="flex flex-col items-center p-6 bg-white/[0.02] rounded-2xl border border-white/5">
                            <Icon className={`w-9 h-9 mb-3 ${color}`} />
                            <h3 className="text-base font-bold mb-1.5">{title}</h3>
                            <p className="text-sm text-gray-400">{text}</p>
                        </div>
                    ))}
                </motion.div>

                {history.length > 0 && (
                    <motion.div variants={item} className="w-full space-y-6 pt-8 border-t border-white/5 text-left">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                                <h2 className="text-2xl font-black text-white">Historial</h2>
                                <p className="text-xs text-gray-500 mt-1">Torneos guardados en este dispositivo.</p>
                            </div>
                            <Button onClick={() => setConfirm({ type: 'all' })} size="sm" variant="ghost" className="text-accent hover:bg-accent/10">
                                <Trash2 className="w-3.5 h-3.5" /> Borrar historial
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <SummaryCard icon={<Trophy className="w-6 h-6" />} tone="text-primary bg-primary/10 border-primary/20" label="Torneos jugados" value={history.length} />
                            <SummaryCard icon={<Coins className="w-6 h-6" />} tone="text-secondary bg-secondary/10 border-secondary/20" label="Premios repartidos" value={formatMoney(accumulated)} />
                            <SummaryCard icon={<Award className="w-6 h-6" />} tone="text-warning bg-warning/10 border-warning/20" label="Pozo récord" value={formatMoney(maxPrizePool)} />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            <div className="lg:col-span-7 space-y-3">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Últimos torneos</h3>
                                {history.map((entry) => {
                                    const champ = entry.winners.find(w => w.position === 1);
                                    return (
                                        <div key={entry.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-white/10 transition-colors group">
                                            <div className="space-y-1.5 min-w-0">
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                                    {entry.name && <span className="font-bold text-gray-300">{entry.name}</span>}
                                                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {entry.date}</span>
                                                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {entry.totalPlayers}</span>
                                                    {entry.durationMinutes !== undefined && (
                                                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {Math.floor(entry.durationMinutes / 60)}h {entry.durationMinutes % 60}m</span>
                                                    )}
                                                </div>
                                                <div className="text-lg font-bold text-white truncate">🏆 {champ?.name ?? '—'}</div>
                                                {entry.winners.length > 1 && (
                                                    <div className="text-xs text-gray-400 flex flex-wrap gap-x-3 gap-y-1">
                                                        {entry.winners.slice(1).map((w) => (
                                                            <span key={w.position}>{placeMedal(w.position)} {w.name} ({formatMoney(w.prize)})</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 self-end sm:self-center">
                                                <div className="text-right">
                                                    <span className="text-[10px] text-gray-500 uppercase font-bold block">Pozo</span>
                                                    <span className="text-xl font-mono font-black text-primary">{formatMoney(entry.prizePool)}</span>
                                                </div>
                                                <button
                                                    onClick={() => setConfirm({ type: 'entry', entry })}
                                                    className="text-gray-600 hover:text-accent p-2 rounded-lg hover:bg-accent/10 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                                    aria-label="Eliminar del historial"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="lg:col-span-5 space-y-3">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ranking de jugadores</h3>
                                <div className="glass-panel rounded-2xl p-2">
                                    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-3 py-2 text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                                        <span>Jugador</span><span className="text-right">Títulos</span><span className="text-right">Cobros</span><span className="text-right">Ganado</span>
                                    </div>
                                    {records.map((r, i) => (
                                        <div key={r.name} className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center px-3 py-2.5 rounded-xl hover:bg-white/[0.03]">
                                            <span className="font-bold text-white truncate">
                                                <span className="inline-block w-6 text-gray-500 font-mono text-xs">{i < 3 ? placeMedal(i + 1) : i + 1}</span>{r.name}
                                            </span>
                                            <span className="text-right font-mono text-warning">{r.wins}</span>
                                            <span className="text-right font-mono text-gray-300">{r.cashes}</span>
                                            <span className="text-right font-mono font-bold text-primary">{formatMoney(r.winnings)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </motion.div>

            <div className="mt-20 text-[10px] text-gray-600 font-mono">v2.0 • NEXPULSE • MADE BY MIGA</div>

            <AnimatePresence>
                {confirm && (
                    <ConfirmModal
                        title={confirm.type === 'all' ? '¿Borrar todo el historial?' : '¿Eliminar este torneo?'}
                        message={confirm.type === 'all'
                            ? `Se eliminan los ${history.length} torneos guardados y el ranking. No se puede deshacer.`
                            : `Se elimina el torneo del ${confirm.entry.date} del historial.`}
                        confirmText="Eliminar"
                        isDestructive
                        onConfirm={applyDelete}
                        onCancel={() => setConfirm(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const SummaryCard: React.FC<{ icon: React.ReactNode; tone: string; label: string; value: React.ReactNode }> = ({ icon, tone, label, value }) => (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
        <div className={`p-3 rounded-xl border shrink-0 ${tone}`}>{icon}</div>
        <div>
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{label}</span>
            <div className="text-2xl font-mono font-black text-white">{value}</div>
        </div>
    </div>
);
