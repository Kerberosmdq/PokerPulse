/**
 * Manos iniciales de póker (Texas Hold'em), sin palos concretos: antes del flop solo importa
 * si las dos cartas son del mismo palo ("suited") o no ("offsuit"). Hay 169 manos distintas.
 */

export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;
export type Rank = typeof RANKS[number];

/** 'AA' (pareja), 'AKs' (mismo palo) o 'AKo' (distinto palo). */
export type HandKey = string;

const rankIndex = (r: string) => RANKS.indexOf(r as Rank);

export const isRank = (r: string): r is Rank => rankIndex(r) >= 0;

export const handKey = (a: Rank, b: Rank, suited: boolean): HandKey => {
    if (a === b) return a + b;
    const [hi, lo] = rankIndex(a) < rankIndex(b) ? [a, b] : [b, a];
    return hi + lo + (suited ? 's' : 'o');
};

/**
 * Cuadrícula estándar de 13 × 13: la diagonal son las parejas, arriba a la derecha las manos del
 * mismo palo y abajo a la izquierda las de distinto palo.
 */
export const gridHand = (row: number, col: number): HandKey => {
    if (row === col) return RANKS[row] + RANKS[row];
    return row < col ? RANKS[row] + RANKS[col] + 's' : RANKS[col] + RANKS[row] + 'o';
};

export const ALL_HANDS: HandKey[] = RANKS.flatMap((_, row) => RANKS.map((__, col) => gridHand(row, col)));

export const isPair = (h: HandKey) => h.length === 2;
export const isSuited = (h: HandKey) => h.endsWith('s');

/** Cantidad de combinaciones reales de cartas: pareja 6, mismo palo 4, distinto palo 12. */
export const comboCount = (h: HandKey) => (isPair(h) ? 6 : isSuited(h) ? 4 : 12);

export const TOTAL_COMBOS = 1326;

export const isValidHand = (h: string): h is HandKey => ALL_HANDS.includes(h);

// ---------- Rangos en notación estándar ----------

/**
 * Convierte un rango en notación de póker a un conjunto de manos. Admite:
 * - `AA`, `AKs`, `AKo`, `AK` (las dos variantes)
 * - `77+` (77 hasta AA), `ATs+` (ATs, AJs, AQs, AKs)
 * - `JJ-66`, `A5s-A2s` (intervalos)
 */
export const parseRange = (range: string): Set<HandKey> => {
    const hands = new Set<HandKey>();
    range.split(',').map(t => t.trim()).filter(Boolean).forEach(token => {
        expandToken(token).forEach(h => hands.add(h));
    });
    return hands;
};

const fail = (token: string): never => {
    throw new Error(`Rango inválido: "${token}"`);
};

const between = (a: number, b: number) => {
    const [from, to] = a <= b ? [a, b] : [b, a];
    return Array.from({ length: to - from + 1 }, (_, i) => from + i);
};

function expandToken(token: string): HandKey[] {
    if (token.includes('-')) {
        const [a, b] = token.split('-');
        if (!a || !b || a.length !== b.length) fail(token);
        if (a.length === 2) {
            if (a[0] !== a[1] || b[0] !== b[1] || !isRank(a[0]) || !isRank(b[0])) fail(token);
            return between(rankIndex(a[0]), rankIndex(b[0])).map(i => RANKS[i] + RANKS[i]);
        }
        if (a[0] !== b[0] || a[2] !== b[2] || !isRank(a[0]) || !isRank(a[1]) || !isRank(b[1])) fail(token);
        return between(rankIndex(a[1]), rankIndex(b[1])).map(i => checked(a[0] + RANKS[i] + a[2], token));
    }

    const plus = token.endsWith('+');
    const base = plus ? token.slice(0, -1) : token;
    const [hi, lo, suffix] = base;
    if (!isRank(hi) || !isRank(lo) || base.length > 3) fail(token);
    if (suffix !== undefined && suffix !== 's' && suffix !== 'o') fail(token);

    if (hi === lo) {
        if (suffix) fail(token);
        return plus ? between(0, rankIndex(hi)).map(i => RANKS[i] + RANKS[i]) : [hi + lo];
    }
    if (rankIndex(hi) > rankIndex(lo)) fail(token); // se escribe la carta alta primero
    const suffixes = suffix ? [suffix] : ['s', 'o'];
    // "+" sube el kicker hasta la carta inmediatamente debajo de la alta (ATs+ → ATs..AKs)
    const kickers = plus ? between(rankIndex(hi) + 1, rankIndex(lo)) : [rankIndex(lo)];
    return kickers.flatMap(k => suffixes.map(s => checked(hi + RANKS[k] + s, token)));
}

