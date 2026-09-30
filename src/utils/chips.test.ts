import { describe, expect, it } from 'vitest';
import { distributeChips } from './chips';

const chips = [
    { color: 'w', value: 50 },
    { color: 'r', value: 100 },
    { color: 'b', value: 200 },
    { color: 'g', value: 500 },
    { color: 'z', value: 1000 },
];

const total = (d: ReturnType<typeof distributeChips>) => d.distribution.reduce((s, c) => s + c.count * c.value, 0);
const countOf = (d: ReturnType<typeof distributeChips>, value: number) => d.distribution.find(c => c.value === value)!.count;

describe('distributeChips', () => {
    it('sin cantidades fijas llega exacto al stack', () => {
        const d = distributeChips(chips, 8000);
        expect(total(d)).toBe(8000);
        expect(d.remainder).toBe(0);
        expect(d.distribution.every(c => !c.locked)).toBe(true);
    });

    it('respeta una cantidad fija y recalcula las demás', () => {
        const d = distributeChips(chips, 8000, { 100: 15 });
        expect(countOf(d, 100)).toBe(15);
        expect(d.distribution.find(c => c.value === 100)!.locked).toBe(true);
        expect(total(d)).toBe(8000);
        expect(d.remainder).toBe(0);
    });

    it('respeta varias cantidades fijas', () => {
        const d = distributeChips(chips, 8000, { 50: 20, 1000: 2 });
        expect(countOf(d, 50)).toBe(20);
        expect(countOf(d, 1000)).toBe(2);
        expect(total(d)).toBe(8000);
    });

    it('avisa cuando las fijas se pasan del stack', () => {
        const d = distributeChips(chips, 8000, { 1000: 10 });
        expect(d.excess).toBe(2000);
        expect(d.distribution.filter(c => !c.locked).every(c => c.count === 0)).toBe(true);
    });

    it('avisa lo que falta si todas están fijas y no suman el stack', () => {
        const all = { 50: 1, 100: 1, 200: 1, 500: 1, 1000: 1 };
        const d = distributeChips(chips, 8000, all);
        expect(d.remainder).toBe(8000 - 1850);
        expect(d.excess).toBe(0);
    });

    it('ignora cantidades fijas de fichas que ya no existen', () => {
        const d = distributeChips(chips, 8000, { 25: 40 });
        expect(total(d)).toBe(8000);
        expect(d.excess).toBe(0);
    });
});
