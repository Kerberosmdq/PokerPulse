import { ALL_HANDS, handName, handPercentile, isPair, isSuited, parseRange, rangePercent, type HandKey } from './cards';
import { POSITION_INFO, playersBehind, type PositionGroup, type PositionId } from './positions';
import { BB_DEFEND, CALL_ALLIN, OPEN_RAISE, SB_VS_RAISE, SHORT_PUSH, SHORT_RESHOVE, VS_RAISE, VS_THREEBET } from './ranges';

export type Action = 'fold' | 'check' | 'call' | 'raise' | 'threebet' | 'fourbet' | 'allin';

/** Qué pasó antes de que te toque hablar. */
export type Situation =
    | 'unopened' // Nadie entró: todos se tiraron hasta vos
    | 'limped' // Alguien pagó la ciega sin subir
    | 'raised' // Alguien subió
    | 'threebet' // Vos subiste y te resubieron
    | 'allin'; // Alguien fue all-in

/** Tus fichas medidas en ciegas grandes. */
export type StackDepth = 'deep' | 'medium' | 'short';

export interface Spot {
    players: number;
    position: PositionId;
    situation: Situation;
    stack: StackDepth;
    /** Desde dónde subió el rival (si se sabe). Por defecto, posición media. */
    raiser?: PositionGroup;
    /** Cuántos pagaron sin subir (para calcular la subida). Por defecto, 1. */
    limpers?: number;
    /** No resubir de farol (p. ej. contra alguien que paga todo) */
    noBluffs?: boolean;
    /** La subida se evaluó por el estilo del rival, no por su posición (para el texto) */
    readOnRaiser?: boolean;
}

export type Chart = Record<HandKey, Action>;

export interface Advice {
    action: Action;
    /** Texto corto del botón grande: "Subí a 2,5 BB" */
    label: string;
    /** Explicación en castellano de por qué */
    reason: string;
    /** Qué hacer si la mano sigue (p. ej. si te resuben) */
    followUp?: string;
    /** "Tu mano está dentro del X% de mejores manos" */
    handPercentile: number;
    /** Porcentaje de manos que se juegan (no se tiran) en esta situación */
    playedPercent: number;
}

export const STACK_INFO: Record<StackDepth, { label: string; range: string }> = {
    deep: { label: 'Muchas fichas', range: '40 BB o más' },
    medium: { label: 'Fichas medias', range: 'Entre 15 y 40 BB' },
    short: { label: 'Pocas fichas', range: 'Menos de 15 BB' },
};

export const stackDepthFor = (bigBlinds: number): StackDepth => (bigBlinds >= 40 ? 'deep' : bigBlinds >= 15 ? 'medium' : 'short');

export const SITUATION_INFO: Record<Situation, { label: string; hint: string }> = {
    unopened: { label: 'Nadie entró', hint: 'Todos los que hablaron antes se tiraron' },
    limped: { label: 'Alguien pagó', hint: 'Entraron pagando la ciega, sin subir' },
    raised: { label: 'Alguien subió', hint: 'Un rival subió antes que vos' },
    threebet: { label: 'Me resubieron', hint: 'Vos subiste y otro volvió a subir' },
    allin: { label: 'All-in', hint: 'Un rival apostó todas sus fichas' },
};

const cache = new Map<string, Set<HandKey>>();
const range = (notation: string) => {
    let set = cache.get(notation);
    if (!set) {
        set = parseRange(notation);
        cache.set(notation, set);
    }
    return set;
};

// Una posición más ajustada que la propia (para subir sobre jugadores que solo pagaron)
const TIGHTER: Record<PositionId, Exclude<PositionId, 'BB'>> = {
    UTG: 'UTG', UTG1: 'UTG', UTG2: 'UTG1', UTG3: 'UTG2', LJ: 'UTG3', HJ: 'LJ', CO: 'HJ', BTN: 'CO', SB: 'HJ', BB: 'HJ',
};

const isLate = (p: PositionId) => POSITION_INFO[p].group === 'late';

