import type { PositionGroup } from './positions';
import type { Situation, Spot } from './advisor';

/**
 * Notas privadas sobre los rivales y cómo cambian el consejo. Sin IA: estadísticas simples con
 * un "promedio de partida" que se va corrigiendo a medida que hay más manos anotadas.
 */

/** Lo que hizo un rival antes del flop en una mano que viste. */
export type Observation = 'fold' | 'call' | 'raise' | 'threebet';

/** Etiquetas que se pueden poner a mano, sin contar manos. */
export type RivalTag = 'tight' | 'station' | 'aggressive' | 'bluffer';

export type RivalStyle = 'tight' | 'station' | 'aggressive' | 'regular' | 'unknown';

export interface RivalNote {
    name: string;
    tags: RivalTag[];
    counts: Record<Observation, number>;
    /** Últimas observaciones, para poder deshacer */
    history: Observation[];
    updatedAt: number;
}

export const OBSERVATION_INFO: Record<Observation, { label: string; hint: string }> = {
    fold: { label: 'Se tiró', hint: 'No jugó la mano' },
    call: { label: 'Pagó', hint: 'Entró pagando, sin subir' },
    raise: { label: 'Subió', hint: 'Subió antes del flop' },
    threebet: { label: 'Resubió', hint: 'Volvió a subir sobre otra subida' },
};

export const TAG_INFO: Record<RivalTag, { label: string; hint: string }> = {
    tight: { label: 'Juega poco', hint: 'Entra solo con manos buenas' },
    station: { label: 'Paga mucho', hint: 'Paga con cualquier cosa y casi nunca se tira' },
    aggressive: { label: 'Sube mucho', hint: 'Sube y resube con muchas manos' },
    bluffer: { label: 'Farolea', hint: 'Apuesta fuerte sin tener nada' },
};

export const STYLE_INFO: Record<RivalStyle, { label: string; description: string; tone: string }> = {
    tight: { label: 'Juega poco', description: 'Entra con pocas manos: cuando apuesta, suele tener algo bueno.', tone: 'text-secondary' },
    station: { label: 'Paga mucho', description: 'Paga con muchas manos y se tira poco: no le farolees, apostale cuando tengas mano.', tone: 'text-warning' },
    aggressive: { label: 'Sube mucho', description: 'Sube con muchas manos: sus subidas valen menos, podés defenderte con más.', tone: 'text-accent' },
    regular: { label: 'Normal', description: 'Juega un rango parecido al promedio.', tone: 'text-gray-300' },
    unknown: { label: 'Sin datos', description: 'Anotá algunas manos para conocerlo.', tone: 'text-gray-500' },
};

export const emptyNote = (name: string): RivalNote => ({
    name,
    tags: [],
    counts: { fold: 0, call: 0, raise: 0, threebet: 0 },
    history: [],
    updatedAt: Date.now(),
});

const HISTORY_LIMIT = 50;

export const recordObservation = (note: RivalNote, obs: Observation): RivalNote => ({
    ...note,
    counts: { ...note.counts, [obs]: note.counts[obs] + 1 },
    history: [...note.history, obs].slice(-HISTORY_LIMIT),
    updatedAt: Date.now(),
});

export const undoObservation = (note: RivalNote): RivalNote => {
    const last = note.history[note.history.length - 1];
    if (!last) return note;
    return {
        ...note,
        counts: { ...note.counts, [last]: Math.max(0, note.counts[last] - 1) },
        history: note.history.slice(0, -1),
        updatedAt: Date.now(),
    };
};

export const toggleTag = (note: RivalNote, tag: RivalTag): RivalNote => ({
    ...note,
    tags: note.tags.includes(tag) ? note.tags.filter(t => t !== tag) : [...note.tags, tag],
    updatedAt: Date.now(),
});

// ---------- Perfil ----------

// Promedio de una mesa de casa: entra ~28% de las manos y sube ~14%
const PRIOR = { vpip: 0.28, pfr: 0.14, threebet: 0.05 };
// Cuántas manos "imaginarias" de promedio pesan al principio
const PRIOR_WEIGHT = 8;
// Con menos manos que esto no se clasifica por estadística (solo por etiquetas)
const MIN_HANDS = 6;

export interface RivalProfile {
    hands: number;
    vpip: number; // 0–1, estimado
    pfr: number;
    threebet: number;
    confidence: 'none' | 'low' | 'medium' | 'high';
    style: RivalStyle;
    bluffer: boolean;
    /** El estilo sale de una etiqueta puesta a mano */
    fromTag: boolean;
}

