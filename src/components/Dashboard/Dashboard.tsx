import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Timer } from './Timer';
import { PlayerList } from './PlayerList';
import { GameLog } from './GameLog';
import { BlindsList } from './BlindsList';
import { ChipList } from './ChipList';
import { Button } from '../ui/Button';
import { Settings, Tv, QrCode, Shuffle, DollarSign, Share2 } from 'lucide-react';
import { RemoteControlQR } from './RemoteControlQR';
import { TVMode } from './TVMode';
import { SeatingDraw } from './SeatingDraw';
import { PrizePool } from './PrizePool';
import { AnimatePresence } from 'framer-motion';

export const Dashboard: React.FC = () => {
    const { resetGame } = useGameStore();
    const [showRemote, setShowRemote] = useState(false);
    const [showTV, setShowTV] = useState(false);
    const [showSeating, setShowSeating] = useState(false);
    const [showPrizes, setShowPrizes] = useState(false);

    return (

        <div className="min-h-screen bg-background text-white flex flex-col relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] right-[20%] w-[60%] h-[60%] bg-secondary/5 rounded-full blur-[150px]" />
            </div>

            <AnimatePresence>
                {showRemote && <RemoteControlQR onClose={() => setShowRemote(false)} />}
                {showTV && <TVMode onClose={() => setShowTV(false)} />}
                {showSeating && <SeatingDraw onClose={() => setShowSeating(false)} />}
                {showPrizes && <PrizePool onClose={() => setShowPrizes(false)} />}
            </AnimatePresence>

            {/* Top Bar */}
            <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-black/20 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="PokerPulse Logo" className="w-12 h-12 object-contain drop-shadow-[0_0_10px_rgba(0,255,157,0.5)]" />
                    <span className="font-black text-2xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">POKERPULSE</span>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowRemote(true)} className="hover:bg-white/5">
                        <QrCode className="w-4 h-4 mr-2 text-primary" /> Remoto
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowTV(true)} className="hover:bg-white/5">
                        <Tv className="w-4 h-4 mr-2 text-secondary" /> Modo TV
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowSeating(true)} className="hover:bg-white/5">
                        <Shuffle className="w-4 h-4 mr-2 text-accent" /> Asientos
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowPrizes(true)} className="hover:bg-white/5">
                        <DollarSign className="w-4 h-4 mr-2 text-yellow-400" /> Premios
                    </Button>
                    <div className="w-px h-8 bg-white/10 mx-2" />
                    <Button variant="ghost" size="sm" onClick={() => {
                        if (confirm('¿Estás seguro de que quieres reiniciar la partida? Todos los datos se perderán.')) {
                            resetGame();
                        }
                    }} className="hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-colors duration-300">
                        <Settings className="w-4 h-4 mr-2" /> Reiniciar
                    </Button>
                    <div className="w-px h-8 bg-white/10 mx-2" />
                    <Button variant="ghost" size="sm" onClick={() => {
                        const { players, prizePool, blindsStructure, currentLevelIndex } = useGameStore.getState();
                        const activePlayers = players.filter(p => p.status !== 'busted');
                        const bustedPlayers = players.filter(p => p.status === 'busted').sort((a, b) => b.buyInTime - a.buyInTime); // Approximate finish order

                        let summary = `🏆 *Resultados del Torneo PokerPulse* 🏆\n\n`;
                        summary += `💰 *Bolsa de Premios:* $${prizePool.toLocaleString()}\n`;
                        summary += `⏱️ *Nivel:* ${currentLevelIndex + 1} (${blindsStructure[currentLevelIndex]?.smallBlind}/${blindsStructure[currentLevelIndex]?.bigBlind})\n\n`;

                        summary += `🟢 *Jugadores Activos (${activePlayers.length}):*\n`;
                        activePlayers.forEach(p => {
                            summary += `• ${p.name}: ${p.chips.toLocaleString()} fichas\n`;
                        });

                        if (bustedPlayers.length > 0) {
                            summary += `\n🔴 *Eliminados:*\n`;
                            bustedPlayers.forEach(p => {
                                summary += `• ${p.name}\n`;
                            });
                        }

                        navigator.clipboard.writeText(summary).then(() => alert('¡Resultados copiados al portapapeles! 📋'));
                    }} className="hover:bg-green-500/10 text-green-400 hover:text-green-500 transition-colors duration-300">
                        <Share2 className="w-4 h-4 mr-2" /> Exportar
                    </Button>
                </div>
            </header >

            {/* Main Content Grid */}
            < main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-hidden z-10" >

                {/* Left Column: Players & Stats (3 cols) */}
                < div className="lg:col-span-3 space-y-6 flex flex-col h-full" >
                    <div className="glass-panel rounded-2xl p-6 h-full flex flex-col">
                        <h3 className="text-primary font-bold mb-6 uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" /> Jugadores
                        </h3>
                        <div className="flex-1 overflow-hidden -mx-2 px-2">
                            <PlayerList />
                        </div>
                    </div>
                </div >

                {/* Center Column: Timer & Game Info (6 cols) */}
                < div className="lg:col-span-6 flex flex-col gap-6 h-full" >
                    <div className="flex-1 glass-panel rounded-2xl p-8 flex items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
                        <Timer />
                    </div>

                    {/* Game Log */}
                    <div className="h-64 glass-panel rounded-2xl p-6 overflow-hidden flex flex-col">
                        <h3 className="text-gray-500 font-bold mb-4 uppercase text-xs tracking-[0.2em]">Registro de Partida</h3>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <GameLog />
                        </div>
                    </div>
                </div >

                {/* Right Column: Blinds & Chips (3 cols) */}
                < div className="lg:col-span-3 space-y-6 flex flex-col h-full" >
                    <div className="glass-panel rounded-2xl p-6 max-h-[50%] overflow-hidden flex flex-col">
                        <h3 className="text-secondary font-bold mb-6 uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                            <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" /> Agenda de Ciegas
                        </h3>
                        <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
                            <BlindsList />
                        </div>
                    </div>

                    <div className="glass-panel rounded-2xl p-6 max-h-[50%] overflow-hidden flex flex-col">
                        <h3 className="text-accent font-bold mb-6 uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                            <span className="w-2 h-2 bg-accent rounded-full animate-pulse" /> Valores de Fichas
                        </h3>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <ChipList />
                        </div>
                    </div>
                </div >

            </main >
        </div >
    );
};
