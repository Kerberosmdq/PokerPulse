import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus, Grid3x3, Armchair, BookOpen, Info } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { cn } from '../../utils/cn';
import { HandGrid } from './HandGrid';
import { HandCards } from './PlayingCards';
import { MiniTable } from './MiniTable';
import { ACTION_ORDER, ACTION_STYLE } from './actionStyles';
import { advise, buildChart, SITUATION_INFO, STACK_INFO, type Action, type Situation, type StackDepth } from '../../poker/advisor';
import { handLabel, handName, parseRange, rangePercent, comboCount, TOTAL_COMBOS, type HandKey } from '../../poker/cards';
import { MAX_PLAYERS, MIN_PLAYERS, POSITION_INFO, positionsForTable, preflopOrder, type PositionGroup, type PositionId } from '../../poker/positions';
import { OPEN_RAISE } from '../../poker/ranges';

type Tab = 'chart' | 'positions' | 'howto';

interface GuideSettings {
    players: number;
    position: PositionId;
    situation: Situation;
    stack: StackDepth;
    raiser: PositionGroup;
}

const SETTINGS_KEY = 'nexpulse-guide';
const DEFAULTS: GuideSettings = { players: 9, position: 'CO', situation: 'unopened', stack: 'deep', raiser: 'middle' };

const loadSettings = (): GuideSettings => {
    try {
        return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
    } catch {
        return DEFAULTS;
    }
};

const RAISER_LABEL: Record<PositionGroup, string> = { early: 'Temprana', middle: 'Media', late: 'Tardía', blinds: 'Ciegas' };
const GROUP_LABEL: Record<PositionGroup, string> = { early: 'Temprana', middle: 'Media', late: 'Tardía', blinds: 'Ciegas' };
const GROUP_TONE: Record<PositionGroup, string> = {
    early: 'text-accent border-accent/30 bg-accent/10',
    middle: 'text-warning border-warning/30 bg-warning/10',
    late: 'text-primary border-primary/30 bg-primary/10',
    blinds: 'text-secondary border-secondary/30 bg-secondary/10',
};

/** Guía visual de manos iniciales: se puede abrir sola (?view=guia) o desde la app. */
export const GuidePage: React.FC = () => {
    const [tab, setTab] = useState<Tab>('chart');
    const [settings, setSettings] = useState<GuideSettings>(loadSettings);
    const [selected, setSelected] = useState<HandKey | null>(null);

    useEffect(() => {
        document.title = 'NexPulse · Guía de manos';
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch {
            /* Preferencia opcional */
        }
    }, [settings]);

    const update = (patch: Partial<GuideSettings>) => setSettings(prev => {
        const next = { ...prev, ...patch };
        // Si la posición no existe en esta mesa (p. ej. UTG+2 con 6 jugadores), usar la primera
        if (!positionsForTable(next.players).includes(next.position)) next.position = preflopOrder(next.players)[0];
        return next;
    });

    const openPosition = (position: PositionId) => {
        update({ position, situation: 'unopened' });
        setTab('chart');
    };

    return (
        <div className="min-h-dvh bg-background text-white">
            <div className="max-w-6xl mx-auto px-4 py-5 sm:py-8">
                <header className="flex items-center gap-3 mb-5">
                    <Logo className="w-10 h-10" />
                    <div>
                        <h1 className="font-black text-xl sm:text-2xl tracking-tight">Guía de manos</h1>
                        <p className="text-xs text-gray-500">Qué hacer antes del flop según tu posición</p>
                    </div>
                </header>

                <nav role="tablist" aria-label="Secciones de la guía" className="grid grid-cols-3 gap-1 bg-black/30 p-1 rounded-xl border border-white/5 mb-5">
                    {([['chart', 'Tabla', Grid3x3], ['positions', 'Posiciones', Armchair], ['howto', 'Cómo se lee', BookOpen]] as const).map(([id, label, Icon]) => (
                        <button
                            key={id}
                            role="tab"
                            aria-selected={tab === id}
                            onClick={() => setTab(id)}
                            className={cn(
                                'h-10 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors',
                                tab === id ? 'bg-primary/15 text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-primary)_40%,transparent)]' : 'text-gray-400 hover:text-white'
                            )}
                        >
                            <Icon className="w-4 h-4" /> {label}
                        </button>
                    ))}
                </nav>

                {tab === 'chart' && <ChartTab settings={settings} update={update} selected={selected} onSelect={setSelected} />}
                {tab === 'positions' && <PositionsTab players={settings.players} onPlayers={(players) => update({ players })} onOpen={openPosition} />}
                {tab === 'howto' && <HowToTab />}
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------

const Chip: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; title?: string; className?: string }> = ({ active, onClick, children, title, className }) => (
    <button
        type="button"
        onClick={onClick}
        title={title}
        aria-pressed={active}
        className={cn(
            'h-9 px-3 rounded-lg text-xs font-bold border transition-colors whitespace-nowrap',
            active ? 'bg-primary text-black border-primary' : 'bg-white/[0.03] border-white/10 text-gray-300 hover:border-white/25 hover:text-white',
            className
        )}
    >
        {children}
    </button>
);

const ControlRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-1.5">{label}</div>
        <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
);

