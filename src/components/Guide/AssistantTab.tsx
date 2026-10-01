import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronDown, RotateCcw, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { HandGrid } from './HandGrid';
import { HandCards } from './PlayingCards';
import { MiniTable } from './MiniTable';
import { ACTION_STYLE } from './actionStyles';
import { Chip, PlayersStepper } from './GuideControls';
import { advise, buildChart, SITUATION_INFO, STACK_INFO, stackDepthFor, type Situation, type StackDepth } from '../../poker/advisor';
import { handLabel, type HandKey } from '../../poker/cards';
import { POSITION_INFO, positionOf, type PositionGroup } from '../../poker/positions';

interface AssistantSettings {
    players: number;
    heroSeat: number;
    dealerSeat: number;
    situation: Situation;
    raiser: PositionGroup;
    stack: StackDepth;
}

const SETTINGS_KEY = 'nexpulse-assistant';
const DEFAULTS: AssistantSettings = { players: 9, heroSeat: 0, dealerSeat: 5, situation: 'unopened', raiser: 'middle', stack: 'deep' };

const loadSettings = (): AssistantSettings => {
    try {
        return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
    } catch {
        return DEFAULTS;
    }
};

const RAISER_LABEL: Record<PositionGroup, string> = { early: 'Temprana', middle: 'Media', late: 'Tardía', blinds: 'Ciegas' };
const STACK_SHORT: Record<StackDepth, string> = { deep: '40+ BB', medium: '15–40 BB', short: '−15 BB' };

/** Fila de opciones en una sola línea que se desliza de costado (ahorra alto en el celular). */
const ScrollRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.12em] w-16 shrink-0 leading-tight">{label}</span>
        <div className="flex gap-1.5 overflow-x-auto -mr-3 pr-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>
    </div>
);

type MarkMode = 'hero' | 'dealer';

interface AssistantTabProps {
    /** Si el jugador está en un torneo, sus fichas en ciegas grandes (completa "Tus fichas") */
    bigBlinds?: number;
}

/**
 * Asistente de mano: armás tu mesa (jugadores, tu asiento y el dealer), elegís qué pasó antes y
 * tocás tu mano. La respuesta aparece abajo sin tener que desplazarse.
 */