/** Acción recomendada para cada una de las 169 manos en esta situación. */
export const buildChart = (spot: Spot): Chart => {
    const { position, situation, stack } = spot;
    const raiser = spot.raiser ?? 'middle';
    const chart: Chart = {};
    const assign = (fn: (h: HandKey) => Action) => {
        ALL_HANDS.forEach(h => { chart[h] = fn(h); });
        return chart;
    };

    // ----- Pocas fichas: all-in o tirarse -----
    if (stack === 'short') {
        if (situation === 'unopened' || situation === 'limped') {
            if (position === 'BB') {
                const push = range(SHORT_PUSH.SB);
                return assign(h => (push.has(h) ? 'allin' : 'check'));
            }
            const push = range(SHORT_PUSH[position]);
            return assign(h => (push.has(h) ? 'allin' : 'fold'));
        }
        const reshove = range(situation === 'allin' ? CALL_ALLIN.short : SHORT_RESHOVE);
        return assign(h => (reshove.has(h) ? (situation === 'allin' ? 'call' : 'allin') : 'fold'));
    }

    switch (situation) {
        case 'unopened': {
            if (position === 'BB') return assign(() => 'check');
            const open = range(OPEN_RAISE[position]);
            return assign(h => (open.has(h) ? 'raise' : 'fold'));
        }

        case 'limped': {
            // Subir con las mejores; en posición tardía o ciegas, pagar barato con manos que
            // ligan jugadas fuertes (parejas, conectores y ases del mismo palo)
            const iso = range(OPEN_RAISE[TIGHTER[position]]);
            const wide = position === 'BB' ? new Set<HandKey>() : range(OPEN_RAISE[position as Exclude<PositionId, 'BB'>]);
            const canOverlimp = isLate(position) || position === 'SB';
            return assign(h => {
                if (iso.has(h)) return 'raise';
                if (position === 'BB') return 'check';
                if (canOverlimp && wide.has(h) && (isPair(h) || isSuited(h))) return 'call';
                return 'fold';
            });
        }

        case 'raised': {
            const table = position === 'BB'
                ? BB_DEFEND[raiser]
                : position === 'SB'
                    ? SB_VS_RAISE[raiser === 'blinds' ? 'late' : raiser]
                    : VS_RAISE[raiser === 'blinds' ? 'late' : raiser];
            const threebet = range(table.threebet);
            // Con stack medio no se farolea con resubidas: el rival puede ir all-in
            const bluff = stack === 'deep' && !spot.noBluffs ? range(table.bluff) : new Set<HandKey>();
            const call = range(table.call);
            return assign(h => (threebet.has(h) || bluff.has(h) ? 'threebet' : call.has(h) ? 'call' : 'fold'));
        }

        case 'threebet': {
            if (stack === 'medium') {
                const shove = range(VS_THREEBET.shoveMedium);
                return assign(h => (shove.has(h) ? 'allin' : 'fold'));
            }
            const fourbet = range(VS_THREEBET.fourbet);
            const bluff = isLate(position) && !spot.noBluffs ? range(VS_THREEBET.fourbetBluffLate) : new Set<HandKey>();
            const call = range(isLate(position) ? VS_THREEBET.callInPosition : VS_THREEBET.callOutOfPosition);
            return assign(h => (fourbet.has(h) || bluff.has(h) ? 'fourbet' : call.has(h) ? 'call' : 'fold'));
        }

        case 'allin': {
            const call = range(CALL_ALLIN[stack]);
            return assign(h => (call.has(h) ? 'call' : 'fold'));
        }
    }
};

/** Porcentaje de manos que no se tiran en una tabla. */
export const playedPercent = (chart: Chart) =>
    rangePercent(Object.entries(chart).filter(([, a]) => a !== 'fold' && a !== 'check').map(([h]) => h));

const pct = (n: number) => `${Math.round(n)}%`;

const sizeLabel = (spot: Spot, action: Action): string => {
    switch (action) {
        case 'raise':
            if (spot.situation === 'limped') {
                const limpers = Math.max(1, spot.limpers ?? 1);
                return `Subí a ${3 + limpers} BB`;
            }
            return spot.stack === 'medium' ? 'Subí a 2,2 BB' : spot.position === 'SB' ? 'Subí a 3 BB' : 'Subí a 2,5 BB';
        case 'threebet':
            return spot.stack === 'medium' ? 'Resubí (all-in con menos de 25 BB)' : spot.position === 'SB' || spot.position === 'BB' ? 'Resubí a 4 veces la subida' : 'Resubí a 3 veces la subida';
        case 'fourbet':
            return 'Volvé a subir (≈2,2 veces la resubida)';
        case 'allin':
            return 'All-in';
        case 'call':
            return spot.situation === 'limped' ? 'Pagá la ciega' : 'Pagá';
        case 'check':
            // Si todos se tiraron hasta la ciega grande, la mano ya terminó
            return spot.situation === 'unopened' && spot.position === 'BB' ? 'Ganaste las ciegas' : 'Pasá (check)';
        case 'fold':
            return 'Tirate';
    }
};