const PlayersStepper: React.FC<{ value: number; onChange: (n: number) => void }> = ({ value, onChange }) => (
    <div className="flex items-center gap-1 bg-black/30 border border-white/10 rounded-lg p-0.5 w-fit">
        <button type="button" aria-label="Menos jugadores" disabled={value <= MIN_PLAYERS} onClick={() => onChange(value - 1)} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-white/10 disabled:opacity-30">
            <Minus className="w-4 h-4" />
        </button>
        <span className="w-8 text-center font-mono font-black text-lg">{value}</span>
        <button type="button" aria-label="Más jugadores" disabled={value >= MAX_PLAYERS} onClick={() => onChange(value + 1)} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-white/10 disabled:opacity-30">
            <Plus className="w-4 h-4" />
        </button>
    </div>
);

const ChartTab: React.FC<{
    settings: GuideSettings;
    update: (p: Partial<GuideSettings>) => void;
    selected: HandKey | null;
    onSelect: (h: HandKey) => void;
}> = ({ settings, update, selected, onSelect }) => {
    const { players, position, situation, stack, raiser } = settings;
    const spot = useMemo(() => ({ players, position, situation, stack, raiser }), [players, position, situation, stack, raiser]);
    const chart = useMemo(() => buildChart(spot), [spot]);
    const order = preflopOrder(players);

    // Porcentaje de combinaciones por acción, para la leyenda
    const totals = useMemo(() => {
        const acc = new Map<Action, number>();
        Object.entries(chart).forEach(([h, a]) => acc.set(a, (acc.get(a) ?? 0) + comboCount(h)));
        return ACTION_ORDER.filter(a => acc.has(a)).map(a => ({ action: a, pct: ((acc.get(a) ?? 0) / TOTAL_COMBOS) * 100 }));
    }, [chart]);

    const raiserOptions: PositionGroup[] = position === 'BB' ? ['early', 'middle', 'late', 'blinds'] : ['early', 'middle', 'late'];

    const detailRef = useRef<HTMLDivElement>(null);
    const select = (h: HandKey) => {
        onSelect(h);
        // En pantallas angostas el detalle queda debajo de la tabla: mostrarlo
        if (window.matchMedia('(max-width: 1023px)').matches) {
            requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] gap-4 lg:gap-5 items-start">
            <div className="lg:col-start-1 lg:row-start-1">
                <section className="glass-panel rounded-2xl p-4 space-y-3.5" aria-label="Situación">
                    <ControlRow label="Jugadores en la mesa">
                        <PlayersStepper value={players} onChange={(n) => update({ players: n })} />
                    </ControlRow>
                    <ControlRow label="Tu posición">
                        {order.map(p => (
                            <Chip key={p} active={position === p} onClick={() => update({ position: p })} title={POSITION_INFO[p].name}>
                                {POSITION_INFO[p].short}
                            </Chip>
                        ))}
                    </ControlRow>
                    <ControlRow label="Qué pasó antes">
                        {(Object.keys(SITUATION_INFO) as Situation[]).map(s => (
                            <Chip key={s} active={situation === s} onClick={() => update({ situation: s })} title={SITUATION_INFO[s].hint}>
                                {SITUATION_INFO[s].label}
                            </Chip>
                        ))}
                    </ControlRow>
                    {situation === 'raised' && (
                        <ControlRow label="¿Desde dónde subió?">
                            {raiserOptions.map(g => (
                                <Chip key={g} active={raiser === g} onClick={() => update({ raiser: g })}>{RAISER_LABEL[g]}</Chip>
                            ))}
                        </ControlRow>
                    )}
                    <ControlRow label="Tus fichas">
                        {(Object.keys(STACK_INFO) as StackDepth[]).map(s => (
                            <Chip key={s} active={stack === s} onClick={() => update({ stack: s })} title={STACK_INFO[s].range}>
                                {STACK_INFO[s].label}
                            </Chip>
                        ))}
                    </ControlRow>
                    <p className="text-[11px] text-gray-500">{STACK_INFO[stack].range} · {POSITION_INFO[position].tip}</p>
                </section>
            </div>

            <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2 space-y-3 w-full lg:max-w-[max(520px,calc(100dvh-200px))] lg:justify-self-center">
                <div className="flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Referencias">
                    {totals.map(({ action, pct }) => (
                        <span key={action} className="flex items-center gap-1.5 text-xs text-gray-300">
                            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: ACTION_STYLE[action].bg, boxShadow: `0 0 0 1px ${ACTION_STYLE[action].ring}55` }} />
                            {ACTION_STYLE[action].label} <span className="text-gray-500 font-mono">{Math.round(pct)}%</span>
                        </span>
                    ))}
                </div>
                <div className="glass-panel rounded-2xl p-2 sm:p-3">
                    <HandGrid chart={chart} selected={selected} onSelect={select} />
                </div>
                <p className="text-[11px] text-gray-500 text-center">
                    Arriba a la derecha: mismo palo (s) · Abajo a la izquierda: distinto palo (o) · Diagonal: parejas · T = 10
                </p>
            </div>

            <div ref={detailRef} className="lg:col-start-1 lg:row-start-2 scroll-mt-4">
                <HandDetail spot={spot} hand={selected} />
            </div>
        </div>
    );
};

