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

/** Guarda un torneo terminado; completa id, fecha y duración a partir de cuándo empezó. */
export const saveHistoryEntry = (
    entry: Omit<TournamentHistoryEntry, 'id' | 'timestamp' | 'date' | 'durationMinutes'>,
    startedAt: number | null,
) => {
    const now = Date.now();
    saveHistory([...loadHistory(), {
        ...entry,
        id: crypto.randomUUID(),
        timestamp: now,
        date: new Date(now).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        durationMinutes: startedAt ? Math.round((now - startedAt) / 60000) : undefined,
    }]);
};

/** Más recientes primero (los registros viejos sin timestamp quedan en su orden original). */
export const sortHistory = (entries: TournamentHistoryEntry[]) =>
    entries.map((e, i) => ({ e, i })).sort((a, b) => (b.e.timestamp ?? b.i) - (a.e.timestamp ?? a.i)).map(x => x.e);

export interface PlayerRecord {
    name: string;
    wins: number;
    cashes: number;
    winnings: number;
    bounties: number;
}

/** Ranking histórico por jugador: puestos pagos y bounties (las ganancias incluyen ambos). */
export const getPlayerRecords = (entries: TournamentHistoryEntry[]): PlayerRecord[] => {
    const map = new Map<string, PlayerRecord>();
    const get = (name: string) => map.get(name) ?? { name, wins: 0, cashes: 0, winnings: 0, bounties: 0 };
    entries.forEach(t => {
        t.winners.forEach(w => {
            const r = get(w.name);
            r.cashes++;
            r.winnings += w.prize;
            if (w.position === 1) r.wins++;
            map.set(w.name, r);
        });
        t.bounties?.forEach(b => {
            const r = get(b.name);
            r.bounties += b.amount;
            r.winnings += b.amount;
            map.set(b.name, r);
        });
    });
    return [...map.values()].sort((a, b) => b.winnings - a.winnings || b.wins - a.wins);
};
