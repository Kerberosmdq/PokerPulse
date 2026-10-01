import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Flame, Grid3x3, Play, RotateCcw, Trophy, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { HandCards } from './PlayingCards';
import { MiniTable } from './MiniTable';
import { ACTION_STYLE, pillStyle } from './actionStyles';
import { advise, SITUATION_INFO, STACK_INFO, type Action, type Spot } from '../../poker/advisor';
import { handLabel, handName } from '../../poker/cards';
import { POSITION_INFO, positionsForTable, type PositionGroup } from '../../poker/positions';
import {
    DIFFICULTY_INFO, MAX_ROUND_POINTS, ROUND_LENGTH, generateRound, pointsFor, roundVerdict,
    type Difficulty, type Question,
} from '../../poker/practice';

interface PracticeStats {
    difficulty: Difficulty;
    bestStreak: number;
    bestScore: Partial<Record<Difficulty, number>>;
    answered: number;
    correct: number;
}

const STATS_KEY = 'nexpulse-practice';
const EMPTY_STATS: PracticeStats = { difficulty: 'normal', bestStreak: 0, bestScore: {}, answered: 0, correct: 0 };

const loadStats = (): PracticeStats => {
    try {
        return { ...EMPTY_STATS, ...JSON.parse(localStorage.getItem(STATS_KEY) || '{}') };
    } catch {
        return EMPTY_STATS;
    }
};

const RAISER_TEXT: Record<PositionGroup, string> = {
    early: 'desde posición temprana',
    middle: 'desde posición media',
    late: 'desde posición tardía',
    blinds: 'desde la ciega chica',
};

const situationText = (spot: Spot) =>
    spot.situation === 'raised' && spot.raiser ? `${SITUATION_INFO.raised.label} ${RAISER_TEXT[spot.raiser]}` : SITUATION_INFO[spot.situation].label;

interface Answer {
    question: Question;
    chosen: Action;
    correct: boolean;
    points: number;
}

type Phase = 'intro' | 'playing' | 'done';

