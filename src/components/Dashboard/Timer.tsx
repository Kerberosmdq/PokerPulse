import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Coffee } from 'lucide-react';
import { soundManager } from '../../utils/audio';
import { cn } from '../../utils/cn';
import { findNextPlayingLevel, formatChips, formatTime, getLevelNumber, secondsUntilNextBreak } from '../../utils/tournament';

const RADIUS = 180;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const Timer: React.FC = () => {
    const timerSecondsRemaining = useGameStore(s => s.timerSecondsRemaining);
    const isPaused = useGameStore(s => s.isPaused);
    const blindsStructure = useGameStore(s => s.blindsStructure);
    const currentLevelIndex = useGameStore(s => s.currentLevelIndex);
    const { startTimer, pauseTimer, resetTimer, nextLevel, prevLevel, adjustTimer } = useGameStore.getState();

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

    return (
        <div className="w-full flex flex-col items-center gap-5">
            {/* Etiqueta de nivel */}
            <div className={cn(
                'px-4 py-1.5 rounded-full border text-xs font-black uppercase tracking-[0.25em] flex items-center gap-2',
                isBreak ? 'border-warning/40 bg-warning/10 text-warning' : 'border-primary/30 bg-primary/10 text-primary'
            )}>
                {isBreak ? <><Coffee className="w-3.5 h-3.5" /> Descanso</> : <>Nivel {getLevelNumber(blindsStructure, currentLevelIndex)}</>}
                {isPaused && <span className="text-gray-400 tracking-widest">· En pausa</span>}
            </div>

            {/* Reloj circular */}
            <div className="relative w-full max-w-[400px] lg:max-w-[min(440px,calc(100dvh-470px))] lg:min-w-[240px] aspect-square @container">
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
                            <div className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold">Ciegas</div>
                            <div className="font-black text-white tabular leading-tight" style={{ fontSize: '9cqw' }}>
                                {formatChips(level.smallBlind)} <span className="text-white/25">/</span> {formatChips(level.bigBlind)}
                            </div>
                            {level.ante > 0 && (
                                <div className="text-sm font-bold text-accent tracking-wider">Ante {formatChips(level.ante)}</div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-2 sm:gap-4">
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
                    className={cn('w-40 sm:w-48 h-16 sm:h-18 rounded-full text-lg sm:text-xl font-black tracking-widest', isPaused ? 'glow-primary' : 'glow-secondary')}
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
            <div className="w-full max-w-md grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2.5">
                    <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Próximo nivel</div>
                    <div className="text-sm font-bold text-gray-200 tabular mt-0.5">
                        {nextPlaying
                            ? <>{formatChips(nextPlaying.smallBlind)} / {formatChips(nextPlaying.bigBlind)}{nextPlaying.ante > 0 && <span className="text-accent/80"> · A {formatChips(nextPlaying.ante)}</span>}</>
                            : '—'}
                    </div>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2.5">
                    <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Próximo descanso</div>
                    <div className="text-sm font-bold text-warning/90 tabular mt-0.5">
                        {isBreak ? 'Ahora' : toBreak !== null ? `en ${formatTime(toBreak)}` : 'Sin descansos'}
                    </div>
                </div>
            </div>

            <button
                onClick={resetTimer}
                className="text-[11px] text-gray-500 hover:text-white uppercase tracking-widest font-bold flex items-center gap-1.5 transition-colors"
            >
                <RotateCcw className="w-3 h-3" /> Reiniciar nivel
            </button>
        </div>
    );
};
