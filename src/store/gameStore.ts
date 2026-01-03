import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PokerGameStore, Player, BlindLevel, ChipValue } from '../types';

const INITIAL_BLINDS: BlindLevel[] = [
    { id: '1', type: 'level', smallBlind: 50, bigBlind: 100, ante: 0, duration: 20 },
    { id: '2', type: 'level', smallBlind: 100, bigBlind: 200, ante: 0, duration: 20 },
    { id: '3', type: 'level', smallBlind: 150, bigBlind: 300, ante: 25, duration: 20 },
    { id: '4', type: 'level', smallBlind: 200, bigBlind: 400, ante: 50, duration: 20 },
    { id: '5', type: 'level', smallBlind: 300, bigBlind: 600, ante: 50, duration: 20 },
    { id: '6', type: 'level', smallBlind: 400, bigBlind: 800, ante: 50, duration: 20 },
    { id: '7', type: 'level', smallBlind: 500, bigBlind: 1000, ante: 50, duration: 20 },
    { id: '8', type: 'level', smallBlind: 600, bigBlind: 1200, ante: 50, duration: 20 },
];

const INITIAL_CHIPS: ChipValue[] = [
    { color: '#ffffff', value: 50 }, // White
    { color: '#ff0000', value: 100 }, // Red
    { color: '#000000', value: 200 }, // Black
    { color: '#00ff00', value: 500 }, // Green
    { color: '#0000ff', value: 1000 }, // Blue
];

