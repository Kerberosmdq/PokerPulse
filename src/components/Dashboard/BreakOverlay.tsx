import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Users, TrendingUp, Coins, Play, Pause, SkipForward, Plus } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { PokerChip } from './ChipList';
import { chipsToColorUp, computePayouts, findNextPlayingLevel, formatChips, formatMoney, formatTime, getPayoutPercents, getTournamentStats, ordinalPlace, placeMedal } from '../../utils/tournament';

const SLIDE_MS = 8000;

export const BreakOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const timerSecondsRemaining = useGameStore(s => s.timerSecondsRemaining);
    const isPaused = useGameStore(s => s.isPaused);
    const prizePool = useGameStore(s => s.prizePool);
    const payoutStructure = useGameStore(s => s.payoutStructure);
    const customPayouts = useGameStore(s => s.customPayouts);
    const players = useGameStore(s => s.players);
    const blindsStructure = useGameStore(s => s.blindsStructure);
    const chipValues = useGameStore(s => s.chipValues);
    const currentLevelIndex = useGameStore(s => s.currentLevelIndex);
    const { startTimer, pauseTimer, adjustTimer, nextLevel } = useGameStore.getState();

    const stats = getTournamentStats(players);
    const nextLevelInfo = findNextPlayingLevel(blindsStructure, currentLevelIndex);
    const payouts = computePayouts(prizePool, getPayoutPercents(payoutStructure, customPayouts));
    const colorUp = chipsToColorUp(chipValues, blindsStructure, currentLevelIndex);

    const slides = ['payouts', 'stats', 'next', ...(colorUp.length > 0 ? ['chiprace'] : [])];
    const [activeSlide, setActiveSlide] = useState(0);
    const slide = slides[activeSlide % slides.length];

    useEffect(() => {
        const id = setInterval(() => setActiveSlide(prev => (prev + 1) % slides.length), SLIDE_MS);
        return () => clearInterval(id);
    }, [slides.length]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const slideMotion = {
        initial: { opacity: 0, x: 40 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -40 },
        transition: { duration: 0.4 },
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="region"
            aria-label="Pantalla de descanso"
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl flex flex-col p-6 md:p-12 text-white overflow-y-auto"
        >
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-warning/[0.06] rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/[0.05] rounded-full blur-[150px]" />
            </div>

            <div className="w-full max-w-6xl mx-auto flex justify-between items-center relative">
                <div className="flex items-center gap-3">
                    <Logo className="w-11 h-11" />
                    <div>
                        <span className="font-black text-xl tracking-[0.2em] text-warning">DESCANSO</span>
                        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-[0.2em] block">Las mesas vuelven al terminar la cuenta</span>
                    </div>
                </div>
                <Button variant="outline" onClick={onClose} className="rounded-full h-11 px-4" aria-label="Volver al panel">
                    <X className="w-5 h-5" /> <span className="hidden sm:inline">Volver al panel</span>
                </Button>
            </div>

            <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center flex-1 my-8 relative">
                {/* Cuenta regresiva */}
                <div className="flex flex-col items-center text-center gap-6">
                    <div
                        className={`font-mono font-black tracking-tighter leading-none tabular ${isPaused ? 'text-gray-400' : 'text-warning'}`}
                        style={{ fontSize: 'clamp(4.5rem, 12vw, 11rem)', textShadow: '0 0 60px color-mix(in oklab, var(--color-warning) 30%, transparent)' }}
                    >
                        {formatTime(timerSecondsRemaining)}
                    </div>
                    <div className="text-sm uppercase font-bold tracking-[0.4em] text-gray-500">
                        {isPaused ? 'Cuenta en pausa' : 'Tiempo de descanso'}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={isPaused ? startTimer : pauseTimer} variant={isPaused ? 'primary' : 'outline'} className="rounded-full">
                            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
                            {isPaused ? 'Reanudar' : 'Pausar'}
                        </Button>
                        <Button onClick={() => adjustTimer(300)} variant="outline" className="rounded-full" title="Extender el descanso 5 minutos">
                            <Plus className="w-4 h-4" /> 5 min
                        </Button>
                        <Button onClick={nextLevel} variant="outline" className="rounded-full" title="Terminar el descanso ahora">
                            <SkipForward className="w-4 h-4" /> Terminar
                        </Button>
                    </div>
                </div>

                {/* Información rotativa */}
                <div className="min-h-[380px] bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col">
                    <div className="flex-1">
                        <AnimatePresence mode="wait">
                            {slide === 'payouts' && (
                                <motion.div key="payouts" {...slideMotion} className="space-y-5">
                                    <SlideHeader icon={<Trophy className="w-6 h-6" />} title="Bolsa de premios" tone="text-warning bg-warning/10" extra={<span className="text-3xl font-black text-warning tabular">{formatMoney(prizePool)}</span>} />
                                    <div className="space-y-2">
                                        {payouts.slice(0, 5).map(p => (
                                            <div key={p.place} className="flex justify-between items-center bg-white/[0.02] border border-white/5 px-4 py-3 rounded-2xl">
                                                <span className="flex items-center gap-3 font-bold text-sm">
                                                    <span className="text-2xl">{placeMedal(p.place)}</span> {ordinalPlace(p.place)}
                                                    <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{p.percent}%</span>
                                                </span>
                                                <span className="text-xl font-mono font-black text-primary tabular">{formatMoney(p.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {slide === 'stats' && (
                                <motion.div key="stats" {...slideMotion} className="space-y-5">
                                    <SlideHeader icon={<Users className="w-6 h-6" />} title="Estado del torneo" tone="text-primary bg-primary/10" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <Stat label="Stack promedio" value={formatChips(stats.avgStack)} extra={nextLevelInfo ? `${Math.round(stats.avgStack / nextLevelInfo.bigBlind)} BB` : undefined} />
                                        <Stat label="En juego" value={`${stats.alive} / ${stats.total}`} className="text-primary" />
                                        <Stat label="Re-entradas" value={stats.rebuys} className="text-secondary" />
                                        <Stat label="Add-ons" value={stats.addons} className="text-accent" />
                                    </div>
                                </motion.div>
                            )}

                            {slide === 'next' && (
                                <motion.div key="next" {...slideMotion} className="space-y-5">
                                    <SlideHeader icon={<TrendingUp className="w-6 h-6" />} title="Al volver" tone="text-secondary bg-secondary/10" />
                                    {nextLevelInfo ? (
                                        <div className="bg-white/[0.02] border border-white/5 p-8 rounded-2xl text-center space-y-2">
                                            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Ciegas</span>
                                            <div className="text-5xl font-black text-white font-mono tabular">
                                                {formatChips(nextLevelInfo.smallBlind)} / {formatChips(nextLevelInfo.bigBlind)}
                                            </div>
                                            {nextLevelInfo.ante > 0 && <div className="text-accent font-bold">Ante {formatChips(nextLevelInfo.ante)}</div>}
                                            <div className="text-xs text-gray-500">{nextLevelInfo.duration} minutos por nivel</div>
                                        </div>
                                    ) : (
                                        <div className="bg-white/[0.02] border border-white/5 p-8 rounded-2xl text-center text-gray-500 font-bold uppercase tracking-wider">
                                            Fin de la estructura de ciegas
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {slide === 'chiprace' && (
                                <motion.div key="chiprace" {...slideMotion} className="space-y-5">
                                    <SlideHeader icon={<Coins className="w-6 h-6" />} title="Chip race" tone="text-accent bg-accent/10" />
                                    <p className="text-sm text-gray-300">
                                        Estas fichas ya no hacen falta para las ciegas que vienen. Aprovechá el descanso para cambiarlas por denominaciones mayores:
                                    </p>
                                    <div className="flex flex-wrap gap-4">
                                        {colorUp.map(c => (
                                            <div key={c.value} className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-2xl pl-2 pr-4 py-2">
                                                <PokerChip color={c.color} value={c.value} size={44} />
                                                <span className="font-mono font-bold">{formatChips(c.value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500">Las fracciones que no completan una ficha mayor se redondean al valor más cercano.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex justify-center gap-2 pt-6">
                        {slides.map((s, idx) => (
                            <button
                                key={s}
                                onClick={() => setActiveSlide(idx)}
                                aria-label={`Ver panel ${idx + 1}`}
                                className={`h-1.5 rounded-full transition-all duration-300 ${slide === s ? 'w-6 bg-warning' : 'w-1.5 bg-white/15 hover:bg-white/30'}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const SlideHeader: React.FC<{ icon: React.ReactNode; title: string; tone: string; extra?: React.ReactNode }> = ({ icon, title, tone, extra }) => (
    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
        <div className={`p-2 rounded-xl ${tone}`}>{icon}</div>
        <h3 className="text-lg font-bold text-white uppercase tracking-wider">{title}</h3>
        {extra && <div className="ml-auto">{extra}</div>}
    </div>
);

const Stat: React.FC<{ label: string; value: React.ReactNode; extra?: string; className?: string }> = ({ label, value, extra, className }) => (
    <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{label}</div>
        <div className={`text-2xl font-black font-mono tabular mt-1 ${className ?? 'text-white'}`}>{value}</div>
        {extra && <div className="text-xs text-gray-500 mt-0.5">{extra}</div>}
    </div>
);
