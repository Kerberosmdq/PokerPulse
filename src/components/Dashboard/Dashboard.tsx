import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
    Tv, QrCode, Shuffle, DollarSign, Coffee, Trophy, VolumeX, Volume1, Volume2, Download, Upload,
    MoreHorizontal, Keyboard, RotateCcw, Settings2, MessageSquare, Check,
} from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { toast } from '../../store/toastStore';
import { soundManager } from '../../utils/audio';
import { cn } from '../../utils/cn';
import { BackupError, exportTournamentData, importTournamentData } from '../../utils/backupManager';
import { formatChips, formatMoney, formatTime, getTournamentStats } from '../../utils/tournament';
import { useKeyboardShortcuts, SHORTCUTS } from '../../hooks/useKeyboardShortcuts';
import { useClockEngine } from '../../hooks/useClockEngine';
import { useNow } from '../../hooks/useNow';
import { peerService } from '../../services/peerService';
import type { PokerGameStore } from '../../types';
import { THEMES } from '../../utils/themes';
import { Timer } from './Timer';
import { PlayerList } from './PlayerList';
import { GameLog } from './GameLog';
import { BlindsList } from './BlindsList';
import { ChipList } from './ChipList';
import { RemoteControlQR } from './RemoteControlQR';
import { TVMode } from './TVMode';
import { SeatingDraw } from './SeatingDraw';
import { PrizePool } from './PrizePool';
import { BreakOverlay } from './BreakOverlay';
import { FinishTournamentModal } from './FinishTournamentModal';
import { Button } from '../ui/Button';
import { BrandMark } from '../ui/Logo';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Modal } from '../ui/Modal';
import { Dropdown, MenuItem, MenuLabel } from '../ui/Dropdown';

type Overlay = 'remote' | 'tv' | 'seating' | 'prizes' | 'finish' | 'reset' | 'shortcuts' | null;

