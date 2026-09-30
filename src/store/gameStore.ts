import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PokerGameStore, Player, BlindLevel, ChipValue, GameLogEntry, TournamentSettings } from '../types';
import { soundManager } from '../utils/audio';
import { getLevelNumber } from '../utils/tournament';

export const STORAGE_KEY = 'poker-pulse-storage';

export const INITIAL_BLINDS: BlindLevel[] = [
    { id: '1', type: 'level', smallBlind: 50, bigBlind: 100, ante: 0, duration: 20 },
    { id: '2', type: 'level', smallBlind: 100, bigBlind: 200, ante: 0, duration: 20 },
    { id: '3', type: 'level', smallBlind: 150, bigBlind: 300, ante: 25, duration: 20 },
    { id: '4', type: 'level', smallBlind: 200, bigBlind: 400, ante: 50, duration: 20 },
    { id: 'b1', type: 'break', smallBlind: 0, bigBlind: 0, ante: 0, duration: 10 },
    { id: '5', type: 'level', smallBlind: 300, bigBlind: 600, ante: 50, duration: 20 },
    { id: '6', type: 'level', smallBlind: 400, bigBlind: 800, ante: 50, duration: 20 },
    { id: '7', type: 'level', smallBlind: 500, bigBlind: 1000, ante: 100, duration: 20 },
    { id: '8', type: 'level', smallBlind: 600, bigBlind: 1200, ante: 100, duration: 20 },
];

export const INITIAL_CHIPS: ChipValue[] = [
    { color: '#ffffff', value: 25 },
    { color: '#e11d48', value: 100 },
    { color: '#16a34a', value: 500 },
    { color: '#111111', value: 1000 },
    { color: '#7c3aed', value: 5000 },
];

export const DEFAULT_SETTINGS: TournamentSettings = {
    tournamentName: '',
    buyIn: 100,
    startingStack: 10000,
    rebuyAmount: 100,
    rebuyChips: 10000,
    addonAmount: 100,
    addonChips: 10000,
    seatsPerTable: 9,
};

// Tope para extender un nivel con +1m (evita valores absurdos)
const MAX_LEVEL_SECONDS = 5 * 60 * 60;

const logEntry = (action: GameLogEntry['action'], description: string): GameLogEntry => ({
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    action,
    description,
});

const levelLabel = (blinds: BlindLevel[], index: number) => {
    const level = blinds[index];
    if (!level) return '';
    return level.type === 'break'
        ? `Descanso de ${level.duration} min`
        : `Nivel ${getLevelNumber(blinds, index)} (${level.smallBlind}/${level.bigBlind})`;
};

const playerSpent = (p: Player) => p.buyInAmount + (p.rebuyTotal || 0) + (p.addonTotal || 0);

