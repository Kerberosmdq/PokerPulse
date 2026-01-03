import React, { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { Play, Pause, SkipForward, SkipBack, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { soundManager } from '../../utils/audio';

export const Timer: React.FC = () => {
    const {
        timerSecondsRemaining,
        isPaused,
        startTimer,
        pauseTimer,
        resetTimer,
        tickTimer,
        nextLevel,
        prevLevel,
        blindsStructure,
        currentLevelIndex
    } = useGameStore();

    // Sound effects
    useEffect(() => {
        if (!isPaused && timerSecondsRemaining <= 10 && timerSecondsRemaining > 0) {
            soundManager.playTimerWarning();
        }
    }, [timerSecondsRemaining, isPaused]);

    useEffect(() => {
        // Play sound when level changes (and it's not the initial load)
        if (currentLevelIndex > 0) {
            soundManager.playBlindsUp();
        }
    }, [currentLevelIndex]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        if (!isPaused) {
            interval = setInterval(() => {
                tickTimer();
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isPaused, tickTimer]);

    const handleStart = () => {
        soundManager.playClick();
        startTimer();
    };

    const handlePause = () => {
        soundManager.playClick();
        pauseTimer();
    };

    const handleNext = () => {
        soundManager.playClick();
        nextLevel();
    };

    const handlePrev = () => {
        soundManager.playClick();
        prevLevel();
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const currentLevel = blindsStructure[currentLevelIndex];
    const progress = currentLevel
        ? ((currentLevel.duration * 60 - timerSecondsRemaining) / (currentLevel.duration * 60)) * 100
        : 0;

    return (
        <div className="flex flex-col items-center justify-center space-y-10 p-8 relative">
            {/* Circular Progress Timer */}
            <div className="relative w-96 h-96 flex items-center justify-center">
                {/* Outer Glow Ring */}
                <div className="absolute inset-0 rounded-full bg-primary/5 blur-3xl animate-pulse" />

                <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(0,255,157,0.3)]">
                    {/* Track */}
                    <circle
                        cx="192"
                        cy="192"
                        r="170"
                        stroke="#1e1e1e"
                        strokeWidth="8"
                        fill="transparent"
                    />
                    {/* Progress */}
                    <motion.circle
                        cx="192"
                        cy="192"
                        r="170"
                        stroke="#00ff9d"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 170}
                        strokeDashoffset={2 * Math.PI * 170 * (1 - progress / 100)}
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: 2 * Math.PI * 170 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 170 * (1 - progress / 100) }}
                        transition={{ duration: 1, ease: "linear" }}
                    />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <div className="text-[7rem] font-mono font-bold text-white tracking-tighter leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                        {formatTime(timerSecondsRemaining)}
                    </div>
                    <div className={`text-2xl font-bold tracking-widest uppercase mt-4 drop-shadow-[0_0_5px_rgba(0,255,157,0.8)] ${currentLevel?.type === 'break' ? 'text-yellow-400 animate-pulse' : 'text-primary'}`}>
                        {currentLevel?.type === 'break' ? 'TIEMPO DE DESCANSO' : `Nivel ${currentLevelIndex + 1}`}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-8">
                <Button variant="ghost" onClick={handlePrev} title="Nivel Anterior" className="hover:text-primary hover:bg-primary/10 rounded-full w-12 h-12 p-0">
                    <SkipBack className="w-6 h-6" />
                </Button>

                {isPaused ? (
                    <Button
                        onClick={handleStart}
                        size="lg"
                        className="w-48 h-20 rounded-full text-2xl font-black tracking-widest uppercase bg-gradient-to-r from-primary to-emerald-400 hover:from-primary/90 hover:to-emerald-400/90 text-black shadow-[0_0_40px_rgba(0,255,157,0.4)] hover:shadow-[0_0_60px_rgba(0,255,157,0.6)] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 border-4 border-black/20"
                    >
                        <Play className="w-8 h-8 fill-current" />
                        <span className="mt-1">Iniciar</span>
                    </Button>
                ) : (
                    <Button
                        onClick={handlePause}
                        size="lg"
                        className="w-48 h-20 rounded-full text-2xl font-black tracking-widest uppercase bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-400/90 hover:to-blue-500/90 text-black shadow-[0_0_40px_rgba(34,211,238,0.5)] hover:shadow-[0_0_60px_rgba(34,211,238,0.7)] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 border-4 border-black/20"
                    >
                        <Pause className="w-8 h-8 fill-current" />
                        <span className="mt-1">Pausar</span>
                    </Button>
                )}

                <Button variant="ghost" onClick={handleNext} title="Siguiente Nivel" className="hover:text-primary hover:bg-primary/10 rounded-full w-12 h-12 p-0">
                    <SkipForward className="w-6 h-6" />
                </Button>
            </div>

            <Button variant="ghost" onClick={resetTimer} title="Reiniciar Nivel" className="absolute bottom-0 right-0 text-gray-600 hover:text-white">
                <RefreshCw className="w-4 h-4" />
            </Button>
        </div>
    );
};