const HandDetail: React.FC<{ spot: Parameters<typeof advise>[0]; hand: HandKey | null }> = ({ spot, hand }) => {
    if (!hand) {
        return (
            <section className="glass-panel rounded-2xl p-5 flex items-center gap-3 text-sm text-gray-400" aria-live="polite">
                <Info className="w-5 h-5 shrink-0 text-secondary" />
                Tocá cualquier mano de la tabla para ver qué conviene hacer y por qué.
            </section>
        );
    }
    const advice = advise(spot, hand);
    const style = ACTION_STYLE[advice.action];
    const strength = Math.max(1, 100 - advice.handPercentile);

    return (
        <section className="glass-panel rounded-2xl p-5 space-y-4" aria-live="polite" aria-label={`Detalle de ${hand}`}>
            <div className="flex items-center gap-4">
                <HandCards hand={hand} size="md" />
                <div className="min-w-0">
                    <div className="text-lg font-black">{handLabel(hand)}</div>
                    <div className="text-xs text-gray-400">{handName(hand)}</div>
                </div>
            </div>

            <div
                className="rounded-xl px-4 py-3 font-black text-lg"
                style={{ backgroundColor: style.bg, color: style.text }}
            >
                <span>{advice.label}</span>
            </div>

            <p className="text-sm text-gray-200 leading-relaxed">{advice.reason}</p>
            {advice.followUp && <p className="text-xs text-gray-400">{advice.followUp}</p>}

            <div>
                <div className="flex justify-between text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">
                    <span>Fuerza de la mano</span>
                    <span className="font-mono normal-case tracking-normal">top {Math.max(1, Math.round(advice.handPercentile))}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-accent via-warning to-primary" style={{ width: `${strength}%` }} />
                </div>
            </div>
        </section>
    );
};

// ---------------------------------------------------------------------------

const PositionsTab: React.FC<{ players: number; onPlayers: (n: number) => void; onOpen: (p: PositionId) => void }> = ({ players, onPlayers, onOpen }) => {
    const table = positionsForTable(players);
    const order = preflopOrder(players);
    const [selectedSeat, setSelectedSeat] = useState(table.indexOf(order[0]));
    const seat = Math.min(selectedSeat, players - 1);
    const position = table[seat];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <section className="glass-panel rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">Jugadores en la mesa</div>
                    <PlayersStepper value={players} onChange={onPlayers} />
                </div>
                <MiniTable
                    players={players}
                    dealerSeat={0}
                    highlightSeat={seat}
                    onSeatClick={setSelectedSeat}
                    center={<span className="text-[10px] sm:text-xs text-emerald-200/70 font-bold uppercase tracking-widest">Tocá un asiento</span>}
                />
                <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="font-black text-lg">{POSITION_INFO[position].name}</span>
                        <span className="text-xs font-mono text-gray-400">{POSITION_INFO[position].short}</span>
                        <span className={cn('ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border', GROUP_TONE[POSITION_INFO[position].group])}>
                            {GROUP_LABEL[POSITION_INFO[position].group]}
                        </span>
                    </div>
                    <p className="text-sm text-gray-300">{POSITION_INFO[position].tip}</p>
                    <button onClick={() => onOpen(position)} className="text-xs font-bold text-primary hover:underline">Ver la tabla de esta posición →</button>
                </div>
            </section>

            <section className="glass-panel rounded-2xl p-4">
                <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-3">Orden en que se habla antes del flop</h2>
                <ol className="space-y-1.5">
                    {order.map((p, i) => {
                        const pct = p === 'BB' ? null : rangePercent(parseRange(OPEN_RAISE[p]));
                        return (
                            <li key={p}>
                                <button
                                    onClick={() => setSelectedSeat(table.indexOf(p))}
                                    className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left border transition-colors', p === position ? 'border-primary/50 bg-primary/10' : 'border-transparent hover:bg-white/[0.03]')}
                                >
                                    <span className="w-5 text-xs font-mono text-gray-500">{i + 1}</span>
                                    <span className="w-12 text-xs font-black font-mono">{POSITION_INFO[p].short}</span>
                                    <span className="flex-1 text-sm text-gray-200">{POSITION_INFO[p].name}</span>
                                    <span className="text-xs font-mono text-gray-400">{pct === null ? '—' : `abre ${Math.round(pct)}%`}</span>
                                </button>
                            </li>
                        );
                    })}
                </ol>
                <p className="text-[11px] text-gray-500 mt-3">
                    El porcentaje es cuántas manos se juegan subiendo cuando nadie entró antes. Cuanto más tarde hablás, más información tenés y más manos podés jugar.
                </p>
            </section>
        </div>
    );
};

