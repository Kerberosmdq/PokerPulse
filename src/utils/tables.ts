import type { Player } from '../types';
import { shuffle } from './tournament';

export interface Seat<P = Player> { player: P; table: number; seat: number }

/**
 * Reparte a los jugadores en la menor cantidad de mesas posible y equilibradas (la diferencia
 * entre mesas es de a lo sumo un jugador).
 */
export const drawSeats = <P extends { id: string }>(players: P[], seatsPerTable: number): Seat<P>[] => {
    const tables = Math.max(1, Math.ceil(players.length / seatsPerTable));
    const byTable: P[][] = Array.from({ length: tables }, () => []);
    shuffle(players).forEach((p, i) => byTable[i % tables].push(p));
    return byTable.flatMap((list, t) => {
        // Asientos al azar dentro de la mesa (no siempre 1..n seguidos)
        const seatNumbers = shuffle(Array.from({ length: seatsPerTable }, (_, i) => i + 1)).slice(0, list.length).sort((a, b) => a - b);
        return shuffle(list).map((player, i) => ({ player, table: t + 1, seat: seatNumbers[i] }));
    });
};

export interface SeatMove {
    id: string;
    name: string;
    fromTable: number;
    fromSeat: number;
    table: number;
    seat: number;
}

export interface RebalancePlan {
    reason: 'break' | 'balance';
    brokenTable?: number;
    /** Queda una sola mesa: conviene re-sortear la mesa final */
    finalTable: boolean;
    moves: SeatMove[];
}

type SeatedPlayer = Pick<Player, 'id' | 'name' | 'status' | 'table' | 'seat'>;

/**
 * Propone movimientos cuando las mesas quedan desparejas por las eliminaciones:
 * - si sobran mesas, se rompe la más chica y sus jugadores van a los lugares libres;
 * - si una mesa tiene 2 o más jugadores que otra, se pasa uno de la más llena a la más vacía.
 * Solo considera jugadores en juego que ya tienen asiento asignado.
 */
export const getRebalancePlan = (players: SeatedPlayer[], seatsPerTable: number): RebalancePlan | null => {
    const seated = players.filter(p => p.status !== 'busted' && p.table !== undefined && p.seat !== undefined);
    const tableIds = [...new Set(seated.map(p => p.table!))].sort((a, b) => a - b);
    if (tableIds.length <= 1) return null;

    // Estado simulado: mesa → jugadores
    const tables = new Map<number, SeatedPlayer[]>(tableIds.map(t => [t, seated.filter(p => p.table === t)]));
    const moves: SeatMove[] = [];

    const freeSeat = (table: number) => {
        const taken = new Set(tables.get(table)!.map(p => p.seat));
        for (let s = 1; s <= seatsPerTable; s++) if (!taken.has(s)) return s;
        return null;
    };
    const move = (p: SeatedPlayer, to: number) => {
        const seat = freeSeat(to);
        if (seat === null) return false;
        tables.set(p.table!, tables.get(p.table!)!.filter(x => x.id !== p.id));
        const original = moves.find(m => m.id === p.id);
        const moved = { ...p, table: to, seat };
        tables.get(to)!.push(moved);
        if (original) Object.assign(original, { table: to, seat });
        else moves.push({ id: p.id, name: p.name, fromTable: p.table!, fromSeat: p.seat!, table: to, seat });
        return true;
    };
    const sizes = () => [...tables.entries()].sort((a, b) => a[1].length - b[1].length || a[0] - b[0]);

    const needed = Math.max(1, Math.ceil(seated.length / seatsPerTable));
    let reason: RebalancePlan['reason'] = 'balance';
    let brokenTable: number | undefined;

    if (needed < tableIds.length) {
        // Romper la mesa más chica (en empate, la de número más alto)
        reason = 'break';
        const [smallest] = [...tables.entries()].sort((a, b) => a[1].length - b[1].length || b[0] - a[0])[0];
        brokenTable = smallest;
        const leaving = [...tables.get(smallest)!].sort((a, b) => a.seat! - b.seat!);
        for (const p of leaving) {
            // Cada uno va a la mesa con menos jugadores que tenga lugar
            const target = sizes().find(([t]) => t !== smallest && freeSeat(t) !== null);
            if (!target) break;
            move(p, target[0]);
        }
        tables.delete(smallest);
    }

    // Equilibrar: diferencia máxima de un jugador
    for (let guard = 0; guard < 50; guard++) {
        const ordered = sizes();
        const [minTable, minList] = ordered[0];
        const maxList = ordered[ordered.length - 1][1];
        if (maxList.length - minList.length < 2) break;
        // Se mueve el de asiento más alto de la mesa más llena
        const candidate = [...maxList].sort((a, b) => b.seat! - a.seat!)[0];
        if (!move(candidate, minTable)) break;
    }

    if (moves.length === 0) return null;
    return { reason, brokenTable, finalTable: tables.size === 1, moves };
};
