import { describe, expect, it } from 'vitest';
import type { Player } from '../types';
import { drawSeats, getRebalancePlan } from './tables';

type P = Pick<Player, 'id' | 'name' | 'status' | 'table' | 'seat'>;
const seated = (id: string, table: number, seat: number, status: Player['status'] = 'active'): P => ({ id, name: id, status, table, seat });

/** Aplica el plan y devuelve cuántos jugadores quedan por mesa */
const apply = (players: P[], plan: ReturnType<typeof getRebalancePlan>) => {
    const moved = players.map(p => {
        const m = plan?.moves.find(x => x.id === p.id);
        return m ? { ...p, table: m.table, seat: m.seat } : p;
    });
    const counts: Record<number, number> = {};
    moved.filter(p => p.status !== 'busted').forEach(p => { counts[p.table!] = (counts[p.table!] ?? 0) + 1; });
    const keys = new Set(moved.filter(p => p.status !== 'busted').map(p => `${p.table}-${p.seat}`));
    return { counts, uniqueSeats: keys.size === moved.filter(p => p.status !== 'busted').length };
};

describe('drawSeats', () => {
    it('reparte en mesas equilibradas sin asientos repetidos', () => {
        const players = Array.from({ length: 11 }, (_, i) => ({ id: `p${i}` }));
        const seats = drawSeats(players, 6);
        const counts = seats.reduce<Record<number, number>>((acc, s) => ({ ...acc, [s.table]: (acc[s.table] ?? 0) + 1 }), {});
        expect(Object.keys(counts)).toHaveLength(2);
        expect(Math.abs(counts[1] - counts[2])).toBeLessThanOrEqual(1);
        expect(new Set(seats.map(s => `${s.table}-${s.seat}`)).size).toBe(11);
        expect(seats.every(s => s.seat >= 1 && s.seat <= 6)).toBe(true);
    });

    it('con pocos jugadores usa una sola mesa', () => {
        expect(new Set(drawSeats([{ id: 'a' }, { id: 'b' }, { id: 'c' }], 9).map(s => s.table)).size).toBe(1);
    });
});

describe('getRebalancePlan', () => {
    it('no propone nada con una sola mesa o mesas parejas', () => {
        expect(getRebalancePlan([seated('a', 1, 1), seated('b', 1, 2)], 9)).toBeNull();
        // 4 jugadores, mesas de 2: hacen falta 2 mesas y están parejas
        expect(getRebalancePlan([seated('a', 1, 1), seated('b', 1, 2), seated('c', 2, 1), seated('d', 2, 2)], 2)).toBeNull();
    });

    it('equilibra cuando una mesa tiene 2 jugadores más', () => {
        const players = [
            seated('a', 1, 1), seated('b', 1, 2), seated('c', 1, 3), seated('d', 1, 4),
            seated('e', 2, 1), seated('f', 2, 2, 'busted'), seated('g', 2, 3, 'busted'),
        ];
        // 5 en juego con mesas de 4: siguen haciendo falta 2 mesas
        const plan = getRebalancePlan(players, 4)!;
        expect(plan.reason).toBe('balance');
        expect(plan.moves).toHaveLength(1);
        expect(plan.moves[0]).toMatchObject({ id: 'd', fromTable: 1, table: 2 });
        const result = apply(players, plan);
        expect(result.counts).toEqual({ 1: 3, 2: 2 });
        expect(result.uniqueSeats).toBe(true);
    });

    it('rompe una mesa cuando todos entran en menos mesas', () => {
        const players = [
            seated('a', 1, 1), seated('b', 1, 2), seated('c', 1, 3),
            seated('d', 2, 1), seated('e', 2, 2),
            seated('x', 2, 3, 'busted'),
        ];
        const plan = getRebalancePlan(players, 6)!;
        expect(plan.reason).toBe('break');
        expect(plan.brokenTable).toBe(2);
        expect(plan.finalTable).toBe(true);
        const result = apply(players, plan);
        expect(result.counts).toEqual({ 1: 5 });
        expect(result.uniqueSeats).toBe(true);
    });

    it('al romper una mesa entre varias, reparte equilibrado', () => {
        const players = [
            ...[1, 2, 3, 4].map(s => seated(`a${s}`, 1, s)),
            ...[1, 2, 3, 4].map(s => seated(`b${s}`, 2, s)),
            ...[1, 2].map(s => seated(`c${s}`, 3, s)),
        ];
        const plan = getRebalancePlan(players, 5)!;
        expect(plan.brokenTable).toBe(3);
        expect(plan.finalTable).toBe(false);
        expect(apply(players, plan).counts).toEqual({ 1: 5, 2: 5 });
    });

    it('ignora a quienes no tienen asiento', () => {
        const players: P[] = [seated('a', 1, 1), { id: 'n', name: 'n', status: 'active' }];
        expect(getRebalancePlan(players, 9)).toBeNull();
    });
});
