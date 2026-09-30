import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { soundManager } from '../utils/audio';

export interface ShortcutHandlers {
    onToggleTV?: () => void;
    onShowHelp?: () => void;
}

export const SHORTCUTS: { keys: string; description: string }[] = [
    { keys: 'Espacio', description: 'Iniciar / pausar el reloj' },
    { keys: '→ / ←', description: 'Nivel siguiente / anterior' },
    { keys: '+ / −', description: 'Sumar / restar 1 minuto' },
    { keys: 'T', description: 'Abrir / cerrar Modo TV' },
    { keys: 'M', description: 'Silenciar / activar sonido' },
    { keys: '?', description: 'Mostrar esta ayuda' },
];

const isTypingTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
};

export const useKeyboardShortcuts = (handlers: ShortcutHandlers = {}) => {
    // Handlers en una ref para no re-suscribir el listener en cada render
    const handlersRef = useRef(handlers);
    useEffect(() => {
        handlersRef.current = handlers;
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Nunca interceptar teclas mientras se escribe (antes, un espacio en el nombre
            // de un jugador pausaba el reloj)
            if (isTypingTarget(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
            // Con un diálogo abierto, las teclas son del diálogo
            if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;

            const store = useGameStore.getState();
            if (store.gameState !== 'active') return;

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    soundManager.playClick();
                    if (store.isPaused) store.startTimer();
                    else store.pauseTimer();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    store.nextLevel();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    store.prevLevel();
                    break;
                case '+':
                case '=':
                    store.adjustTimer(60);
                    break;
                case '-':
                    store.adjustTimer(-60);
                    break;
                case 'm':
                case 'M':
                    store.toggleMute();
                    break;
                case 't':
                case 'T':
                    handlersRef.current.onToggleTV?.();
                    break;
                case '?':
                    handlersRef.current.onShowHelp?.();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
};
