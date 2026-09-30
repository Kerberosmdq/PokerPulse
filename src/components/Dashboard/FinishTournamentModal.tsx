import React, { useMemo, useState } from 'react';
import { Trophy, AlertTriangle, Copy, Crosshair } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { toast } from '../../store/toastStore';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { formatMoney, getStandings, getTournamentStats, ordinalPlace, placeMedal } from '../../utils/tournament';
import { unclaimedBounties } from '../../utils/rules';
import { usePrizes } from '../../hooks/usePrizes';
import { saveHistoryEntry } from '../../utils/history';

export const FinishTournamentModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const players = useGameStore(s => s.players);
    const tournamentName = useGameStore(s => s.tournamentName);
    const tournamentStartedAt = useGameStore(s => s.tournamentStartedAt);

    const { breakdown, payouts: allPayouts } = usePrizes();
    const payouts = allPayouts.slice(0, Math.max(1, players.length));
    const standings = useMemo(() => getStandings(players), [players]);
    const stats = getTournamentStats(players);

    // Sugerencia inicial: la clasificación actual (fichas y orden de eliminación)
    const [selected, setSelected] = useState<string[]>(() => payouts.map((_, i) => standings[i]?.player.id ?? ''));

    const nameOf = (id: string) => players.find(p => p.id === id)?.name ?? '';
    const winners = payouts
        .map((p, i) => ({ position: p.place, name: nameOf(selected[i] ?? ''), prize: p.amount }))
        .filter(w => w.name);

    // Bounties: lo que cobró cada uno, y lo que quedó sin cobrar (su propia cabeza y eliminaciones
    // sin autor registrado) se lo lleva el campeón
    const championId = selected[0];
    const leftover = unclaimedBounties(players);
    const bounties = players
        .map(p => ({ name: p.name, amount: (p.bountyEarnings || 0) + (p.id === championId ? leftover : 0), count: p.bountiesWon || 0 }))
        .filter(b => b.amount > 0)
        .sort((a, b) => b.amount - a.amount);

    const summaryText = () => {
        const title = tournamentName || 'Torneo NexPulse';
        const lines = winners.map(w => `${placeMedal(w.position)} ${w.name} — ${formatMoney(w.prize)}`);
        const bountyLines = bounties.length > 0
            ? `\n\n🎯 Bounties\n${bounties.map(b => `${b.name} — ${formatMoney(b.amount)}`).join('\n')}`
            : '';
        return `🏆 ${title}\nPremios: ${formatMoney(breakdown.net)} · ${stats.total} jugadores\n\n${lines.join('\n')}${bountyLines}`;
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
            name: tournamentName || undefined,
            prizePool: breakdown.net,
            rake: breakdown.rake || undefined,
            bounties: bounties.length > 0 ? bounties.map(({ name, amount }) => ({ name, amount })) : undefined,
            totalPlayers: players.length,
            rebuysCount: stats.rebuys,
            addonsCount: stats.addons,
            winners,
        }, tournamentStartedAt);
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
                    <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Premios</span>
                    <span className="text-sm font-bold text-primary font-mono">{formatMoney(breakdown.net)}</span>
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

            {bounties.length > 0 && (
                <div className="mt-5">
                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Crosshair className="w-3.5 h-3.5 text-accent" /> Bounties</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {bounties.map(b => (
                            <div key={b.name} className="flex justify-between items-center bg-white/[0.02] border border-white/5 px-3 py-2 rounded-lg text-sm">
                                <span className="truncate">{b.name} {b.count > 0 && <span className="text-[10px] text-gray-500">×{b.count}</span>}</span>
                                <span className="font-mono font-bold text-accent">{formatMoney(b.amount)}</span>
                            </div>
                        ))}
                    </div>
                    {leftover > 0 && <p className="text-[11px] text-gray-500 mt-2">Incluye {formatMoney(leftover)} de bounties sin cobrar para el campeón.</p>}
                </div>
            )}

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
