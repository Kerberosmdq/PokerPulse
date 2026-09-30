import { useGameStore } from '../store/gameStore';
import { getPoolBreakdown } from '../utils/rules';
import { computePayouts, getPayoutPercents } from '../utils/tournament';

/** Pozo desglosado (bruto, bounties, comisión, garantizado) y premios por puesto sobre el neto. */
export const usePrizes = () => {
    const prizePool = useGameStore(s => s.prizePool);
    const players = useGameStore(s => s.players);
    const rakePercent = useGameStore(s => s.rakePercent);
    const guaranteedPool = useGameStore(s => s.guaranteedPool);
    const payoutStructure = useGameStore(s => s.payoutStructure);
    const customPayouts = useGameStore(s => s.customPayouts);

    const breakdown = getPoolBreakdown({ prizePool, players, rakePercent, guaranteedPool });
    const payouts = computePayouts(breakdown.net, getPayoutPercents(payoutStructure, customPayouts));
    return { breakdown, payouts };
};