const shrink = (count: number, hands: number, prior: number) => (count + prior * PRIOR_WEIGHT) / (hands + PRIOR_WEIGHT);

export const profileOf = (note: RivalNote): RivalProfile => {
    const { fold, call, raise, threebet } = note.counts;
    const hands = fold + call + raise + threebet;
    const vpip = shrink(call + raise + threebet, hands, PRIOR.vpip);
    const pfr = shrink(raise + threebet, hands, PRIOR.pfr);
    const tb = shrink(threebet, hands, PRIOR.threebet);
    const confidence = hands === 0 ? 'none' : hands < 10 ? 'low' : hands < 30 ? 'medium' : 'high';

    // Las etiquetas puestas a mano mandan (prioridad: agresivo > paga mucho > juega poco)
    const tagged = (['aggressive', 'station', 'tight'] as const).find(t => note.tags.includes(t));
    let style: RivalStyle;
    if (tagged) {
        style = tagged;
    } else if (hands < MIN_HANDS) {
        style = 'unknown';
    } else if (pfr >= 0.22 || tb >= 0.1) {
        style = 'aggressive';
    } else if (vpip >= 0.38 && pfr / vpip < 0.4) {
        style = 'station';
    } else if (vpip <= 0.2) {
        style = 'tight';
    } else {
        style = 'regular';
    }

    return { hands, vpip, pfr, threebet: tb, confidence, style, bluffer: note.tags.includes('bluffer'), fromTag: !!tagged };
};

// ---------- Ajuste del consejo ----------

export interface OpponentAdjustment {
    spot: Spot;
    /** Frase que se agrega a la explicación */
    note?: string;
}

const STRICTER: Record<Spot['stack'], Spot['stack']> = { short: 'medium', medium: 'deep', deep: 'deep' };
const LOOSER: Record<Spot['stack'], Spot['stack']> = { deep: 'medium', medium: 'short', short: 'short' };

const RELEVANT: Situation[] = ['limped', 'raised', 'threebet', 'allin'];

/**
 * Adapta la situación según el rival que apostó:
 * - si juega poco, sus subidas son fuertes: se juega como contra una subida temprana;
 * - si sube mucho, sus subidas valen menos: como contra una subida tardía;
 * - si paga mucho, no conviene farolear;
 * - frente a un all-in, se paga más (o menos) según qué tan seguido apuesta de más.
 */
export const applyOpponent = (spot: Spot, name: string, profile: RivalProfile): OpponentAdjustment => {
    if (!RELEVANT.includes(spot.situation)) return { spot };
    const { style, bluffer } = profile;
    const loose = style === 'aggressive' || bluffer;

    switch (spot.situation) {
        case 'raised':
        case 'threebet': {
            if (style === 'tight') {
                return {
                    spot: { ...spot, raiser: 'early' as PositionGroup, readOnRaiser: true },
                    note: `${name} juega poco: si sube, suele tener una mano fuerte. Por eso el consejo es más cerrado.`,
                };
            }
            if (style === 'station') {
                return {
                    spot: { ...spot, noBluffs: true },
                    note: `${name} paga mucho: no le resubas de farol; resubí solo con manos fuertes.`,
                };
            }
            if (loose) {
                return {
                    spot: { ...spot, raiser: 'late' as PositionGroup, readOnRaiser: true },
                    note: `${name} sube con muchas manos: sus subidas valen menos y podés defenderte con más.`,
                };
            }
            return { spot };
        }
        case 'allin': {
            if (style === 'tight') {
                return { spot: { ...spot, stack: STRICTER[spot.stack] }, note: `${name} juega poco: un all-in suyo suele ser una mano muy fuerte. Pagá solo con lo mejor.` };
            }
            if (loose) {
                return { spot: { ...spot, stack: LOOSER[spot.stack] }, note: `${name} apuesta de más seguido: podés pagarle el all-in con más manos.` };
            }
            return { spot };
        }
        case 'limped':
            if (style === 'station') {
                return { spot: { ...spot, noBluffs: true }, note: `${name} paga mucho: si subís y te paga, apostá fuerte cuando ligues y no farolees.` };
            }
            if (style === 'tight') {
                return { spot, note: `${name} juega poco: si pagó, puede tener una mano media que quiere ver el flop barato.` };
            }
            return { spot };
        default:
            return { spot };
    }
};
