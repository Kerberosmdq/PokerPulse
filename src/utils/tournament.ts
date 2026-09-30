import type { BlindLevel, ChipValue, PayoutStructure, Player } from '../types';

// ---------- Formato ----------

export const formatTime = (totalSeconds: number) => {
    const s = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const mm = m.toString().padStart(2, '0');
    const ss = sec.toString().padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

export const formatMoney = (amount: number) => `$${Math.round(amount).toLocaleString('es-AR')}`;

export const formatChips = (amount: number) => Math.round(amount).toLocaleString('es-AR');

/** 1500 → "1.5k", 25000 → "25k" (para fichas y espacios chicos) */
export const formatShort = (value: number) => {
    if (value >= 1_000_000) return `${+(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1000) return `${+(value / 1000).toFixed(1)}k`;
    return value.toString();
};

export const ordinalPlace = (place: number) => `${place}º puesto`;

export const placeMedal = (place: number) => ['🥇', '🥈', '🥉'][place - 1] ?? '🎖️';

// ---------- Niveles ----------

/** Número de nivel "de juego" (los descansos no cuentan). */
export const getLevelNumber = (blinds: BlindLevel[], index: number) =>
    blinds.slice(0, index + 1).filter(l => l.type === 'level').length;

export const findNextPlayingLevel = (blinds: BlindLevel[], index: number) =>
    blinds.slice(index + 1).find(l => l.type === 'level');

/** Segundos hasta el próximo descanso (null si no hay más descansos). */
export const secondsUntilNextBreak = (blinds: BlindLevel[], index: number, remainingInCurrent: number) => {
    if (blinds[index]?.type === 'break') return 0;
    let total = remainingInCurrent;
    for (let i = index + 1; i < blinds.length; i++) {
        if (blinds[i].type === 'break') return total;
        total += blinds[i].duration * 60;
    }
    return null;
};

export const totalStructureMinutes = (blinds: BlindLevel[]) => blinds.reduce((sum, l) => sum + l.duration, 0);

export const validateBlindsStructure = (blinds: BlindLevel[]): string[] => {
    const errors: string[] = [];
    if (!blinds.some(l => l.type === 'level')) errors.push('La estructura necesita al menos un nivel de juego.');
    let prevLevel: BlindLevel | null = null;
    blinds.forEach((level, idx) => {
        const label = level.type === 'break' ? `Descanso (fila ${idx + 1})` : `Nivel ${getLevelNumber(blinds, idx)}`;
        if (level.duration <= 0) errors.push(`${label}: la duración debe ser mayor a 0 minutos.`);
        if (level.type === 'level') {
            if (level.smallBlind <= 0) errors.push(`${label}: la ciega chica debe ser mayor a 0.`);
            if (level.bigBlind <= level.smallBlind) errors.push(`${label}: la ciega grande debe ser mayor que la chica.`);
            if (prevLevel && prevLevel.bigBlind > level.bigBlind) {
                errors.push(`${label}: las ciegas bajan respecto del nivel anterior (${prevLevel.bigBlind} → ${level.bigBlind}).`);
            }
            prevLevel = level;
        }
    });
    return errors;
};

// ---------- Premios ----------

export const PAYOUT_PRESETS: Record<Exclude<PayoutStructure, 'custom'>, { label: string; percents: number[] }> = {
    'winner-takes-all': { label: 'Todo al ganador', percents: [100] },
    'heads-up': { label: 'Top 2', percents: [70, 30] },
    'top-3': { label: 'Top 3', percents: [50, 30, 20] },
};

export const getPayoutPercents = (structure: PayoutStructure | string, custom: number[]) =>
    structure === 'custom'
        ? custom
        : (PAYOUT_PRESETS[structure as keyof typeof PAYOUT_PRESETS] ?? PAYOUT_PRESETS['top-3']).percents;

/**
 * Reparte el pozo según porcentajes. Los montos se redondean hacia abajo y el resto de redondeo
 * va al primer puesto, así la suma siempre coincide con el pozo.
 */
export const computePayouts = (prizePool: number, percents: number[]) => {
    const amounts = percents.map(pct => Math.floor(prizePool * pct / 100));
    const totalPct = percents.reduce((s, p) => s + p, 0);
    if (totalPct === 100 && amounts.length > 0) {
        amounts[0] += prizePool - amounts.reduce((s, a) => s + a, 0);
    }
    return percents.map((percent, i) => ({ place: i + 1, percent, amount: amounts[i] }));
};

// ---------- Jugadores ----------

export const playerSpent = (p: Player) => p.buyInAmount + (p.rebuyTotal || 0) + (p.addonTotal || 0);

/**
 * Clasificación actual: los que siguen en juego (por fichas) y luego los eliminados en orden
 * inverso de salida (el último en caer queda mejor ubicado).
 */
export const getStandings = (players: Player[]) => {
    const alive = players.filter(p => p.status !== 'busted').sort((a, b) => b.chips - a.chips);
    const busted = players
        .filter(p => p.status === 'busted')
        .sort((a, b) => (b.bustedAt ?? 0) - (a.bustedAt ?? 0));
    return [...alive, ...busted].map((player, i) => ({ player, position: i + 1 }));
};

export const getTournamentStats = (players: Player[]) => {
    const alive = players.filter(p => p.status !== 'busted');
    const totalChips = players.reduce((sum, p) => sum + p.chips, 0);
    return {
        alive: alive.length,
        total: players.length,
        totalChips,
        avgStack: alive.length > 0 ? Math.floor(totalChips / alive.length) : 0,
        rebuys: players.reduce((s, p) => s + (p.rebuys || 0), 0),
        addons: players.reduce((s, p) => s + (p.addons || 0), 0),
    };
};

// ---------- Fichas ----------

/**
 * Fichas que conviene retirar ("chip race"): una ficha sobra cuando todas las ciegas y antes que
 * quedan por jugar se pueden pagar con la denominación inmediatamente superior.
 */
export const chipsToColorUp = (chips: ChipValue[], blinds: BlindLevel[], index: number) => {
    const amounts = blinds
        .slice(index + 1)
        .filter(l => l.type === 'level')
        .flatMap(l => [l.smallBlind, l.bigBlind, l.ante])
        .filter(a => a > 0);
    if (amounts.length === 0) return [];

    const sorted = chips.filter(c => c.value > 0).sort((a, b) => a.value - b.value);
    const obsolete: ChipValue[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
        const nextValue = sorted[i + 1].value;
        if (!amounts.every(a => a % nextValue === 0)) break;
        obsolete.push(sorted[i]);
    }
    return obsolete;
};

// ---------- Aleatoriedad ----------

/** Fisher–Yates: mezcla sin sesgo (sort(() => Math.random() - 0.5) está sesgado). */
export const shuffle = <T,>(items: T[]): T[] => {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};
