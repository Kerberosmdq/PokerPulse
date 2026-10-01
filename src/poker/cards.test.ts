import { describe, expect, it } from 'vitest';
import {
    ALL_HANDS, TOTAL_COMBOS, chenScore, comboCount, gridHand, handKey, handLabel, handName, handPercentile,
    parseRange, rangeCombos, rangePercent,
} from './cards';

describe('manos', () => {
    it('hay 169 manos distintas que suman las 1326 combinaciones', () => {
        expect(ALL_HANDS).toHaveLength(169);
        expect(new Set(ALL_HANDS).size).toBe(169);
        expect(rangeCombos(ALL_HANDS)).toBe(TOTAL_COMBOS);
    });

    it('la cuadrícula tiene parejas en la diagonal, suited arriba y offsuit abajo', () => {
        expect(gridHand(0, 0)).toBe('AA');
        expect(gridHand(0, 1)).toBe('AKs');
        expect(gridHand(1, 0)).toBe('AKo');
        expect(gridHand(12, 12)).toBe('22');
        expect(gridHand(4, 5)).toBe('T9s');
    });

    it('normaliza el orden de las cartas', () => {
        expect(handKey('J', 'A', true)).toBe('AJs');
        expect(handKey('7', '7', false)).toBe('77');
        expect(comboCount('AA')).toBe(6);
        expect(comboCount('AKs')).toBe(4);
        expect(comboCount('AKo')).toBe(12);
    });

    it('nombres en castellano', () => {
        expect(handName('QQ')).toBe('Pareja de Reinas');
        expect(handName('AKs')).toBe('As-Rey del mismo palo');
        expect(handName('T9o')).toBe('Diez-Nueve de distinto palo');
        expect(handLabel('T9s')).toBe('109 suited');
        expect(handLabel('TT')).toBe('1010');
    });
});

describe('parseRange', () => {
    it('entiende parejas con +', () => {
        const r = parseRange('77+');
        expect([...r].sort()).toEqual(['77', '88', '99', 'AA', 'JJ', 'KK', 'QQ', 'TT'].sort());
    });

    it('entiende kicker con +', () => {
        expect([...parseRange('ATs+')].sort()).toEqual(['AJs', 'AKs', 'AQs', 'ATs']);
        expect([...parseRange('K9o+')].sort()).toEqual(['K9o', 'KJo', 'KQo', 'KTo']);
    });

    it('entiende intervalos en cualquier orden', () => {
        expect([...parseRange('A5s-A2s')].sort()).toEqual(['A2s', 'A3s', 'A4s', 'A5s']);
        expect([...parseRange('66-JJ')]).toHaveLength(6);
    });

    it('sin sufijo incluye suited y offsuit', () => {
        expect([...parseRange('AK')].sort()).toEqual(['AKo', 'AKs']);
    });

    it('22+ son todas las parejas', () => {
        expect(rangeCombos(parseRange('22+'))).toBe(78);
        expect(rangePercent(parseRange('22+'))).toBeCloseTo(5.88, 1);
    });

    it('rechaza notación inválida', () => {
        expect(() => parseRange('AXs')).toThrow();
        expect(() => parseRange('KAs')).toThrow();
        expect(() => parseRange('AKs-QJs')).toThrow();
        expect(() => parseRange('AAs')).toThrow();
    });
});

describe('fuerza de las manos', () => {
    it('ordena con la fórmula de Chen', () => {
        expect(chenScore('AA')).toBe(20);
        expect(chenScore('AKs')).toBe(12);
        expect(chenScore('72o')).toBeLessThan(chenScore('T9s'));
    });

    it('el percentil sube con manos peores', () => {
        expect(handPercentile('AA')).toBeLessThan(1);
        expect(handPercentile('AKs')).toBeLessThan(handPercentile('KQo'));
        expect(handPercentile('72o')).toBeGreaterThan(90);
    });
});
