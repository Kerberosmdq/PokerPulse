export type PlayerStatus = 'active' | 'busted' | 'away';

export interface Player {
    id: string;
    name: string;
    chips: number;
    buyInAmount: number; // Track actual money invested
    status: PlayerStatus;
    rebuys: number;
    addons: number;
    buyInTime: number;
}

export interface BlindLevel {
    id: string;
    type: 'level' | 'break';
    smallBlind: number;
    bigBlind: number;
    ante: number;
    duration: number; // in minutes
}

export interface ChipValue {
    color: string; // hex code or name
    value: number;
}

export interface GameLogEntry {
    id: string;
    timestamp: number;
    action: string;
    description: string;
}

export type GameState = 'landing' | 'setup' | 'active' | 'paused' | 'finished';

export interface PokerGameStore {
    gameState: GameState;
    players: Player[];
    blindsStructure: BlindLevel[];
    chipValues: ChipValue[];
    currentLevelIndex: number;
    timerSecondsRemaining: number;
    isPaused: boolean;
    prizePool: number;
    payoutStructure: string;
    gameLog: GameLogEntry[];
    playerHistory: string[];

    // Actions
    setGameState: (state: GameState) => void;
    setPayoutStructure: (structure: string) => void;
    addPlayer: (name: string, initialStack?: number, buyIn?: number) => void;
    updatePlayer: (id: string, updates: Partial<Player>) => void;
    deletePlayer: (id: string) => void;
    rebuyPlayer: (id: string, cost?: number, chips?: number) => void;
    addonPlayer: (id: string, cost?: number, chips?: number) => void;
    bustPlayer: (id: string) => void;
    setBlindsStructure: (levels: BlindLevel[]) => void;
    setChipValues: (chips: ChipValue[]) => void;
    startTimer: () => void;
    pauseTimer: () => void;
    resetTimer: () => void;
    tickTimer: () => void;
    nextLevel: () => void;
    prevLevel: () => void;
    logAction: (action: GameLogEntry['action'], description: string) => void;
    resetGame: () => void;
    endGame: () => void;
    clearPlayerHistory: () => void;
}
