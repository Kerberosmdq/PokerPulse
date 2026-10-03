import React, { useEffect, useState } from 'react';
import { X, Maximize, ExternalLink, Coffee } from 'lucide-react';
import { STORAGE_KEY, useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { cn } from '../../utils/cn';
import {
    chipsToColorUp, findNextPlayingLevel, formatChips, formatMoney, formatTime, getLevelNumber,
    getTournamentStats, placeMedal, secondsUntilNextBreak,
} from '../../utils/tournament';
import { usePrizes } from '../../hooks/usePrizes';
import { QRCodeSVG } from 'qrcode.react';
import { playerLink } from '../../utils/links';
import { PokerChip } from './ChipList';

/** ID del anfitrión si la conexión de celulares ya se usó en este navegador. */
const savedHostId = () => {
    try {
        return localStorage.getItem('nexpulse-host-id');
    } catch {
        return null;
    }
};

/**
 * Tiempo restante calculado localmente a partir de levelEndTime: la pantalla TV se ve fluida
 * aunque el estado le llegue desde otra ventana.
 */
const useLiveRemaining = () => {
    const isPaused = useGameStore(s => s.isPaused);
    const levelEndTime = useGameStore(s => s.levelEndTime);
    const stored = useGameStore(s => s.timerSecondsRemaining);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (isPaused || !levelEndTime) return;
        const id = setInterval(() => setNow(Date.now()), 250);
        return () => clearInterval(id);
    }, [isPaused, levelEndTime]);

    return isPaused || !levelEndTime ? stored : Math.max(0, Math.ceil((levelEndTime - now) / 1000));
};