/** Recomendación para una mano concreta, con explicación. */
export const advise = (spot: Spot, hand: HandKey): Advice => {
    const chart = buildChart(spot);
    const action = chart[hand] ?? 'fold';
    const played = playedPercent(chart);
    const top = handPercentile(hand);
    const pos = POSITION_INFO[spot.position];
    const behind = playersBehind(spot.players, spot.position);
    const name = handName(hand);
    // "es una de las mejores manos posibles" / "está dentro del 20% de mejores manos"
    const strength = top <= 5 ? 'es una de las mejores manos posibles' : `está dentro del ${pct(top)} de mejores manos`;

    let reason: string;
    let followUp: string | undefined;

    switch (spot.situation) {
        case 'unopened':
            if (spot.position === 'BB') {
                reason = 'Si nadie entró y sos la ciega grande, ganaste las ciegas sin jugar.';
            } else if (spot.stack === 'short') {
                reason = action === 'allin'
                    ? `Con pocas fichas, subir poco no sirve: desde ${pos.the} se va all-in con el ${pct(played)} de las manos, y ${name} entra: ${strength}.`
                    : `Con pocas fichas, desde ${pos.the} solo conviene ir all-in con el ${pct(played)} de las manos. ${name} queda afuera: esperá una mejor.`;
            } else if (action === 'raise') {
                reason = `Nadie entró y estás en ${pos.the}: desde ahí se abre con el ${pct(played)} de las manos. ${name} ${strength}, así que subí.`;
                followUp = 'Si te resuben, volvé a consultar con "Me resubieron".';
            } else {
                reason = `Desde ${pos.the} se abre solo con el ${pct(played)} de las manos porque ${behind === 1 ? 'queda 1 jugador' : `quedan ${behind} jugadores`} por hablar. ${name} no alcanza: tirate.`;
            }
            break;

        case 'limped':
            reason = action === 'raise'
                ? `Entraron pagando sin subir, lo que suele mostrar manos flojas. Con ${name} conviene subir para quedarte con la iniciativa (o ganar ya).`
                : action === 'call'
                    ? `${name} no es para subir, pero en ${pos.the} sale barato ver el flop: puede ligar una jugada fuerte.`
                    : action === 'check'
                        ? 'Desde la ciega grande podés ver el flop gratis: pasá.'
                        : `${name} no rinde contra varios jugadores: tirate.`;
            if (spot.stack === 'short') {
                reason = action === 'allin'
                    ? `Con pocas fichas y jugadores que solo pagaron, ir all-in con ${name} suele ganar el pozo sin pelea.`
                    : action === 'check'
                        ? 'Desde la ciega grande, pasá y mirá el flop gratis.'
                        : `Con pocas fichas, ${name} no alcanza para ir all-in: tirate.`;
            }
            break;

        case 'raised': {
            const raiserText = { early: 'una posición temprana', middle: 'una posición media', late: 'una posición tardía', blinds: 'las ciegas' }[spot.raiser ?? 'middle'];
            if (spot.stack === 'short') {
                reason = action === 'allin'
                    ? `Con pocas fichas no hay lugar para pagar y ver: ${name} es suficiente para ir all-in contra una subida.`
                    : `Con pocas fichas, frente a una subida solo se va all-in con manos fuertes. ${name} no alcanza.`;
            } else if (action === 'threebet') {
                reason = top <= 6
                    ? `${name} es muy fuerte: resubí para sumar fichas al pozo y aislar al rival.`
                    : `Resubida de farol con ${name}: bloquea manos fuertes del rival y, si te pagan, tiene buenas chances de ligar.`;
                followUp = 'Si te vuelven a subir o van all-in, consultá de nuevo.';
            } else if (action === 'call') {
                reason = spot.position === 'BB'
                    ? `Desde la ciega grande ya pusiste fichas: con ${name} pagar sale barato para el pozo que podés ganar.`
                    : spot.readOnRaiser
                        ? `${name} alcanza para pagar a este rival, pero no para resubir: pagá y mirá el flop.`
                        : `${name} juega bien contra una subida desde ${raiserText}, pero no tanto como para resubir: pagá y mirá el flop.`;
            } else {
                reason = spot.readOnRaiser
                    ? `${name} no alcanza contra la subida de este rival: tirate.`
                    : `Si el rival sube desde ${raiserText}, suele tener buena mano. ${name} quedaría por debajo: tirate.`;
            }
            break;
        }

        case 'threebet':
            reason = action === 'fourbet'
                ? `${name} es de las manos que aguantan una resubida: volvé a subir.`
                : action === 'allin'
                    ? `Con fichas medias, frente a una resubida con ${name} conviene ir all-in directamente.`
                    : action === 'call'
                        ? `${name} es buena pero no para seguir subiendo: pagá y decidí en el flop.`
                        : `Una resubida suele mostrar una mano muy fuerte. Con ${name} lo mejor es tirarse, aunque ya hayas puesto fichas.`;
            break;

        case 'allin':
            reason = action === 'call'
                ? `Para pagar un all-in hace falta una mano que gane seguido: ${name} lo es con tus fichas.`
                : `Para pagar un all-in hace falta una mano muy fuerte. ${name} no alcanza: tirate y guardá tus fichas.`;
            break;
    }

    return { action, label: sizeLabel(spot, action), reason, followUp, handPercentile: top, playedPercent: played };
};