export const useGameStore = create<PokerGameStore>()(
    persist(
        (set, get) => ({
            gameState: 'landing',
            players: [],
            blindsStructure: INITIAL_BLINDS,
            chipValues: INITIAL_CHIPS,
            currentLevelIndex: 0,
            timerSecondsRemaining: INITIAL_BLINDS[0].duration * 60,
            levelEndTime: null, // timestamp de fin del nivel actual (solo con el reloj corriendo)
            isPaused: true,
            tournamentStartedAt: null,
            prizePool: 0,
            payoutStructure: 'top-3',
            gameLog: [],
            playerHistory: [],
            theme: 'cyberpunk',
            volume: 0.5,
            isMuted: false,
            voiceEnabled: true,
            customPayouts: [50, 30, 20],
            ...DEFAULT_SETTINGS,

            setTheme: (theme) => set({ theme }),

            setPayoutStructure: (structure) => set({ payoutStructure: structure }),

            setTournamentSettings: (settings) => set(settings),

            setGameState: (state) => set({ gameState: state }),

            addPlayer: (name, initialStack, buyIn) => {
                const stack = initialStack ?? get().startingStack;
                const entry = buyIn ?? get().buyIn;
                const newPlayer: Player = {
                    id: crypto.randomUUID(),
                    name,
                    chips: stack,
                    buyInAmount: entry,
                    rebuyTotal: 0,
                    addonTotal: 0,
                    status: 'active',
                    rebuys: 0,
                    addons: 0,
                    buyInTime: Date.now(),
                };

                set((state) => ({
                    players: [...state.players, newPlayer],
                    prizePool: state.prizePool + entry,
                    playerHistory: state.playerHistory.includes(name)
                        ? state.playerHistory
                        : [...state.playerHistory, name].sort((a, b) => a.localeCompare(b)),
                    gameLog: [...state.gameLog, logEntry('ADD_PLAYER', `${name} se unió con ${stack.toLocaleString()} fichas (entrada: $${entry}).`)],
                }));
            },

            updatePlayer: (id, updates) => {
                const player = get().players.find(p => p.id === id);
                if (!player) return;

                const prizePoolDiff = updates.buyInAmount !== undefined ? updates.buyInAmount - player.buyInAmount : 0;

                set((state) => ({
                    players: state.players.map((p) => (p.id === id ? { ...p, ...updates } : p)),
                    prizePool: state.prizePool + prizePoolDiff,
                }));
            },

            deletePlayer: (id) => {
                const player = get().players.find((p) => p.id === id);
                if (!player) return;

                set((state) => ({
                    players: state.players.filter(p => p.id !== id),
                    // Se descuenta todo lo que puso: entrada + re-entradas + add-ons
                    prizePool: Math.max(0, state.prizePool - playerSpent(player)),
                    gameLog: [...state.gameLog, logEntry('DELETE_PLAYER', `Se quitó a ${player.name} del torneo (-$${playerSpent(player)}).`)],
                }));
            },

            rebuyPlayer: (id, cost, chips) => {
                const player = get().players.find((p) => p.id === id);
                if (!player) return;

                const finalCost = cost ?? get().rebuyAmount;
                const finalChips = chips ?? get().rebuyChips;

                set((state) => ({
                    players: state.players.map((p) =>
                        p.id === id ? {
                            ...p,
                            rebuys: p.rebuys + 1,
                            rebuyTotal: (p.rebuyTotal || 0) + finalCost,
                            status: 'active',
                            bustedAt: undefined,
                            chips: p.chips + finalChips
                        } : p
                    ),
                    prizePool: state.prizePool + finalCost,
                    gameLog: [...state.gameLog, logEntry('REBUY', `${player.name} hizo una re-entrada por $${finalCost}.`)],
                }));
            },

            addonPlayer: (id, cost, chips) => {
                const player = get().players.find((p) => p.id === id);
                if (!player) return;

                const finalCost = cost ?? get().addonAmount;
                const finalChips = chips ?? get().addonChips;

                set((state) => ({
                    players: state.players.map((p) =>
                        p.id === id ? {
                            ...p,
                            addons: (p.addons || 0) + 1,
                            addonTotal: (p.addonTotal || 0) + finalCost,
                            chips: p.chips + finalChips
                        } : p
                    ),
                    prizePool: state.prizePool + finalCost,
                    gameLog: [...state.gameLog, logEntry('ADDON', `${player.name} hizo un add-on por $${finalCost}.`)],
                }));
            },

            bustPlayer: (id) => {
                const player = get().players.find((p) => p.id === id);
                if (!player || player.status === 'busted') return;

                const remaining = get().players.filter(p => p.status !== 'busted').length;

                set((state) => ({
                    players: state.players.map((p) => (p.id === id ? { ...p, status: 'busted', chips: 0, bustedAt: Date.now() } : p)),
                    gameLog: [...state.gameLog, logEntry('BUST_OUT', `${player.name} quedó afuera en el puesto ${remaining}.`)],
                }));
            },

            restorePlayer: (id, chips) => {
                const player = get().players.find((p) => p.id === id);
                if (!player) return;

                set((state) => ({
                    players: state.players.map((p) => (p.id === id ? { ...p, status: 'active', chips, bustedAt: undefined } : p)),
                    gameLog: [...state.gameLog, logEntry('RESTORE', `Se deshizo la eliminación de ${player.name}.`)],
                }));
            },

            toggleAway: (id) => {
                const player = get().players.find((p) => p.id === id);
                if (!player || player.status === 'busted') return;
                get().updatePlayer(id, { status: player.status === 'away' ? 'active' : 'away' });
            },

            assignSeats: (seats) => {
                const byId = new Map(seats.map(s => [s.id, s]));
                set((state) => ({
                    players: state.players.map(p => {
                        const s = byId.get(p.id);
                        return s ? { ...p, table: s.table, seat: s.seat } : p;
                    }),
                    gameLog: [...state.gameLog, logEntry('SEATING', `Sorteo de asientos realizado (${seats.length} jugadores).`)],
                }));
            },

            setBlindsStructure: (levels) => {
                const { currentLevelIndex, isPaused } = get();
                const currentLevel = levels[currentLevelIndex];
                // Con el reloj detenido, reflejar de inmediato la nueva duración del nivel actual
                if (currentLevel && isPaused) {
                    set({ blindsStructure: levels, timerSecondsRemaining: currentLevel.duration * 60 });
                } else {
                    set({ blindsStructure: levels });
                }
            },

            setChipValues: (chips) => set({ chipValues: chips }),

            startTimer: () => {
                const { isPaused, timerSecondsRemaining, tournamentStartedAt } = get();
                if (!isPaused) return;
                // Recalcular el fin desde el tiempo restante congelado (reanuda correctamente tras una pausa)
                set({
                    levelEndTime: Date.now() + timerSecondsRemaining * 1000,
                    isPaused: false,
                    tournamentStartedAt: tournamentStartedAt ?? Date.now(),
                });
                get().logAction('TIMER_START', 'Reloj iniciado.');
            },

            pauseTimer: () => {
                const { isPaused, levelEndTime, timerSecondsRemaining } = get();
                if (isPaused) return;
                const remaining = levelEndTime
                    ? Math.max(0, Math.ceil((levelEndTime - Date.now()) / 1000))
                    : timerSecondsRemaining;
                set({ isPaused: true, timerSecondsRemaining: remaining, levelEndTime: null });
                get().logAction('TIMER_PAUSE', 'Reloj pausado.');
            },

            resetTimer: () => {
                const level = get().blindsStructure[get().currentLevelIndex];
                if (!level) return;
                set({ levelEndTime: null, timerSecondsRemaining: level.duration * 60, isPaused: true });
                get().logAction('TIMER_RESET', 'Nivel reiniciado.');
            },

            adjustTimer: (seconds) => {
                const { timerSecondsRemaining, isPaused, levelEndTime } = get();
                const current = !isPaused && levelEndTime
                    ? Math.max(0, Math.ceil((levelEndTime - Date.now()) / 1000))
                    : timerSecondsRemaining;
                const newRemaining = Math.max(0, Math.min(MAX_LEVEL_SECONDS, current + seconds));
                set(isPaused
                    ? { timerSecondsRemaining: newRemaining }
                    : { timerSecondsRemaining: newRemaining, levelEndTime: Date.now() + newRemaining * 1000 });
                get().logAction('TIMER_ADJUST', `Reloj ajustado ${seconds > 0 ? '+' : ''}${Math.round(seconds / 60)} min.`);
            },

            tickTimer: () => {
                const { isPaused, levelEndTime, currentLevelIndex, blindsStructure, timerSecondsRemaining } = get();
                if (isPaused || !levelEndTime) return;

                const now = Date.now();
                const remaining = Math.max(0, Math.ceil((levelEndTime - now) / 1000));

                if (remaining > 0) {
                    // Solo notificar cuando cambia el segundo: evita re-renders, escrituras en
                    // localStorage y envíos al control remoto 10 veces por segundo
                    if (remaining !== timerSecondsRemaining) set({ timerSecondsRemaining: remaining });
                    return;
                }

                // Fin de nivel: avanzar arrastrando el tiempo real transcurrido (si la pestaña estuvo
                // suspendida se pueden haber completado varios niveles)
                let index = currentLevelIndex;
                let endTime = levelEndTime;
                while (endTime <= now && index < blindsStructure.length - 1) {
                    index++;
                    endTime += blindsStructure[index].duration * 60 * 1000;
                }

                if (endTime <= now) {
                    set({ currentLevelIndex: index, timerSecondsRemaining: 0, isPaused: true, levelEndTime: null });
                    get().logAction('STRUCTURE_END', 'Se terminó la estructura de ciegas.');
                    return;
                }

                set({
                    currentLevelIndex: index,
                    levelEndTime: endTime,
                    timerSecondsRemaining: Math.ceil((endTime - now) / 1000),
                });
                get().logAction(blindsStructure[index].type === 'break' ? 'BREAK' : 'LEVEL_UP', `Comienza: ${levelLabel(blindsStructure, index)}.`);
            },

            nextLevel: () => {
                const { currentLevelIndex, blindsStructure, isPaused } = get();
                if (currentLevelIndex >= blindsStructure.length - 1) return;
                const index = currentLevelIndex + 1;
                const seconds = blindsStructure[index].duration * 60;
                set({
                    currentLevelIndex: index,
                    timerSecondsRemaining: seconds,
                    levelEndTime: isPaused ? null : Date.now() + seconds * 1000,
                });
                get().logAction('LEVEL_CHANGE', `Salto manual a ${levelLabel(blindsStructure, index)}.`);
            },

            prevLevel: () => {
                const { currentLevelIndex, blindsStructure, isPaused } = get();
                if (currentLevelIndex <= 0) return;
                const index = currentLevelIndex - 1;
                const seconds = blindsStructure[index].duration * 60;
                set({
                    currentLevelIndex: index,
                    timerSecondsRemaining: seconds,
                    levelEndTime: isPaused ? null : Date.now() + seconds * 1000,
                });
                get().logAction('LEVEL_CHANGE', `Regreso manual a ${levelLabel(blindsStructure, index)}.`);
            },

            logAction: (action, description) =>
                set((state) => ({ gameLog: [...state.gameLog, logEntry(action, description)] })),

            importState: (data) => {
                set({
                    ...data,
                    players: (data.players ?? []).map(normalizePlayer),
                    // Un respaldo siempre se retoma en pausa: el reloj no debe "saltar" niveles
                    isPaused: true,
                    levelEndTime: null,
                    gameState: 'active',
                });
                get().logAction('IMPORT', 'Torneo restaurado desde un respaldo.');
            },

            resetGame: () => {
                // Se conserva la configuración (estructura, fichas, entradas) para el próximo torneo
                const { blindsStructure } = get();
                set({
                    gameState: 'landing',
                    players: [],
                    currentLevelIndex: 0,
                    timerSecondsRemaining: (blindsStructure[0]?.duration ?? 20) * 60,
                    levelEndTime: null,
                    isPaused: true,
                    tournamentStartedAt: null,
                    prizePool: 0,
                    gameLog: [],
                });
            },

            clearPlayerHistory: () => set({ playerHistory: [] }),

            setVolume: (volume) => {
                set({ volume });
                if (!get().isMuted) soundManager.setVolume(volume);
            },

            toggleMute: () => {
                const isMuted = !get().isMuted;
                set({ isMuted });
                soundManager.setVolume(isMuted ? 0 : get().volume);
            },

            toggleVoice: () => set({ voiceEnabled: !get().voiceEnabled }),

            setCustomPayouts: (payouts) => set({ customPayouts: payouts }),
        }),
        {
            name: STORAGE_KEY,
            version: 2,
            storage: createJSONStorage(() => localStorage),
            migrate: (persisted, version) => {
                const state = persisted as Partial<PokerGameStore>;
                if (version < 2) {
                    // v1 no guardaba el dinero de re-entradas/add-ons por jugador
                    const rebuyAmount = state.rebuyAmount ?? DEFAULT_SETTINGS.rebuyAmount;
                    const addonAmount = state.addonAmount ?? DEFAULT_SETTINGS.addonAmount;
                    state.players = (state.players ?? []).map(p => normalizePlayer({
                        ...p,
                        rebuyTotal: p.rebuyTotal ?? (p.rebuys || 0) * rebuyAmount,
                        addonTotal: p.addonTotal ?? (p.addons || 0) * addonAmount,
                    }));
                }
                return state as PokerGameStore;
            },
        }
    )
);

function normalizePlayer(p: Partial<Player>): Player {
    return {
        id: p.id ?? crypto.randomUUID(),
        name: p.name ?? 'Jugador',
        chips: p.chips ?? 0,
        buyInAmount: p.buyInAmount ?? 0,
        rebuyTotal: p.rebuyTotal ?? 0,
        addonTotal: p.addonTotal ?? 0,
        status: p.status ?? 'active',
        rebuys: p.rebuys ?? 0,
        addons: p.addons ?? 0,
        buyInTime: p.buyInTime ?? Date.now(),
        bustedAt: p.bustedAt ?? (p.status === 'busted' ? p.buyInTime : undefined),
        table: p.table,
        seat: p.seat,
    };
}
