import { describe, expect, it } from 'vitest';
import { buildChart } from './advisor';
import { preflopOrder, POSITION_INFO } from './positions';
import { MAX_ROUND_POINTS, generateQuestion, generateRound, pointsFor, roundVerdict, seededRandom, type Difficulty } from './practice';

const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];

describe('generador de preguntas', () => {
    it('con la misma semilla genera las mismas preguntas', () => {
        expect(generateRound(seededRandom(42), 'hard')).toEqual(generateRound(seededRandom(42), 'hard'));
    });

    it('cada pregunta es coherente', () => {
        for (const difficulty of DIFFICULTIES) {
            const rng = seededRandom(7);
            for (let i = 0; i < 300; i++) {
                const q = generateQuestion(rng, difficulty);
                const order = preflopOrder(q.spot.players);
                // La respuesta correcta es la de la tabla y está entre las opciones
                expect(buildChart(q.spot)[q.hand]).toBe(q.correct);
                expect(q.options).toContain(q.correct);
                expect(q.options.length).toBeGreaterThanOrEqual(2);
                // Nadie puede haber subido antes del primero en hablar
                if (['raised', 'limped', 'allin'].includes(q.spot.situation)) expect(q.spot.position).not.toBe(order[0]);
                // La ciega grande no abre
                if (q.spot.situation === 'unopened') expect(q.spot.position).not.toBe('BB');
                // El que subió habla antes que vos
                if (q.spot.situation === 'raised') {
                    const before = order.slice(0, order.indexOf(q.spot.position)).map(p => POSITION_INFO[p].group);
                    expect(before).toContain(q.spot.raiser);
                }
            }
        }
    });

    it('fácil es solo "nadie entró" con muchas fichas', () => {
        const round = generateRound(seededRandom(1), 'easy', 50);
        expect(new Set(round.map(q => q.spot.situation))).toEqual(new Set(['unopened']));
        expect(new Set(round.map(q => q.spot.stack))).toEqual(new Set(['deep']));
    });

    it('no pregunta siempre por manos para tirar', () => {
        const round = generateRound(seededRandom(3), 'normal', 100);
        const played = round.filter(q => q.correct !== 'fold' && q.correct !== 'check').length;
        expect(played).toBeGreaterThan(30);
        expect(played).toBeLessThan(80);
    });
});

describe('puntaje', () => {
    it('suma bonus por racha, con tope', () => {
        expect(pointsFor(false, 3)).toBe(0);
        expect(pointsFor(true, 0)).toBe(10);
        expect(pointsFor(true, 2)).toBe(14);
        expect(pointsFor(true, 9)).toBe(20);
        expect(MAX_ROUND_POINTS).toBe(170);
    });

    it('da un mensaje según el resultado', () => {
        expect(roundVerdict(10, 10).title).toBe('¡Perfecto!');
        expect(roundVerdict(8, 10).title).toBe('Muy bien');
        expect(roundVerdict(2, 10).title).toBe('A seguir practicando');
    });
});