export const AssistantTab: React.FC<AssistantTabProps> = ({ bigBlinds }) => {
    const [settings, setSettings] = useState<AssistantSettings>(loadSettings);
    const [hand, setHand] = useState<HandKey | null>(null);
    // Si todavía no marcó su asiento (primera vez), empezar por ahí
    const [tableOpen, setTableOpen] = useState(() => {
        try {
            return !localStorage.getItem(SETTINGS_KEY);
        } catch {
            return true;
        }
    });
    const [mode, setMode] = useState<MarkMode>(() => {
        try {
            return localStorage.getItem(SETTINGS_KEY) ? 'dealer' : 'hero';
        } catch {
            return 'hero';
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch {
            /* Preferencia opcional */
        }
    }, [settings]);

    const update = (patch: Partial<AssistantSettings>) => setSettings(prev => {
        const next = { ...prev, ...patch };
        next.heroSeat = Math.min(next.heroSeat, next.players - 1);
        next.dealerSeat = Math.min(next.dealerSeat, next.players - 1);
        return next;
    });

    const { players, heroSeat, dealerSeat, situation, raiser } = settings;
    // Con datos del torneo, las fichas se calculan solas
    const stack = bigBlinds !== undefined ? stackDepthFor(bigBlinds) : settings.stack;
    const position = positionOf(players, dealerSeat, heroSeat);
    const spot = useMemo(() => ({ players, position, situation, stack, raiser }), [players, position, situation, stack, raiser]);
    const chart = useMemo(() => buildChart(spot), [spot]);
    const advice = hand ? advise(spot, hand) : null;
    const raiserOptions: PositionGroup[] = position === 'BB' ? ['early', 'middle', 'late', 'blinds'] : ['early', 'middle', 'late'];

    const onSeat = (seat: number) => {
        if (mode === 'hero') {
            update({ heroSeat: seat });
            setMode('dealer'); // Lo siguiente suele ser marcar el dealer
        } else {
            update({ dealerSeat: seat });
        }
    };

    const nextHand = () => {
        // En la mano siguiente el botón pasa al jugador de la izquierda
        update({ dealerSeat: (dealerSeat + 1) % players, situation: 'unopened' });
        setHand(null);
    };

    return (
        <div className={cn('grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-4 lg:gap-5 items-start', hand && 'pb-72 lg:pb-0')}>
            <div className="space-y-3">
                {/* Mesa: abierta para configurarla; después queda en una línea */}
                <section className="glass-panel rounded-2xl p-3 sm:p-4 space-y-3" aria-label="Tu mesa">
                    <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">Tu posición</div>
                            <div className="font-black text-base leading-tight truncate">
                                {POSITION_INFO[position].name} <span className="text-xs font-mono text-gray-400">{POSITION_INFO[position].short} · {players} jug.</span>
                            </div>
                        </div>
                        <button
                            onClick={() => update({ dealerSeat: (dealerSeat + 1) % players })}
                            className="h-9 px-3 rounded-lg border border-white/10 text-xs font-bold text-gray-200 hover:bg-white/5 flex items-center gap-1.5 shrink-0"
                            title="Mover el dealer un lugar (como pasa en cada mano)"
                            aria-label="Mover el dealer un lugar"
                        >
                            D <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setTableOpen(o => !o)}
                            aria-expanded={tableOpen}
                            className={cn('h-9 px-3 rounded-lg border text-xs font-bold shrink-0 flex items-center gap-1', tableOpen ? 'border-primary/50 text-primary bg-primary/10' : 'border-white/10 text-gray-200 hover:bg-white/5')}
                        >
                            {tableOpen ? 'Listo' : 'Mesa'} <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', tableOpen && 'rotate-180')} />
                        </button>
                    </div>

                    {tableOpen && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">Jugadores en la mano</div>
                                <PlayersStepper value={players} onChange={(n) => update({ players: n })} />
                            </div>
                            <div className="grid grid-cols-2 gap-1 bg-black/30 p-1 rounded-xl border border-white/5" role="radiogroup" aria-label="Qué marcar en la mesa">
                                {([['hero', 'Mi asiento'], ['dealer', 'Dealer']] as const).map(([id, label]) => (
                                    <button
                                        key={id}
                                        role="radio"
                                        aria-checked={mode === id}
                                        onClick={() => setMode(id)}
                                        className={cn('h-8 rounded-lg text-xs font-bold transition-colors', mode === id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white')}
                                    >
                                        Tocar: {label}
                                    </button>
                                ))}
                            </div>
                            <MiniTable
                                players={players}
                                dealerSeat={dealerSeat}
                                highlightSeat={heroSeat}
                                highlightLabel="Vos"
                                onSeatClick={onSeat}
                                center={<span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-emerald-200/60 font-bold">{mode === 'hero' ? 'Tocá tu asiento' : 'Tocá el dealer'}</span>}
                            />
                        </div>
                    )}
                </section>

                {/* Situación y fichas: filas deslizables para no ocupar alto */}
                <section className="glass-panel rounded-2xl p-3 sm:p-4 space-y-2.5" aria-label="Qué pasó antes">
                    <ScrollRow label="Antes que vos">
                        {(Object.keys(SITUATION_INFO) as Situation[]).map(s => (
                            <Chip key={s} active={situation === s} onClick={() => update({ situation: s })} title={SITUATION_INFO[s].hint}>
                                {SITUATION_INFO[s].label}
                            </Chip>
                        ))}
                    </ScrollRow>
                    {situation === 'raised' && (
                        <ScrollRow label="Subió desde">
                            {raiserOptions.map(g => (
                                <Chip key={g} active={raiser === g} onClick={() => update({ raiser: g })}>{RAISER_LABEL[g]}</Chip>
                            ))}
                        </ScrollRow>
                    )}
                    {bigBlinds !== undefined ? (
                        <p className="text-xs text-gray-400">
                            Tus fichas: <b className="text-white font-mono">{Math.round(bigBlinds)} BB</b> · {STACK_INFO[stack].label.toLowerCase()} (del torneo)
                        </p>
                    ) : (
                        <ScrollRow label="Tus fichas">
                            {(Object.keys(STACK_INFO) as StackDepth[]).map(s => (
                                <Chip key={s} active={settings.stack === s} onClick={() => update({ stack: s })} title={STACK_INFO[s].range}>
                                    {STACK_SHORT[s]}
                                </Chip>
                            ))}
                        </ScrollRow>
                    )}
                </section>
            </div>

            {/* Mano */}
            <section className="space-y-2 w-full lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:max-w-[max(520px,calc(100dvh-200px))] lg:justify-self-center" aria-label="Tu mano">
                <div className="flex items-center justify-between">
                    <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">Tocá tu mano</h2>
                    <span className="text-[10px] text-gray-500">s = mismo palo · o = distinto · T = 10</span>
                </div>
                <div className="glass-panel rounded-2xl p-2 sm:p-3">
                    <HandGrid chart={chart} selected={hand} onSelect={setHand} />
                </div>
            </section>

            {/* Respuesta: tarjeta fija abajo en el celular, al costado en escritorio */}
            <AnimatePresence>
                {advice && hand && (
                    <motion.section
                        key="answer"
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 40, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        aria-live="polite"
                        aria-label="Recomendación"
                        className="fixed lg:static bottom-0 inset-x-0 z-30 lg:col-start-1 lg:row-start-2"
                    >
                        <div className="max-w-lg mx-auto lg:max-w-none bg-surface/95 backdrop-blur-md border border-white/10 rounded-t-3xl lg:rounded-2xl shadow-[0_-12px_40px_rgba(0,0,0,0.6)] lg:shadow-none p-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-3">
                            <div className="flex items-center gap-3">
                                <HandCards hand={hand} size="sm" />
                                <div className="min-w-0 flex-1">
                                    <div className="font-black">{handLabel(hand)}</div>
                                    <div className="text-[11px] text-gray-400">{POSITION_INFO[position].name} · {SITUATION_INFO[situation].label}</div>
                                </div>
                                <button onClick={() => setHand(null)} aria-label="Cerrar" className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-white/10">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="rounded-xl px-4 py-3 font-black text-xl" style={{ backgroundColor: ACTION_STYLE[advice.action].bg, color: ACTION_STYLE[advice.action].text }}>
                                {advice.label}
                            </div>
                            <p className="text-sm text-gray-200 leading-relaxed">{advice.reason}</p>
                            {advice.followUp && <p className="text-xs text-gray-400">{advice.followUp}</p>}

                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <button onClick={() => setHand(null)} className="h-10 rounded-xl border border-white/10 text-xs font-bold text-gray-300 hover:bg-white/5 flex items-center justify-center gap-1.5">
                                    <RotateCcw className="w-3.5 h-3.5" /> Otra mano
                                </button>
                                <button onClick={nextHand} className="h-10 rounded-xl bg-primary text-black text-xs font-black hover:brightness-110 flex items-center justify-center gap-1.5">
                                    Siguiente mano <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>
        </div>
    );
};
