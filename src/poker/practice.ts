import { ALL_HANDS, handPercentile, type HandKey } from './cards';
import { POSITION_INFO, preflopOrder, type PositionGroup, type PositionId } from './positions';
import { buildChart, type Action, type Situation, type Spot, type StackDepth } from './advisor';

/** Modo práctica: preguntas de "¿qué hacés con esta mano?" con puntos y rachas. */

export type Difficulty = 'easy' | 'normal' | 'hard';

export const DIFFICULTY_INFO: Record<Difficulty, { label: string; hint: string }> = {
    easy: { label: 'Fácil', hint: 'Solo abrir cuando nadie entró' },
    normal: { label: 'Normal', hint: 'Abrir, pagaron y subieron' },
    hard: { label: 'Difícil', hint: 'Todas las situaciones y stacks' },
};

export interface Question {
    spot: Spot;
    hand: HandKey;
    correct: Action;
    /** Botones de respuesta (incluye siempre la correcta) */
    options: Action[];
}

export const ROUND_LENGTH = 10;

/** Generador pseudoaleatorio con semilla (para que los tests sean reproducibles). */
export const seededRandom = (seed: number) => {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

type Rng = () => number;
const pick = <T,>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng() * items.length)];

const SITUATIONS: Record<Difficulty, Situation[]> = {
    easy: ['unopened'],
    // "Nadie entró" aparece más seguido porque es lo más común en la mesa
    normal: ['unopened', 'unopened', 'raised', 'raised', 'limped'],
    hard: ['unopened', 'raised', 'raised', 'limped', 'threebet', 'allin'],
};

const STACKS: Record<Difficulty, StackDepth[]> = {
    easy: ['deep'],
    normal: ['deep', 'deep', 'medium'],
    hard: ['deep', 'medium', 'short'],
};

const PLAYERS: Record<Difficulty, number[]> = {
    easy: [9],
    normal: [6, 8, 9],
    hard: [6, 7, 8, 9],
};

// Orden de los botones de respuesta
const OPTION_ORDER: Action[] = ['fold', 'check', 'call', 'raise', 'threebet', 'fourbet', 'allin'];

/** Posiciones válidas para la situación (p. ej. nadie puede haber subido antes del primero en hablar). */
const validPositions = (players: number, situation: Situation): PositionId[] => {
    const order = preflopOrder(players);
    switch (situation) {
        case 'unopened':
        case 'threebet':
            // La ciega grande no puede abrir: si todos se tiraron, ya ganó
            return order.filter(p => p !== 'BB');
        case 'raised':
        case 'limped':
        case 'allin':
            // Alguien tuvo que hablar antes
            return order.slice(1);
    }
};

/** Desde dónde pudo haber subido el rival: alguna posición que habla antes que vos. */
const raiserGroupsBefore = (players: number, position: PositionId): PositionGroup[] => {
    const order = preflopOrder(players);
    const before = order.slice(0, order.indexOf(position));
    return [...new Set(before.map(p => POSITION_INFO[p].group))];
};

export const generateQuestion = (rng: Rng, difficulty: Difficulty): Question => {
    const players = pick(rng, PLAYERS[difficulty]);
    const situation = pick(rng, SITUATIONS[difficulty]);
    const position = pick(rng, validPositions(players, situation));
    const stack = pick(rng, STACKS[difficulty]);
    const groups = raiserGroupsBefore(players, position);
    const raiser = situation === 'raised' && groups.length > 0 ? pick(rng, groups) : 'middle';
    const spot: Spot = { players, position, situation, stack, raiser };

    const chart = buildChart(spot);
    const played = ALL_HANDS.filter(h => chart[h] !== 'fold' && chart[h] !== 'check');
    // Manos que conviene tirar pero "tientan" (no la basura obvia)
    const tempting = ALL_HANDS.filter(h => (chart[h] === 'fold' || chart[h] === 'check') && handPercentile(h) <= 60);
    const pool = rng() < 0.55 && played.length > 0 ? played : tempting.length > 0 ? tempting : ALL_HANDS;
    const hand = pick(rng, pool);
    const correct = chart[hand];

    const present = new Set(Object.values(chart));
    const options = OPTION_ORDER.filter(a => present.has(a));
    // Siempre al menos dos opciones: si todo es lo mismo, sumar "tirarse"
    if (options.length < 2 && !options.includes('fold')) options.unshift('fold');

    return { spot, hand, correct, options };
};

export const generateRound = (rng: Rng, difficulty: Difficulty, length = ROUND_LENGTH) =>
    Array.from({ length }, () => generateQuestion(rng, difficulty));

/** Puntos por respuesta: 10 por acierto más 2 por cada acierto seguido (hasta +10). */
export const pointsFor = (correct: boolean, streakBefore: number) => (correct ? 10 + Math.min(streakBefore, 5) * 2 : 0);

export const MAX_ROUND_POINTS = Array.from({ length: ROUND_LENGTH }, (_, i) => pointsFor(true, i)).reduce((a, b) => a + b, 0);

/** Mensaje final según cuántas acertó. */
export const roundVerdict = (correct: number, total: number) => {
    const ratio = total > 0 ? correct / total : 0;
    if (ratio === 1) return { title: '¡Perfecto!', text: 'Jugaste como un profesional. Probá la dificultad siguiente.' };
    if (ratio >= 0.8) return { title: 'Muy bien', text: 'Ya tenés los rangos bastante claros.' };
    if (ratio >= 0.5) return { title: 'Vas bien', text: 'Repasá los errores: casi siempre son manos al límite.' };
    return { title: 'A seguir practicando', text: 'Mirá la tabla de cada posición y volvé a intentar.' };
};
