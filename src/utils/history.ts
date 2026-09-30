import type { TournamentHistoryEntry } from '../types';

const HISTORY_KEY = 'poker-pulse-history';

export const loadHistory = (): TournamentHistoryEntry[] => {
    try {
        const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

export const saveHistory = (entries: TournamentHistoryEntry[]) => {
    if (entries.length === 0) localStorage.removeItem(HISTORY_KEY);
    else localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
};

export const saveHistoryEntry = (entry: TournamentHistoryEntry) => saveHistory([...loadHistory(), entry]);

/** Más recientes primero (los registros viejos sin timestamp quedan en su orden original). */
export const sortHistory = (entries: TournamentHistoryEntry[]) =>
    entries.map((e, i) => ({ e, i })).sort((a, b) => (b.e.timestamp ?? b.i) - (a.e.timestamp ?? a.i)).map(x => x.e);

export interface PlayerRecord {
    name: string;
    wins: number;
    cashes: number;
    winnings: number;
}

/** Ranking histórico por jugador (solo se conocen los puestos pagos de cada torneo). */
export const getPlayerRecords = (entries: TournamentHistoryEntry[]): PlayerRecord[] => {
    const map = new Map<string, PlayerRecord>();
    entries.forEach(t => t.winners.forEach(w => {
        const r = map.get(w.name) ?? { name: w.name, wins: 0, cashes: 0, winnings: 0 };
        r.cashes++;
        r.winnings += w.prize;
        if (w.position === 1) r.wins++;
        map.set(w.name, r);
    }));
    return [...map.values()].sort((a, b) => b.winnings - a.winnings || b.wins - a.wins);
};