const checked = (h: string, token: string) => (isValidHand(h) ? h : fail(token));

export const rangeCombos = (hands: Iterable<HandKey>) => {
    let total = 0;
    for (const h of hands) total += comboCount(h);
    return total;
};

/** Porcentaje del total de combinaciones (0–100). */
export const rangePercent = (hands: Iterable<HandKey>) => (rangeCombos(hands) / TOTAL_COMBOS) * 100;

// ---------- Fuerza relativa (fórmula de Chen) ----------

const CHEN_HIGH: Record<Rank, number> = { A: 10, K: 8, Q: 7, J: 6, T: 5, '9': 4.5, '8': 4, '7': 3.5, '6': 3, '5': 2.5, '4': 2, '3': 1.5, '2': 1 };

/** Puntaje de Chen: una forma clásica y simple de ordenar las manos iniciales por fuerza. */
export const chenScore = (h: HandKey): number => {
    const hi = h[0] as Rank;
    const lo = h[1] as Rank;
    if (hi === lo) return Math.max(5, CHEN_HIGH[hi] * 2);
    let score = CHEN_HIGH[hi];
    if (isSuited(h)) score += 2;
    const gap = rankIndex(lo) - rankIndex(hi) - 1;
    score -= [0, 1, 2, 4][gap] ?? 5;
    if (gap <= 1 && rankIndex(hi) > rankIndex('Q')) score += 1;
    return Math.ceil(score);
};

const RANKED: HandKey[] = [...ALL_HANDS].sort((a, b) => chenScore(b) - chenScore(a) || comboCount(a) - comboCount(b));

const PERCENTILE = new Map<HandKey, number>();
{
    let cumulative = 0;
    RANKED.forEach(h => {
        cumulative += comboCount(h);
        PERCENTILE.set(h, (cumulative / TOTAL_COMBOS) * 100);
    });
}

/** "Esta mano está dentro del X% de mejores manos" (aproximado). */
export const handPercentile = (h: HandKey) => PERCENTILE.get(h) ?? 100;

// ---------- Nombres en castellano ----------

const RANK_NAMES: Record<Rank, [singular: string, plural: string]> = {
    A: ['As', 'Ases'], K: ['Rey', 'Reyes'], Q: ['Reina', 'Reinas'], J: ['Jota', 'Jotas'], T: ['Diez', 'Dieces'],
    '9': ['Nueve', 'Nueves'], '8': ['Ocho', 'Ochos'], '7': ['Siete', 'Sietes'], '6': ['Seis', 'Seises'],
    '5': ['Cinco', 'Cincos'], '4': ['Cuatro', 'Cuatros'], '3': ['Tres', 'Treses'], '2': ['Dos', 'Doses'],
};

/** 'AKs' → 'As-Rey del mismo palo', 'QQ' → 'Pareja de Reinas'. */
export const handName = (h: HandKey) => {
    const hi = h[0] as Rank;
    const lo = h[1] as Rank;
    if (hi === lo) return `Pareja de ${RANK_NAMES[hi][1]}`;
    return `${RANK_NAMES[hi][0]}-${RANK_NAMES[lo][0]} ${isSuited(h) ? 'del mismo palo' : 'de distinto palo'}`;
};

/** Texto corto para mostrar en pantalla: 'AKs' → 'AK suited', 'T9o' → '10-9 offsuit'. */
export const handLabel = (h: HandKey) => {
    const show = (r: string) => (r === 'T' ? '10' : r);
    if (isPair(h)) return `${show(h[0])}${show(h[1])}`;
    return `${show(h[0])}${show(h[1])} ${isSuited(h) ? 'suited' : 'offsuit'}`;
};
