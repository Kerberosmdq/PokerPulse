import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BlindLevel } from '../types';
import { useGameStore } from './gameStore';

const initial = useGameStore.getState();
const store = () => useGameStore.getState();
const byName = (name: string) => store().players.find(p => p.name === name)!;

const level = (bb: number, minutes = 10): BlindLevel => ({ id: `l${bb}`, type: 'level', smallBlind: bb / 2, bigBlind: bb, ante: 0, duration: minutes });
const pause = (minutes = 5): BlindLevel => ({ id: `b${minutes}`, type: 'break', smallBlind: 0, bigBlind: 0, ante: 0, duration: minutes });

beforeEach(() => {
    localStorage.clear();
    useGameStore.setState(initial, true);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T20:00:00Z'));
});

afterEach(() => {
    vi.useRealTimers();
});

describe('reloj', () => {
    beforeEach(() => {
        store().setBlindsStructure([level(100), pause(), level(200), level(400)]);
    });

    it('cuenta a partir del momento de fin del nivel', () => {
        store().startTimer();
        vi.advanceTimersByTime(90_500);
        store().tickTimer();
        expect(store().timerSecondsRemaining).toBe(510); // 600 - 90.5 → se redondea hacia arriba
    });

    it('pausar y reanudar conserva el tiempo restante', () => {
        store().startTimer();
        vi.advanceTimersByTime(60_000);
        store().pauseTimer();
        expect(store().timerSecondsRemaining).toBe(540);
        vi.advanceTimersByTime(300_000); // tiempo en pausa: no cuenta
        store().startTimer();
        vi.advanceTimersByTime(40_000);
        store().tickTimer();
        expect(store().timerSecondsRemaining).toBe(500);
    });

    it('al terminar el nivel entra al descanso sin pausarse', () => {
        store().startTimer();
        vi.advanceTimersByTime(600_000);
        store().tickTimer();
        expect(store().currentLevelIndex).toBe(1);
        expect(store().isPaused).toBe(false);
        expect(store().timerSecondsRemaining).toBe(300);
    });

    it('si la pestaña estuvo dormida, avanza varios niveles sin perder tiempo', () => {
        store().startTimer();
        // 10 min nivel + 5 min descanso + 3 min del nivel siguiente
        vi.advanceTimersByTime(18 * 60_000);
        store().tickTimer();
        expect(store().currentLevelIndex).toBe(2);
        expect(store().timerSecondsRemaining).toBe(7 * 60);
    });

    it('al terminar la estructura se detiene', () => {
        store().startTimer();
        vi.advanceTimersByTime(60 * 60_000);
        store().tickTimer();
        expect(store().currentLevelIndex).toBe(3);
        expect(store().isPaused).toBe(true);
    });

    it('+1 minuto con el reloj corriendo mueve el fin del nivel', () => {
        store().startTimer();
        vi.advanceTimersByTime(100_000);
        store().adjustTimer(60);
        vi.advanceTimersByTime(1_000);
        store().tickTimer();
        expect(store().timerSecondsRemaining).toBe(559);
    });

    it('solo notifica cuando cambia el segundo', () => {
        store().startTimer();
        const listener = vi.fn();
        const unsubscribe = useGameStore.subscribe(listener);
        for (let i = 0; i < 10; i++) {
            vi.advanceTimersByTime(100);
            store().tickTimer();
        }
        unsubscribe();
        expect(listener).toHaveBeenCalledTimes(1);
    });
});

describe('pozo', () => {
    beforeEach(() => {
        store().setTournamentSettings({ buyIn: 100, rebuyAmount: 80, addonAmount: 50 });
        store().addPlayer('Ana');
        store().addPlayer('Luis');
    });

    it('suma entradas, re-entradas y add-ons', () => {
        store().rebuyPlayer(byName('Ana').id);
        store().addonPlayer(byName('Luis').id);
        expect(store().prizePool).toBe(100 + 100 + 80 + 50);
    });

    it('al borrar un jugador descuenta todo lo que puso', () => {
        store().rebuyPlayer(byName('Ana').id);
        store().addonPlayer(byName('Ana').id);
        store().deletePlayer(byName('Ana').id);
        expect(store().prizePool).toBe(100);
    });

    it('una re-entrada devuelve al jugador eliminado al juego', () => {
        store().bustPlayer(byName('Ana').id);
        expect(byName('Ana').status).toBe('busted');
        store().rebuyPlayer(byName('Ana').id);
        expect(byName('Ana')).toMatchObject({ status: 'active', rebuys: 1, bustedAt: undefined });
    });
});

describe('bounties', () => {
    beforeEach(() => {
        store().setTournamentSettings({ buyIn: 100, rebuyAmount: 100, bountyAmount: 20 });
        store().addPlayer('Ana');
        store().addPlayer('Luis');
        store().addPlayer('Sofi');
    });

    it('cada entrada y re-entrada aporta a los bounties', () => {
        expect(byName('Ana').bountyPaid).toBe(20);
        store().bustPlayer(byName('Ana').id);
        store().rebuyPlayer(byName('Ana').id);
        expect(byName('Ana').bountyPaid).toBe(40);
    });

    it('quien elimina cobra el bounty y deshacer lo revierte', () => {
        store().bustPlayer(byName('Ana').id, byName('Luis').id);
        expect(byName('Luis')).toMatchObject({ bountiesWon: 1, bountyEarnings: 20 });
        expect(byName('Ana').bustedBy).toBe(byName('Luis').id);

        store().restorePlayer(byName('Ana').id, 10000);
        expect(byName('Luis')).toMatchObject({ bountiesWon: 0, bountyEarnings: 0 });
        expect(byName('Ana').bustedBy).toBeUndefined();
    });

    it('un jugador fuera de juego no puede cobrar', () => {
        store().bustPlayer(byName('Sofi').id);
        store().bustPlayer(byName('Ana').id, byName('Sofi').id);
        expect(byName('Sofi').bountyEarnings).toBe(0);
    });
});

describe('plantillas de ciegas', () => {
    it('guarda, reemplaza por nombre y carga con ids nuevos', () => {
        store().setBlindsStructure([level(100), level(200)]);
        store().saveBlindTemplate('Turbo');
        store().setBlindsStructure([level(100), level(200), level(400)]);
        store().saveBlindTemplate('turbo');
        expect(store().blindTemplates).toHaveLength(1);
        expect(store().blindTemplates[0].levels).toHaveLength(3);

        store().setBlindsStructure([level(50)]);
        store().loadBlindTemplate(store().blindTemplates[0].id);
        expect(store().blindsStructure.map(l => l.bigBlind)).toEqual([100, 200, 400]);
        expect(store().blindsStructure[0].id).not.toBe('l100');
    });
});

describe('cambios de mesa', () => {
    it('mueve jugadores y lo registra', () => {
        store().addPlayer('Ana');
        store().moveSeats([{ id: byName('Ana').id, table: 2, seat: 4 }]);
        expect(byName('Ana')).toMatchObject({ table: 2, seat: 4 });
        expect(store().gameLog.at(-1)?.description).toMatch(/Ana → mesa 2, asiento 4/);
    });
});
