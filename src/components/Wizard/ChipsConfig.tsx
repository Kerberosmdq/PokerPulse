import React, { useState } from 'react';
import { Trash2, Plus, Minus, Calculator, AlertTriangle, CheckCircle2, Lock, LockOpen, RotateCcw } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { NumberField } from '../ui/NumberField';
import { PokerChip } from '../Dashboard/ChipList';
import { formatChips } from '../../utils/tournament';
import { distributeChips } from '../../utils/chips';
import { cn } from '../../utils/cn';
import type { ChipValue } from '../../types';

// Un maletín típico trae ~100 fichas de cada color
const TYPICAL_PER_COLOR = 100;

export const ChipsConfig: React.FC = () => {
    const chipValues = useGameStore(s => s.chipValues);
    const startingStack = useGameStore(s => s.startingStack);
    const registered = useGameStore(s => s.players.length);
    // Cantidades que el usuario fijó a mano, por valor de ficha (se guardan para verlas durante el torneo)
    const locked = useGameStore(s => s.chipLocks);
    const { setChipValues, setChipLocks: setLocked, setTournamentSettings } = useGameStore.getState();
    const [playersCount, setPlayersCount] = useState(registered || 8);

    const setCount = (value: number, count: number) => setLocked({ ...locked, [value]: Math.max(0, count) });
    const unlock = (value: number) => {
        const next = { ...locked };
        delete next[value];
        setLocked(next);
    };

    const update = (index: number, patch: Partial<ChipValue>) =>
        setChipValues(chipValues.map((chip, i) => (i === index ? { ...chip, ...patch } : chip)));

    const { distribution, remainder, excess } = distributeChips(chipValues, startingStack, locked);
    const hasLocks = distribution.some(d => d.locked);
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

                    {excess > 0 ? (
                        <div className="bg-accent/10 border border-accent/30 p-3 rounded-lg flex items-start gap-2.5 text-xs text-accent">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>Las cantidades fijas se pasan del stack por <b className="font-mono">{formatChips(excess)}</b>. Bajá alguna o subí el stack.</span>
                        </div>
                    ) : remainder > 0 ? (
                        <div className="bg-accent/10 border border-accent/30 p-3 rounded-lg flex items-start gap-2.5 text-xs text-accent">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>Con estas fichas no se llega exacto al stack: faltan <b className="font-mono">{formatChips(remainder)}</b>. {hasLocks ? 'Soltá algún candado para que se recalcule, o ajustá las cantidades.' : 'Agregá una ficha de menor valor o ajustá el stack.'}</span>
                        </div>
                    ) : (
                        <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg flex items-center gap-2.5 text-xs text-primary">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>Cada jugador recibe exactamente {formatChips(startingStack)}.</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-2 -mb-1">
                        <p className="text-[11px] text-gray-500">Tocá una cantidad para fijarla: las demás se recalculan solas.</p>
                        {hasLocks && (
                            <button onClick={() => setLocked({})} className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline flex items-center gap-1 shrink-0">
                                <RotateCcw className="w-3 h-3" /> Automático
                            </button>
                        )}
                    </div>

                    <div className="divide-y divide-white/5 bg-black/20 rounded-xl border border-white/5">
                        {distribution.map((item) => {
                            const physical = item.count * playersCount;
                            const tooMany = physical > TYPICAL_PER_COLOR;
                            return (
                                <div key={item.value} className={cn('p-3 flex items-center gap-3 text-sm', item.locked && 'bg-primary/[0.04]')}>
                                    <PokerChip color={item.color} value={item.value} size={30} />
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setCount(item.value, item.count - 1)}
                                            disabled={item.count === 0}
                                            aria-label={`Una ficha de ${item.value} menos`}
                                            className="w-7 h-7 rounded-md border border-white/10 flex items-center justify-center text-gray-300 hover:bg-white/10 disabled:opacity-30"
                                        >
                                            <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <NumberField
                                            aria-label={`Cantidad de fichas de ${item.value}`}
                                            value={item.count}
                                            onValueChange={(v) => setCount(item.value, v)}
                                            max={999}
                                            className={cn('w-14 h-8 text-center px-1 font-bold', item.locked && 'border-primary/50 text-primary')}
                                        />
                                        <button
                                            onClick={() => setCount(item.value, item.count + 1)}
                                            aria-label={`Una ficha de ${item.value} más`}
                                            className="w-7 h-7 rounded-md border border-white/10 flex items-center justify-center text-gray-300 hover:bg-white/10"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-bold text-white">× {formatChips(item.value)}</div>
                                        <div className="text-[11px] text-gray-500 font-mono">= {formatChips(item.count * item.value)}</div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className={`font-mono text-xs font-bold ${tooMany ? 'text-warning' : 'text-gray-400'}`}>{physical} en total</div>
                                        {tooMany && <div className="text-[10px] text-warning">Más de {TYPICAL_PER_COLOR}</div>}
                                    </div>
                                    <button
                                        onClick={() => (item.locked ? unlock(item.value) : setCount(item.value, item.count))}
                                        aria-label={item.locked ? `Soltar la cantidad de ${item.value} (se recalcula)` : `Fijar la cantidad de ${item.value}`}
                                        title={item.locked ? 'Fija: tocá para que se recalcule sola' : 'Automática: tocá para fijarla'}
                                        aria-pressed={item.locked}
                                        className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors', item.locked ? 'text-primary bg-primary/10' : 'text-gray-600 hover:text-gray-300 hover:bg-white/5')}
                                    >
                                        {item.locked ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
                                    </button>
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