export const Dashboard: React.FC = () => {
    const [overlay, setOverlay] = useState<Overlay>(null);
    const [pendingImport, setPendingImport] = useState<Partial<PokerGameStore> | null>(null);
    const [remoteDevices, setRemoteDevices] = useState(peerService.connectedCount);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const blindsStructure = useGameStore(s => s.blindsStructure);
    const currentLevelIndex = useGameStore(s => s.currentLevelIndex);
    const players = useGameStore(s => s.players);
    const tournamentName = useGameStore(s => s.tournamentName);

    useClockEngine();
    useKeyboardShortcuts({
        onToggleTV: () => setOverlay(o => (o === 'tv' ? null : 'tv')),
        onShowHelp: () => setOverlay('shortcuts'),
    });

    // Si el control remoto ya se usó en este dispositivo, volver a publicarlo al cargar: los
    // teléfonos se reconectan solos con el mismo enlace
    useEffect(() => {
        if (peerService.hasHostHistory()) peerService.initializeHost(() => { });
        return peerService.onConnectionsChange(setRemoteDevices);
    }, []);

    const isBreak = blindsStructure[currentLevelIndex]?.type === 'break';
    const [dismissedBreakIndex, setDismissedBreakIndex] = useState<number | null>(null);
    const showBreakOverlay = isBreak && dismissedBreakIndex !== currentLevelIndex && overlay !== 'tv';

    const alive = players.filter(p => p.status !== 'busted');
    const champion = players.length >= 2 && alive.length === 1 ? alive[0] : null;

    const close = () => setOverlay(null);

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        try {
            setPendingImport(await importTournamentData(file));
        } catch (err) {
            toast.error(err instanceof BackupError ? err.message : 'No se pudo leer el archivo.');
        }
    };

    return (
        <div className="min-h-screen lg:h-dvh flex flex-col lg:overflow-hidden">
            <AnimatePresence>
                {overlay === 'remote' && <RemoteControlQR key="remote" onClose={close} />}
                {overlay === 'seating' && <SeatingDraw key="seating" onClose={close} />}
                {overlay === 'prizes' && <PrizePool key="prizes" onClose={close} />}
                {overlay === 'finish' && <FinishTournamentModal key="finish" onClose={close} />}
                {overlay === 'shortcuts' && <ShortcutsHelp key="shortcuts" onClose={close} />}
                {overlay === 'reset' && (
                    <ConfirmModal
                        key="reset"
                        title="¿Descartar el torneo?"
                        message="Se borran los jugadores, el pozo y el registro sin guardarlo en el historial. La configuración de ciegas y fichas se conserva. Para guardar los resultados usá Finalizar."
                        confirmText="Descartar"
                        isDestructive
                        onConfirm={() => { useGameStore.getState().resetGame(); close(); }}
                        onCancel={close}
                    />
                )}
                {pendingImport && (
                    <ConfirmModal
                        key="import"
                        title="¿Restaurar respaldo?"
                        message={`El torneo actual se reemplaza por el del archivo (${pendingImport.players?.length ?? 0} jugadores, pozo ${formatMoney(pendingImport.prizePool ?? 0)}). El reloj queda en pausa.`}
                        confirmText="Restaurar"
                        onConfirm={() => {
                            useGameStore.getState().importState(pendingImport);
                            setPendingImport(null);
                            toast.success('Respaldo restaurado');
                        }}
                        onCancel={() => setPendingImport(null)}
                    />
                )}
                {showBreakOverlay && <BreakOverlay key="break" onClose={() => setDismissedBreakIndex(currentLevelIndex)} />}
            </AnimatePresence>
            {overlay === 'tv' && <TVMode onClose={close} />}

            <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleImport} className="hidden" />

            {/* Barra superior */}
            <header className="border-b border-white/10 bg-black/30 backdrop-blur-md z-30 px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
                <BrandMark subtitle={tournamentName || undefined} />

                <nav className="flex flex-wrap items-center gap-1" aria-label="Herramientas del torneo">
                    {isBreak && (
                        <Button variant="ghost" size="sm" onClick={() => setDismissedBreakIndex(null)} className="text-warning border border-warning/30 hover:bg-warning/10">
                            <Coffee className="w-4 h-4" /> Descanso
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setOverlay('tv')} title="Modo TV (T)">
                        <Tv className="w-4 h-4 text-secondary" /> <span className="hidden sm:inline">Modo TV</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setOverlay('remote')} className="relative">
                        <QrCode className="w-4 h-4 text-primary" /> <span className="hidden sm:inline">Remoto</span>
                        {remoteDevices > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse" aria-label="Control remoto conectado" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setOverlay('seating')}>
                        <Shuffle className="w-4 h-4 text-accent" /> <span className="hidden sm:inline">Asientos</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setOverlay('prizes')}>
                        <DollarSign className="w-4 h-4 text-warning" /> <span className="hidden sm:inline">Premios</span>
                    </Button>

                    <div className="w-px h-6 bg-white/10 mx-1" />
                    <SoundMenu />
                    <Dropdown
                        trigger={({ toggle, open }) => (
                            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Más opciones" aria-expanded={open} className={open ? 'bg-white/10' : ''}>
                                <MoreHorizontal className="w-5 h-5" />
                            </Button>
                        )}
                    >
                        {(closeMenu) => <MoreMenu closeMenu={closeMenu} onOverlay={setOverlay} onImport={() => fileInputRef.current?.click()} />}
                    </Dropdown>

                    <Button size="sm" onClick={() => setOverlay('finish')} className="ml-1 bg-warning text-black hover:brightness-110">
                        <Trophy className="w-4 h-4" /> Finalizar
                    </Button>
                </nav>
            </header>

            <StatsBar />

            {champion && (
                <div className="mx-4 lg:mx-6 mt-4 rounded-2xl border border-warning/40 bg-warning/10 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                    <span className="font-bold text-warning">🏆 ¡{champion.name} es el último jugador en pie!</span>
                    <Button size="sm" onClick={() => setOverlay('finish')} className="bg-warning text-black">Cerrar torneo y guardar</Button>
                </div>
            )}

            {/* Contenido */}
            <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 p-4 lg:p-6">
                <section className="lg:col-span-3 glass-panel rounded-2xl p-4 lg:p-5 flex flex-col min-h-[420px] lg:min-h-0 order-2 lg:order-1" aria-label="Jugadores">
                    <PlayerList />
                </section>

                <section className="lg:col-span-6 flex flex-col gap-4 lg:gap-5 min-h-0 order-1 lg:order-2">
                    <div className="flex-1 glass-panel rounded-2xl p-5 lg:p-6 flex items-center justify-center overflow-y-auto min-h-0">
                        <Timer />
                    </div>
                </section>

                <section className="lg:col-span-3 flex flex-col gap-4 lg:gap-5 min-h-0 order-3">
                    <div className="glass-panel rounded-2xl p-4 lg:p-5 flex flex-col min-h-0 lg:flex-[3]">
                        <h3 className="text-secondary font-bold mb-3 uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                            <span className="w-2 h-2 bg-secondary rounded-full" /> Ciegas
                        </h3>
                        <div data-scroll-container className="relative flex-1 overflow-y-auto -mx-1 px-1 max-h-80 lg:max-h-none">
                            <BlindsList />
                        </div>
                    </div>
                    <div className="glass-panel rounded-2xl p-4 lg:p-5 flex flex-col min-h-0 lg:flex-[2] lg:max-h-fit">
                        <h3 className="text-accent font-bold mb-3 uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                            <span className="w-2 h-2 bg-accent rounded-full" /> Fichas
                        </h3>
                        <div className="flex-1 overflow-y-auto">
                            <ChipList />
                        </div>
                    </div>
                    <div className="h-56 lg:h-auto glass-panel rounded-2xl p-4 flex flex-col min-h-0 lg:flex-[2]">
                        <GameLog />
                    </div>
                </section>
            </main>
        </div>
    );
};

