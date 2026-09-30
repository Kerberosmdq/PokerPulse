import { describe, expect, it } from 'vitest';
import type { BlindLevel, Player } from '../types';
import {
    chipsToColorUp, computePayouts, formatTime, getLevelNumber, getStandings, secondsUntilNextBreak,
    shuffle, validateBlindsStructure,
} from './tournament';

const level = (sb: number, bb: number, ante = 0, duration = 20): BlindLevel => ({ id: `${sb}-${bb}`, type: 'level', smallBlind: sb, bigBlind: bb, ante, duration });
const pause = (duration = 10): BlindLevel => ({ id: `b${duration}${Math.random()}`, type: 'break', smallBlind: 0, bigBlind: 0, ante: 0, duration });

const player = (name: string, extra: Partial<Player> = {}): Player => ({
    id: name, name, chips: 10000, buyInAmount: 100, rebuyTotal: 0, addonTotal: 0, bountyPaid: 0, bountiesWon: 0, bountyEarnings: 0,
    status: 'active', rebuys: 0, addons: 0, buyInTime: 0, ...extra,
});

describe('formatTime', () => {
    it('formatea minutos y horas', () => {
        expect(formatTime(0)).toBe('00:00');
        expect(formatTime(65)).toBe('01:05');
        expect(formatTime(3725)).toBe('1:02:05');
        expect(formatTime(-5)).toBe('00:00');
    });
});

describe('computePayouts', () => {
    it('la suma siempre coincide con el pozo (el resto de redondeo va al 1º)', () => {
        const payouts = computePayouts(1001, [50, 30, 20]);
        expect(payouts.map(p => p.amount)).toEqual([501, 300, 200]);
        expect(payouts.reduce((s, p) => s + p.amount, 0)).toBe(1001);
    });

    it('no inventa dinero si los porcentajes no suman 100', () => {
        const payouts = computePayouts(1000, [50, 30]);
        expect(payouts.reduce((s, p) => s + p.amount, 0)).toBe(800);
    });
});

describe('niveles', () => {
    const blinds = [level(50, 100), level(100, 200), pause(), level(200, 400)];

    it('los descansos no cuentan como nivel', () => {
        expect(getLevelNumber(blinds, 0)).toBe(1);
        expect(getLevelNumber(blinds, 2)).toBe(2);
        expect(getLevelNumber(blinds, 3)).toBe(3);
    });

    it('calcula el tiempo hasta el próximo descanso', () => {
        expect(secondsUntilNextBreak(blinds, 0, 300)).toBe(300 + 20 * 60);
        expect(secondsUntilNextBreak(blinds, 2, 100)).toBe(0);
        expect(secondsUntilNextBreak(blinds, 3, 100)).toBeNull();
    });

    it('valida estructuras', () => {
        expect(validateBlindsStructure(blinds)).toEqual([]);
        expect(validateBlindsStructure([level(100, 100)])).toHaveLength(1);
        expect(validateBlindsStructure([level(100, 200), pause(), level(50, 100)])[0]).toMatch(/bajan/);
        expect(validateBlindsStructure([pause()])[0]).toMatch(/al menos un nivel/);
    });
});

describe('getStandings', () => {
    it('ordena en juego por fichas y eliminados por orden inverso de salida', () => {
        const standings = getStandings([
            player('A', { chips: 5000 }),
            player('B', { status: 'busted', chips: 0, bustedAt: 100 }),
            player('C', { chips: 20000 }),
            player('D', { status: 'busted', chips: 0, bustedAt: 200 }),
        ]);
        expect(standings.map(s => `${s.position}:${s.player.name}`)).toEqual(['1:C', '2:A', '3:D', '4:B']);
    });
});

describe('chipsToColorUp', () => {
    const chips = [{ color: 'w', value: 25 }, { color: 'r', value: 100 }, { color: 'g', value: 500 }];

    it('retira las fichas que ya no hacen falta', () => {
        expect(chipsToColorUp(chips, [level(25, 50), level(100, 200), level(500, 1000)], 1).map(c => c.value)).toEqual([25, 100]);
    });

    it('conserva las fichas si algún monto las necesita', () => {
        expect(chipsToColorUp(chips, [level(25, 50), level(75, 150)], 0)).toEqual([]);
    });
});

describe('shuffle', () => {
    it('conserva los mismos elementos sin modificar el original', () => {
        const original = [1, 2, 3, 4, 5];
        const result = shuffle(original);
        expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
        expect(original).toEqual([1, 2, 3, 4, 5]);
    });
});
