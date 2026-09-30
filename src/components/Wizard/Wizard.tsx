import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Play, Check } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { cn } from '../../utils/cn';
import { validateBlindsStructure } from '../../utils/tournament';
import { TournamentConfig } from './TournamentConfig';
import { BlindsConfig } from './BlindsConfig';
import { ChipsConfig } from './ChipsConfig';
import { PlayersSetup } from './PlayersSetup';

const STEPS = [
    { id: 'tournament', label: 'Torneo' },
    { id: 'blinds', label: 'Ciegas' },
    { id: 'chips', label: 'Fichas' },
    { id: 'players', label: 'Jugadores' },
] as const;

export const Wizard: React.FC = () => {
    const [step, setStep] = useState(0);
    const [validationError, setValidationError] = useState('');
    const blindsStructure = useGameStore(s => s.blindsStructure);
    // Si ya hay un torneo en marcha, el asistente funciona como "editar configuración"
    const inProgress = useGameStore(s => s.tournamentStartedAt !== null);
    const { setGameState } = useGameStore.getState();

    const canLeaveStep = (from: number) => {
        if (STEPS[from].id === 'blinds') {
            const errors = validateBlindsStructure(blindsStructure);
            if (errors.length > 0) {
                setValidationError(errors[0]);
                return false;
            }
        }
        setValidationError('');
        return true;
    };

    const goTo = (target: number) => {
        if (target === step) return;
        if (target > step && !canLeaveStep(step)) return;
        setStep(target);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const finish = () => {
        if (!canLeaveStep(step)) return;
        const errors = validateBlindsStructure(blindsStructure);
        if (errors.length > 0) {
            setStep(1);
            setValidationError(errors[0]);
            return;
        }
        setGameState('active');
    };

    const isLast = step === STEPS.length - 1;

    return (
        <div className="min-h-screen flex justify-center px-4 py-8 md:py-12">
            <div className="w-full max-w-5xl">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Logo className="w-12 h-12" />
                        <div>
                            <div className="font-black text-2xl tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-secondary">NEXPULSE</div>
                            <div className="text-[11px] text-gray-500 uppercase tracking-[0.25em]">{inProgress ? 'Editar configuración' : 'Nuevo torneo'}</div>
                        </div>
                    </div>
                    {inProgress && (
                        <Button variant="outline" size="sm" onClick={finish}>Volver al torneo</Button>
                    )}
                </div>

                {/* Pasos */}
                <ol className="grid grid-cols-4 gap-2 mb-6" aria-label="Pasos">
                    {STEPS.map((s, i) => (
                        <li key={s.id}>
                            <button
                                onClick={() => goTo(i)}
                                aria-current={i === step ? 'step' : undefined}
                                className="w-full text-left group"
                            >
                                <div className={cn('h-1 rounded-full transition-all duration-500', i <= step ? 'bg-gradient-to-r from-primary to-secondary' : 'bg-white/10 group-hover:bg-white/20')} />
                                <div className={cn('mt-2 text-[11px] uppercase tracking-wider font-bold flex items-center gap-1.5', i === step ? 'text-white' : i < step ? 'text-primary' : 'text-gray-600 group-hover:text-gray-400')}>
                                    {i < step ? <Check className="w-3 h-3" /> : <span className="font-mono">{i + 1}</span>}
                                    {s.label}
                                </div>
                            </button>
                        </li>
                    ))}
                </ol>

                <div className="glass-panel rounded-3xl p-5 md:p-10 shadow-2xl">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="min-h-[380px]"
                        >
                            {STEPS[step].id === 'tournament' && <TournamentConfig />}
                            {STEPS[step].id === 'blinds' && <BlindsConfig />}
                            {STEPS[step].id === 'chips' && <ChipsConfig />}
                            {STEPS[step].id === 'players' && <PlayersSetup />}
                        </motion.div>
                    </AnimatePresence>

                    {validationError && (
                        <div className="bg-accent/10 border border-accent/30 p-3 rounded-lg mt-6" role="alert">
                            <p className="text-sm text-accent font-bold">⚠️ {validationError}</p>
                        </div>
                    )}

                    <div className="flex justify-between gap-3 pt-6 mt-8 border-t border-white/10">
                        <Button
                            variant="ghost"
                            onClick={() => (step > 0 ? goTo(step - 1) : setGameState(inProgress ? 'active' : 'landing'))}
                        >
                            <ChevronLeft className="w-5 h-5" /> {step > 0 ? 'Atrás' : inProgress ? 'Volver' : 'Inicio'}
                        </Button>

                        {isLast ? (
                            <Button onClick={finish} size="lg" className="glow-primary">
                                {inProgress ? 'Guardar y volver' : 'Comenzar torneo'} <Play className="w-5 h-5 fill-current" />
                            </Button>
                        ) : (
                            <Button onClick={() => goTo(step + 1)} size="lg" variant="neon">
                                Siguiente <ChevronRight className="w-5 h-5" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