const StatsBar: React.FC = () => {
    const players = useGameStore(s => s.players);
    const prizePool = useGameStore(s => s.prizePool);
    const tournamentStartedAt = useGameStore(s => s.tournamentStartedAt);
    const blindsStructure = useGameStore(s => s.blindsStructure);
    const currentLevelIndex = useGameStore(s => s.currentLevelIndex);
    const now = useNow(1000, tournamentStartedAt !== null);

    const stats = getTournamentStats(players);
    const level = blindsStructure[currentLevelIndex];
    const bb = level?.type === 'level' ? level.bigBlind : blindsStructure.slice(currentLevelIndex).find(l => l.type === 'level')?.bigBlind;
    const elapsed = tournamentStartedAt ? Math.max(0, Math.floor((now - tournamentStartedAt) / 1000)) : 0;

    const items = [
        { label: 'Pozo', value: formatMoney(prizePool), className: 'text-primary' },
        { label: 'En juego', value: `${stats.alive} / ${stats.total}` },
        { label: 'Stack promedio', value: formatChips(stats.avgStack), hint: bb && stats.avgStack ? `${Math.round(stats.avgStack / bb)} BB` : undefined },
        { label: 'Re-entradas · Add-ons', value: `${stats.rebuys} · ${stats.addons}`, className: 'text-secondary' },
        { label: 'Tiempo jugado', value: tournamentStartedAt ? formatTime(elapsed) : '—' },
    ];

    return (
        <div className="px-4 lg:px-6 pt-4">
            <dl className="grid grid-cols-2 md:grid-cols-5 gap-2 lg:gap-3">
                {items.map(i => (
                    <div key={i.label} className="glass-panel rounded-xl px-3 lg:px-4 py-2.5 last:col-span-2 md:last:col-span-1 min-w-0">
                        <dt className="text-[10px] uppercase tracking-widest text-gray-500 font-bold truncate">{i.label}</dt>
                        <dd className={cn('text-lg font-black font-mono tabular', i.className ?? 'text-white')}>
                            {i.value}
                            {i.hint && <span className="text-xs text-gray-500 font-sans font-bold ml-1.5">{i.hint}</span>}
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
};

const SoundMenu: React.FC = () => {
    const volume = useGameStore(s => s.volume);
    const isMuted = useGameStore(s => s.isMuted);
    const voiceEnabled = useGameStore(s => s.voiceEnabled);
    const { setVolume, toggleMute, toggleVoice } = useGameStore.getState();
    const Icon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

    const previews: [string, () => void][] = [
        ['🛎️ Campana', () => soundManager.playBlindsUp()],
        ['🃏 Barajar', () => soundManager.playCardShuffle()],
        ['🪙 Fichas', () => soundManager.playChipsClash()],
        ['⏱️ Tensión', () => soundManager.playTimerWarning()],
    ];

    return (
        <Dropdown
            trigger={({ toggle, open }) => (
                <Button variant="ghost" size="icon" onClick={toggle} aria-label="Sonido (M para silenciar)" aria-expanded={open} className={open ? 'bg-white/10' : ''}>
                    <Icon className={cn('w-5 h-5', isMuted ? 'text-accent' : 'text-gray-300')} />
                </Button>
            )}
            className="w-64 p-4 space-y-4"
        >
            {() => (
                <>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sonido</span>
                        <button onClick={toggleMute} className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border', isMuted ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-white/5 border-white/10 text-gray-300 hover:text-white')}>
                            {isMuted ? 'Silenciado' : 'Activo'}
                        </button>
                    </div>
                    <label className="block space-y-2">
                        <span className="flex justify-between text-xs text-gray-400">
                            Volumen <span className="font-mono">{Math.round(volume * 100)}%</span>
                        </span>
                        <input
                            type="range" min="0" max="1" step="0.05" value={volume} disabled={isMuted}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-full accent-primary cursor-pointer disabled:opacity-30"
                        />
                    </label>
                    <button onClick={toggleVoice} className="w-full flex items-center justify-between text-sm text-gray-200 px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5">
                        <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Anuncios por voz</span>
                        <span className={cn('w-9 h-5 rounded-full relative transition-colors', voiceEnabled ? 'bg-primary' : 'bg-white/15')}>
                            <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all', voiceEnabled ? 'left-4.5' : 'left-0.5')} />
                        </span>
                    </button>
                    <div className="grid grid-cols-2 gap-1.5">
                        {previews.map(([label, play]) => (
                            <button key={label} disabled={isMuted} onClick={play} className="text-[11px] font-bold border border-white/5 hover:bg-white/5 text-gray-300 rounded-lg h-8 disabled:opacity-30">
                                {label}
                            </button>
                        ))}
                        <button
                            disabled={isMuted || !voiceEnabled}
                            onClick={() => soundManager.announce('Nivel 3. Ciegas 150 y 300.')}
                            className="col-span-2 text-[11px] font-bold border border-white/5 hover:bg-white/5 text-gray-300 rounded-lg h-8 disabled:opacity-30"
                        >
                            🗣️ Probar voz
                        </button>
                    </div>
                </>
            )}
        </Dropdown>
    );
};

const MoreMenu: React.FC<{ closeMenu: () => void; onOverlay: (o: Overlay) => void; onImport: () => void }> = ({ closeMenu, onOverlay, onImport }) => {
    const theme = useGameStore(s => s.theme);
    const { setTheme, setGameState } = useGameStore.getState();
    const act = (fn: () => void) => () => { closeMenu(); fn(); };

    return (
        <div className="w-72">
            <MenuLabel>Tema</MenuLabel>
            <div className="grid grid-cols-2 gap-1 px-1 pb-2">
                {THEMES.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={cn('flex items-center gap-2 px-2 py-1.5 text-xs rounded-lg border', theme === t.id ? 'border-primary/50 bg-white/5 text-white' : 'border-transparent text-gray-400 hover:bg-white/5')}
                    >
                        <span className="w-4 h-4 rounded-full border border-black/50 shrink-0" style={{ background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})` }} />
                        <span className="truncate">{t.name}</span>
                        {theme === t.id && <Check className="w-3 h-3 ml-auto shrink-0" />}
                    </button>
                ))}
            </div>
            <div className="h-px bg-white/5 my-1" />
            <MenuItem icon={<Settings2 className="w-4 h-4" />} onClick={act(() => setGameState('setup'))}>Editar configuración</MenuItem>
            <MenuItem icon={<Download className="w-4 h-4" />} onClick={act(() => { exportTournamentData(useGameStore.getState()); toast.success('Respaldo descargado'); })}>Exportar respaldo</MenuItem>
            <MenuItem icon={<Upload className="w-4 h-4" />} onClick={act(onImport)}>Importar respaldo</MenuItem>
            <MenuItem icon={<Keyboard className="w-4 h-4" />} hint="?" onClick={act(() => onOverlay('shortcuts'))}>Atajos de teclado</MenuItem>
            <div className="h-px bg-white/5 my-1" />
            <MenuItem icon={<RotateCcw className="w-4 h-4" />} danger onClick={act(() => onOverlay('reset'))}>Descartar torneo</MenuItem>
        </div>
    );
};

const ShortcutsHelp: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <Modal onClose={onClose} size="sm" title="Atajos de teclado" icon={<Keyboard className="w-5 h-5 text-primary" />}>
        <dl className="space-y-2">
            {SHORTCUTS.map(s => (
                <div key={s.keys} className="flex items-center justify-between gap-4 text-sm">
                    <dt className="text-gray-300">{s.description}</dt>
                    <dd><kbd className="font-mono text-xs text-white bg-white/5 border border-white/15 rounded px-2 py-1 whitespace-nowrap">{s.keys}</kbd></dd>
                </div>
            ))}
        </dl>
    </Modal>
);
