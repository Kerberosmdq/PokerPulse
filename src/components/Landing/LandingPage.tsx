import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Play, Trophy, Users, Clock } from 'lucide-react';

export const LandingPage: React.FC = () => {
    const { setGameState } = useGameStore();

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.3
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease: "easeOut" }
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-primary selection:text-black relative overflow-hidden flex flex-col items-center justify-center">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '6s' }} />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />
            </div>

            <motion.div
                className="relative z-10 flex flex-col items-center max-w-4xl px-4 text-center"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Logo */}
                <motion.div variants={itemVariants} className="mb-8 relative group">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full group-hover:bg-primary/30 transition-all duration-500" />
                    <img
                        src="/logo.png?v=5"
                        alt="PokerPulse Logo"
                        className="w-48 h-48 md:w-64 md:h-64 object-contain relative z-10 drop-shadow-[0_0_30px_rgba(0,255,157,0.3)]"
                    />
                </motion.div>

                {/* Title */}
                <motion.h1
                    variants={itemVariants}
                    className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-secondary mb-6 drop-shadow-[0_0_30px_rgba(0,255,157,0.3)]"
                >
                    POKERPULSE
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    variants={itemVariants}
                    className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl font-light tracking-wide"
                >
                    El gestor de torneos definitivo para partidas profesionales en casa.
                </motion.p>

                {/* Start Button */}
                <motion.div variants={itemVariants}>
                    <Button
                        onClick={() => setGameState('setup')}
                        size="lg"
                        className="w-64 h-16 rounded-full text-xl font-bold tracking-widest uppercase bg-gradient-to-r from-primary to-emerald-400 hover:from-primary/90 hover:to-emerald-400/90 text-black shadow-[0_0_40px_rgba(0,255,157,0.4)] hover:shadow-[0_0_60px_rgba(0,255,157,0.6)] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 border-4 border-black/20"
                    >
                        <Play className="w-6 h-6 fill-current" />
                        Iniciar Torneo
                    </Button>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 w-full"
                >
                    <div className="flex flex-col items-center p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                        <Clock className="w-10 h-10 text-primary mb-4" />
                        <h3 className="text-lg font-bold mb-2">Timer Pro</h3>
                        <p className="text-sm text-gray-400">Niveles de ciegas precisos con descansos y estructuras personalizadas.</p>
                    </div>
                    <div className="flex flex-col items-center p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                        <Users className="w-10 h-10 text-secondary mb-4" />
                        <h3 className="text-lg font-bold mb-2">Gestión de Jugadores</h3>
                        <p className="text-sm text-gray-400">Controla entradas, re-entradas y premios sin esfuerzo.</p>
                    </div>
                    <div className="flex flex-col items-center p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                        <Trophy className="w-10 h-10 text-yellow-400 mb-4" />
                        <h3 className="text-lg font-bold mb-2">Modo Torneo</h3>
                        <p className="text-sm text-gray-400">Cálculo automático de bolsa de premios y sorteo de asientos.</p>
                    </div>
                </motion.div>
            </motion.div>

            {/* Footer */}
            <div className="absolute bottom-4 text-xs text-gray-600 font-mono">
                v1.0.0 • MADE BY MIGA
            </div>
        </div>
    );
};