/** Controles que se ocultan (junto con el cursor) tras unos segundos sin mover el mouse. */
const useIdleControls = (delay = 2500) => {
    const [visible, setVisible] = useState(true);
    useEffect(() => {
        let timeout = setTimeout(() => setVisible(false), delay);
        const onMove = () => {
            setVisible(true);
            clearTimeout(timeout);
            timeout = setTimeout(() => setVisible(false), delay);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchstart', onMove);
        return () => {
            clearTimeout(timeout);
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('touchstart', onMove);
        };
    }, [delay]);
    return visible;
};

/** Ancho de la ventana, para escalar elementos que se dimensionan en píxeles (las fichas). */
const useViewportWidth = () => {
    const [width, setWidth] = useState(() => window.innerWidth);
    useEffect(() => {
        const onResize = () => setWidth(window.innerWidth);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
    return width;
};

const toggleFullscreen = async () => {
    try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
    } catch {
        /* Pantalla completa no disponible */
    }
};

/** Pantalla grande de solo lectura: reloj, ciegas, pozo y estado del torneo. */
export const TVDisplay: React.FC = () => {
    const blindsStructure = useGameStore(s => s.blindsStructure);
    const currentLevelIndex = useGameStore(s => s.currentLevelIndex);
    const players = useGameStore(s => s.players);
    const isPaused = useGameStore(s => s.isPaused);
    const tournamentName = useGameStore(s => s.tournamentName);
    const remaining = useLiveRemaining();
    const [hostId] = useState(savedHostId);

    const level = blindsStructure[currentLevelIndex];
    const isBreak = level?.type === 'break';
    const nextPlaying = findNextPlayingLevel(blindsStructure, currentLevelIndex);
    const stats = getTournamentStats(players);
    const toBreak = secondsUntilNextBreak(blindsStructure, currentLevelIndex, remaining);
    const progress = level ? Math.min(1, Math.max(0, 1 - remaining / (level.duration * 60))) : 0;
    const isLastMinute = !isBreak && remaining <= 60 && remaining > 0;
    const { breakdown, payouts: allPayouts } = usePrizes();
    const payouts = allPayouts.slice(0, 3);
    const bbRef = isBreak ? nextPlaying?.bigBlind : level?.bigBlind;

    return (
        <div className="absolute inset-0 flex flex-col p-[3vw] gap-[2vw]">
            <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
                <div className="absolute top-[-20%] left-[10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[160px]" />
                <div className="absolute bottom-[-20%] right-[10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[160px]" />
            </div>

            {/* Encabezado */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-[1vw]">
                    <Logo className="w-[3.5vw] h-[3.5vw] min-w-10 min-h-10" />
                    <span className="font-black tracking-[0.2em] text-gray-300" style={{ fontSize: 'clamp(1rem, 1.8vw, 2.2rem)' }}>
                        {tournamentName || 'NEXPULSE'}
                    </span>
                </div>
                <div
                    className={cn('px-[1.5vw] py-[0.5vw] rounded-full border font-black uppercase tracking-[0.25em]', isBreak ? 'border-warning/50 text-warning bg-warning/10' : 'border-primary/40 text-primary bg-primary/10')}
                    style={{ fontSize: 'clamp(0.9rem, 1.5vw, 2rem)' }}
                >
                    {isBreak ? 'Descanso' : `Nivel ${getLevelNumber(blindsStructure, currentLevelIndex)}`}
                    {isPaused && <span className="text-gray-400"> · Pausa</span>}
                </div>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-[3vw] min-h-0">
                {/* Reloj + ciegas */}
                <div className="col-span-12 lg:col-span-7 flex flex-col justify-center items-center text-center gap-[2vw]">
                    <div
                        className={cn('font-mono font-bold leading-none tracking-tighter tabular', isLastMinute ? 'text-accent' : isBreak ? 'text-warning' : isPaused ? 'text-gray-400' : 'text-white')}
                        style={{ fontSize: remaining >= 3600 ? '13vw' : '17vw', textShadow: '0 0 60px rgba(255,255,255,0.25)' }}
                    >
                        {formatTime(remaining)}
                    </div>
                    <div className="w-[80%] h-[0.6vw] min-h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                            className={cn('h-full rounded-full transition-[width] duration-1000 ease-linear', isBreak ? 'bg-warning' : isLastMinute ? 'bg-accent' : 'bg-primary')}
                            style={{ width: `${progress * 100}%` }}
                        />
                    </div>

                    {isBreak ? (
                        <div className="flex items-center gap-[1vw] text-warning font-black uppercase tracking-widest" style={{ fontSize: '3.5vw' }}>
                            <Coffee style={{ width: '3.5vw', height: '3.5vw' }} /> Descanso
                        </div>
                    ) : level && (
                        <div>
                            <div className="text-gray-500 uppercase tracking-[0.3em] font-light" style={{ fontSize: '2vw' }}>Ciegas</div>
                            <div className="font-black leading-none text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary tabular" style={{ fontSize: '7.5vw' }}>
                                {formatChips(level.smallBlind)}<span className="text-white/20"> / </span>{formatChips(level.bigBlind)}
                            </div>
                            {level.ante > 0 && (
                                <div className="text-accent font-bold mt-[0.5vw]" style={{ fontSize: '3vw' }}>ANTE {formatChips(level.ante)}</div>
                            )}
                        </div>
                    )}

                    <TVChipStrip />
                </div>

                {/* Información */}
                <div className="hidden lg:flex col-span-5 flex-col justify-center gap-[1.6vw] pl-[3vw] border-l border-white/10">
                    <InfoBlock label={isBreak ? 'Al volver' : 'Próximo nivel'}>
                        <span className="text-gray-200">
                            {nextPlaying ? `${formatChips(nextPlaying.smallBlind)} / ${formatChips(nextPlaying.bigBlind)}` : 'Fin'}
                        </span>
                        {nextPlaying && nextPlaying.ante > 0 && <span className="text-accent/80" style={{ fontSize: '1.6vw' }}> ante {formatChips(nextPlaying.ante)}</span>}
                    </InfoBlock>

                    <InfoBlock label="Bolsa de premios">
                        <span className="text-secondary">{formatMoney(breakdown.net)}</span>
                    </InfoBlock>

                    {payouts.length > 1 && (
                        <div className="flex gap-[1.5vw] text-gray-300" style={{ fontSize: '1.5vw' }}>
                            {payouts.map(p => (
                                <span key={p.place} className="tabular">{placeMedal(p.place)} {formatMoney(p.amount)}</span>
                            ))}
                        </div>
                    )}

                    <div className="h-px bg-white/10" />

                    <div className="grid grid-cols-2 gap-[2vw]">
                        <InfoBlock label="Jugadores" small>
                            <span className="text-primary">{stats.alive}</span>
                            <span className="text-gray-600"> / {stats.total}</span>
                        </InfoBlock>
                        <InfoBlock label="Stack promedio" small>
                            {formatChips(stats.avgStack)}
                            {bbRef ? <span className="block text-gray-500 font-medium" style={{ fontSize: '1.4vw' }}>{Math.round(stats.avgStack / bbRef)} ciegas grandes</span> : null}
                        </InfoBlock>
                    </div>

                    {toBreak !== null && !isBreak && (
                        <InfoBlock label="Próximo descanso" small>
                            <span className="text-warning/90">{formatTime(toBreak)}</span>
                        </InfoBlock>
                    )}

                    {hostId && (
                        <div className="flex items-center gap-[1vw] mt-auto">
                            <div className="bg-white p-[0.4vw] rounded-lg shrink-0">
                                <QRCodeSVG value={playerLink(hostId)} size={256} style={{ width: '6.5vw', height: '6.5vw', minWidth: 72, minHeight: 72 }} />
                            </div>
                            <div className="text-gray-400 leading-tight" style={{ fontSize: '1.1vw' }}>
                                <div className="font-bold text-gray-200">Asistente de manos</div>
                                Escaneá con tu celular para ver tus fichas y qué jugar
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/** Franja inferior con las fichas en juego y su valor; las que ya se pueden retirar aparecen atenuadas. */
const TVChipStrip: React.FC = () => {
    const chipValues = useGameStore(s => s.chipValues);
    const blindsStructure = useGameStore(s => s.blindsStructure);
    const currentLevelIndex = useGameStore(s => s.currentLevelIndex);
    const vw = useViewportWidth();

    const chips = [...chipValues].filter(c => c.value > 0).sort((a, b) => a.value - b.value);
    if (chips.length === 0) return null;
    const obsolete = new Set(chipsToColorUp(chipValues, blindsStructure, currentLevelIndex).map(c => c.value));
    // Va en la columna del reloj (~55% del ancho): con muchas denominaciones se achican para no pasar de dos filas
    const size = Math.round(Math.min(80, Math.max(30, vw * (chips.length > 6 ? 0.024 : 0.03))));

    return (
        <div className="w-full flex flex-wrap items-center justify-center gap-x-[1.8vw] gap-y-[0.8vw] pt-[1.2vw] border-t border-white/10">
            {chips.map(chip => {
                const retire = obsolete.has(chip.value);
                return (
                    <div key={`${chip.color}-${chip.value}`} className={cn('flex items-center gap-[0.8vw]', retire && 'opacity-40')}>
                        <PokerChip color={chip.color} value={chip.value} size={size} />
                        <div className="leading-none">
                            <div className="font-black text-white font-mono tabular" style={{ fontSize: chips.length > 6 ? 'clamp(0.9rem, 1.4vw, 2.2rem)' : 'clamp(1rem, 1.8vw, 2.6rem)' }}>{formatChips(chip.value)}</div>
                            {retire && <div className="uppercase tracking-wider text-gray-400 font-bold mt-[0.3vw]" style={{ fontSize: 'clamp(0.6rem, 0.9vw, 1.2rem)' }}>Retirar</div>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const InfoBlock: React.FC<{ label: string; small?: boolean; children: React.ReactNode }> = ({ label, small, children }) => (
    <div>
        <div className="text-gray-500 uppercase tracking-[0.2em]" style={{ fontSize: '1.2vw' }}>{label}</div>
        <div className="font-bold text-white tabular leading-tight" style={{ fontSize: small ? '3.4vw' : '4.4vw' }}>{children}</div>
    </div>
);

/** Modo TV dentro de la app del anfitrión. */
export const TVMode: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const controlsVisible = useIdleControls();

    useEffect(() => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => { });
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.fullscreenElement) onClose(); };
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
            if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
        };
    }, [onClose]);

    const openExternal = () => {
        window.open(`${window.location.pathname}?view=tv`, 'nexpulse-tv', 'popup,width=1280,height=720');
        onClose();
    };

    return (
        <div role="region" aria-label="Modo TV" className={cn('fixed inset-0 z-50 bg-background text-white overflow-hidden', !controlsVisible && 'cursor-none')}>
            <TVDisplay />
            <div className={cn('absolute top-0 inset-x-0 p-4 flex justify-between bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300', controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={toggleFullscreen}>
                        <Maximize className="w-4 h-4" /> Pantalla completa
                    </Button>
                    <Button variant="outline" onClick={openExternal} title="Abrir en una ventana aparte para llevarla a la TV o a un segundo monitor">
                        <ExternalLink className="w-4 h-4" /> Abrir en otra ventana
                    </Button>
                </div>
                <Button variant="outline" onClick={onClose}>
                    <X className="w-4 h-4" /> Salir (T)
                </Button>
            </div>
        </div>
    );
};

/**
 * Ventana independiente (?view=tv) para una segunda pantalla. Solo lee: se sincroniza con la
 * ventana principal a través de localStorage, sin escribir nada.
 */
export const TVWindow: React.FC = () => {
    const gameState = useGameStore(s => s.gameState);
    const controlsVisible = useIdleControls();

    useEffect(() => {
        document.title = 'NexPulse · TV';
        const onStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY) useGameStore.persist.rehydrate();
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const waiting = gameState !== 'active' && gameState !== 'paused' && gameState !== 'finished';

    return (
        <div className={cn('fixed inset-0 bg-background text-white overflow-hidden', !controlsVisible && 'cursor-none')} onDoubleClick={toggleFullscreen}>
            {waiting ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 text-center">
                    <Logo className="w-32 h-32" />
                    <p className="text-2xl text-gray-400 tracking-widest uppercase">Esperando que empiece el torneo…</p>
                </div>
            ) : (
                <TVDisplay />
            )}
            <div className={cn('absolute bottom-4 inset-x-0 flex justify-center transition-opacity duration-300', controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
                <Button variant="outline" onClick={toggleFullscreen}>
                    <Maximize className="w-4 h-4" /> Pantalla completa (o doble clic)
                </Button>
            </div>
        </div>
    );
};
