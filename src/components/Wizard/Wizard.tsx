import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { BlindsConfig } from './BlindsConfig';
import { ChipsConfig } from './ChipsConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Play } from 'lucide-react';

export const Wizard: React.FC = () => {
    const [step, setStep] = useState(1);
    const { setGameState } = useGameStore();

    const handleNext = () => {
        if (step < 2) setStep(step + 1);
        else handleStartGame();
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
        else setGameState('landing');
    };

    const handleStartGame = () => {
        setGameState('active');
        // startTimer(); // Optional: start immediately or wait for user
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-5xl relative z-10">
                <div className="text-center space-y-4 mb-12 flex flex-col items-center">
                    <img src="/logo.png?v=5" alt="PokerPulse Logo" className="w-32 h-32 object-contain drop-shadow-[0_0_15px_rgba(0,255,157,0.5)] mb-4" />
                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-secondary drop-shadow-[0_0_15px_rgba(0,255,157,0.5)] tracking-tighter">
                        POKERPULSE
                    </h1>
                    <p className="text-gray-400 text-lg tracking-widest uppercase">Configuración del Torneo</p>
                </div>

                <div className="glass-panel rounded-2xl p-8 md:p-12 backdrop-blur-xl border border-white/10 shadow-2xl">
                    {/* Stepper */}
                    <div className="flex justify-center gap-4 mb-12">
                        {[1, 2].map((i) => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <div
                                    className={`h-1 w-24 rounded-full transition-all duration-500 ${step >= i
                                        ? 'bg-gradient-to-r from-primary to-secondary shadow-[0_0_10px_rgba(0,255,157,0.5)]'
                                        : 'bg-white/10'
                                        }`}
                                />
                                <span className={`text-xs uppercase tracking-wider font-bold ${step >= i ? 'text-white' : 'text-gray-600'}`}>
                                    {i === 1 ? 'Ciegas' : 'Fichas'}
                                </span>
                            </div>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="min-h-[400px]"
                        >
                            {step === 1 && <BlindsConfig />}
                            {step === 2 && <ChipsConfig />}
                        </motion.div>
                    </AnimatePresence>

                    <div className="flex justify-between pt-8 mt-8 border-t border-white/10">
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            className={`transition-opacity duration-300 ${step === 1 ? 'text-gray-500 hover:text-white' : 'opacity-100'}`}
                        >
                            <ChevronLeft className="w-5 h-5 mr-2" /> {step === 1 ? 'Inicio' : 'Atrás'}
                        </Button>

                        <Button
                            onClick={handleNext}
                            size="lg"
                            variant={step === 2 ? 'primary' : 'neon'}
                            className="w-48 shadow-lg"
                        >
                            {step === 2 ? (
                                <>Comenzar <Play className="w-5 h-5 ml-2 fill-current" /></>
                            ) : (
                                <>Siguiente <ChevronRight className="w-5 h-5 ml-2" /></>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
