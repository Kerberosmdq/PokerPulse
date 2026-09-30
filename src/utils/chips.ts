import type { ChipValue } from '../types';

// Cantidades objetivo por jugador, de la denominación menor a la mayor
const TARGET_COUNTS = [10, 10, 6, 4, 2];

export interface ChipAllocation extends ChipValue {
    count: number;
    /** El usuario fijó esta cantidad: no se recalcula */
    locked: boolean;
}

export interface ChipDistribution {
    distribution: ChipAllocation[];
    /** Lo que falta para llegar al stack (no se pudo completar con las fichas libres) */
    remainder: number;
    /** Cuánto se pasan las cantidades fijas del stack */
    excess: number;
}

/** Reparto automático: pocas fichas chicas para las ciegas y el resto en las grandes. */
const autoDistribute = (chips: ChipValue[], stack: number) => {
    let remaining = stack;
    const counts = chips.map((chip, i) => {
        const isLast = i === chips.length - 1;
        const count = isLast
            ? Math.floor(remaining / chip.value)
            : Math.min(TARGET_COUNTS[i] ?? 2, Math.floor(remaining / chip.value));
        remaining -= count * chip.value;
        return count;
    });
    // Completar lo que falte con las denominaciones más chicas posibles
    for (let i = counts.length - 1; i >= 0 && remaining > 0; i--) {
        const extra = Math.floor(remaining / chips[i].value);
        counts[i] += extra;
        remaining -= extra * chips[i].value;
    }
    return { counts, remaining };
};

/**
 * Reparte el stack inicial entre las fichas. Las cantidades fijadas por el usuario (`locked`,
 * indexado por valor de ficha) se respetan y el resto del stack se reparte automáticamente
 * entre las demás denominaciones.
 */
export const distributeChips = (chips: ChipValue[], stack: number, locked: Record<number, number> = {}): ChipDistribution => {
    // Una fila por valor (si hay dos fichas con el mismo valor, cuenta la primera)
    const sorted = chips
        .filter((c, i) => c.value > 0 && chips.findIndex(o => o.value === c.value) === i)
        .sort((a, b) => a.value - b.value);

    const isLocked = (c: ChipValue) => locked[c.value] !== undefined;
    const lockedTotal = sorted.filter(isLocked).reduce((sum, c) => sum + locked[c.value] * c.value, 0);
    const free = sorted.filter(c => !isLocked(c));
    const available = stack - lockedTotal;

    const auto = available > 0 && free.length > 0 ? autoDistribute(free, available) : { counts: [], remaining: Math.max(0, available) };
    const autoByValue = new Map(free.map((c, i) => [c.value, auto.counts[i] ?? 0]));

    return {
        distribution: sorted.map(c => ({
            ...c,
            locked: isLocked(c),
            count: isLocked(c) ? locked[c.value] : autoByValue.get(c.value) ?? 0,
        })),
        remainder: available < 0 ? 0 : auto.remaining,
        excess: available < 0 ? -available : 0,
    };
};
