import React from 'react';
import { DollarSign, Minus, Plus } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { Modal } from '../ui/Modal';
import { cn } from '../../utils/cn';
import { formatMoney, getTournamentStats, ordinalPlace, PAYOUT_PRESETS, placeMedal } from '../../utils/tournament';
import { usePrizes } from '../../hooks/usePrizes';
import type { PayoutStructure } from '../../types';

const MAX_PLACES = 10;

export const PayoutEditor: React.FC = () => {
    const payoutStructure = useGameStore(s => s.payoutStructure);
    const customPayouts = useGameStore(s => s.customPayouts);
    const { setPayoutStructure, setCustomPayouts } = useGameStore.getState();
    const sum = customPayouts.reduce((s, p) => s + p, 0);

    const options: { id: PayoutStructure; label: string }[] = [
        ...Object.entries(PAYOUT_PRESETS).map(([id, p]) => ({ id: id as PayoutStructure, label: p.label })),
        { id: 'custom', label: 'Personalizado' },
    ];

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-black/30 p-1 rounded-xl border border-white/5" role="radiogroup" aria-label="Estructura de premios">
                {options.map(o => (
                    <button
                        key={o.id}
                        role="radio"
                        aria-checked={payoutStructure === o.id}
                        onClick={() => setPayoutStructure(o.id)}
                        className={cn(
                            'h-9 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors',
                            payoutStructure === o.id ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'
                        )}
                    >
                        {o.label}
                    </button>
                ))}
            </div>

            {payoutStructure === 'custom' && (
                <div className="bg-black/20 border border-white/5 p-3 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Puestos pagos: {customPayouts.length}</span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setCustomPayouts(customPayouts.slice(0, -1))}
                                disabled={customPayouts.length <= 1}
                                aria-label="Quitar puesto"
                                className="w-7 h-7 rounded-md border border-white/10 flex items-center justify-center text-gray-300 hover:bg-white/5 disabled:opacity-30"
                            >
                                <Minus className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => setCustomPayouts([...customPayouts, 0])}
                                disabled={customPayouts.length >= MAX_PLACES}
                                aria-label="Agregar puesto"
                                className="w-7 h-7 rounded-md border border-white/10 flex items-center justify-center text-gray-300 hover:bg-white/5 disabled:opacity-30"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {customPayouts.map((pct, idx) => (
                            <label key={idx} className="flex items-center justify-between gap-2 bg-black/25 px-3 py-1.5 rounded-lg border border-white/5">
                                <span className="text-xs text-gray-400">{placeMedal(idx + 1)} {idx + 1}º</span>
                                <span className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={pct}
                                        onChange={(e) => {
                                            const updated = [...customPayouts];
                                            updated[idx] = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                                            setCustomPayouts(updated);
                                        }}
                                        className="w-12 bg-surface border border-white/10 rounded px-1.5 py-0.5 text-right text-xs font-mono text-white focus:outline-none focus:border-primary"
                                    />
                                    <span className="text-xs text-gray-500">%</span>
                                </span>
                            </label>
                        ))}
                    </div>
                    <div className={cn('flex justify-between items-center text-xs pt-1', sum === 100 ? 'text-primary' : 'text-accent')}>
                        <span>{sum === 100 ? 'Suma correcta' : `Los porcentajes deben sumar 100% (faltan ${100 - sum}%)`}</span>
                        <span className="font-mono font-bold">{sum}%</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export const PrizePool: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const players = useGameStore(s => s.players);
    const rakePercent = useGameStore(s => s.rakePercent);
    const { breakdown, payouts } = usePrizes();
    const stats = getTournamentStats(players);
    const hasExtras = breakdown.bounties > 0 || breakdown.rake > 0 || breakdown.added > 0;

    return (
        <Modal onClose={onClose} size="md" title="Bolsa de premios" accent="primary" icon={<DollarSign className="w-5 h-5 text-primary" />}>
            <div className="text-center py-2">
                <div className="text-5xl font-black text-primary tabular text-glow">{formatMoney(breakdown.net)}</div>
                <div className="text-xs text-gray-500 mt-2">
                    {stats.total} entradas · {stats.rebuys} re-entradas · {stats.addons} add-ons
                </div>
            </div>

            {hasExtras && (
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs bg-black/20 border border-white/5 rounded-xl px-4 py-3">
                    <dt className="text-gray-500">Recaudado</dt><dd className="text-right font-mono text-gray-200">{formatMoney(breakdown.gross)}</dd>
                    {breakdown.bounties > 0 && <><dt className="text-gray-500">Bounties (aparte)</dt><dd className="text-right font-mono text-accent">−{formatMoney(breakdown.bounties)}</dd></>}
                    {breakdown.rake > 0 && <><dt className="text-gray-500">Comisión ({rakePercent}%)</dt><dd className="text-right font-mono text-accent">−{formatMoney(breakdown.rake)}</dd></>}
                    {breakdown.added > 0 && <><dt className="text-gray-500">Agrega la casa (garantizado)</dt><dd className="text-right font-mono text-primary">+{formatMoney(breakdown.added)}</dd></>}
                    <dt className="text-gray-300 font-bold border-t border-white/10 pt-1">Para premios</dt><dd className="text-right font-mono font-bold text-primary border-t border-white/10 pt-1">{formatMoney(breakdown.net)}</dd>
                </dl>
            )}

            <div className="mt-4">
                <PayoutEditor />
            </div>

            <div className="space-y-2 mt-4">
                {payouts.map((payout) => (
                    <div key={payout.place} className="bg-surface-light/60 px-4 py-3 rounded-xl flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{placeMedal(payout.place)}</span>
                            <span className="font-bold text-white text-sm">{ordinalPlace(payout.place)}</span>
                            <span className="text-[11px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{payout.percent}%</span>
                        </div>
                        <div className="text-xl font-mono font-bold text-primary tabular">{formatMoney(payout.amount)}</div>
                    </div>
                ))}
            </div>
        </Modal>
    );
};
