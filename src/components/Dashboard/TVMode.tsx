import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';

interface TVModeProps {
    onClose: () => void;
}

export const TVMode: React.FC<TVModeProps> = ({ onClose }) => {
    const {
        timerSecondsRemaining,
        blindsStructure,
        currentLevelIndex,
        players,
        prizePool
    } = useGameStore();

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const currentLevel = blindsStructure[currentLevelIndex];
    const nextLevel = blindsStructure[currentLevelIndex + 1];
    const activePlayers = players.filter(p => p.status !== 'busted');
    const avgStack = activePlayers.length > 0
        ? Math.floor(players.reduce((sum, p) => sum + p.chips, 0) / activePlayers.length)
        : 0;

    return (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col overflow-hidden cursor-none hover:cursor-default group">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[20%] w-[60%] h-[60%] bg-secondary/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Hidden Back Button */}
            <div className="absolute top-0 left-0 w-full h-24 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-b from-black/80 to-transparent flex items-start justify-end p-6">
                <Button
                    variant="ghost"
                    onClick={onClose}
                    className="text-white/50 hover:text-white hover:bg-white/10"
                >
                    <X className="w-8 h-8 mr-2" /> Salir de Modo TV
                </Button>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-8 p-12 z-10">
                {/* Left: Timer & Blinds (7 cols) */}
                <div className="col-span-7 flex flex-col justify-center items-center space-y-16 relative">
                    {/* Timer Ring Glow */}
                    <div className="absolute w-[80vh] h-[80vh] bg-primary/5 rounded-full blur-3xl -z-10" />

                    <div className="text-[20vw] font-mono font-bold leading-none tracking-tighter text-white drop-shadow-[0_0_50px_rgba(255,255,255,0.4)] tabular-nums">
                        {formatTime(timerSecondsRemaining)}
                    </div>

                    <div className="text-center space-y-6">
                        <div className="text-5xl text-gray-400 uppercase tracking-[0.3em] font-light">Ciegas</div>
                        <div className="text-[8vw] font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary drop-shadow-[0_0_30px_rgba(0,255,157,0.3)] leading-none">
                            {currentLevel?.smallBlind.toLocaleString()} <span className="text-white/20">/</span> {currentLevel?.bigBlind.toLocaleString()}
                        </div>
                        {currentLevel?.ante > 0 && (
                            <div className="text-6xl text-accent font-bold mt-4 drop-shadow-[0_0_20px_rgba(255,0,85,0.5)]">
                                ANTE {currentLevel.ante}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Stats & Next Level (5 cols) */}
                <div className="col-span-5 flex flex-col justify-center space-y-12 pl-12 border-l border-white/10 bg-black/20 backdrop-blur-sm rounded-r-3xl my-12 py-12">

                    <div className="space-y-4">
                        <h3 className="text-3xl text-gray-500 uppercase tracking-[0.2em]">Siguiente Nivel</h3>
                        <div className="text-7xl font-bold text-gray-300">
                            {nextLevel
                                ? `${nextLevel.smallBlind.toLocaleString()} / ${nextLevel.bigBlind.toLocaleString()}`
                                : 'Descanso / Fin'}
                        </div>
                    </div>

                    <div className="h-px w-full bg-white/10" />

                    <div className="space-y-4">
                        <h3 className="text-3xl text-gray-500 uppercase tracking-[0.2em]">Bolsa de Premios</h3>
                        <div className="text-8xl font-bold text-secondary drop-shadow-[0_0_20px_rgba(0,212,255,0.4)]">
                            ${prizePool.toLocaleString()}
                        </div>
                    </div>

                    <div className="h-px w-full bg-white/10" />

                    <div className="grid grid-cols-2 gap-12">
                        <div className="space-y-2">
                            <h3 className="text-2xl text-gray-500 uppercase tracking-[0.2em]">Jugadores</h3>
                            <div className="text-6xl font-bold text-white">
                                <span className="text-primary">{activePlayers.length}</span>
                                <span className="text-gray-600 mx-2">/</span>
                                {players.length}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl text-gray-500 uppercase tracking-[0.2em]">Stack Promedio</h3>
                            <div className="text-6xl font-bold text-white">
                                {avgStack.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
