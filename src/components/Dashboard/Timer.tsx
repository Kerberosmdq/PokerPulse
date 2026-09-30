import React, { useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Coffee } from 'lucide-react';
import { soundManager } from '../../utils/audio';
import { cn } from '../../utils/cn';
import { findNextPlayingLevel, formatChips, formatTime, getLevelNumber, secondsUntilNextBreak } from '../../utils/tournament';
import { useElementSize, useMediaQuery } from '../../hooks/useElementSize';

const RADIUS = 180;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const MAX_RING = 440;
const MIN_RING = 180;
// Por debajo de este alto el panel pasa a modo compacto
const COMPACT_HEIGHT = 620;

export const Timer: React.FC = () => {
    const timerSecondsRemaining = useGameStore(s => s.timerSecondsRemaining);
    const isPaused = useGameStore(s => s.isPaused);
    const blindsStructure = useGameStore(s => s.blindsStructure);
    const currentLevelIndex = useGameStore(s => s.currentLevelIndex);
    const { startTimer, pauseTimer, resetTimer, nextLevel, prevLevel, adjustTimer } = useGameStore.getState();

    // En escritorio el panel tiene alto fijo: el anillo ocupa el espacio que dejan los controles.
    // En pantallas chicas la página scrollea y el anillo se dimensiona por el ancho.
    const fitHeight = useMediaQuery('(min-width: 1024px)');
    const rootRef = useRef<HTMLDivElement>(null);
    const ringAreaRef = useRef<HTMLDivElement>(null);
    const root = useElementSize(rootRef);
    const ringArea = useElementSize(ringAreaRef);
    const compact = fitHeight && root.height > 0 && root.height < COMPACT_HEIGHT;
    const ringSize = fitHeight
        ? Math.max(MIN_RING, Math.min(MAX_RING, ringArea.width, ringArea.height))
        : Math.min(400, ringArea.width || 400);

    const withClick = (fn: () => void) => () => {
        soundManager.playClick();
        fn();
    };

    const level = blindsStructure[currentLevelIndex];
    const isBreak = level?.type === 'break';
    const totalSeconds = (level?.duration ?? 1) * 60;
    const progress = Math.min(1, Math.max(0, 1 - timerSecondsRemaining / totalSeconds));
    const isLastMinute = !isBreak && timerSecondsRemaining <= 60 && timerSecondsRemaining > 0;
    const nextPlaying = findNextPlayingLevel(blindsStructure, currentLevelIndex);
    const toBreak = secondsUntilNextBreak(blindsStructure, currentLevelIndex, timerSecondsRemaining);
    const isLastLevel = currentLevelIndex >= blindsStructure.length - 1;

    const ringColor = isBreak ? 'var(--color-warning)' : isLastMinute ? 'var(--color-accent)' : 'var(--color-primary)';

    const nextLevelText = nextPlaying
        ? <>{formatChips(nextPlaying.smallBlind)} / {formatChips(nextPlaying.bigBlind)}{nextPlaying.ante > 0 && <span className="text-accent/80"> · A {formatChips(nextPlaying.ante)}</span>}</>
        : '—';
    const breakText = isBreak ? 'Ahora' : toBreak !== null ? `en ${formatTime(toBreak)}` : 'Sin descansos';

    return (
        <div ref={rootRef} className={cn('w-full flex flex-col items-center', fitHeight ? 'h-full min-h-0' : '', compact ? 'gap-3' : 'gap-5')}>
            {/* Etiqueta de nivel */}
            <div className={cn(
                'shrink-0 px-4 py-1.5 rounded-full border text-xs font-black uppercase tracking-[0.25em] flex items-center gap-2',
                isBreak ? 'border-warning/40 bg-warning/10 text-warning' : 'border-primary/30 bg-primary/10 text-primary'
            )}>
                {isBreak ? <><Coffee className="w-3.5 h-3.5" /> Descanso</> : <>Nivel {getLevelNumber(blindsStructure, currentLevelIndex)}</>}
                {isPaused && <span className="text-gray-400 tracking-widest">· En pausa</span>}
            </div>

            {/* Área del reloj: en escritorio toma todo el alto libre */}
            <div ref={ringAreaRef} className={cn('w-full flex items-center justify-center', fitHeight ? 'flex-1 min-h-0' : 'max-w-[400px] aspect-square')}>
                <div className="relative @container" style={{ width: ringSize, height: ringSize }}>
                    <svg viewBox="0 0 400 400" className="w-full h-full -rotate-90">
                        <circle cx="200" cy="200" r={RADIUS} stroke="rgba(255,255,255,0.06)" strokeWidth="10" fill="none" />
                        <circle
                            cx="200"
                            cy="200"
                            r={RADIUS}
                            stroke={ringColor}
                            strokeWidth="12"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={CIRCUMFERENCE}
                            strokeDashoffset={CIRCUMFERENCE * progress}
                            style={{
                                transition: 'stroke-dashoffset 1s linear, stroke 0.4s',
                                filter: `drop-shadow(0 0 10px color-mix(in oklab, ${ringColor} 60%, transparent))`,
                                opacity: isPaused ? 0.45 : 1,
                            }}
                        />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-[12%]">
                        <div
                            className={cn(
                                'font-mono font-bold tabular tracking-tighter leading-none text-glow-white transition-colors',
                                isLastMinute ? 'text-accent animate-pulse' : isPaused ? 'text-gray-300' : 'text-white'
                            )}
                            style={{ fontSize: timerSecondsRemaining >= 3600 ? '17cqw' : '24cqw' }}
                        >
                            {formatTime(timerSecondsRemaining)}
                        </div>

                        {isBreak ? (
                            <div className="mt-[4cqw] text-gray-400 uppercase tracking-widest" style={{ fontSize: '3.5cqw' }}>
                                {nextPlaying ? <>Vuelve con <span className="text-white font-bold">{formatChips(nextPlaying.smallBlind)} / {formatChips(nextPlaying.bigBlind)}</span></> : 'Fin de la estructura'}
                            </div>
                        ) : level && (
                            <div className="mt-[4cqw]">
                                <div className="uppercase tracking-[0.3em] text-gray-500 font-bold" style={{ fontSize: 'max(9px, 2.6cqw)' }}>Ciegas</div>
                                <div className="font-black text-white tabular leading-tight" style={{ fontSize: '9cqw' }}>
                                    {formatChips(level.smallBlind)} <span className="text-white/25">/</span> {formatChips(level.bigBlind)}
                                </div>
                                {level.ante > 0 && (
                                    <div className="font-bold text-accent tracking-wider" style={{ fontSize: 'max(11px, 3.6cqw)' }}>Ante {formatChips(level.ante)}</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Controles */}
            <div className="shrink-0 flex items-center gap-2 sm:gap-4">
                <Button variant="ghost" size="icon" onClick={withClick(prevLevel)} disabled={currentLevelIndex === 0} title="Nivel anterior (←)" aria-label="Nivel anterior" className="rounded-full w-11 h-11">
                    <SkipBack className="w-5 h-5" />
                </Button>
                <Button variant="ghost" onClick={withClick(() => adjustTimer(-60))} title="Restar 1 minuto (−)" className="rounded-full w-11 h-11 p-0 font-mono text-xs normal-case tracking-normal hover:text-accent">
                    −1m
                </Button>

                <Button
                    onClick={withClick(isPaused ? startTimer : pauseTimer)}
                    size="lg"
                    aria-label={isPaused ? 'Iniciar reloj' : 'Pausar reloj'}
                    title="Espacio"
                    variant={isPaused ? 'primary' : 'secondary'}
                    className={cn(
                        'rounded-full font-black tracking-widest',
                        compact ? 'w-40 h-14 text-lg' : 'w-40 sm:w-48 h-16 sm:h-18 text-lg sm:text-xl',
                        isPaused ? 'glow-primary' : 'glow-secondary'
                    )}
                >
                    {isPaused ? <Play className="w-7 h-7 fill-current" /> : <Pause className="w-7 h-7 fill-current" />}
                    {isPaused ? 'Iniciar' : 'Pausar'}
                </Button>

                <Button variant="ghost" onClick={withClick(() => adjustTimer(60))} title="Sumar 1 minuto (+)" className="rounded-full w-11 h-11 p-0 font-mono text-xs normal-case tracking-normal hover:text-primary">
                    +1m
                </Button>
                <Button variant="ghost" size="icon" onClick={withClick(nextLevel)} disabled={isLastLevel} title="Nivel siguiente (→)" aria-label="Nivel siguiente" className="rounded-full w-11 h-11">
                    <SkipForward className="w-5 h-5" />
                </Button>
            </div>

            {/* Próximo nivel / descanso */}
            {compact ? (
                <div className="shrink-0 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs">
                    <span className="text-gray-500 uppercase tracking-widest font-bold">Próximo <span className="text-gray-200 normal-case tracking-normal text-sm tabular">{nextLevelText}</span></span>
                    <span className="text-gray-500 uppercase tracking-widest font-bold">Descanso <span className="text-warning/90 normal-case tracking-normal text-sm tabular">{breakText}</span></span>
                    <button onClick={resetTimer} title="Reiniciar nivel" aria-label="Reiniciar nivel" className="text-gray-500 hover:text-white p-1">
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                </div>
            ) : (
                <>
                    <div className="shrink-0 w-full max-w-md grid grid-cols-2 gap-3 text-center">
                        <div className="rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2.5">
                            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Próximo nivel</div>
                            <div className="text-sm font-bold text-gray-200 tabular mt-0.5">{nextLevelText}</div>
                        </div>
                        <div className="rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2.5">
                            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Próximo descanso</div>
                            <div className="text-sm font-bold text-warning/90 tabular mt-0.5">{breakText}</div>
                        </div>
                    </div>
                    <button
                        onClick={resetTimer}
                        className="shrink-0 text-[11px] text-gray-500 hover:text-white uppercase tracking-widest font-bold flex items-center gap-1.5 transition-colors"
                    >
                        <RotateCcw className="w-3 h-3" /> Reiniciar nivel
                    </button>
                </>
            )}
        </div>
    );
};
