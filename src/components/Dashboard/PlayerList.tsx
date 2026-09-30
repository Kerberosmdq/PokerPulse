import React, { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, RefreshCcw, Skull, UserPlus, Pencil, Trash2, Coffee, MoreVertical, Search, X, History, Crosshair } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { toast } from '../../store/toastStore';
import type { Player } from '../../types';
import { Button } from '../ui/Button';
import { NumberField } from '../ui/NumberField';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Modal } from '../ui/Modal';
import { usePlayerRules } from '../../hooks/usePlayerRules';
import { cn } from '../../utils/cn';
import { formatChips, formatMoney, getStandings, playerSpent } from '../../utils/tournament';

export const PlayerList: React.FC = () => {
    const players = useGameStore(s => s.players);
    const [isAdding, setIsAdding] = useState(players.length === 0);
    const [query, setQuery] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [toDelete, setToDelete] = useState<Player | null>(null);
    const [bustTarget, setBustTarget] = useState<Player | null>(null);
    const bountyAmount = useGameStore(s => s.bountyAmount);
    const { deletePlayer, bustPlayer, restorePlayer } = useGameStore.getState();

    const bust = (player: Player, eliminatorId?: string) => {
        const chips = player.chips;
        bustPlayer(player.id, eliminatorId);
        toast.warning(`${player.name} quedó afuera`, { label: 'Deshacer', onClick: () => restorePlayer(player.id, chips) });
    };
    // Con bounties hay que saber quién lo eliminó para pagarle
    const requestBust = (player: Player) => (bountyAmount > 0 ? setBustTarget(player) : bust(player));

    const standings = useMemo(() => getStandings(players), [players]);
    const positionById = useMemo(() => new Map(standings.map(s => [s.player.id, s.position])), [standings]);

    const q = query.trim().toLowerCase();
    const matches = (p: Player) => !q || p.name.toLowerCase().includes(q);
    // En juego: orden de inscripción (estable, no "salta" al editar fichas)
    const alivePlayers = players.filter(p => p.status !== 'busted' && matches(p));
    const bustedPlayers = standings.map(s => s.player).filter(p => p.status === 'busted' && matches(p));
    const aliveCount = players.filter(p => p.status !== 'busted').length;

    return (
        <div className="h-full flex flex-col gap-3 min-h-0">
            <div className="flex justify-between items-center gap-2">
                <h3 className="text-primary font-bold uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full" /> Jugadores
                    <span className="text-gray-500 tracking-normal font-mono normal-case">{aliveCount}/{players.length}</span>
                </h3>
                <Button size="sm" variant={isAdding ? 'outline' : 'neon'} onClick={() => setIsAdding(!isAdding)} className="h-8 px-2.5">
                    {isAdding ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {isAdding ? 'Cerrar' : 'Agregar'}
                </Button>
            </div>

            <AnimatePresence initial={false}>
                {isAdding && <AddPlayerForm />}
            </AnimatePresence>

            {players.length > 6 && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar jugador..."
                        aria-label="Buscar jugador"
                        className="w-full h-9 bg-black/20 border border-white/5 rounded-lg pl-9 pr-3 text-sm focus:outline-none focus:border-primary/50"
                    />
                </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1 min-h-0">
                {players.length === 0 && !isAdding && (
                    <div className="text-center py-10 text-sm text-gray-500">
                        Todavía no hay jugadores.
                        <button onClick={() => setIsAdding(true)} className="block mx-auto mt-2 text-primary font-bold hover:underline">Agregar el primero</button>
                    </div>
                )}

                <AnimatePresence initial={false}>
                    {alivePlayers.map((player) => (
                        <motion.div
                            key={player.id}
                            layout="position"
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 12 }}
                        >
                            {editingId === player.id
                                ? <EditPlayerRow player={player} onDone={() => setEditingId(null)} />
                                : <PlayerRow player={player} onEdit={() => setEditingId(player.id)} onDelete={() => setToDelete(player)} onBust={() => requestBust(player)} />}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {bustedPlayers.length > 0 && (
                    <div className="pt-3 mt-3 border-t border-white/5">
                        <h4 className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] mb-2">Eliminados</h4>
                        <div className="space-y-1">
                            {bustedPlayers.map(player => (
                                <BustedRow key={player.id} player={player} position={positionById.get(player.id)} onDelete={() => setToDelete(player)} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {bustTarget && (
                    <EliminatorPicker
                        key="picker"
                        player={bustTarget}
                        candidates={players.filter(p => p.status !== 'busted' && p.id !== bustTarget.id)}
                        bounty={bountyAmount}
                        onPick={(eliminatorId) => { bust(bustTarget, eliminatorId); setBustTarget(null); }}
                        onClose={() => setBustTarget(null)}
                    />
                )}
                {toDelete && (
                    <ConfirmModal
                        title={`¿Borrar a ${toDelete.name}?`}
                        message={<>Se quita del torneo y se descuentan <b className="text-white">{formatMoney(playerSpent(toDelete))}</b> del pozo. Usalo solo si se anotó por error; si perdió sus fichas, usá <b className="text-white">Eliminar</b> (calavera).</>}
                        confirmText="Borrar"
                        isDestructive
                        onConfirm={() => {
                            deletePlayer(toDelete.id);
                            setToDelete(null);
                        }}
                        onCancel={() => setToDelete(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const ActionButton: React.FC<{ label: string; onClick: () => void; className?: string; active?: boolean; disabledReason?: string; children: React.ReactNode }> = ({ label, onClick, className, active, disabledReason, children }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={!!disabledReason}
        title={disabledReason ?? label}
        aria-label={disabledReason ? `${label}: ${disabledReason}` : label}
        aria-pressed={active}
        className={cn('h-8 w-8 rounded-lg flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent', className)}
    >
        {children}
    </button>
);

const PlayerRow: React.FC<{ player: Player; onEdit: () => void; onDelete: () => void; onBust: () => void }> = ({ player, onEdit, onDelete, onBust }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const { rebuyPlayer, addonPlayer, toggleAway } = useGameStore.getState();
    const rules = usePlayerRules(player);
    const isAway = player.status === 'away';

    return (
        <div className={cn(
            'rounded-xl p-3 border transition-colors',
            isAway ? 'bg-warning/[0.04] border-warning/25' : 'bg-surface-light/60 border-white/[0.04] hover:border-white/10'
        )}>
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className={cn('font-bold truncate flex items-center gap-2', isAway ? 'text-warning' : 'text-white')}>
                        <span className="truncate">{player.name}</span>
                        {isAway && <span className="text-[9px] font-black bg-warning/10 border border-warning/20 px-1.5 py-0.5 rounded tracking-widest uppercase shrink-0">Ausente</span>}
                    </div>
                    <div className="text-xs flex items-center gap-2 mt-0.5 font-mono">
                        <span className="text-primary">{formatChips(player.chips)}</span>
                        <span className="text-gray-500">{formatMoney(playerSpent(player))}</span>
                        {player.rebuys > 0 && <span className="text-secondary">{player.rebuys}R</span>}
                        {player.addons > 0 && <span className="text-accent">{player.addons}A</span>}
                        {player.bountiesWon > 0 && (
                            <span className="text-warning flex items-center gap-0.5" title={`Eliminó a ${player.bountiesWon} · cobró ${formatMoney(player.bountyEarnings)}`}>
                                <Crosshair className="w-3 h-3" />{player.bountiesWon}
                            </span>
                        )}
                    </div>
                </div>
                {player.table !== undefined && (
                    <span className="text-[10px] font-mono text-gray-400 bg-black/30 border border-white/5 px-1.5 py-0.5 rounded shrink-0" title={`Mesa ${player.table}, asiento ${player.seat}`}>
                        M{player.table}·A{player.seat}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-1 mt-2 -ml-1">
                <ActionButton label="Re-entrada" disabledReason={rules.rebuy.reason} onClick={() => { rebuyPlayer(player.id); toast.success(`Re-entrada de ${player.name}`); }} className="text-secondary hover:bg-secondary/10">
                    <RefreshCcw className="w-4 h-4" />
                </ActionButton>
                <ActionButton label="Add-on" disabledReason={rules.addon.reason} onClick={() => { addonPlayer(player.id); toast.success(`Add-on de ${player.name}`); }} className="text-accent hover:bg-accent/10">
                    <Plus className="w-4 h-4" />
                </ActionButton>
                <ActionButton label={isAway ? 'Marcar presente' : 'Marcar ausente'} active={isAway} onClick={() => toggleAway(player.id)} className={isAway ? 'text-warning bg-warning/10' : 'text-gray-400 hover:text-warning hover:bg-warning/10'}>
                    <Coffee className="w-4 h-4" />
                </ActionButton>
                <ActionButton label="Eliminar (perdió sus fichas)" onClick={onBust} className="text-gray-400 hover:text-accent hover:bg-accent/10">
                    <Skull className="w-4 h-4" />
                </ActionButton>

                <div className="ml-auto flex items-center gap-1">
                    {menuOpen && (
                        <>
                            <ActionButton label="Editar" onClick={() => { setMenuOpen(false); onEdit(); }} className="text-gray-300 hover:bg-white/10">
                                <Pencil className="w-3.5 h-3.5" />
                            </ActionButton>
                            <ActionButton label="Borrar del torneo" onClick={() => { setMenuOpen(false); onDelete(); }} className="text-accent/80 hover:text-accent hover:bg-accent/10">
                                <Trash2 className="w-3.5 h-3.5" />
                            </ActionButton>
                        </>
                    )}
                    <ActionButton label={menuOpen ? 'Menos opciones' : 'Más opciones'} active={menuOpen} onClick={() => setMenuOpen(!menuOpen)} className={menuOpen ? 'text-white bg-white/10' : 'text-gray-500 hover:text-white hover:bg-white/10'}>
                        <MoreVertical className="w-4 h-4" />
                    </ActionButton>
                </div>
            </div>
        </div>
    );
};

const EditPlayerRow: React.FC<{ player: Player; onDone: () => void }> = ({ player, onDone }) => {
    const [name, setName] = useState(player.name);
    const [chips, setChips] = useState(player.chips);
    const [buyIn, setBuyIn] = useState(player.buyInAmount);

    const save = () => {
        if (!name.trim()) return;
        useGameStore.getState().updatePlayer(player.id, { name: name.trim(), chips, buyInAmount: buyIn });
        onDone();
    };

    return (
        <form
            onSubmit={(e) => { e.preventDefault(); save(); }}
            onKeyDown={(e) => { if (e.key === 'Escape') onDone(); }}
            className="rounded-xl p-3 border border-primary/30 bg-surface-light/60 space-y-2"
        >
            <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                aria-label="Nombre"
                className="w-full h-9 rounded-lg border border-white/10 bg-black/30 px-3 text-sm focus:outline-none focus:border-primary/60"
            />
            <div className="grid grid-cols-2 gap-2">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider">
                    Fichas
                    <NumberField value={chips} onValueChange={setChips} className="h-9 mt-1" />
                </label>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider">
                    Entrada
                    <NumberField value={buyIn} onValueChange={setBuyIn} prefix="$" className="h-9 mt-1" />
                </label>
            </div>
            <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={onDone} className="h-8">Cancelar</Button>
                <Button size="sm" type="submit" className="h-8">Guardar</Button>
            </div>
        </form>
    );
};

const AddPlayerForm: React.FC = () => {
    const players = useGameStore(s => s.players);
    const playerHistory = useGameStore(s => s.playerHistory);
    const startingStack = useGameStore(s => s.startingStack);
    const buyIn = useGameStore(s => s.buyIn);
    const [name, setName] = useState('');
    const [stack, setStack] = useState(startingStack);
    const [entry, setEntry] = useState(buyIn);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const taken = new Set(players.map(p => p.name.toLowerCase()));
    const isDuplicate = taken.has(name.trim().toLowerCase());
    const suggestions = playerHistory.filter(n => !taken.has(n.toLowerCase()));
    const filtered = name.trim()
        ? suggestions.filter(n => n.toLowerCase().includes(name.trim().toLowerCase()))
        : suggestions;

    const add = (playerName: string) => {
        const clean = playerName.trim();
        if (!clean || taken.has(clean.toLowerCase())) return;
        useGameStore.getState().addPlayer(clean, stack, entry);
        setName('');
        setShowHistory(false);
        // El formulario queda abierto para anotar a varios seguidos
        inputRef.current?.focus();
    };

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden shrink-0"
        >
            <form
                onSubmit={(e) => { e.preventDefault(); add(name); }}
                className="flex flex-col gap-2 bg-black/20 p-3 rounded-xl border border-white/10"
            >
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nombre del jugador"
                        aria-label="Nombre del jugador"
                        autoFocus
                        className={cn(
                            'flex-1 min-w-0 h-10 rounded-lg border bg-surface px-3 text-sm focus:outline-none',
                            isDuplicate ? 'border-accent/60' : 'border-white/10 focus:border-primary/60'
                        )}
                    />
                    {suggestions.length > 0 && (
                        <Button type="button" variant="outline" size="icon" className="h-10 w-10" onClick={() => setShowHistory(!showHistory)} title="Jugadores habituales" aria-label="Jugadores habituales">
                            <History className="w-4 h-4" />
                        </Button>
                    )}
                    <Button type="submit" size="icon" className="h-10 w-10" disabled={!name.trim() || isDuplicate} aria-label="Agregar jugador">
                        <Plus className="w-5 h-5" />
                    </Button>
                </div>
                {isDuplicate && <p className="text-[11px] text-accent">Ya hay un jugador con ese nombre.</p>}

                {(showHistory || name.trim()) && filtered.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {filtered.slice(0, 12).map(n => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => add(n)}
                                className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:border-primary/50 hover:text-white"
                            >
                                + {n}
                            </button>
                        ))}
                    </div>
                )}

                <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="text-[10px] text-gray-500 hover:text-gray-300 uppercase tracking-wider font-bold text-left">
                    {showAdvanced ? '▾' : '▸'} {formatChips(stack)} fichas · {formatMoney(entry)}
                </button>
                {showAdvanced && (
                    <div className="grid grid-cols-2 gap-2">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider">
                            Fichas
                            <NumberField value={stack} onValueChange={setStack} className="h-9 mt-1" />
                        </label>
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider">
                            Entrada
                            <NumberField value={entry} onValueChange={setEntry} prefix="$" className="h-9 mt-1" />
                        </label>
                    </div>
                )}
            </form>
        </motion.div>
    );
};

const BustedRow: React.FC<{ player: Player; position?: number; onDelete: () => void }> = ({ player, position, onDelete }) => {
    const rules = usePlayerRules(player);
    return (
        <div className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg hover:bg-white/[0.03]">
            <span className="font-mono text-[11px] text-gray-500 w-7 shrink-0">#{position}</span>
            <span className="text-gray-400 truncate flex-1">{player.name}</span>
            <span className="text-gray-600 text-xs font-mono">{formatMoney(playerSpent(player))}</span>
            <button
                onClick={() => {
                    useGameStore.getState().rebuyPlayer(player.id);
                    toast.success(`Re-entrada de ${player.name}`);
                }}
                disabled={!rules.rebuy.allowed}
                title={rules.rebuy.reason ?? 'Re-entrada'}
                aria-label={`Re-entrada de ${player.name}`}
                className="p-1.5 rounded-md text-secondary/70 hover:text-secondary hover:bg-secondary/10 disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
                <RefreshCcw className="w-3.5 h-3.5" />
            </button>
            <button
                onClick={onDelete}
                title="Borrar del torneo"
                aria-label={`Borrar a ${player.name}`}
                className="p-1.5 rounded-md text-gray-600 hover:text-accent hover:bg-accent/10"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </div>
    );
};

/** Con bounties: elegir quién eliminó al jugador (cobra el bounty). */
const EliminatorPicker: React.FC<{ player: Player; candidates: Player[]; bounty: number; onPick: (id?: string) => void; onClose: () => void }> = ({ player, candidates, bounty, onPick, onClose }) => (
    <Modal
        onClose={onClose}
        size="sm"
        accent="danger"
        title={`¿Quién eliminó a ${player.name}?`}
        description={`Cobra el bounty de ${formatMoney(bounty)}.`}
        icon={<Crosshair className="w-5 h-5 text-accent" />}
    >
        <div className="grid grid-cols-2 gap-2">
            {candidates.map(c => (
                <button
                    key={c.id}
                    onClick={() => onPick(c.id)}
                    className="h-11 px-3 rounded-lg border border-white/10 bg-white/[0.03] text-sm font-bold text-white hover:border-accent/60 hover:bg-accent/10 truncate"
                >
                    {c.name}
                </button>
            ))}
        </div>
        <button onClick={() => onPick(undefined)} className="w-full mt-3 h-10 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5">
            No lo sé / sin bounty
        </button>
    </Modal>
);
