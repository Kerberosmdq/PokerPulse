import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, WifiOff, Eye, UserRound, Coffee } from 'lucide-react';
import { peerService, type RemoteSnapshot, type RemoteStatus } from '../../services/peerService';
import { GuidePage } from '../Guide/GuidePage';
import { Logo } from '../ui/Logo';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import { findNextPlayingLevel, formatChips, formatTime, getLevelNumber } from '../../utils/tournament';

const WATCH = 'watch';

const hostIdFromUrl = () => new URLSearchParams(window.location.search).get('id');
const identityKey = (hostId: string) => `nexpulse-player-${hostId}`;

const readIdentity = (hostId: string | null) => {
    if (!hostId) return null;
    try {
        return localStorage.getItem(identityKey(hostId));
    } catch {
        return null;
    }
};

/**
 * Vista del jugador que entró escaneando el QR: ve el reloj, las ciegas y sus fichas, y usa el
 * asistente de manos con sus fichas ya cargadas. Solo lectura: no puede tocar el torneo.
 */
export const PlayerClient: React.FC = () => {
    const [hostId] = useState(hostIdFromUrl);
    const [status, setStatus] = useState<RemoteStatus>('connecting');
    const [state, setState] = useState<RemoteSnapshot | null>(null);
    const [identity, setIdentity] = useState<string | null>(() => readIdentity(hostId));

    useEffect(() => {
        document.title = 'NexPulse · Jugador';
        if (!hostId) return;
        peerService.connectToHost(hostId, setStatus, setState, { role: 'player' });
        return () => peerService.destroy();
    }, [hostId]);

    // Tema del torneo
    useEffect(() => {
        if (!state?.theme) return;
        const root = document.documentElement;
        root.classList.forEach(c => c.startsWith('theme-') && root.classList.remove(c));
        root.classList.add(`theme-${state.theme}`);
    }, [state?.theme]);

    const choose = (id: string | null) => {
        setIdentity(id);
        if (!hostId) return;
        try {
            if (id) localStorage.setItem(identityKey(hostId), id);
            else localStorage.removeItem(identityKey(hostId));
        } catch {
            /* opcional */
        }
    };

    const me = state?.players.find(p => p.id === identity);
    // Si el jugador elegido ya no existe (otro torneo), volver a preguntar
    const needsPick = !!state && (identity === null || (identity !== WATCH && !me));

    const bigBlind = useMemo(() => {
        if (!state) return 0;
        const level = state.blindsStructure[state.currentLevelIndex];
        if (level?.type === 'level') return level.bigBlind;
        return findNextPlayingLevel(state.blindsStructure, state.currentLevelIndex)?.bigBlind ?? 0;
    }, [state]);
    const myBigBlinds = me && me.status !== 'busted' && bigBlind > 0 ? me.chips / bigBlind : undefined;

    if (!hostId) {
        return (
            <Centered>
                <p className="text-sm text-gray-400">Falta el código del torneo. Escaneá el QR de <b className="text-white">Jugadores</b> que muestra la computadora.</p>
            </Centered>
        );
    }

    if (!state) {
        return (
            <Centered>
                {status === 'failed' ? <WifiOff className="w-9 h-9 text-accent" /> : <Loader2 className="w-9 h-9 text-primary animate-spin" />}
                <p className="text-sm text-gray-400">
                    {status === 'failed' ? 'No se pudo conectar con el torneo. Verificá que siga abierto en la computadora.' : 'Conectando con el torneo…'}
                </p>
                {status === 'failed' && <Button onClick={() => peerService.retryClient()}>Reintentar</Button>}
                <a href="?view=guia" className="text-xs text-primary hover:underline">Usar el asistente sin conectarme</a>
            </Centered>
        );
    }

    if (needsPick) return <PickPlayer state={state} onPick={choose} />;

    return (
        <GuidePage
            bigBlinds={myBigBlinds}
            header={<TournamentHeader state={state} status={status} me={me} myBigBlinds={myBigBlinds} onChange={() => choose(null)} />}
        />
    );
};

const Centered: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="min-h-dvh bg-background text-white flex items-center justify-center p-6">
        <div className="glass-panel rounded-2xl p-8 max-w-sm w-full flex flex-col items-center text-center gap-4">
            <Logo className="w-14 h-14" />
            <h1 className="text-lg font-bold">NexPulse · Jugador</h1>
            {children}
        </div>
    </div>
);

