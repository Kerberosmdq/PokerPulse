import React, { useEffect, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Search, Skull, RefreshCw, Plus, Coffee, WifiOff, Loader2 } from 'lucide-react';
import { peerService, type RemoteAction, type RemoteSnapshot, type RemoteStatus } from '../../services/peerService';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { cn } from '../../utils/cn';
import { findNextPlayingLevel, formatChips, formatMoney, formatTime, getLevelNumber } from '../../utils/tournament';

const hostIdFromUrl = () => new URLSearchParams(window.location.search).get('id');

const STATUS_ORDER = { active: 0, away: 1, busted: 2 } as const;

export const RemoteClient: React.FC = () => {
    const [hostId] = useState(hostIdFromUrl);
    const [status, setStatus] = useState<RemoteStatus>('connecting');
    const [state, setState] = useState<RemoteSnapshot | null>(null);
    const [query, setQuery] = useState('');
    const [confirmBust, setConfirmBust] = useState<string | null>(null);

    useEffect(() => {
        document.title = 'NexPulse · Remoto';
        if (!hostId) return;
        peerService.connectToHost(hostId, setStatus, setState);
        return () => peerService.destroy();
    }, [hostId]);

    // Tema del anfitrión
    useEffect(() => {
        if (!state?.theme) return;
        const root = document.documentElement;
        root.classList.forEach(c => c.startsWith('theme-') && root.classList.remove(c));
        root.classList.add(`theme-${state.theme}`);
    }, [state?.theme]);

    // La confirmación de eliminar expira sola
    useEffect(() => {
        if (!confirmBust) return;
        const t = setTimeout(() => setConfirmBust(null), 3000);
        return () => clearTimeout(t);
    }, [confirmBust]);

    const online = status === 'connected';
    const send = (action: RemoteAction) => {
        // Si la conexión se cayó, peerService ya está reintentando y avisa por setStatus
        if (peerService.sendAction(action)) navigator.vibrate?.(15);
    };

    if (!hostId) {
        return (
            <CenteredCard>
                <h2 className="text-xl font-bold">NexPulse Remoto</h2>
                <p className="text-sm text-gray-400">Falta el código del anfitrión. En la computadora abrí <b className="text-white">Remoto</b> y escaneá el QR.</p>
            </CenteredCard>
        );
    }

    if (!state) {
        return (
            <CenteredCard>
                {status === 'failed' ? <WifiOff className="w-10 h-10 text-accent" /> : <Loader2 className="w-10 h-10 text-primary animate-spin" />}
                <h2 className="text-xl font-bold">NexPulse Remoto</h2>
                <p className="text-sm text-gray-400">
                    {status === 'failed' ? 'No se pudo conectar. Verificá que el torneo siga abierto en la computadora.' : 'Conectando con el anfitrión…'}
                </p>
                {status === 'failed' && <Button onClick={() => peerService.retryClient()}>Reintentar</Button>}
            </CenteredCard>
        );
    }

    const { players, blindsStructure, currentLevelIndex, timerSecondsRemaining, isPaused, prizePool } = state;
    const level = blindsStructure[currentLevelIndex];
    const isBreak = level?.type === 'break';
    const next = findNextPlayingLevel(blindsStructure, currentLevelIndex);
    const aliveCount = players.filter(p => p.status !== 'busted').length;

    const q = query.trim().toLowerCase();
    const list = players
        .filter(p => !q || p.name.toLowerCase().includes(q))
        .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

    return (
        <div className="min-h-dvh bg-background text-white flex flex-col gap-4 p-4 pb-10 max-w-lg mx-auto">
            {/* Estado de conexión */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                    <Logo className="w-8 h-8" />
                    <span className="font-black tracking-[0.15em] truncate">{state.tournamentName || 'NEXPULSE'}</span>
                </div>
                <div className={cn(
                    'px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 shrink-0',
                    online ? 'bg-primary/10 border-primary/30 text-primary' : status === 'failed' ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-warning/10 border-warning/30 text-warning'
                )}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', online ? 'bg-primary animate-pulse' : status === 'failed' ? 'bg-accent' : 'bg-warning animate-pulse')} />
                    {online ? 'En línea' : status === 'failed' ? 'Sin conexión' : 'Reconectando'}
                </div>
            </div>
            {status === 'failed' && (
                <Button variant="danger" onClick={() => peerService.retryClient()}>Reintentar conexión</Button>
            )}

            {/* Reloj */}
            <div className={cn('sticky top-2 z-10 glass-panel rounded-2xl p-5 flex flex-col items-center gap-4 border', isPaused ? 'border-white/10' : isBreak ? 'border-warning/40' : 'border-primary/40')}>
                <div className="text-center">
                    <div className={cn('text-[10px] uppercase font-bold tracking-widest', isBreak ? 'text-warning' : 'text-gray-500')}>
                        {isBreak ? 'Descanso' : `Nivel ${getLevelNumber(blindsStructure, currentLevelIndex)}`} · {isPaused ? 'En pausa' : 'En curso'}
                    </div>
                    <div className={cn('font-mono text-6xl font-black tabular leading-tight', isPaused ? 'text-gray-400' : 'text-white')}>{formatTime(timerSecondsRemaining)}</div>
                    {!isBreak && level && (
                        <div className="text-lg font-bold tabular">
                            {formatChips(level.smallBlind)} / {formatChips(level.bigBlind)}
                            {level.ante > 0 && <span className="text-accent text-sm"> · A {formatChips(level.ante)}</span>}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-5 gap-2 w-full">
                    <Button variant="outline" disabled={!online} onClick={() => send({ action: 'PREV_LEVEL' })} className="h-12 px-0" aria-label="Nivel anterior"><SkipBack className="w-5 h-5" /></Button>
                    <Button variant="outline" disabled={!online} onClick={() => send({ action: 'ADJUST_TIMER', payload: { seconds: -60 } })} className="h-12 px-0 font-mono normal-case tracking-normal">−1m</Button>
                    <Button variant={isPaused ? 'primary' : 'secondary'} disabled={!online} onClick={() => send({ action: isPaused ? 'PLAY' : 'PAUSE' })} className="h-12 px-0" aria-label={isPaused ? 'Iniciar' : 'Pausar'}>
                        {isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
                    </Button>
                    <Button variant="outline" disabled={!online} onClick={() => send({ action: 'ADJUST_TIMER', payload: { seconds: 60 } })} className="h-12 px-0 font-mono normal-case tracking-normal">+1m</Button>
                    <Button variant="outline" disabled={!online} onClick={() => send({ action: 'NEXT_LEVEL' })} className="h-12 px-0" aria-label="Nivel siguiente"><SkipForward className="w-5 h-5" /></Button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
                <MiniStat label="Próximo" value={next ? `${formatChips(next.smallBlind)}/${formatChips(next.bigBlind)}` : '—'} />
                <MiniStat label="En juego" value={`${aliveCount}/${players.length}`} />
                <MiniStat label="Pozo" value={formatMoney(prizePool)} className="text-primary" />
            </div>

            {/* Jugadores */}
            <div className="glass-panel rounded-2xl p-4 flex flex-col gap-3">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="search"
                        placeholder="Buscar jugador..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-base text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
                    />
                </div>

                {list.length === 0 && (
                    <p className="text-center text-gray-500 text-sm py-6">{players.length === 0 ? 'Todavía no hay jugadores.' : 'Nadie coincide con la búsqueda.'}</p>
                )}

                {list.map((player) => {
                    const isBusted = player.status === 'busted';
                    const isAway = player.status === 'away';
                    const confirming = confirmBust === player.id;
                    return (
                        <div key={player.id} className={cn('p-3 rounded-xl border flex flex-col gap-2.5', isBusted ? 'border-white/5 opacity-50' : isAway ? 'border-warning/30 bg-warning/[0.04]' : 'border-white/10 bg-white/[0.02]')}>
                            <div className="min-w-0">
                                <div className={cn('font-bold truncate', isBusted && 'line-through text-gray-400', isAway && 'text-warning')}>{player.name}</div>
                                <div className="text-[11px] text-gray-500 font-mono">
                                    {isBusted ? 'Fuera de juego' : `${formatChips(player.chips)} fichas`} · R{player.rebuys} · A{player.addons}
                                </div>
                            </div>
                            <div className={cn('grid gap-2', isBusted ? 'grid-cols-1' : 'grid-cols-4')}>
                                <IconAction label={`Re-entrada (${formatMoney(state.rebuyAmount)})`} disabled={!online} onClick={() => send({ action: 'REBUY', payload: { playerId: player.id } })} className="text-secondary border-secondary/30">
                                    <RefreshCw className="w-4 h-4" />
                                </IconAction>
                                {!isBusted && (
                                    <>
                                        <IconAction label={`Add-on (${formatMoney(state.addonAmount)})`} disabled={!online} onClick={() => send({ action: 'ADDON', payload: { playerId: player.id } })} className="text-accent border-accent/30">
                                            <Plus className="w-4 h-4" />
                                        </IconAction>
                                        <IconAction label={isAway ? 'Marcar presente' : 'Marcar ausente'} disabled={!online} onClick={() => send({ action: 'AWAY', payload: { playerId: player.id } })} className={isAway ? 'text-warning border-warning/50 bg-warning/10' : 'text-gray-400 border-white/10'}>
                                            <Coffee className="w-4 h-4" />
                                        </IconAction>
                                        <button
                                            disabled={!online}
                                            onClick={() => {
                                                if (confirming) {
                                                    send({ action: 'BUST', payload: { playerId: player.id } });
                                                    setConfirmBust(null);
                                                } else {
                                                    setConfirmBust(player.id);
                                                }
                                            }}
                                            aria-label={confirming ? `Confirmar eliminación de ${player.name}` : `Eliminar a ${player.name}`}
                                            className={cn('h-11 rounded-lg border flex items-center justify-center gap-1 transition-colors disabled:opacity-30', confirming ? 'bg-accent text-white border-accent text-xs font-bold' : 'text-gray-400 border-white/10')}
                                        >
                                            <Skull className="w-4 h-4" /> {confirming && '¿Seguro?'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const CenteredCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="min-h-dvh bg-background text-white flex items-center justify-center p-6">
        <div className="glass-panel rounded-2xl p-8 max-w-sm w-full flex flex-col items-center text-center gap-4">
            <Logo className="w-14 h-14" />
            {children}
        </div>
    </div>
);

const MiniStat: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className }) => (
    <div className="glass-panel rounded-xl px-2 py-2.5">
        <div className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">{label}</div>
        <div className={cn('text-sm font-black font-mono tabular truncate', className ?? 'text-white')}>{value}</div>
    </div>
);

const IconAction: React.FC<{ label: string; onClick: () => void; disabled?: boolean; className?: string; children: React.ReactNode }> = ({ label, onClick, disabled, className, children }) => (
    <button onClick={onClick} disabled={disabled} aria-label={label} title={label} className={cn('h-11 rounded-lg border flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30', className)}>
        {children}
    </button>
);
