import type { PositionGroup, PositionId } from './positions';

/**
 * Rangos de referencia para torneos (simplificados a partir de tablas estándar, sin "mezclas"):
 * qué manos jugar antes del flop según la posición y la situación. Están pensados para mesas
 * de hasta 10 jugadores; con menos jugadores se usan los de las posiciones más tardías.
 */

/** Abrir subiendo cuando nadie entró antes (con 40+ ciegas grandes). Cada posición incluye a la anterior. */
export const OPEN_RAISE: Record<Exclude<PositionId, 'BB'>, string> = {
    UTG: '66+, A9s+, A5s, KTs+, QTs+, JTs, AJo+, KQo',
    UTG1: '55+, A8s+, A5s-A4s, KTs+, QTs+, JTs, T9s, AJo+, KQo',
    UTG2: '44+, A7s+, A5s-A3s, K9s+, Q9s+, J9s+, T9s, ATo+, KQo',
    UTG3: '33+, A6s+, A5s-A2s, K9s+, Q9s+, J9s+, T9s, 98s, ATo+, KJo+',
    LJ: '22+, A2s+, K8s+, Q9s+, J9s+, T8s+, 98s, 87s, A9o+, KTo+, QJo',
    HJ: '22+, A2s+, K6s+, Q8s+, J8s+, T8s+, 97s+, 87s, 76s, A8o+, KTo+, QTo+, JTo',
    CO: '22+, A2s+, K4s+, Q6s+, J7s+, T7s+, 96s+, 86s+, 75s+, 65s, 54s, A5o+, K9o+, Q9o+, J9o+, T9o',
    BTN: '22+, A2s+, K2s+, Q3s+, J5s+, T6s+, 95s+, 85s+, 74s+, 64s+, 53s+, 43s, A2o+, K7o+, Q8o+, J8o+, T8o+, 97o+, 87o',
    SB: '22+, A2s+, K2s+, Q4s+, J6s+, T6s+, 96s+, 85s+, 75s+, 64s+, 54s, A2o+, K8o+, Q9o+, J9o+, T9o',
};

/** Con menos de 15 ciegas grandes: ir all-in o tirarse cuando nadie entró antes. */
export const SHORT_PUSH: Record<Exclude<PositionId, 'BB'>, string> = {
    UTG: '66+, ATs+, KQs, AJo+',
    UTG1: '55+, A9s+, KJs+, AJo+',
    UTG2: '44+, A7s+, KTs+, QJs, ATo+, KQo',
    UTG3: '44+, A6s+, KTs+, QJs, ATo+, KQo',
    LJ: '33+, A5s+, K9s+, QTs+, JTs, A9o+, KJo+',
    HJ: '22+, A3s+, K8s+, Q9s+, J9s+, T9s, A8o+, KTo+, QJo',
    CO: '22+, A2s+, K6s+, Q8s+, J8s+, T8s+, 98s, A5o+, K9o+, QTo+, JTo',
    BTN: '22+, A2s+, K3s+, Q6s+, J7s+, T7s+, 97s+, 87s, 76s, A2o+, K7o+, Q9o+, J9o+, T9o',
    SB: '22+, A2s+, K2s+, Q4s+, J6s+, T6s+, 96s+, 85s+, 75s+, 64s+, 54s, A2o+, K5o+, Q8o+, J8o+, T8o+, 98o',
};

/** Frente a una subida (sin ser ciega): resubir o pagar según desde dónde subió el rival. */
export const VS_RAISE: Record<Exclude<PositionGroup, 'blinds'>, { threebet: string; bluff: string; call: string }> = {
    early: { threebet: 'QQ+, AKs, AKo', bluff: '', call: 'JJ-77, AQs-AJs, KQs, QJs, JTs, AQo' },
    middle: { threebet: 'QQ+, AKs, AKo', bluff: 'A5s-A4s', call: 'JJ-66, AQs-ATs, KQs-KJs, QJs, JTs, T9s, AQo, KQo' },
    late: { threebet: 'TT+, AQs+, AKo', bluff: 'A5s-A3s, K9s', call: '99-22, AJs-A8s, KTs+, QTs+, JTs, T9s, 98s, 87s, AJo-ATo, KQo' },
};

/** Desde la ciega chica frente a una subida: casi todo es resubir o tirarse (sin posición). */
export const SB_VS_RAISE: Record<Exclude<PositionGroup, 'blinds'>, { threebet: string; bluff: string; call: string }> = {
    early: { threebet: 'QQ+, AKs, AKo', bluff: '', call: 'JJ-99, AQs, KQs' },
    middle: { threebet: 'JJ+, AQs+, AKo', bluff: 'A5s', call: 'TT-88, AJs, KQs' },
    late: { threebet: 'TT+, AJs+, KQs, AQo+', bluff: 'A5s-A4s, K9s', call: '99-66, ATs, KJs, QJs, JTs' },
};

/** Desde la ciega grande: ya pusiste una ciega, así que se defiende con muchas más manos. */
export const BB_DEFEND: Record<PositionGroup, { threebet: string; bluff: string; call: string }> = {
    early: { threebet: 'QQ+, AKs, AKo', bluff: '', call: 'JJ-22, A2s+, K9s+, Q9s+, J9s+, T9s, 98s, 87s, 76s, AQo-ATo, KQo' },
    middle: { threebet: 'QQ+, AKs, AKo', bluff: 'A5s-A4s', call: 'JJ-22, A2s+, K7s+, Q8s+, J8s+, T8s+, 97s+, 86s+, 76s, 65s, AQo-A9o, KTo+, QJo' },
    late: { threebet: 'TT+, AQs+, AKo', bluff: 'A5s-A3s', call: '99-22, AJs-A2s, K2s+, Q5s+, J7s+, T7s+, 96s+, 86s+, 75s+, 65s, 54s, AQo-A2o, K8o+, Q9o+, J9o+, T9o, 98o' },
    blinds: { threebet: 'TT+, AQs+, AKo', bluff: 'A5s-A2s, K9s', call: '99-22, AJs-A2s, K2s+, Q4s+, J6s+, T6s+, 95s+, 85s+, 74s+, 64s+, 54s, AQo-A2o, K5o+, Q8o+, J8o+, T8o+, 98o' },
};

/** Después de abrir, si te resuben: volver a subir (4-bet), pagar o tirarse. */
export const VS_THREEBET = {
    fourbet: 'QQ+, AKs, AKo',
    fourbetBluffLate: 'A5s',
    callInPosition: 'JJ-99, AQs-AJs, KQs, AQo',
    callOutOfPosition: 'JJ-TT, AQs, KQs',
    // Con stack medio la resubida suele ser all-in
    shoveMedium: 'TT+, AQs+, AKo',
};

/** Pagar un all-in según tus ciegas grandes (cuanto más corto, más amplio). */
export const CALL_ALLIN = {
    deep: 'QQ+, AKs, AKo',
    medium: 'TT+, AQs+, AKo',
    short: '77+, ATs+, KQs, AJo+',
};

/** Con menos de 15 BB frente a una subida: all-in o tirarse. */
export const SHORT_RESHOVE = '77+, ATs+, KQs, AJo+';
