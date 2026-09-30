import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { soundManager } from '../utils/audio';
import { getLevelNumber } from '../utils/tournament';

/**
 * Motor del reloj del anfitrión: avanza el tiempo, mantiene la pantalla encendida y dispara
 * sonidos/anuncios. Se monta una sola vez (Dashboard), independiente de qué vista esté abierta.
 */
export const useClockEngine = () => {
    const isPaused = useGameStore(s => s.isPaused);

    // Tick: el store calcula el restante a partir de levelEndTime, así que la frecuencia solo
    // afecta la fluidez, no la precisión.
    useEffect(() => {
        if (isPaused) return;
        const { tickTimer } = useGameStore.getState();
        tickTimer();
        const interval = setInterval(tickTimer, 250);
        return () => clearInterval(interval);
    }, [isPaused]);

    // Wake Lock: evitar que la pantalla se apague con el reloj corriendo
    useEffect(() => {
        if (isPaused || !('wakeLock' in navigator)) return;
        let lock: WakeLockSentinel | null = null;
        let cancelled = false;

        const request = () => {
            navigator.wakeLock.request('screen')
                .then(l => {
                    if (cancelled) l.release();
                    else lock = l;
                })
                .catch(() => { /* No disponible o denegado */ });
        };
        // El lock se libera solo al ocultar la pestaña; se vuelve a pedir al regresar
        const onVisibility = () => { if (document.visibilityState === 'visible') request(); };

        request();
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            cancelled = true;
            document.removeEventListener('visibilitychange', onVisibility);
            lock?.release();
        };
    }, [isPaused]);

    // Sonidos y anuncios por voz ante cambios del reloj
    useEffect(() => {
        return useGameStore.subscribe((state, prev) => {
            const level = state.blindsStructure[state.currentLevelIndex];
            if (!level) return;

            if (state.currentLevelIndex !== prev.currentLevelIndex) {
                if (level.type === 'break') {
                    soundManager.playSuccess();
                    if (state.voiceEnabled) soundManager.announce(`Descanso de ${level.duration} minutos.`);
                } else {
                    soundManager.playBlindsUp();
                    if (state.voiceEnabled) {
                        const n = getLevelNumber(state.blindsStructure, state.currentLevelIndex);
                        const ante = level.ante > 0 ? ` Ante ${level.ante}.` : '';
                        soundManager.announce(`Nivel ${n}. Ciegas ${level.smallBlind} y ${level.bigBlind}.${ante}`);
                    }
                }
                return;
            }

            if (state.isPaused || state.timerSecondsRemaining === prev.timerSecondsRemaining) return;
            const remaining = state.timerSecondsRemaining;

            if (remaining === 60 && level.duration > 1) {
                soundManager.playChipsClash();
                if (state.voiceEnabled) {
                    soundManager.announce(level.type === 'break' ? 'Un minuto para volver a las mesas.' : 'Queda un minuto en este nivel.');
                }
            } else if (remaining <= 10 && remaining > 0) {
                soundManager.playTimerWarning();
            }
        });
    }, []);
};
