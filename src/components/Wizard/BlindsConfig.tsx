import React, { useState } from 'react';
import { Trash2, Plus, Settings2, Sparkles, Coffee, RotateCcw, Clock } from 'lucide-react';
import { INITIAL_BLINDS, useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { BlindTemplates } from './BlindTemplates';
import { NumberField } from '../ui/NumberField';
import { cn } from '../../utils/cn';
import { formatChips, getLevelNumber, totalStructureMinutes, validateBlindsStructure } from '../../utils/tournament';
import type { BlindLevel } from '../../types';

const STANDARD_BBS = [
    50, 100, 150, 200, 300, 400, 500, 600, 800, 1000, 1200, 1500, 2000, 2500, 3000, 4000,
    5000, 6000, 8000, 10000, 12000, 15000, 20000, 25000, 30000, 40000, 50000, 60000,
    80000, 100000, 150000, 200000
];

const SPEEDS = {
    turbo: { label: 'Turbo', minutes: 10 },
    normal: { label: 'Normal', minutes: 15 },
    deep: { label: 'Deep', minutes: 20 },
} as const;

type Speed = keyof typeof SPEEDS;

const snapBB = (raw: number) => STANDARD_BBS.reduce((prev, curr) => (Math.abs(curr - raw) < Math.abs(prev - raw) ? curr : prev));

/**
 * Progresión geométrica desde BB = stack/100 hasta BB = fichas totales/50 al final del tiempo
 * previsto, redondeando a valores de ciega habituales y con un descanso cada 4 niveles.
 */
const generateStructure = (opts: { minutes: number; players: number; stack: number; speed: Speed; antes: boolean }): BlindLevel[] => {
    const levelDuration = SPEEDS[opts.speed].minutes;
    const n = Math.max(4, Math.ceil(opts.minutes / levelDuration));
    const bb0 = snapBB(Math.max(50, opts.stack / 100));
    const bbN = Math.max(bb0 * 4, (opts.players * opts.stack) / 50);
    const factor = Math.pow(bbN / bb0, 1 / (n - 1));

    const result: BlindLevel[] = [];
    let lastBB = 0;
    for (let i = 0; i < n; i++) {
        // Nunca repetir ni bajar la ciega tras redondear
        let bigBlind = snapBB(bb0 * Math.pow(factor, i));
        if (bigBlind <= lastBB) bigBlind = STANDARD_BBS.find(v => v > lastBB) ?? lastBB * 2;
        lastBB = bigBlind;
        result.push({
            id: crypto.randomUUID(),
            type: 'level',
            smallBlind: bigBlind / 2,
            bigBlind,
            ante: opts.antes && i >= 2 ? bigBlind : 0,
            duration: levelDuration,
        });
        if ((i + 1) % 4 === 0 && i < n - 1) {
            result.push({ id: crypto.randomUUID(), type: 'break', smallBlind: 0, bigBlind: 0, ante: 0, duration: 10 });
        }
    }
    return result;
};

export const BlindsConfig: React.FC = () => {
    const blindsStructure = useGameStore(s => s.blindsStructure);
    const startingStack = useGameStore(s => s.startingStack);
    const registered = useGameStore(s => s.players.length);
    const { setBlindsStructure } = useGameStore.getState();
    const [activeTab, setActiveTab] = useState<'manual' | 'generator'>('manual');

    const [minutes, setMinutes] = useState(180);
    const [playersCount, setPlayersCount] = useState(registered || 8);
    const [speed, setSpeed] = useState<Speed>('normal');
    const [antes, setAntes] = useState(false);

    const errors = validateBlindsStructure(blindsStructure);
    const preview = generateStructure({ minutes, players: playersCount, stack: startingStack, speed, antes });
    const previewLevels = preview.filter(l => l.type === 'level');

    const update = (id: string, field: keyof BlindLevel, value: number) => {
        setBlindsStructure(blindsStructure.map((level) => {
            if (level.id !== id) return level;
            const next = { ...level, [field]: value };
            // Al tocar la ciega grande, proponer la chica como la mitad
            if (field === 'bigBlind' && level.smallBlind === level.bigBlind / 2) next.smallBlind = Math.floor(value / 2);
            return next;
        }));
    };

    const insertAfter = (index: number, type: BlindLevel['type']) => {
        const prev = [...blindsStructure.slice(0, index + 1)].reverse().find(l => l.type === 'level');
        const newLevel: BlindLevel = type === 'break'
            ? { id: crypto.randomUUID(), type: 'break', smallBlind: 0, bigBlind: 0, ante: 0, duration: 10 }
            : {
                id: crypto.randomUUID(),
                type: 'level',
                smallBlind: prev ? prev.smallBlind * 2 : 25,
                bigBlind: prev ? prev.bigBlind * 2 : 50,
                ante: prev ? prev.ante * 2 : 0,
                duration: prev?.duration ?? 20,
            };
        const next = [...blindsStructure];
        next.splice(index + 1, 0, newLevel);
        setBlindsStructure(next);
    };

    const remove = (id: string) => setBlindsStructure(blindsStructure.filter((l) => l.id !== id));

    const totalMinutes = totalStructureMinutes(blindsStructure);

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Estructura de ciegas</h2>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {blindsStructure.filter(l => l.type === 'level').length} niveles · {Math.floor(totalMinutes / 60)} h {totalMinutes % 60} min en total
                    </p>
                </div>
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 self-stretch sm:self-auto" role="tablist">
                    {([['manual', 'Editar', Settings2], ['generator', 'Generar', Sparkles]] as const).map(([id, label, Icon]) => (
                        <button
                            key={id}
                            role="tab"
                            aria-selected={activeTab === id}
                            onClick={() => setActiveTab(id)}
                            className={cn('flex-1 sm:flex-initial px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2', activeTab === id ? 'bg-primary text-black' : 'text-gray-400 hover:text-white')}
                        >
                            <Icon className="w-3.5 h-3.5" /> {label}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'generator' ? (
                <div className="bg-black/20 p-5 rounded-2xl border border-white/10 space-y-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <label className="block">
                            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Duración (min)</span>
                            <NumberField value={minutes} onValueChange={setMinutes} min={30} max={900} />
                        </label>
                        <label className="block">
                            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Jugadores</span>
                            <NumberField value={playersCount} onValueChange={setPlayersCount} min={2} max={200} />
                        </label>
                        <div className="block">
                            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Velocidad</span>
                            <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-lg border border-white/5 h-10">
                                {(Object.keys(SPEEDS) as Speed[]).map((s) => (
                                    <button key={s} type="button" onClick={() => setSpeed(s)} className={cn('text-[10px] font-black uppercase rounded-md', speed === s ? 'bg-secondary text-black' : 'text-gray-400 hover:text-white')}>
                                        {SPEEDS[s].label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <label className="flex items-end gap-2 pb-2 cursor-pointer">
                            <input type="checkbox" checked={antes} onChange={(e) => setAntes(e.target.checked)} className="w-4 h-4 accent-primary" />
                            <span className="text-xs text-gray-300">Big Blind Ante desde el nivel 3</span>
                        </label>
                    </div>

                    <div className="text-xs text-gray-400 bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-1">
                        <p>Stack inicial: <b className="text-white">{formatChips(startingStack)}</b> (se configura en el paso Torneo)</p>
                        <p>
                            {previewLevels.length} niveles de {SPEEDS[speed].minutes} min, de <b className="text-white">{formatChips(previewLevels[0].smallBlind)}/{formatChips(previewLevels[0].bigBlind)}</b> a{' '}
                            <b className="text-white">{formatChips(previewLevels[previewLevels.length - 1].smallBlind)}/{formatChips(previewLevels[previewLevels.length - 1].bigBlind)}</b>, con un descanso de 10 min cada 4 niveles.
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-2">
                            {preview.map(l => (
                                <span key={l.id} className={cn('px-2 py-0.5 rounded font-mono text-[10px]', l.type === 'break' ? 'bg-warning/10 text-warning' : 'bg-white/5 text-gray-300')}>
                                    {l.type === 'break' ? '☕' : `${formatChips(l.smallBlind)}/${formatChips(l.bigBlind)}`}
                                </span>
                            ))}
                        </div>
                    </div>

                    <Button onClick={() => { setBlindsStructure(preview); setActiveTab('manual'); }} className="w-full">
                        <Sparkles className="w-4 h-4" /> Usar esta estructura
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    <BlindTemplates />
                    <div className="bg-surface-light/40 rounded-xl border border-white/10 overflow-x-auto">
                        <table className="w-full text-sm text-left min-w-[560px]">
                            <thead className="bg-white/5 text-gray-400 uppercase text-[10px] tracking-wider font-bold">
                                <tr>
                                    <th className="px-3 py-3 w-14">Nivel</th>
                                    <th className="px-3 py-3">Minutos</th>
                                    <th className="px-3 py-3">Ciega chica</th>
                                    <th className="px-3 py-3">Ciega grande</th>
                                    <th className="px-3 py-3">Ante</th>
                                    <th className="px-3 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {blindsStructure.map((level, index) => {
                                    const isBreak = level.type === 'break';
                                    return (
                                        <tr key={level.id} className={isBreak ? 'bg-warning/[0.04]' : 'hover:bg-white/[0.02]'}>
                                            <td className="px-3 py-2 font-mono text-xs">
                                                {isBreak ? <span className="text-warning font-bold flex items-center gap-1"><Coffee className="w-3.5 h-3.5" /></span> : <span className="text-primary font-bold">{getLevelNumber(blindsStructure, index)}</span>}
                                            </td>
                                            <td className="px-3 py-2">
                                                <NumberField aria-label="Minutos" value={level.duration} onValueChange={(v) => update(level.id, 'duration', v)} min={1} max={180} className="w-16 h-8 text-xs" />
                                            </td>
                                            {isBreak ? (
                                                <td colSpan={3} className="px-3 py-2 text-xs uppercase tracking-widest font-bold text-warning/80">Descanso</td>
                                            ) : (
                                                <>
                                                    <td className="px-3 py-2"><NumberField aria-label="Ciega chica" value={level.smallBlind} onValueChange={(v) => update(level.id, 'smallBlind', v)} className="w-24 h-8 text-xs text-primary font-bold" /></td>
                                                    <td className="px-3 py-2"><NumberField aria-label="Ciega grande" value={level.bigBlind} onValueChange={(v) => update(level.id, 'bigBlind', v)} className="w-24 h-8 text-xs text-secondary font-bold" /></td>
                                                    <td className="px-3 py-2"><NumberField aria-label="Ante" value={level.ante} onValueChange={(v) => update(level.id, 'ante', v)} className="w-20 h-8 text-xs text-accent" /></td>
                                                </>
                                            )}
                                            <td className="px-3 py-2">
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => insertAfter(index, 'level')} title="Agregar nivel debajo" aria-label="Agregar nivel debajo" className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10"><Plus className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => insertAfter(index, 'break')} title="Agregar descanso debajo" aria-label="Agregar descanso debajo" className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-warning hover:bg-warning/10"><Coffee className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => remove(level.id)} disabled={blindsStructure.length <= 1} title="Quitar" aria-label="Quitar fila" className="w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:text-accent hover:bg-accent/10 disabled:opacity-30"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex flex-wrap justify-between gap-2">
                        <button onClick={() => setBlindsStructure(INITIAL_BLINDS)} className="text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:text-white flex items-center gap-1.5">
                            <RotateCcw className="w-3 h-3" /> Estructura por defecto
                        </button>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => insertAfter(blindsStructure.length - 1, 'break')}><Coffee className="w-3.5 h-3.5" /> Descanso</Button>
                            <Button size="sm" variant="neon" onClick={() => insertAfter(blindsStructure.length - 1, 'level')}><Plus className="w-3.5 h-3.5" /> Nivel</Button>
                        </div>
                    </div>
                </div>
            )}

            {errors.length > 0 && (
                <div className="bg-accent/10 border border-accent/20 p-4 rounded-xl" role="alert">
                    <p className="text-sm font-bold text-accent mb-1">Revisá la estructura:</p>
                    <ul className="text-xs text-accent/90 space-y-0.5 list-disc list-inside">
                        {errors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                </div>
            )}
        </div>
    );
};
