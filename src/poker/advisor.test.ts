import { describe, expect, it } from 'vitest';
import { ALL_HANDS, parseRange, rangePercent } from './cards';
import { positionsForTable, MIN_PLAYERS, MAX_PLAYERS, type PositionGroup } from './positions';
import { OPEN_RAISE, SHORT_PUSH } from './ranges';
import { advise, buildChart, playedPercent, stackDepthFor, type Situation, type Spot, type StackDepth } from './advisor';

const SITUATIONS: Situation[] = ['unopened', 'limped', 'raised', 'threebet', 'allin'];
const STACKS: StackDepth[] = ['deep', 'medium', 'short'];
const RAISERS: PositionGroup[] = ['early', 'middle', 'late', 'blinds'];

const spot = (s: Partial<Spot>): Spot => ({ players: 9, position: 'BTN', situation: 'unopened', stack: 'deep', ...s });

describe('rangos', () => {
    it('todos los rangos están bien escritos', () => {
        Object.values(OPEN_RAISE).forEach(r => expect(() => parseRange(r)).not.toThrow());
        Object.values(SHORT_PUSH).forEach(r => expect(() => parseRange(r)).not.toThrow());
    });

    it('cuanto más tarde la posición, más manos se abren (y siempre incluye las anteriores)', () => {
        const order = ['UTG', 'UTG1', 'UTG2', 'UTG3', 'LJ', 'HJ', 'CO', 'BTN'] as const;
        for (let i = 1; i < order.length; i++) {
            const prev = parseRange(OPEN_RAISE[order[i - 1]]);
            const next = parseRange(OPEN_RAISE[order[i]]);
            prev.forEach(h => expect(next.has(h), `${h} de ${order[i - 1]} debería estar en ${order[i]}`).toBe(true));
            expect(next.size).toBeGreaterThan(prev.size);
        }
    });

    it('los porcentajes de apertura son razonables', () => {
        expect(rangePercent(parseRange(OPEN_RAISE.UTG))).toBeGreaterThan(8);
        expect(rangePercent(parseRange(OPEN_RAISE.UTG))).toBeLessThan(16);
        expect(rangePercent(parseRange(OPEN_RAISE.BTN))).toBeGreaterThan(35);
        expect(rangePercent(parseRange(OPEN_RAISE.BTN))).toBeLessThan(55);
    });
});

describe('buildChart', () => {
    it('da una acción para las 169 manos en cualquier situación posible', () => {
        for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) {
            for (const position of positionsForTable(n)) {
                for (const situation of SITUATIONS) {
                    for (const stack of STACKS) {
                        for (const raiser of RAISERS) {
                            const chart = buildChart({ players: n, position, situation, stack, raiser });
                            expect(Object.keys(chart)).toHaveLength(169);
                            // Ases siempre se juegan (salvo si ya ganaste las ciegas)
                            expect(['fold'].includes(chart.AA), `AA ${n}/${position}/${situation}/${stack}`).toBe(false);
                        }
                    }
                }
            }
        }
    });

    it('nunca se tira la mano cuando se puede pasar gratis', () => {
        const chart = buildChart(spot({ position: 'BB', situation: 'limped' }));
        expect(ALL_HANDS.some(h => chart[h] === 'fold')).toBe(false);
    });

    it('la ciega grande defiende con más manos que el botón frente a una subida', () => {
        const bb = playedPercent(buildChart(spot({ position: 'BB', situation: 'raised', raiser: 'late' })));
        const btn = playedPercent(buildChart(spot({ position: 'BTN', situation: 'raised', raiser: 'late' })));
        expect(bb).toBeGreaterThan(btn);
    });

    it('contra subidas tempranas se juega más ajustado que contra tardías', () => {
        const early = playedPercent(buildChart(spot({ position: 'BB', situation: 'raised', raiser: 'early' })));
        const late = playedPercent(buildChart(spot({ position: 'BB', situation: 'raised', raiser: 'late' })));
        expect(early).toBeLessThan(late);
    });

    it('con pocas fichas solo hay all-in o tirarse', () => {
        const chart = buildChart(spot({ position: 'CO', stack: 'short' }));
        expect(new Set(Object.values(chart))).toEqual(new Set(['allin', 'fold']));
    });
});

describe('advise', () => {
    it('casos típicos', () => {
        expect(advise(spot({ position: 'UTG' }), 'AA').action).toBe('raise');
        expect(advise(spot({ position: 'UTG' }), 'K9o').action).toBe('fold');
        expect(advise(spot({ position: 'BTN' }), 'K9o').action).toBe('raise');
        expect(advise(spot({ position: 'BTN' }), '72o').action).toBe('fold');
        expect(advise(spot({ position: 'BTN', situation: 'raised', raiser: 'late' }), 'A5s').action).toBe('threebet');
        expect(advise(spot({ position: 'BB', situation: 'raised', raiser: 'late' }), 'K8o').action).toBe('call');
        expect(advise(spot({ position: 'BTN', stack: 'short' }), 'A2o').action).toBe('allin');
        expect(advise(spot({ situation: 'allin' }), 'JJ').action).toBe('fold');
        expect(advise(spot({ situation: 'allin' }), 'AA').action).toBe('call');
        expect(advise(spot({ situation: 'threebet', position: 'CO' }), 'KK').action).toBe('fourbet');
        expect(advise(spot({ position: 'BB', situation: 'limped' }), '72o').action).toBe('check');
    });

    it('si todos se tiraron hasta la ciega grande, ya ganó', () => {
        expect(advise(spot({ position: 'BB', situation: 'unopened' }), '72o').label).toBe('Ganaste las ciegas');
        expect(advise(spot({ position: 'BB', situation: 'limped' }), '72o').label).toBe('Pasá (check)');
    });

    it('con stack medio no farolea con resubidas', () => {
        expect(advise(spot({ position: 'BTN', situation: 'raised', raiser: 'late', stack: 'deep' }), 'A5s').action).toBe('threebet');
        expect(advise(spot({ position: 'BTN', situation: 'raised', raiser: 'late', stack: 'medium' }), 'A5s').action).not.toBe('threebet');
    });

    it('la explicación nombra la mano y la posición', () => {
        const a = advise(spot({ position: 'CO' }), 'AJs');
        expect(a.label).toBe('Subí a 2,5 BB');
        expect(a.reason).toContain('As-Jota del mismo palo');
        expect(a.reason).toContain('el cutoff');
        expect(a.playedPercent).toBeGreaterThan(20);
    });

    it('al subir sobre jugadores que pagaron, la subida crece por cada uno', () => {
        expect(advise(spot({ situation: 'limped', limpers: 2 }), 'AA').label).toBe('Subí a 5 BB');
    });

    it('convierte fichas en profundidad de stack', () => {
        expect(stackDepthFor(60)).toBe('deep');
        expect(stackDepthFor(40)).toBe('deep');
        expect(stackDepthFor(22)).toBe('medium');
        expect(stackDepthFor(8)).toBe('short');
    });
});
