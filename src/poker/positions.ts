/**
 * Posiciones en la mesa según cuántos jugadores haya y dónde está el botón del repartidor.
 * Los asientos se numeran en sentido horario (0..n-1).
 */

export type PositionId = 'UTG' | 'UTG1' | 'UTG2' | 'UTG3' | 'LJ' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';
export type PositionGroup = 'early' | 'middle' | 'late' | 'blinds';

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 10;

// Posiciones que no son botón ni ciegas, de la primera en hablar a la última, según cuántos
// jugadores haya. Con menos jugadores se quitan posiciones tempranas, pero el primero en hablar
// sigue siendo UTG hasta 7 jugadores (en mesas de 6 se usa la nomenclatura LJ/HJ/CO).
const OTHER_SLOTS_BY_PLAYERS: Record<number, PositionId[]> = {
    3: [],
    4: ['CO'],
    5: ['HJ', 'CO'],
    6: ['LJ', 'HJ', 'CO'],
    7: ['UTG', 'LJ', 'HJ', 'CO'],
    8: ['UTG', 'UTG1', 'LJ', 'HJ', 'CO'],
    9: ['UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO'],
    10: ['UTG', 'UTG1', 'UTG2', 'UTG3', 'LJ', 'HJ', 'CO'],
};

const OTHER_SLOTS = OTHER_SLOTS_BY_PLAYERS[10];

export const POSITION_INFO: Record<PositionId, {
    short: string;
    name: string;
    /** Con artículo, para usar dentro de frases ("desde el botón") */
    the: string;
    group: PositionGroup;
    tip: string;
}> = {
    UTG: { short: 'UTG', name: 'Primera posición', the: 'la primera posición', group: 'early', tip: 'Hablás primero antes del flop y tenés a toda la mesa detrás: jugá solo manos fuertes.' },
    UTG1: { short: 'UTG+1', name: 'Segunda posición', the: 'la segunda posición', group: 'early', tip: 'Todavía quedan muchos por hablar: casi tan ajustado como la primera posición.' },
    UTG2: { short: 'UTG+2', name: 'Tercera posición', the: 'la tercera posición', group: 'early', tip: 'Posición temprana: preferí manos fuertes y fáciles de jugar.' },
    UTG3: { short: 'UTG+3', name: 'Cuarta posición', the: 'la cuarta posición', group: 'early', tip: 'Última de las tempranas: podés sumar algunas manos más.' },
    LJ: { short: 'LJ', name: 'Lojack', the: 'el lojack', group: 'middle', tip: 'Posición media: ya podés abrir un rango más amplio.' },
    HJ: { short: 'HJ', name: 'Hijack', the: 'el hijack', group: 'middle', tip: 'Dos lugares antes del botón: buena posición para abrir.' },
    CO: { short: 'CO', name: 'Cutoff', the: 'el cutoff', group: 'late', tip: 'A la derecha del botón: posición tardía, abrí con muchas manos.' },
    BTN: { short: 'BTN', name: 'Botón', the: 'el botón', group: 'late', tip: 'La mejor posición: después del flop hablás último en cada ronda.' },
    SB: { short: 'SB', name: 'Ciega chica', the: 'la ciega chica', group: 'blinds', tip: 'Ya pusiste media ciega, pero después del flop hablás primero.' },
    BB: { short: 'BB', name: 'Ciega grande', the: 'la ciega grande', group: 'blinds', tip: 'Ya pusiste una ciega entera: te sale barato defender, pero jugás sin posición.' },
};

const assertPlayers = (players: number) => {
    if (!Number.isInteger(players) || players < MIN_PLAYERS || players > MAX_PLAYERS) {
        throw new Error(`Cantidad de jugadores inválida: ${players}`);
    }
};

/**
 * Posición de cada asiento según su distancia al botón: índice 0 = botón, 1 = ciega chica,
 * 2 = ciega grande y después el resto en orden de juego. En mano a mano el botón es también
 * la ciega chica.
 */
export const positionsForTable = (players: number): PositionId[] => {
    assertPlayers(players);
    if (players === 2) return ['BTN', 'BB'];
    return ['BTN', 'SB', 'BB', ...OTHER_SLOTS_BY_PLAYERS[players]];
};

/** Posición de un asiento dado dónde está el botón (asientos 0..players-1, en sentido horario). */
export const positionOf = (players: number, dealerSeat: number, seat: number): PositionId => {
    assertPlayers(players);
    const offset = (((seat - dealerSeat) % players) + players) % players;
    return positionsForTable(players)[offset];
};

/** Orden en que se habla antes del flop. */
export const preflopOrder = (players: number): PositionId[] => {
    const table = positionsForTable(players);
    if (players === 2) return ['BTN', 'BB'];
    return [...table.slice(3), 'BTN', 'SB', 'BB'];
};

/** Cuántos jugadores hablan después de esta posición antes del flop. */
export const playersBehind = (players: number, position: PositionId) => {
    const order = preflopOrder(players);
    return order.length - 1 - order.indexOf(position);
};

/** true si después del flop esta posición habla después que la otra (juega "en posición"). */
export const actsAfterPostflop = (a: PositionId, b: PositionId) => {
    // Después del flop habla primero la ciega chica y último el botón
    const postflop: PositionId[] = ['SB', 'BB', ...OTHER_SLOTS, 'BTN'];
    return postflop.indexOf(a) > postflop.indexOf(b);
};