// ---------------------------------------------------------------------------

const HowToTab: React.FC = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="glass-panel rounded-2xl p-5 space-y-3">
            <h2 className="font-black text-lg">La tabla</h2>
            <ul className="space-y-2 text-sm text-gray-300 list-disc pl-5">
                <li>Están las <b className="text-white">169 manos</b> posibles. Antes del flop no importa el palo exacto, solo si las dos cartas son del mismo palo.</li>
                <li><b className="text-white">Diagonal:</b> parejas (AA, KK… 22).</li>
                <li><b className="text-white">T</b> es el 10 (así se escribe en todas las tablas de póker para que entre en una letra).</li>
                <li><b className="text-white">Arriba a la derecha (s):</b> mismo palo, por ejemplo A♠ K♠.</li>
                <li><b className="text-white">Abajo a la izquierda (o):</b> distinto palo, por ejemplo A♠ K♥.</li>
                <li>Cada color es lo que conviene hacer con esa mano en la situación elegida.</li>
            </ul>
        </section>

        <section className="glass-panel rounded-2xl p-5 space-y-3">
            <h2 className="font-black text-lg">Los colores</h2>
            <ul className="space-y-2">
                {(['raise', 'call', 'threebet', 'fourbet', 'allin', 'check', 'fold'] as Action[]).map(a => (
                    <li key={a} className="flex items-start gap-3 text-sm">
                        <span className="mt-0.5 w-4 h-4 rounded shrink-0" style={{ backgroundColor: ACTION_STYLE[a].bg, boxShadow: `0 0 0 1px ${ACTION_STYLE[a].ring}66` }} />
                        <span className="text-gray-300"><b className="text-white">{ACTION_STYLE[a].label}:</b> {ACTION_HELP[a]}</span>
                    </li>
                ))}
            </ul>
        </section>

        <section className="glass-panel rounded-2xl p-5 space-y-3">
            <h2 className="font-black text-lg">Tus fichas en "BB"</h2>
            <p className="text-sm text-gray-300">
                BB es la ciega grande. Si tenés 8.000 fichas y la ciega grande es 400, tenés <b className="text-white">20 BB</b>. Es la forma de medir cuánto margen tenés:
            </p>
            <ul className="space-y-1.5 text-sm text-gray-300">
                {(Object.keys(STACK_INFO) as StackDepth[]).map(s => (
                    <li key={s}><b className="text-white">{STACK_INFO[s].label}</b> ({STACK_INFO[s].range}): {STACK_HELP[s]}</li>
                ))}
            </ul>
        </section>

        <section className="glass-panel rounded-2xl p-5 space-y-3">
            <h2 className="font-black text-lg">Tené en cuenta</h2>
            <p className="text-sm text-gray-300">
                Son rangos de referencia para torneos, simplificados para que sean fáciles de usar. Son una muy buena base, pero el póker también depende de los rivales: contra alguien que paga todo conviene farolear menos, y contra alguien muy cuidadoso, robar más ciegas.
            </p>
        </section>
    </div>
);

const ACTION_HELP: Record<Action, string> = {
    raise: 'sos el primero en apostar: subí para quedarte con la iniciativa.',
    call: 'igualá la apuesta y mirá el flop.',
    threebet: 'alguien subió y vos volvés a subir: con manos muy fuertes, o de farol con algunas manos elegidas.',
    fourbet: 'te resubieron y volvés a subir: solo con lo mejor.',
    allin: 'apostá todas tus fichas (sobre todo con pocas fichas).',
    check: 'no pongas más fichas: mirá el flop gratis desde la ciega grande.',
    fold: 'tirá la mano: no conviene seguir.',
};

const STACK_HELP: Record<StackDepth, string> = {
    deep: 'podés jugar normal, subir y ver flops.',
    medium: 'cuidá las fichas: menos faroles y, si resubís, muchas veces conviene ir all-in.',
    short: 'subir poco ya no sirve: o vas all-in o te tirás.',
};