export const useGameStore = create<PokerGameStore>()(
    persist(
        (set, get) => ({
            gameState: 'landing',
            players: [],
            blindsStructure: INITIAL_BLINDS,
            chipValues: INITIAL_CHIPS,
            currentLevelIndex: 0,
            timerSecondsRemaining: INITIAL_BLINDS[0].duration * 60,
            isPaused: true,
            prizePool: 0,
            payoutStructure: 'top-3', // 'winner-takes-all' | 'heads-up' | 'top-3' | 'custom'
            gameLog: [],
            playerHistory: [],

            setPayoutStructure: (structure: string) => set({ payoutStructure: structure }),

            setGameState: (state) => set({ gameState: state }),

            addPlayer: (name, initialStack = 1000, buyIn = 100) => {
                const newPlayer: Player = {
                    id: crypto.randomUUID(),
                    name,
                    chips: initialStack,
                    buyInAmount: buyIn,
                    status: 'active',
                    rebuys: 0,
                    addons: 0,
                    buyInTime: Date.now(),
                };

                set((state) => {
                    // Add to history if unique
                    const newHistory = state.playerHistory.includes(name)
                        ? state.playerHistory
                        : [...state.playerHistory, name].sort();

                    return {
                        players: [...state.players, newPlayer],
                        prizePool: state.prizePool + buyIn,
                        playerHistory: newHistory,
                        gameLog: [
                            ...state.gameLog,
                            {
                                id: crypto.randomUUID(),
                                timestamp: Date.now(),
                                action: 'ADD_PLAYER',
                                description: `El jugador ${name} se unió con ${initialStack} fichas (Entrada: $${buyIn}).`,
                            },
                        ],
                    };
                });
            },

            updatePlayer: (id, updates) => {
                const player = get().players.find(p => p.id === id);
                if (!player) return;

                // Calculate prize pool difference if buyInAmount changed
                let prizePoolDiff = 0;
                if (updates.buyInAmount !== undefined) {
                    prizePoolDiff = updates.buyInAmount - player.buyInAmount;
                }

                set((state) => ({
                    players: state.players.map((p) => (p.id === id ? { ...p, ...updates } : p)),
                    prizePool: state.prizePool + prizePoolDiff
                }));
            },

            deletePlayer: (id) => {
                const player = get().players.find((p) => p.id === id);
                if (!player) return;

                const remainingPlayers = get().players.filter(p => p.id !== id);

                set((state) => ({
                    players: remainingPlayers,
                    prizePool: state.prizePool - player.buyInAmount,
                    gameLog: [
                        ...state.gameLog,
                        {
                            id: crypto.randomUUID(),
                            timestamp: Date.now(),
                            action: 'DELETE_PLAYER',
                            description: `Jugador ${player.name} eliminado.`,
                        },
                    ],
                }));
            },

            rebuyPlayer: (id, cost = 100, chips = 1000) => {
                const player = get().players.find((p) => p.id === id);
                if (!player) return;

                set((state) => ({
                    players: state.players.map((p) =>
                        p.id === id ? {
                            ...p,
                            rebuys: p.rebuys + 1,
                            status: 'active',
                            chips: p.chips + chips
                        } : p
                    ),
                    prizePool: state.prizePool + cost,
                    gameLog: [
                        ...state.gameLog,
                        {
                            id: crypto.randomUUID(),
                            timestamp: Date.now(),
                            action: 'REBUY',
                            description: `${player.name} realizó una re-entrada por $${cost}.`,
                        },
                    ],
                }));
            },

            addonPlayer: (id, cost = 100, chips = 1000) => {
                const player = get().players.find((p) => p.id === id);
                if (!player) return;

                set((state) => ({
                    players: state.players.map((p) =>
                        p.id === id ? {
                            ...p,
                            addons: (p.addons || 0) + 1,
                            chips: p.chips + chips
                        } : p
                    ),
                    prizePool: state.prizePool + cost,
                    gameLog: [
                        ...state.gameLog,
                        {
                            id: crypto.randomUUID(),
                            timestamp: Date.now(),
                            action: 'ADDON',
                            description: `${player.name} realizó un add-on por $${cost}.`,
                        },
                    ],
                }));
            },

            bustPlayer: (id) => {
                const player = get().players.find((p) => p.id === id);
                if (!player) return;

                set((state) => ({
                    players: state.players.map((p) => (p.id === id ? { ...p, status: 'busted', chips: 0 } : p)),
                    gameLog: [
                        ...state.gameLog,
                        {
                            id: crypto.randomUUID(),
                            timestamp: Date.now(),
                            action: 'BUST_OUT',
                            description: `${player.name} ha sido eliminado.`,
                        },
                    ],
                }));
            },

            setBlindsStructure: (levels) => {
                const { currentLevelIndex } = get();
                // If we are currently playing/paused at the start of a level, or if the duration changed,
                // we might want to sync the timer.
                // Simplest fix: If the game is paused and we are at the "start" (or just to be safe),
                // we update the timer to the new duration of the current level.
                // Or better: Just update the timer if it matches the OLD duration, or force it if it's paused.

                // Let's just update the timer to the new duration of the current level
                // This ensures what the user sees in the config is reflected in the timer immediately.
                const currentLevel = levels[currentLevelIndex];
                if (currentLevel) {
                    set({
                        blindsStructure: levels,
                        timerSecondsRemaining: currentLevel.duration * 60
                    });
                } else {
                    set({ blindsStructure: levels });
                }
            },
            setChipValues: (chips) => set({ chipValues: chips }),

            startTimer: () => {
                set({ isPaused: false });
                get().logAction('TIMER_START', 'Reloj iniciado.');
            },
            pauseTimer: () => {
                set({ isPaused: true });
                get().logAction('TIMER_PAUSE', 'Reloj pausado.');
            },
            resetTimer: () => {
                const level = get().blindsStructure[get().currentLevelIndex];
                set({ timerSecondsRemaining: level.duration * 60, isPaused: true });
            },
            tickTimer: () => {
                const { timerSecondsRemaining, isPaused, currentLevelIndex, blindsStructure } = get();
                if (isPaused) return;

                if (timerSecondsRemaining > 0) {
                    set({ timerSecondsRemaining: timerSecondsRemaining - 1 });
                } else {
                    // Level finished
                    if (currentLevelIndex < blindsStructure.length - 1) {
                        const nextLevel = blindsStructure[currentLevelIndex + 1];
                        set({
                            currentLevelIndex: currentLevelIndex + 1,
                            timerSecondsRemaining: nextLevel.duration * 60,
                            isPaused: true
                        });
                        get().logAction('LEVEL_UP', `Nivel ${currentLevelIndex + 2} iniciado.`);
                    } else {
                        set({ isPaused: true });
                        get().logAction('GAME_END', 'Estructura de torneo finalizada.');
                    }
                }
            },

            nextLevel: () => {
                const { currentLevelIndex, blindsStructure } = get();
                if (currentLevelIndex < blindsStructure.length - 1) {
                    const nextLevel = blindsStructure[currentLevelIndex + 1];
                    set({
                        currentLevelIndex: currentLevelIndex + 1,
                        timerSecondsRemaining: nextLevel.duration * 60,
                    });
                    get().logAction('LEVEL_CHANGE', `Salto manual al Nivel ${currentLevelIndex + 2}.`);
                }
            },

            prevLevel: () => {
                const { currentLevelIndex, blindsStructure } = get();
                if (currentLevelIndex > 0) {
                    const prevLevel = blindsStructure[currentLevelIndex - 1];
                    set({
                        currentLevelIndex: currentLevelIndex - 1,
                        timerSecondsRemaining: prevLevel.duration * 60,
                    });
                    get().logAction('LEVEL_CHANGE', `Regreso manual al Nivel ${currentLevelIndex}.`);
                }
            },

            logAction: (action, description) =>
                set((state) => ({
                    gameLog: [
                        ...state.gameLog,
                        {
                            id: crypto.randomUUID(),
                            timestamp: Date.now(),
                            action,
                            description,
                        },
                    ],
                })),

            resetGame: () => {
                localStorage.removeItem('poker-pulse-storage'); // Force clear persistence
                set({
                    gameState: 'landing',
                    players: [],
                    currentLevelIndex: 0,
                    timerSecondsRemaining: INITIAL_BLINDS[0].duration * 60,
                    isPaused: true,
                    prizePool: 0,
                    gameLog: [],
                    blindsStructure: INITIAL_BLINDS,
                    chipValues: INITIAL_CHIPS,
                });
                // window.location.reload(); // Removed to prevent black screen issues, state update is sufficient
            },

            endGame: () => {
                set({ gameState: 'finished', isPaused: true });
                get().logAction('GAME_END', 'Torneo finalizado manualmente.');
            },

            clearPlayerHistory: () => set({ playerHistory: [] }),
        }),
        {
            name: 'poker-pulse-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
