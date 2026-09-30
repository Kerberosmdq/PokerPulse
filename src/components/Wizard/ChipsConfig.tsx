import React, { useState } from 'react';
import { Trash2, Plus, Calculator, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { NumberField } from '../ui/NumberField';
import { PokerChip } from '../Dashboard/ChipList';
import { formatChips } from '../../utils/tournament';
import type { ChipValue } from '../../types';

// Cantidades objetivo por jugador, de la denominación menor a la mayor
const TARGET_COUNTS = [10, 10, 6, 4, 2];
// Un maletín típico trae ~100 fichas de cada color
const TYPICAL_PER_COLOR = 100;

/** Reparto sugerido: pocas fichas chicas para las ciegas y el resto en las grandes. */
const suggestDistribution = (chips: ChipValue[], stack: number) => {
    const sorted = chips.filter(c => c.value > 0).sort((a, b) => a.value - b.value);
    if (sorted.length === 0) return { distribution: [], remainder: stack };

    let remaining = stack;
    const distribution = sorted.map((chip, i) => {
        const isLast = i === sorted.length - 1;
        const count = isLast
            ? Math.floor(remaining / chip.value)
            : Math.min(TARGET_COUNTS[i] ?? 2, Math.floor(remaining / chip.value));
        remaining -= count * chip.value;
        return { ...chip, count };
    });

    // Completar lo que falte con las denominaciones más chicas posibles
    for (let i = distribution.length - 1; i >= 0 && remaining > 0; i--) {
        const extra = Math.floor(remaining / distribution[i].value);
        distribution[i].count += extra;
        remaining -= extra * distribution[i].value;
    }
    return { distribution, remainder: remaining };
};

export const ChipsConfig: React.FC = () => {
    const chipValues = useGameStore(s => s.chipValues);
    const startingStack = useGameStore(s => s.startingStack);
    const registered = useGameStore(s => s.players.length);
    const { setChipValues, setTournamentSettings } = useGameStore.getState();
    const [playersCount, setPlayersCount] = useState(registered || 8);

    const update = (index: number, patch: Partial<ChipValue>) =>
        setChipValues(chipValues.map((chip, i) => (i === index ? { ...chip, ...patch } : chip)));

    const { distribution, remainder } = suggestDistribution(chipValues, startingStack);
    const duplicates = chipValues.filter((c, i) => c.value > 0 && chipValues.findIndex(o => o.value === c.value) !== i).length > 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 space-y-4">
                <div className="flex justify-between items-start gap-3">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Fichas</h2>
                        <p className="text-xs text-gray-500 mt-1">Colores y valores de tus fichas físicas.</p>
                    </div>
                    <Button onClick={() => setChipValues([...chipValues, { color: '#3b82f6', value: 0 }])} size="sm" variant="outline">
                        <Plus className="w-4 h-4" /> Ficha
                    </Button>
                </div>

                <div className="space-y-2">
                    {chipValues.map((chip, index) => (
                        <div key={index} className="flex items-center gap-3 bg-surface-light/40 border border-white/5 rounded-xl px-3 py-2">
                            <label className="relative cursor-pointer shrink-0" title="Cambiar color">
                                <PokerChip color={chip.color} value={chip.value} size={42} />
                                <input
                                    type="color"
                                    value={chip.color}
                                    onChange={(e) => update(index, { color: e.target.value })}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    aria-label="Color de la ficha"
                                />
                            </label>
                            <label className="flex-1">
                                <span className="sr-only">Valor</span>
                                <NumberField value={chip.value} onValueChange={(v) => update(index, { value: v })} className="h-9 font-bold" />
                            </label>
                            <button
                                onClick={() => setChipValues(chipValues.filter((_, i) => i !== index))}
                                aria-label="Quitar ficha"
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-accent hover:bg-accent/10"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
                {duplicates && <p className="text-xs text-warning">Hay dos fichas con el mismo valor.</p>}
            </div>

            <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-accent" />
                    <h2 className="text-xl font-bold text-white">Reparto por jugador</h2>
                </div>

                <div className="bg-black/20 p-5 rounded-2xl border border-white/10 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Stack inicial</span>
                            <NumberField value={startingStack} onValueChange={(v) => setTournamentSettings({ startingStack: v })} min={1} />
                        </label>
                        <label className="block">
                            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Jugadores</span>
                            <NumberField value={playersCount} onValueChange={setPlayersCount} min={1} max={200} />
                        </label>
                    </div>

                    {remainder > 0 ? (
                        <div className="bg-accent/10 border border-accent/30 p-3 rounded-lg flex items-start gap-2.5 text-xs text-accent">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>Con estas fichas no se llega exacto al stack: faltan <b className="font-mono">{formatChips(remainder)}</b>. Agregá una ficha de menor valor o ajustá el stack.</span>
                        </div>
                    ) : (
                        <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg flex items-center gap-2.5 text-xs text-primary">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>Cada jugador recibe exactamente {formatChips(startingStack)}.</span>
                        </div>
                    )}

                    <div className="divide-y divide-white/5 bg-black/20 rounded-xl border border-white/5">
                        {distribution.filter(d => d.count > 0).map((item) => {
                            const physical = item.count * playersCount;
                            const tooMany = physical > TYPICAL_PER_COLOR;
                            return (
                                <div key={`${item.color}-${item.value}`} className="p-3 flex items-center justify-between gap-3 text-sm">
                                    <div className="flex items-center gap-3">
                                        <PokerChip color={item.color} value={item.value} size={30} />
                                        <div>
                                            <div className="font-bold text-white">{item.count} × {formatChips(item.value)}</div>
                                            <div className="text-[11px] text-gray-500 font-mono">= {formatChips(item.count * item.value)}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-mono text-xs font-bold ${tooMany ? 'text-warning' : 'text-gray-400'}`}>{physical} en total</div>
                                        {tooMany && <div className="text-[10px] text-warning">Más de {TYPICAL_PER_COLOR} de un color</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                        Un maletín estándar de 500 fichas trae unas {TYPICAL_PER_COLOR} por color. Si algún color se pasa, reducí el stack o cambiá las denominaciones.
                    </p>
                </div>
            </div>
        </div>
    );
};
