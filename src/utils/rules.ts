import type { BlindLevel, Player, TournamentSettings } from '../types';
import { getLevelNumber } from './tournament';

// ---------- Dinero ----------

export interface PoolBreakdown {
    gross: number; // Todo lo que se cobró (entradas + re-entradas + add-ons)
    bounties: number; // Parte que va a las cabezas de los jugadores
    rake: number; // Comisión de la casa
    added: number; // Lo que pone la casa para llegar al garantizado
    net: number; // Lo que se reparte en premios por puesto
}

/**
 * Del bruto se separan primero los bounties; la comisión se calcula sobre el resto. Si lo que
 * queda no llega al garantizado, la diferencia la pone la casa.
 */
export const getPoolBreakdown = (s: { prizePool: number; players: Player[]; rakePercent: number; guaranteedPool: number }): PoolBreakdown => {
    const gross = s.prizePool;
    const bounties = Math.min(gross, s.players.reduce((sum, p) => sum + (p.bountyPaid || 0), 0));
    const base = gross - bounties;
    const rake = Math.floor(base * Math.min(100, Math.max(0, s.rakePercent)) / 100);
    const afterRake = base - rake;
    const added = Math.max(0, s.guaranteedPool - afterRake);
    return { gross, bounties, rake, added, net: afterRake + added };
};

/** Bounties todavía sin cobrar: al terminar, se los lleva el campeón (incluye su propia cabeza). */
export const unclaimedBounties = (players: Player[]) =>
    Math.max(0, players.reduce((s, p) => s + (p.bountyPaid || 0) - (p.bountyEarnings || 0), 0));

// ---------- Re-entradas y add-ons ----------

export interface RuleStatus {
    allowed: boolean;
    reason?: string;
}

type RuleSettings = Pick<TournamentSettings, 'rebuyUntilLevel' | 'maxRebuys' | 'addonUntilLevel' | 'maxAddons'>;

/**
 * "Hasta el nivel N" incluye el descanso que viene después de N: en la práctica las
 * re-entradas cierran al volver del descanso.
 */
const levelOpen = (blinds: BlindLevel[], index: number, untilLevel: number) =>
    untilLevel <= 0 || getLevelNumber(blinds, index) <= untilLevel;

export const getRebuyStatus = (rules: RuleSettings, blinds: BlindLevel[], index: number, player: Pick<Player, 'rebuys'>): RuleStatus => {
    if (!levelOpen(blinds, index, rules.rebuyUntilLevel)) {
        return { allowed: false, reason: `Las re-entradas cerraron en el nivel ${rules.rebuyUntilLevel}` };
    }
    if (rules.maxRebuys > 0 && player.rebuys >= rules.maxRebuys) {
        return { allowed: false, reason: `Ya usó ${rules.maxRebuys === 1 ? 'su re-entrada' : `sus ${rules.maxRebuys} re-entradas`}` };
    }
    return { allowed: true };
};

export const getAddonStatus = (rules: RuleSettings, blinds: BlindLevel[], index: number, player: Pick<Player, 'addons' | 'status'>): RuleStatus => {
    if (player.status === 'busted') return { allowed: false, reason: 'Está fuera de juego' };
    if (!levelOpen(blinds, index, rules.addonUntilLevel)) {
        return { allowed: false, reason: `Los add-ons cerraron en el nivel ${rules.addonUntilLevel}` };
    }
    if (rules.maxAddons > 0 && player.addons >= rules.maxAddons) {
        return { allowed: false, reason: `Ya usó ${rules.maxAddons === 1 ? 'su add-on' : `sus ${rules.maxAddons} add-ons`}` };
    }
    return { allowed: true };
};

/** Estado general para mostrar en pantalla ("Re-entradas hasta el nivel 4"). */
export const describeRebuyWindow = (rules: RuleSettings, blinds: BlindLevel[], index: number) => {
    if (rules.rebuyUntilLevel <= 0) return null;
    const open = levelOpen(blinds, index, rules.rebuyUntilLevel);
    return { open, label: open ? `Re-entradas hasta el nivel ${rules.rebuyUntilLevel}` : 'Re-entradas cerradas' };
};