const PickPlayer: React.FC<{ state: RemoteSnapshot; onPick: (id: string) => void }> = ({ state, onPick }) => {
    const list = [...state.players].sort((a, b) => Number(a.status === 'busted') - Number(b.status === 'busted') || a.name.localeCompare(b.name));
    return (
        <div className="min-h-dvh bg-background text-white px-4 py-8">
            <div className="max-w-md mx-auto space-y-5">
                <div className="flex items-center gap-3">
                    <Logo className="w-10 h-10" />
                    <div>
                        <div className="font-black text-lg">{state.tournamentName || 'Torneo NexPulse'}</div>
                        <div className="text-xs text-gray-500">¿Quién sos?</div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {list.map(p => (
                        <button
                            key={p.id}
                            onClick={() => onPick(p.id)}
                            className={cn('h-14 px-3 rounded-xl border text-left flex items-center gap-2 active:scale-[0.98] transition-transform', p.status === 'busted' ? 'border-white/5 text-gray-500' : 'border-white/10 bg-white/[0.03] text-white')}
                        >
                            <UserRound className="w-4 h-4 shrink-0 opacity-60" />
                            <span className="font-bold truncate">{p.name}</span>
                        </button>
                    ))}
                </div>
                {list.length === 0 && <p className="text-sm text-gray-500 text-center">Todavía no hay jugadores anotados.</p>}
                <button onClick={() => onPick(WATCH)} className="w-full h-12 rounded-xl border border-white/10 text-sm font-bold text-gray-300 flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4" /> Solo quiero mirar
                </button>
                <p className="text-[11px] text-gray-500 text-center">Esto solo sirve para mostrarte tus fichas: no podés modificar el torneo desde acá.</p>
            </div>
        </div>
    );
};

const TournamentHeader: React.FC<{
    state: RemoteSnapshot;
    status: RemoteStatus;
    me?: RemoteSnapshot['players'][number];
    myBigBlinds?: number;
    onChange: () => void;
}> = ({ state, status, me, myBigBlinds, onChange }) => {
    const level = state.blindsStructure[state.currentLevelIndex];
    const isBreak = level?.type === 'break';
    const next = findNextPlayingLevel(state.blindsStructure, state.currentLevelIndex);
    const online = status === 'connected';

    return (
        <header className="glass-panel rounded-2xl p-3 mb-3 space-y-2">
            <div className="flex items-center gap-2">
                <Logo className="w-6 h-6" />
                <span className="font-black text-sm truncate flex-1">{state.tournamentName || 'NexPulse'}</span>
                <span className={cn('flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest', online ? 'text-primary' : 'text-warning')}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', online ? 'bg-primary animate-pulse' : 'bg-warning animate-pulse')} />
                    {online ? 'En vivo' : 'Reconectando'}
                </span>
            </div>

            <div className="flex items-end justify-between gap-3">
                <div>
                    <div className={cn('text-[10px] uppercase tracking-widest font-bold', isBreak ? 'text-warning' : 'text-gray-500')}>
                        {isBreak ? <span className="flex items-center gap-1"><Coffee className="w-3 h-3" /> Descanso</span> : `Nivel ${getLevelNumber(state.blindsStructure, state.currentLevelIndex)}`}
                        {state.isPaused && ' · en pausa'}
                    </div>
                    <div className={cn('font-mono font-black text-3xl tabular leading-none', state.isPaused ? 'text-gray-400' : 'text-white')}>{formatTime(state.timerSecondsRemaining)}</div>
                </div>
                <div className="text-right">
                    {!isBreak && level && (
                        <div className="font-black text-lg tabular leading-tight">
                            {formatChips(level.smallBlind)}/{formatChips(level.bigBlind)}
                            {level.ante > 0 && <span className="text-accent text-xs"> A{formatChips(level.ante)}</span>}
                        </div>
                    )}
                    {next && <div className="text-[11px] text-gray-500 tabular">Próx: {formatChips(next.smallBlind)}/{formatChips(next.bigBlind)}</div>}
                </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-black/25 border border-white/5 px-3 py-1.5">
                {me ? (
                    <div className="min-w-0 flex-1 text-sm">
                        <span className="font-bold">{me.name}</span>
                        {me.status === 'busted' ? (
                            <span className="text-gray-500"> · fuera de juego</span>
                        ) : (
                            <>
                                <span className="text-gray-400"> · {formatChips(me.chips)} fichas</span>
                                {myBigBlinds !== undefined && <span className="text-primary font-bold font-mono"> · {Math.round(myBigBlinds)} BB</span>}
                            </>
                        )}
                        {me.table != null && <span className="text-gray-500 font-mono text-xs"> · M{me.table}·A{me.seat}</span>}
                    </div>
                ) : (
                    <span className="flex-1 text-sm text-gray-400">Mirando el torneo</span>
                )}
                <button onClick={onChange} className="text-[11px] font-bold text-primary hover:underline shrink-0">Cambiar</button>
            </div>
        </header>
    );
};
