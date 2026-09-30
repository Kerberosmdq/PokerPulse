import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Pencil, Check, X, Trash2 } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { toast } from '../../store/toastStore';
import { ConfirmModal } from '../ui/ConfirmModal';
import { cn } from '../../utils/cn';

/**
 * "Jugadores habituales": tocar un nombre lo anota. En modo edición se pueden quitar nombres
 * (por ejemplo los de prueba) o vaciar la lista; no afecta a quienes ya están anotados.
 */
export const RegularPlayers: React.FC<{ available: string[]; onAdd: (name: string) => void }> = ({ available, onAdd }) => {
    const playerHistory = useGameStore(s => s.playerHistory);
    const { removeFromPlayerHistory, setPlayerHistory, clearPlayerHistory } = useGameStore.getState();
    const [editing, setEditing] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);

    // Editando se muestra la lista completa (también los ya anotados en este torneo)
    const names = editing ? playerHistory : available;
    if (playerHistory.length === 0) return null;

    const remove = (name: string) => {
        const before = useGameStore.getState().playerHistory;
        removeFromPlayerHistory(name);
        toast.info(`${name} se quitó de habituales`, { label: 'Deshacer', onClick: () => setPlayerHistory(before) });
    };

    const clearAll = () => {
        const before = useGameStore.getState().playerHistory;
        clearPlayerHistory();
        setConfirmClear(false);
        setEditing(false);
        toast.info('Lista de habituales vacía', { label: 'Deshacer', onClick: () => setPlayerHistory(before) });
    };

    if (!editing && names.length === 0) return null;

    return (
        <div>
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Jugadores habituales {editing && <span className="text-gray-600 normal-case tracking-normal font-normal">· tocá la ✕ para quitar</span>}
                </div>
                <div className="flex items-center gap-3">
                    {editing && (
                        <button onClick={() => setConfirmClear(true)} className="text-[10px] font-bold uppercase tracking-wider text-accent hover:underline flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Borrar todos
                        </button>
                    )}
                    <button
                        onClick={() => setEditing(!editing)}
                        aria-pressed={editing}
                        className={cn('text-[10px] font-bold uppercase tracking-wider flex items-center gap-1', editing ? 'text-primary' : 'text-gray-400 hover:text-white')}
                    >
                        {editing ? <><Check className="w-3 h-3" /> Listo</> : <><Pencil className="w-3 h-3" /> Editar</>}
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {names.map(n => editing ? (
                    <span key={n} className="flex items-center gap-1 text-sm pl-3 pr-1 py-1 rounded-full bg-white/5 border border-accent/30 text-gray-200">
                        {n}
                        <button
                            onClick={() => remove(n)}
                            aria-label={`Quitar a ${n} de habituales`}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-accent/70"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </span>
                ) : (
                    <button key={n} onClick={() => onAdd(n)} className="text-sm px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:border-primary/60 hover:text-white transition-colors">
                        + {n}
                    </button>
                ))}
                {editing && names.length === 0 && <span className="text-xs text-gray-500">La lista está vacía.</span>}
            </div>

            <AnimatePresence>
                {confirmClear && (
                    <ConfirmModal
                        title="¿Borrar todos los habituales?"
                        message={`Se quitan los ${playerHistory.length} nombres guardados. Los jugadores ya anotados en este torneo no se tocan, y el historial de torneos tampoco.`}
                        confirmText="Borrar todos"
                        isDestructive
                        onConfirm={clearAll}
                        onCancel={() => setConfirmClear(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
