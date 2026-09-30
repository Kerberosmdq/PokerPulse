export type PlayerStatus = 'active' | 'busted' | 'away';

export interface Player {
    id: string;
    name: string;
    chips: number;
    buyInAmount: number; // Dinero de la entrada inicial
    rebuyTotal: number; // Dinero acumulado en re-entradas
    addonTotal: number; // Dinero acumulado en add-ons
    status: PlayerStatus;
    rebuys: number;
    addons: number;
    buyInTime: number;
    bustedAt?: number; // Momento de la eliminación (define el orden de salida)
    bustedBy?: string; // Jugador que lo eliminó (bounties)
    bountyCollected?: number; // Bounty que cobró quien lo eliminó (para poder deshacer)
    bountyPaid: number; // Dinero de sus entradas que fue a bounties
    bountiesWon: number; // Cantidad de jugadores que eliminó
    bountyEarnings: number; // Dinero ganado por bounties
    table?: number; // Mesa asignada en el sorteo (1..n)
    seat?: number; // Asiento asignado en el sorteo (1..n)
}

export interface BlindLevel {
    id: string;
    type: 'level' | 'break';
    smallBlind: number;
    bigBlind: number;
    ante: number;
    duration: number; // en minutos
}

export interface ChipValue {
    color: string;
    value: number;
}

export interface GameLogEntry {
    id: string;
    timestamp: number;
    action: string;
    description: string;
}

export type GameState = 'landing' | 'setup' | 'active' | 'paused' | 'finished';

export type ThemeId = 'cyberpunk' | 'montecarlo' | 'vegas' | 'royal';

export type PayoutStructure = 'winner-takes-all' | 'heads-up' | 'top-3' | 'custom';

export interface TournamentSettings {
    tournamentName: string;
    buyIn: number;
    startingStack: number;
    rebuyAmount: number;
    rebuyChips: number;
    addonAmount: number;
    addonChips: number;
    seatsPerTable: number;
    // Dinero
    rakePercent: number; // Comisión de la casa sobre el pozo (sin bounties)
    guaranteedPool: number; // Pozo garantizado: si no se llega, la casa agrega la diferencia
    bountyAmount: number; // Parte de cada entrada/re-entrada que va a la cabeza del jugador
    // Reglas (0 = sin límite)
    rebuyUntilLevel: number;
    maxRebuys: number;
    addonUntilLevel: number;
    maxAddons: number;
}

export interface BlindTemplate {
    id: string;
    name: string;
    levels: BlindLevel[];
    createdAt: number;
}

export interface TournamentHistoryEntry {
    id: string;
    timestamp?: number; // Registros viejos solo tienen `date`
    date: string;
    name?: string;
    prizePool: number;
    totalPlayers: number;
    rebuysCount: number;
    addonsCount: number;
    durationMinutes?: number;
    winners: { name: string; prize: number; position: number }[];
    bounties?: { name: string; amount: number }[];
    rake?: number;
}

export interface PokerGameStore extends TournamentSettings {
    gameState: GameState;
    players: Player[];
    blindsStructure: BlindLevel[];
    chipValues: ChipValue[];
    currentLevelIndex: number;
    timerSecondsRemaining: number;
    levelEndTime: number | null;
    isPaused: boolean;
    tournamentStartedAt: number | null;
    prizePool: number;
    payoutStructure: PayoutStructure;
    gameLog: GameLogEntry[];
    playerHistory: string[];
    theme: ThemeId;
    volume: number;
    isMuted: boolean;
    voiceEnabled: boolean;
    customPayouts: number[];
    blindTemplates: BlindTemplate[];

    // Actions
    setGameState: (state: GameState) => void;
    setTheme: (theme: ThemeId) => void;
    setPayoutStructure: (structure: PayoutStructure) => void;
    setTournamentSettings: (settings: Partial<TournamentSettings>) => void;
    addPlayer: (name: string, initialStack?: number, buyIn?: number) => void;
    updatePlayer: (id: string, updates: Partial<Player>) => void;
    deletePlayer: (id: string) => void;
    rebuyPlayer: (id: string, cost?: number, chips?: number) => void;
    addonPlayer: (id: string, cost?: number, chips?: number) => void;
    bustPlayer: (id: string, eliminatorId?: string) => void;
    restorePlayer: (id: string, chips: number) => void;
    toggleAway: (id: string) => void;
    assignSeats: (seats: { id: string; table: number; seat: number }[]) => void;
    moveSeats: (moves: { id: string; table: number; seat: number }[]) => void;
    saveBlindTemplate: (name: string) => void;
    loadBlindTemplate: (id: string) => void;
    deleteBlindTemplate: (id: string) => void;
    setBlindsStructure: (levels: BlindLevel[]) => void;
    setChipValues: (chips: ChipValue[]) => void;
    startTimer: () => void;
    pauseTimer: () => void;
    resetTimer: () => void;
    adjustTimer: (seconds: number) => void;
    tickTimer: () => void;
    nextLevel: () => void;
    prevLevel: () => void;
    logAction: (action: GameLogEntry['action'], description: string) => void;
    importState: (data: Partial<PokerGameStore>) => void;
    resetGame: () => void;
    clearPlayerHistory: () => void;
    setVolume: (volume: number) => void;
    toggleMute: () => void;
    toggleVoice: () => void;
    setCustomPayouts: (payouts: number[]) => void;
}
