import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { X, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SeatingDrawProps {
    onClose: () => void;
}

export const SeatingDraw: React.FC<SeatingDrawProps> = ({ onClose }) => {
    const { players } = useGameStore();
    const [seatedPlayers, setSeatedPlayers] = useState<(any | null)[]>([]);
    const [isShuffling, setIsShuffling] = useState(false);

    // Filter only active players for the draw
    const activePlayers = players.filter(p => p.status !== 'busted');

    // Fixed positions for a 9-handed table (oval)
    const MAX_SEATS = 9;

    const handleDraw = () => {
        setIsShuffling(true);

        // Simulate shuffling effect
        let shuffleCount = 0;
        const maxShuffles = 10;
        const interval = setInterval(() => {
            const shuffled = [...activePlayers].sort(() => Math.random() - 0.5);
            // Fill remaining seats with null if there are fewer players than MAX_SEATS
            const finalSeating = Array(MAX_SEATS).fill(null).map((_, i) => shuffled[i] || null);
            setSeatedPlayers(finalSeating);
            shuffleCount++;

            if (shuffleCount >= maxShuffles) {
                clearInterval(interval);
                setIsShuffling(false);
            }
        }, 100);
    };

    const getSeatPosition = (seatNum: number) => {
        const index = seatNum - 1;
        // Seat 1 at Top Center (-90 degrees)
        const angle = (index * (2 * Math.PI / MAX_SEATS)) - Math.PI / 2;

        const a = 320; // Width radius
        const b = 160; // Height radius

        return {
            x: a * Math.cos(angle),
            y: b * Math.sin(angle)
        };
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-hidden">
            <div className="w-full max-w-5xl h-full max-h-[800px] relative flex flex-col items-center justify-center">
                <Button
                    variant="ghost"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white z-50"
                >
                    <X className="w-6 h-6" />
                </Button>

                <div className="text-center mb-12 relative z-10">
                    <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(0,255,157,0.5)]">
                        Sorteo de Asientos
                    </h2>
                    <p className="text-gray-400 mt-2 tracking-widest uppercase text-xs">
                        {activePlayers.length} Jugadores / {MAX_SEATS} Asientos
                    </p>
                </div>

                <div className="relative w-full flex-1 flex items-center justify-center scale-75 md:scale-100">
                    {/* Poker Table */}
                    <div className="relative w-[700px] h-[350px] bg-[#0f0f0f] rounded-[175px] border-[12px] border-[#2a2a2a] shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_0_50px_rgba(0,0,0,0.8)] flex items-center justify-center">
                        {/* Felt */}
                        <div className="absolute inset-2 rounded-[160px] bg-gradient-to-b from-green-900/20 to-green-950/20 shadow-inner border border-white/5" />

                        {/* Center Logo/Button */}
                        <div className="z-10">
                            <Button
                                onClick={handleDraw}
                                disabled={isShuffling || activePlayers.length < 2}
                                size="lg"
                                variant="primary"
                                className="shadow-[0_0_30px_rgba(0,255,157,0.3)] hover:shadow-[0_0_50px_rgba(0,255,157,0.5)] hover:scale-110 transition-all rounded-full w-24 h-24 flex flex-col gap-1"
                            >
                                <Shuffle className={`w-8 h-8 ${isShuffling ? 'animate-spin' : ''}`} />
                                <span className="text-[10px]">SORTEO</span>
                            </Button>
                        </div>

                        {/* Seats */}
                        {Array.from({ length: MAX_SEATS }).map((_, i) => {
                            const seatNum = i + 1;
                            const pos = getSeatPosition(seatNum);
                            const player = seatedPlayers[i];

                            return (
                                <div
                                    key={seatNum}
                                    className="absolute w-32 flex flex-col items-center justify-center pointer-events-none"
                                    style={{
                                        transform: `translate(${pos.x}px, ${pos.y}px)`,
                                        zIndex: 20
                                    }}
                                >
                                    {/* Dealer Button Badge for Seat 1 */}
                                    {seatNum === 1 && (
                                        <div className="absolute -top-14 flex flex-col items-center">
                                            <div className="w-10 h-10 rounded-full bg-white text-black font-black text-sm flex items-center justify-center border-2 border-gray-300 shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                                                D
                                            </div>
                                            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-1">Botón</span>
                                        </div>
                                    )}

                                    <div className="relative group">
                                        <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.5)] relative z-10 transition-all duration-300 ${player ? 'bg-surface-light border-primary/50 scale-110' : 'bg-black/40 border-white/5'}`}>
                                            {player ? (
                                                <span className="text-xl font-bold text-white">{player.name.charAt(0)}</span>
                                            ) : (
                                                <span className="text-xs font-bold text-gray-700">{seatNum}</span>
                                            )}

                                            <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center border border-black shadow-lg ${player ? 'bg-primary text-black' : 'bg-gray-800 text-gray-500'}`}>
                                                {seatNum}
                                            </div>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {player && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="mt-2 bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full border border-primary/30 text-center min-w-[100px] shadow-[0_0_15px_rgba(0,255,157,0.2)]"
                                            >
                                                <div className="text-xs font-bold text-white truncate max-w-[90px]">{player.name}</div>
                                                <div className="text-[10px] text-primary font-mono">{player.chips.toLocaleString()}</div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
