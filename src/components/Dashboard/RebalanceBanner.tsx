import React, { useMemo, useState } from 'react';
import { ArrowRight, Shuffle, Table2, X } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { toast } from '../../store/toastStore';
import { Button } from '../ui/Button';
import { getRebalancePlan } from '../../utils/tables';

/**
 * Aviso cuando las eliminaciones dejan las mesas desparejas: propone quién se cambia de mesa
 * y, si ya entran todos en una, sugiere sortear la mesa final.
 */
export const RebalanceBanner: React.FC<{ onOpenSeating: () => void }> = ({ onOpenSeating }) => {
    const players = useGameStore(s => s.players);
    const seatsPerTable = useGameStore(s => s.seatsPerTable);
    const plan = useMemo(() => getRebalancePlan(players, seatsPerTable), [players, seatsPerTable]);
    const planKey = plan?.moves.map(m => `${m.id}:${m.table}:${m.seat}`).join('|') ?? '';
    // Descartar solo este plan: si cambia la situación, vuelve a aparecer
    const [dismissed, setDismissed] = useState('');

    if (!plan || dismissed === planKey) return null;

    const apply = () => {
        useGameStore.getState().moveSeats(plan.moves.map(({ id, table, seat }) => ({ id, table, seat })));
        toast.success(plan.moves.length === 1 ? `${plan.moves[0].name} cambió de mesa` : `${plan.moves.length} jugadores cambiaron de mesa`);
    };

    const title = plan.finalTable
        ? '¡Mesa final! Todos entran en una mesa'
        : plan.reason === 'break'
            ? `Se puede cerrar la mesa ${plan.brokenTable}`
            : 'Las mesas quedaron desparejas';

    return (
        <div className="mx-4 lg:mx-6 mt-4 rounded-2xl border border-secondary/40 bg-secondary/[0.07] px-5 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="font-bold text-secondary flex items-center gap-2"><Table2 className="w-4 h-4" /> {title}</div>
                    <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-200">
                        {plan.moves.slice(0, 6).map(m => (
                            <li key={m.id} className="flex items-center gap-1.5">
                                <b>{m.name}</b>
                                <span className="text-gray-500 font-mono text-xs">M{m.fromTable}·A{m.fromSeat}</span>
                                <ArrowRight className="w-3 h-3 text-secondary" />
                                <span className="font-mono text-xs text-white">M{m.table}·A{m.seat}</span>
                            </li>
                        ))}
                        {plan.moves.length > 6 && <li className="text-gray-400 text-xs">y {plan.moves.length - 6} más</li>}
                    </ul>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {plan.finalTable && (
                        <Button size="sm" variant="outline" onClick={onOpenSeating}>
                            <Shuffle className="w-3.5 h-3.5" /> Sortear mesa final
                        </Button>
                    )}
                    <Button size="sm" variant="secondary" onClick={apply}>Aplicar cambios</Button>
                    <button onClick={() => setDismissed(planKey)} aria-label="Ocultar aviso" className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
