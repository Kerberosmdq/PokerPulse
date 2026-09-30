import { describe, expect, it } from 'vitest';
import type { BlindLevel, Player } from '../types';
import { describeRebuyWindow, getAddonStatus, getPoolBreakdown, getRebuyStatus, unclaimedBounties } from './rules';

const level = (bb: number): BlindLevel => ({ id: `${bb}`, type: 'level', smallBlind: bb / 2, bigBlind: bb, ante: 0, duration: 20 });
const pause: BlindLevel = { id: 'b', type: 'break', smallBlind: 0, bigBlind: 0, ante: 0, duration: 10 };
// Nivel 1, 2, descanso, 3
const blinds = [level(100), level(200), pause, level(400)];

const noRules = { rebuyUntilLevel: 0, maxRebuys: 0, addonUntilLevel: 0, maxAddons: 0 };

const withBounty = (bountyPaid: number, bountyEarnings = 0) => ({ bountyPaid, bountyEarnings }) as Player;

describe('getPoolBreakdown', () => {
    it('sin rake ni bounties, todo va a premios', () => {
        expect(getPoolBreakdown({ prizePool: 1000, players: [], rakePercent: 0, guaranteedPool: 0 }))
            .toEqual({ gross: 1000, bounties: 0, rake: 0, added: 0, net: 1000 });
    });

    it('separa bounties antes de calcular la comisión', () => {
        const players = [withBounty(20), withBounty(20), withBounty(20)];
        const b = getPoolBreakdown({ prizePool: 300, players, rakePercent: 10, guaranteedPool: 0 });
        expect(b.bounties).toBe(60);
        expect(b.rake).toBe(24); // 10% de 240
        expect(b.net).toBe(216);
        expect(b.bounties + b.rake + b.net).toBe(b.gross);
    });

    it('la casa completa hasta el garantizado', () => {
        const b = getPoolBreakdown({ prizePool: 600, players: [], rakePercent: 0, guaranteedPool: 1000 });
        expect(b.added).toBe(400);
        expect(b.net).toBe(1000);
    });

    it('si se supera el garantizado no se agrega nada', () => {
        expect(getPoolBreakdown({ prizePool: 1500, players: [], rakePercent: 0, guaranteedPool: 1000 }).added).toBe(0);
    });

    it('calcula los bounties pendientes', () => {
        expect(unclaimedBounties([withBounty(20, 40), withBounty(20), withBounty(20)])).toBe(20);
    });
});

describe('reglas de re-entrada', () => {
    it('sin límites siempre se permite', () => {
        expect(getRebuyStatus(noRules, blinds, 3, { rebuys: 9 }).allowed).toBe(true);
    });

    it('cierra después del nivel indicado, pero el descanso siguiente todavía cuenta', () => {
        const rules = { ...noRules, rebuyUntilLevel: 2 };
        expect(getRebuyStatus(rules, blinds, 1, { rebuys: 0 }).allowed).toBe(true);
        expect(getRebuyStatus(rules, blinds, 2, { rebuys: 0 }).allowed).toBe(true); // descanso tras el nivel 2
        const closed = getRebuyStatus(rules, blinds, 3, { rebuys: 0 });
        expect(closed.allowed).toBe(false);
        expect(closed.reason).toMatch(/nivel 2/);
    });

    it('respeta el máximo por jugador', () => {
        const rules = { ...noRules, maxRebuys: 1 };
        expect(getRebuyStatus(rules, blinds, 0, { rebuys: 0 }).allowed).toBe(true);
        expect(getRebuyStatus(rules, blinds, 0, { rebuys: 1 }).allowed).toBe(false);
    });

    it('describe la ventana abierta o cerrada', () => {
        const rules = { ...noRules, rebuyUntilLevel: 1 };
        expect(describeRebuyWindow(noRules, blinds, 0)).toBeNull();
        expect(describeRebuyWindow(rules, blinds, 0)?.open).toBe(true);
        expect(describeRebuyWindow(rules, blinds, 1)?.open).toBe(false);
    });
});

describe('reglas de add-on', () => {
    it('no se permite a un jugador fuera de juego', () => {
        expect(getAddonStatus(noRules, blinds, 0, { addons: 0, status: 'busted' }).allowed).toBe(false);
    });

    it('respeta nivel y máximo', () => {
        const rules = { ...noRules, addonUntilLevel: 2, maxAddons: 1 };
        expect(getAddonStatus(rules, blinds, 2, { addons: 0, status: 'active' }).allowed).toBe(true);
        expect(getAddonStatus(rules, blinds, 2, { addons: 1, status: 'active' }).allowed).toBe(false);
        expect(getAddonStatus(rules, blinds, 3, { addons: 0, status: 'active' }).allowed).toBe(false);
    });
});
