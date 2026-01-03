import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Plus, RefreshCcw, Skull, UserPlus, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PlayerList: React.FC = () => {
    const { players, addPlayer, rebuyPlayer, addonPlayer, bustPlayer, deletePlayer, updatePlayer } = useGameStore();
    const [newPlayerName, setNewPlayerName] = useState('');
    const [initialStack, setInitialStack] = useState('1000');
    const [buyInAmount, setBuyInAmount] = useState('100');
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editStack, setEditStack] = useState('');
    const [editBuyIn, setEditBuyIn] = useState('');

    const handleAddPlayer = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPlayerName.trim()) {
            addPlayer(newPlayerName.trim(), parseInt(initialStack) || 1000, parseInt(buyInAmount) || 100);
            setNewPlayerName('');
            setIsAdding(false);
        }
    };

    const startEditing = (player: any) => {
        setEditingId(player.id);
        setEditName(player.name);
        setEditStack(player.chips.toString());
        setEditBuyIn(player.buyInAmount.toString());
    };

    const saveEdit = () => {
        if (editingId && editName.trim()) {
            updatePlayer(editingId, {
                name: editName.trim(),
                chips: parseInt(editStack) || 0,
                buyInAmount: parseInt(editBuyIn) || 0
            });
            setEditingId(null);
        }
    };

    const activePlayers = players.filter(p => p.status !== 'busted');
    const bustedPlayers = players.filter(p => p.status === 'busted');

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <h3 className="text-gray-400 font-bold uppercase text-xs tracking-widest">Jugadores Activos ({activePlayers.length})</h3>
                <Button size="sm" variant="ghost" onClick={() => setIsAdding(!isAdding)}>
                    <UserPlus className="w-4 h-4" />
                </Button>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.form
                        initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
                        animate={{ height: 'auto', opacity: 1, transitionEnd: { overflow: 'visible' } }}
                        exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                        onSubmit={handleAddPlayer}
                        className="flex flex-col gap-2 bg-surface-light/50 p-3 rounded-lg border border-white/10"
                    >
                        <div className="flex gap-2">
                            <Input
                                value={newPlayerName}
                                onChange={(e) => setNewPlayerName(e.target.value)}
                                placeholder="Nombre del Jugador"
                                autoFocus
                                className="h-9 text-sm flex-1"
                            />
                            {/* Quick Add from History */}
                            <HistoryDropdown onSelect={(name) => setNewPlayerName(name)} />
                        </div>

                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider ml-1">Fichas</label>
                                <Input
                                    type="number"
                                    value={initialStack}
                                    onChange={(e) => setInitialStack(e.target.value)}
                                    placeholder="1000"
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider ml-1">Entrada ($)</label>
                                <Input
                                    type="number"
                                    value={buyInAmount}
                                    onChange={(e) => setBuyInAmount(e.target.value)}
                                    placeholder="100"
                                    className="h-8 text-sm"
                                />
                            </div>
                        </div>
                        <Button type="submit" size="sm" variant="secondary" className="w-full h-8 mt-1">
                            <Plus className="w-4 h-4 mr-2" /> Añadir Jugador
                        </Button>
                    </motion.form>
                )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {activePlayers.map((player) => (
                        <motion.div
                            key={player.id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="bg-surface-light rounded p-3 group hover:bg-surface-light/80 transition-colors relative"
                        >
                            {editingId === player.id ? (
                                <div className="space-y-2">
                                    <Input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            value={editStack}
                                            onChange={(e) => setEditStack(e.target.value)}
                                            className="h-8 text-sm"
                                            placeholder="Fichas"
                                        />
                                        <Input
                                            type="number"
                                            value={editBuyIn}
                                            onChange={(e) => setEditBuyIn(e.target.value)}
                                            className="h-8 text-sm"
                                            placeholder="$"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 text-xs">Cancelar</Button>
                                        <Button size="sm" variant="primary" onClick={saveEdit} className="h-7 text-xs">Guardar</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-bold text-white flex items-center gap-2">
                                            {player.name}
                                            <button onClick={() => startEditing(player)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-opacity">
                                                <Pencil className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className="text-xs text-primary flex items-center gap-2">
                                            <span>{player.chips.toLocaleString()}</span>
                                            <span className="text-gray-500">(${player.buyInAmount})</span>
                                            {player.rebuys > 0 && <span className="text-accent">+{player.rebuys}R</span>}
                                            {player.addons > 0 && <span className="text-secondary">+{player.addons}A</span>}
                                        </div>
                                    </div>

                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => addonPlayer(player.id)}
                                            title="Add-on"
                                            className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => rebuyPlayer(player.id)}
                                            title="Re-entrada"
                                            className="h-8 w-8 p-0 text-secondary hover:text-secondary hover:bg-secondary/10"
                                        >
                                            <RefreshCcw className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => bustPlayer(player.id)}
                                            title="Eliminar"
                                            className="h-8 w-8 p-0 text-accent hover:text-accent hover:bg-accent/10"
                                        >
                                            <Skull className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => deletePlayer(player.id)}
                                            title="Borrar"
                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {bustedPlayers.length > 0 && (
                    <div className="pt-4 border-t border-surface-light mt-4">
                        <h3 className="text-gray-500 font-bold uppercase text-xs tracking-widest mb-2">Eliminados</h3>
                        <div className="space-y-2 opacity-50">
                            {bustedPlayers.map(player => (
                                <div key={player.id} className="flex justify-between text-sm px-2 group">
                                    <span className="line-through text-gray-400">{player.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-600">${player.buyInAmount + (player.rebuys * 100) + (player.addons * 100)}</span>
                                        <button onClick={() => deletePlayer(player.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const HistoryDropdown: React.FC<{ onSelect: (name: string) => void }> = ({ onSelect }) => {
    const { playerHistory, clearPlayerHistory } = useGameStore();
    const [isOpen, setIsOpen] = useState(false);

    if (playerHistory.length === 0) return null;

    return (
        <div className="relative">
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="h-9 w-9 p-0 bg-surface border border-white/10"
                title="Jugadores Recientes"
            >
                <RefreshCcw className="w-4 h-4 text-gray-400" />
            </Button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-10 w-48 bg-surface border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden">
                        <div className="p-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 flex justify-between items-center">
                            <span>Recientes</span>
                            <button onClick={clearPlayerHistory} className="text-red-500 hover:text-red-400 text-[10px]">Borrar</button>
                        </div>
                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                            {playerHistory.map((name) => (
                                <button
                                    key={name}
                                    type="button"
                                    onClick={() => {
                                        onSelect(name);
                                        setIsOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
