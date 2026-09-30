import type { PokerGameStore } from '../types';

// Campos del torneo que viajan en un respaldo (no incluye preferencias como volumen)
const BACKUP_FIELDS = [
    'tournamentName', 'buyIn', 'startingStack', 'seatsPerTable',
    'blindsStructure', 'chipValues', 'players', 'currentLevelIndex', 'timerSecondsRemaining',
    'tournamentStartedAt', 'prizePool', 'payoutStructure', 'customPayouts', 'gameLog',
    'rebuyAmount', 'rebuyChips', 'addonAmount', 'addonChips',
] as const satisfies readonly (keyof PokerGameStore)[];

export const exportTournamentData = (state: PokerGameStore) => {
    const tournament = Object.fromEntries(BACKUP_FIELDS.map(k => [k, state[k]]));
    const json = JSON.stringify({ app: 'nexpulse', version: 2, timestamp: new Date().toISOString(), tournament }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    a.download = `nexpulse-respaldo-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export class BackupError extends Error { }

/** Lee y valida un respaldo. Lanza BackupError con un mensaje apto para mostrar al usuario. */
export const importTournamentData = async (file: File): Promise<Partial<PokerGameStore>> => {
    let data: unknown;
    try {
        data = JSON.parse(await file.text());
    } catch {
        throw new BackupError('El archivo no es un JSON válido.');
    }

    const t = (data as { tournament?: Record<string, unknown> })?.tournament;
    if (!t || typeof t !== 'object') throw new BackupError('El archivo no es un respaldo de NexPulse.');
    if (!Array.isArray(t.blindsStructure) || t.blindsStructure.length === 0) throw new BackupError('El respaldo no tiene estructura de ciegas.');
    if (!Array.isArray(t.players)) throw new BackupError('El respaldo no tiene lista de jugadores.');

    const result: Record<string, unknown> = {};
    BACKUP_FIELDS.forEach(k => { if (t[k] !== undefined) result[k] = t[k]; });

    const levels = t.blindsStructure.length;
    const idx = Number(result.currentLevelIndex ?? 0);
    result.currentLevelIndex = Number.isInteger(idx) && idx >= 0 && idx < levels ? idx : 0;
    if (typeof result.timerSecondsRemaining !== 'number') {
        result.timerSecondsRemaining = ((t.blindsStructure[result.currentLevelIndex as number] as { duration?: number })?.duration ?? 20) * 60;
    }
    return result as Partial<PokerGameStore>;
};
