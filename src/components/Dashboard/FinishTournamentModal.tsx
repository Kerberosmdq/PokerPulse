import React, { useMemo, useState } from 'react';
import { Trophy, AlertTriangle, Copy } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { toast } from '../../store/toastStore';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { computePayouts, formatMoney, getPayoutPercents, getStandings, getTournamentStats, ordinalPlace, placeMedal } from '../../utils/tournament';
import { saveHistoryEntry } from '../../utils/history';

export const FinishTournamentModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const players = useGameStore(s => s.players);
    const prizePool = useGameStore(s => s.prizePool);
    const payoutStructure = useGameStore(s => s.payoutStructure);
    const customPayouts = useGameStore(s => s.customPayouts);
    const tournamentName = useGameStore(s => s.tournamentName);
    const tournamentStartedAt = useGameStore(s => s.tournamentStartedAt);

    const payouts = computePayouts(prizePool, getPayoutPercents(payoutStructure, customPayouts))
        .slice(0, Math.max(1, players.length));
    const standings = useMemo(() => getStandings(players), [players]);
    const stats = getTournamentStats(players);

    // Sugerencia inicial: la clasificación actual (fichas y orden de eliminación)
    const [selected, setSelected] = useState<string[]>(() => payouts.map((_, i) => standings[i]?.player.id ?? ''));

    const nameOf = (id: string) => players.find(p => p.id === id)?.name ?? '';
    const winners = payouts
        .map((p, i) => ({ position: p.place, name: nameOf(selected[i] ?? ''), prize: p.amount }))
        .filter(w => w.name);

    const summaryText = () => {
        const title = tournamentName || 'Torneo NexPulse';
        const lines = winners.map(w => `${placeMedal(w.position)} ${w.name} — ${formatMoney(w.prize)}`);
        return `🏆 ${title}\nPozo: ${formatMoney(prizePool)} · ${stats.total} jugadores\n\n${lines.join('\n')}`;
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(summaryText());
            toast.success('Resultados copiados: pegalos en el grupo');
        } catch {
            toast.error('No se pudo copiar');
        }
    };

    const handleSave = () => {
        saveHistoryEntry({
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            date: new Date().toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            name: tournamentName || undefined,
            prizePool,
            totalPlayers: players.length,
            rebuysCount: stats.rebuys,
            addonsCount: stats.addons,
            durationMinutes: tournamentStartedAt ? Math.round((Date.now() - tournamentStartedAt) / 60000) : undefined,
            winners,
        });
        useGameStore.getState().resetGame();
        toast.success('Torneo guardado en el historial');
    };

    return (
        <Modal
            onClose={onClose}
            size="lg"
            accent="warning"
            title="Finalizar torneo"
            description="Confirmá el podio. La clasificación se completó según las eliminaciones."
            icon={<Trophy className="w-6 h-6 text-warning" />}
        >
            <div className="grid grid-cols-3 gap-3 bg-black/30 p-4 rounded-xl border border-white/5 text-center">
                <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Pozo</span>
                    <span className="text-sm font-bold text-primary font-mono">{formatMoney(prizePool)}</span>
                </div>
                <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Jugadores</span>
                    <span className="text-sm font-bold text-white font-mono">{stats.total}</span>
                </div>
                <div>
                    <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Re-entradas / Add-ons</span>
                    <span className="text-sm font-bold text-secondary font-mono">{stats.rebuys} / {stats.addons}</span>
                </div>
            </div>

            <div className="space-y-2 mt-5">
                {payouts.map((payout, i) => {
                    const takenElsewhere = new Set(selected.filter((_, j) => j !== i));
                    return (
                        <div key={payout.place} className="flex items-center gap-3 bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                            <span className="text-2xl shrink-0">{placeMedal(payout.place)}</span>
                            <label className="flex-1 min-w-0">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">{ordinalPlace(payout.place)}</span>
                                <select
                                    value={selected[i] ?? ''}
                                    onChange={(e) => setSelected(prev => prev.map((v, j) => (j === i ? e.target.value : v)))}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 text-sm text-white focus:outline-none focus:border-warning/60"
                                >
                                    <option value="">Sin asignar</option>
                                    {players.filter(p => !takenElsewhere.has(p.id)).map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </label>
                            <div className="text-right shrink-0">
                                <span className="text-[10px] text-gray-500 block">Premio</span>
                                <span className="text-sm font-mono font-black text-primary">{formatMoney(payout.amount)}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-warning/5 border border-warning/20 p-3 rounded-lg flex items-start gap-2.5 text-xs text-warning/90 mt-5">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Al guardar, el torneo pasa al historial y la mesa actual se cierra. La configuración (ciegas, fichas, entradas) queda lista para el próximo.</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-5">
                <Button variant="outline" onClick={handleCopy} disabled={winners.length === 0} className="sm:flex-1">
                    <Copy className="w-4 h-4" /> Copiar resultados
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={!selected[0]}
                    className="sm:flex-[2] bg-gradient-to-r from-yellow-400 to-amber-500 text-black"
                >
                    <Trophy className="w-4 h-4" /> Guardar en historial
                </Button>
            </div>
        </Modal>
    );
};