/** Modo práctica: rondas cortas de "¿qué hacés?" para aprender los rangos entre manos. */
export const PracticeTab: React.FC<{ onOpenChart?: (spot: Spot) => void }> = ({ onOpenChart }) => {
    const [stats, setStats] = useState<PracticeStats>(loadStats);
    const [phase, setPhase] = useState<Phase>('intro');
    const [round, setRound] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [streak, setStreak] = useState(0);
    const [isRecord, setIsRecord] = useState(false);

    useEffect(() => {
        try {
            localStorage.setItem(STATS_KEY, JSON.stringify(stats));
        } catch {
            /* Estadísticas opcionales */
        }
    }, [stats]);

    const index = answers.length;
    const current = round[index];
    const last = answers[answers.length - 1];
    // Se muestra la respuesta de la última pregunta hasta tocar "Siguiente"
    const [revealed, setRevealed] = useState(false);
    const score = answers.reduce((sum, a) => sum + a.points, 0);

    const start = (difficulty = stats.difficulty) => {
        setStats(s => ({ ...s, difficulty }));
        setRound(generateRound(Math.random, difficulty));
        setAnswers([]);
        setStreak(0);
        setRevealed(false);
        setPhase('playing');
    };

    const answer = (chosen: Action) => {
        if (!current || revealed) return;
        const correct = chosen === current.correct;
        const points = pointsFor(correct, streak);
        const nextStreak = correct ? streak + 1 : 0;
        setAnswers(prev => [...prev, { question: current, chosen, correct, points }]);
        setStreak(nextStreak);
        setRevealed(true);
        setStats(s => ({
            ...s,
            answered: s.answered + 1,
            correct: s.correct + (correct ? 1 : 0),
            bestStreak: Math.max(s.bestStreak, nextStreak),
        }));
    };

    const next = () => {
        setRevealed(false);
        if (answers.length >= round.length) {
            setIsRecord(score > 0 && score > (stats.bestScore[stats.difficulty] ?? 0));
            setStats(s => ({ ...s, bestScore: { ...s.bestScore, [s.difficulty]: Math.max(s.bestScore[s.difficulty] ?? 0, score) } }));
            setPhase('done');
        }
    };

    if (phase === 'intro') return <Intro stats={stats} onStart={start} />;
    if (phase === 'done') {
        return (
            <Summary
                answers={answers}
                score={score}
                isRecord={isRecord}
                difficulty={stats.difficulty}
                onAgain={() => start()}
                onMenu={() => setPhase('intro')}
                onOpenChart={onOpenChart}
            />
        );
    }

    const shown = revealed ? last.question : current;
    if (!shown) return null;

    return (
        <div className="max-w-xl mx-auto space-y-3 pb-28 sm:pb-0">
            <ProgressBar index={revealed ? index : index + 1} total={round.length} score={score} streak={streak} />
            <QuestionCard key={revealed ? `r${index}` : `q${index}`} question={shown} />

            {!revealed ? (
                <div className="grid grid-cols-2 gap-2" role="group" aria-label="¿Qué hacés?">
                    {shown.options.map((a, i) => (
                        <button
                            key={a}
                            onClick={() => answer(a)}
                            className={cn(
                                'h-14 rounded-xl font-black text-base active:scale-[0.97] transition-transform shadow-lg',
                                shown.options.length % 2 === 1 && i === shown.options.length - 1 && 'col-span-2'
                            )}
                            style={{ ...pillStyle(a), boxShadow: `0 0 0 1px ${ACTION_STYLE[a].ring}55` }}
                        >
                            {ACTION_STYLE[a].label}
                        </button>
                    ))}
                </div>
            ) : (
                <Feedback answer={last} isLast={answers.length >= round.length} onNext={next} onOpenChart={onOpenChart} />
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------

const Intro: React.FC<{ stats: PracticeStats; onStart: (d: Difficulty) => void }> = ({ stats, onStart }) => {
    const [difficulty, setDifficulty] = useState(stats.difficulty);
    const accuracy = stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : null;

    return (
        <div className="max-w-xl mx-auto space-y-4">
            <section className="glass-panel rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-warning/15 text-warning flex items-center justify-center shrink-0">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="font-black text-lg leading-tight">Modo práctica</h2>
                        <p className="text-xs text-gray-400">{ROUND_LENGTH} manos, un minuto. Ideal para un descanso.</p>
                    </div>
                </div>
                <p className="text-sm text-gray-300">
                    Te muestro una mano y la situación; vos elegís qué hacer. Cada acierto suma 10 puntos y los aciertos seguidos dan bonus 🔥.
                </p>
            </section>

            <section className="glass-panel rounded-2xl p-4 space-y-2" aria-label="Dificultad">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">Dificultad</div>
                <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(DIFFICULTY_INFO) as Difficulty[]).map(d => (
                        <button
                            key={d}
                            onClick={() => setDifficulty(d)}
                            aria-pressed={difficulty === d}
                            className={cn(
                                'rounded-xl border px-2 py-2.5 text-center transition-colors',
                                difficulty === d ? 'border-primary/60 bg-primary/15 text-primary' : 'border-white/10 bg-white/[0.03] text-gray-300 hover:text-white'
                            )}
                        >
                            <div className="font-black text-sm">{DIFFICULTY_INFO[d].label}</div>
                            <div className="text-[10px] text-gray-500 leading-tight mt-0.5">{DIFFICULTY_INFO[d].hint}</div>
                            {stats.bestScore[d] ? <div className="text-[10px] font-mono text-warning mt-1">Récord {stats.bestScore[d]}</div> : null}
                        </button>
                    ))}
                </div>
            </section>

            <button
                onClick={() => onStart(difficulty)}
                className="w-full h-14 rounded-xl bg-primary text-black font-black text-lg flex items-center justify-center gap-2 glow-primary active:scale-[0.98] transition-transform"
            >
                <Play className="w-5 h-5 fill-current" /> Empezar
            </button>

            {stats.answered > 0 && (
                <div className="grid grid-cols-3 gap-2 text-center">
                    <Stat label="Manos" value={String(stats.answered)} />
                    <Stat label="Aciertos" value={`${accuracy}%`} />
                    <Stat label="Mejor racha" value={String(stats.bestStreak)} />
                </div>
            )}
        </div>
    );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="glass-panel rounded-xl py-2.5">
        <div className="font-black font-mono text-lg">{value}</div>
        <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{label}</div>
    </div>
);

const ProgressBar: React.FC<{ index: number; total: number; score: number; streak: number }> = ({ index, total, score, streak }) => (
    <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-gray-400">Mano <span className="text-white font-mono">{index}</span>/{total}</span>
            <span className="flex items-center gap-3">
                <AnimatePresence>
                    {streak >= 2 && (
                        <motion.span
                            key={streak}
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center gap-1 text-warning font-black"
                            aria-label={`Racha de ${streak}`}
                        >
                            <Flame className="w-4 h-4 fill-current" /> {streak}
                        </motion.span>
                    )}
                </AnimatePresence>
                <span className="font-black font-mono text-primary">{score} pts</span>
            </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${(index / total) * 100}%` }} />
        </div>
    </div>
);

const QuestionCard: React.FC<{ question: Question }> = ({ question }) => {
    const { spot, hand } = question;
    const seat = positionsForTable(spot.players).indexOf(spot.position);
    return (
        <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="glass-panel rounded-2xl p-4 space-y-3"
            aria-label="Situación"
        >
            <MiniTable
                players={spot.players}
                dealerSeat={0}
                highlightSeat={seat}
                highlightLabel="Vos"
                center={<HandCards hand={hand} size="md" />}
                className="max-w-[340px] mx-auto"
            />
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                <Fact label="Tu posición" value={POSITION_INFO[spot.position].name} />
                <Fact label="Tu mano" value={handLabel(hand)} />
                <Fact label="Qué pasó antes" value={situationText(spot)} />
                <Fact label="Tus fichas" value={`${STACK_INFO[spot.stack].label} (${STACK_INFO[spot.stack].range})`} />
            </div>
            <p className="text-center font-black text-lg pt-1">¿Qué hacés?</p>
        </motion.section>
    );
};

const Fact: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="min-w-0">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</div>
        <div className="text-gray-100 font-semibold leading-snug">{value}</div>
    </div>
);

const Feedback: React.FC<{ answer: Answer; isLast: boolean; onNext: () => void; onOpenChart?: (spot: Spot) => void }> = ({ answer, isLast, onNext, onOpenChart }) => {
    const { question, chosen, correct, points } = answer;
    const advice = useMemo(() => advise(question.spot, question.hand), [question]);

    return (
        <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
                'fixed inset-x-0 bottom-0 z-30 sm:static rounded-t-2xl sm:rounded-2xl border-t sm:border p-4 space-y-3 bg-surface/95 backdrop-blur-md',
                correct ? 'border-primary/40' : 'border-accent/40'
            )}
            aria-live="polite"
        >
            <div className="max-w-xl mx-auto space-y-3">
                <div className="flex items-center gap-2">
                    <span className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', correct ? 'bg-primary text-black' : 'bg-accent text-white')}>
                        {correct ? <Check className="w-5 h-5" strokeWidth={3} /> : <X className="w-5 h-5" strokeWidth={3} />}
                    </span>
                    <span className="font-black text-lg">{correct ? `¡Bien! +${points}` : `Elegiste ${ACTION_STYLE[chosen].label.toLowerCase()}`}</span>
                </div>
                <div className="rounded-xl px-4 py-2.5 font-black" style={pillStyle(advice.action)}>{advice.label}</div>
                <p className="text-sm text-gray-200 leading-relaxed">{advice.reason}</p>
                <div className="flex gap-2">
                    {onOpenChart && (
                        <button onClick={() => onOpenChart(question.spot)} className="h-12 px-4 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-bold text-gray-200 flex items-center gap-2">
                            <Grid3x3 className="w-4 h-4" /> Tabla
                        </button>
                    )}
                    <button onClick={onNext} autoFocus className="flex-1 h-12 rounded-xl bg-primary text-black font-black">
                        {isLast ? 'Ver resultado' : 'Siguiente'}
                    </button>
                </div>
            </div>
        </motion.section>
    );
};

const Summary: React.FC<{
    answers: Answer[];
    score: number;
    isRecord: boolean;
    difficulty: Difficulty;
    onAgain: () => void;
    onMenu: () => void;
    onOpenChart?: (spot: Spot) => void;
}> = ({ answers, score, isRecord: record, difficulty, onAgain, onMenu, onOpenChart }) => {
    const hits = answers.filter(a => a.correct).length;
    const verdict = roundVerdict(hits, answers.length);
    const mistakes = answers.filter(a => !a.correct);

    return (
        <div className="max-w-xl mx-auto space-y-4">
            <motion.section
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel rounded-2xl p-5 text-center space-y-2"
            >
                <Trophy className={cn('w-10 h-10 mx-auto', record ? 'text-warning' : 'text-gray-500')} />
                <h2 className="font-black text-2xl">{verdict.title}</h2>
                <p className="text-sm text-gray-400">{verdict.text}</p>
                <div className="flex justify-center gap-6 pt-2">
                    <div>
                        <div className="font-black font-mono text-3xl text-primary">{hits}/{answers.length}</div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Aciertos</div>
                    </div>
                    <div>
                        <div className="font-black font-mono text-3xl">{score}</div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">de {MAX_ROUND_POINTS} pts</div>
                    </div>
                </div>
                {record && <p className="text-xs font-bold text-warning">¡Nuevo récord en {DIFFICULTY_INFO[difficulty].label.toLowerCase()}!</p>}
            </motion.section>

            {mistakes.length > 0 && (
                <section className="glass-panel rounded-2xl p-4 space-y-2" aria-label="Errores">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">Para repasar</h3>
                    <ul className="divide-y divide-white/5">
                        {mistakes.map((m, i) => (
                            <li key={i} className="flex items-center gap-3 py-2.5">
                                <HandCards hand={m.question.hand} size="sm" />
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm font-bold truncate">{POSITION_INFO[m.question.spot.position].name} · {situationText(m.question.spot)}</div>
                                    <div className="text-xs text-gray-400 truncate">{handName(m.question.hand)}</div>
                                    <div className="text-xs mt-0.5">
                                        <span className="text-gray-500 line-through">{ACTION_STYLE[m.chosen].label}</span>
                                        <span className="text-gray-500"> → </span>
                                        <span className="font-bold text-white">{ACTION_STYLE[m.question.correct].label}</span>
                                    </div>
                                </div>
                                {onOpenChart && (
                                    <button onClick={() => onOpenChart(m.question.spot)} className="p-2 rounded-lg text-gray-400 hover:text-white" aria-label="Ver en la tabla">
                                        <Grid3x3 className="w-5 h-5" />
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <div className="flex gap-2">
                <button onClick={onMenu} className="h-14 px-5 rounded-xl border border-white/10 bg-white/[0.04] font-bold text-gray-200">Menú</button>
                <button onClick={onAgain} className="flex-1 h-14 rounded-xl bg-primary text-black font-black text-lg flex items-center justify-center gap-2 glow-primary">
                    <RotateCcw className="w-5 h-5" /> Otra ronda
                </button>
            </div>
        </div>
    );
};
