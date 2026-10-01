import { describe, expect, it } from 'vitest';
import { MAX_PLAYERS, MIN_PLAYERS, actsAfterPostflop, playersBehind, positionOf, positionsForTable, preflopOrder } from './positions';

describe('posiciones', () => {
    it('cada mesa tiene una posición distinta por asiento', () => {
        for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) {
            const table = positionsForTable(n);
            expect(table).toHaveLength(n);
            expect(new Set(table).size).toBe(n);
            expect(table[0]).toBe('BTN');
        }
    });

    it('mesa de 9: posiciones en sentido horario desde el botón', () => {
        expect(positionsForTable(9)).toEqual(['BTN', 'SB', 'BB', 'UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO']);
    });

    it('con menos jugadores desaparecen las posiciones tempranas', () => {
        expect(positionsForTable(6)).toEqual(['BTN', 'SB', 'BB', 'LJ', 'HJ', 'CO']);
        expect(positionsForTable(3)).toEqual(['BTN', 'SB', 'BB']);
        expect(positionsForTable(2)).toEqual(['BTN', 'BB']);
        expect(positionsForTable(10)).toContain('UTG3');
    });

    it('calcula la posición según dónde está el botón', () => {
        expect(positionOf(9, 0, 0)).toBe('BTN');
        expect(positionOf(9, 0, 3)).toBe('UTG');
        expect(positionOf(9, 0, 8)).toBe('CO');
        // El botón en el asiento 5: el asiento 7 es la ciega grande (da la vuelta)
        expect(positionOf(9, 5, 7)).toBe('BB');
        expect(positionOf(9, 5, 4)).toBe('CO');
        expect(positionOf(6, 2, 5)).toBe('LJ');
    });

    it('rechaza mesas imposibles', () => {
        expect(() => positionsForTable(1)).toThrow();
        expect(() => positionsForTable(11)).toThrow();
    });

    it('orden de juego antes del flop y jugadores detrás', () => {
        expect(preflopOrder(6)).toEqual(['LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB']);
        expect(playersBehind(9, 'UTG')).toBe(8);
        expect(playersBehind(9, 'BTN')).toBe(2);
        expect(playersBehind(9, 'BB')).toBe(0);
    });

    it('el botón juega en posición contra todos después del flop', () => {
        expect(actsAfterPostflop('BTN', 'CO')).toBe(true);
        expect(actsAfterPostflop('BB', 'CO')).toBe(false);
        expect(actsAfterPostflop('BB', 'SB')).toBe(true);
    });
});
