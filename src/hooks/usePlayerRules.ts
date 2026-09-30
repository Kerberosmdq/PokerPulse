import { useGameStore } from '../store/gameStore';
import { getAddonStatus, getRebuyStatus } from '../utils/rules';
import type { Player } from '../types';

/** Si el jugador puede hacer re-entrada / add-on ahora, según los límites del torneo. */
export const usePlayerRules = (player: Pick<Player, 'rebuys' | 'addons' | 'status'>) => {
    const rebuyUntilLevel = useGameStore(s => s.rebuyUntilLevel);
    const maxRebuys = useGameStore(s => s.maxRebuys);
    const addonUntilLevel = useGameStore(s => s.addonUntilLevel);
    const maxAddons = useGameStore(s => s.maxAddons);
    const blinds = useGameStore(s => s.blindsStructure);
    const index = useGameStore(s => s.currentLevelIndex);
    const rules = { rebuyUntilLevel, maxRebuys, addonUntilLevel, maxAddons };
    return {
        rebuy: getRebuyStatus(rules, blinds, index, player),
        addon: getAddonStatus(rules, blinds, index, player),
    };
};
