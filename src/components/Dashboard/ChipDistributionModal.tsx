import React from 'react';
import { Calculator, AlertTriangle } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { Modal } from '../ui/Modal';
import { PokerChip } from './ChipList';
import { formatChips } from '../../utils/tournament';
import { distributeChips } from '../../utils/chips';

/** Reparto de fichas por jugador configurado en el asistente, para consultarlo durante el torneo. */
export const ChipDistributionModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const chipValues = useGameStore(s => s.chipValues);
    const chipLocks = useGameStore(s => s.chipLocks);
    const startingStack = useGameStore(s => s.startingStack);
    const playersCount = useGameStore(s => s.players.length);

    const { distribution, remainder, excess } = distributeChips(chipValues, startingStack, chipLocks);
    const used = distribution.filter(d => d.count > 0);
    const perPlayer = used.reduce((sum, d) => sum + d.count, 0);

    return (
        <Modal
            onClose={onClose}
            size="md"
            title="Reparto por jugador"
            icon={<Calculator className="w-5 h-5 text-accent" />}
            description={`Stack inicial de ${formatChips(startingStack)}: ${perPlayer} fichas por jugador.`}
        >
            {(remainder > 0 || excess > 0) && (
                <div className="mb-3 bg-accent/10 border border-accent/30 p-3 rounded-lg flex items-start gap-2.5 text-xs text-accent">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                        {excess > 0
                            ? <>Las cantidades fijas se pasan del stack por <b className="font-mono">{formatChips(excess)}</b>.</>
                            : <>Con estas fichas no se llega exacto al stack: faltan <b className="font-mono">{formatChips(remainder)}</b>.</>}
                    </span>
                </div>
            )}

            <div className="divide-y divide-white/5 bg-black/20 rounded-xl border border-white/5">
                {used.map(item => (
                    <div key={item.value} className="p-3 flex items-center gap-3">
                        <PokerChip color={item.color} value={item.value} size={36} />
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-white text-lg tabular">{item.count} <span className="text-gray-500 font-medium text-sm">× {formatChips(item.value)}</span></div>
                            <div className="text-xs text-gray-500 font-mono">= {formatChips(item.count * item.value)}</div>
                        </div>
                        {playersCount > 0 && (
                            <div className="text-right font-mono text-xs text-gray-400 shrink-0">
                                {item.count * playersCount} en total
                            </div>
                        )}
                    </div>
                ))}
                {used.length === 0 && <p className="p-4 text-sm text-gray-500">Sin fichas configuradas.</p>}
            </div>

            {playersCount > 0 && (
                <p className="mt-3 text-[11px] text-gray-500">Los totales son para los {playersCount} jugadores anotados, sin contar re-entradas ni add-ons.</p>
            )}
        </Modal>
    );
};
