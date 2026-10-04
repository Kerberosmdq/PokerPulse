import { useEffect } from 'react';

/**
 * Wake Lock: mientras `active` sea true, evita que la pantalla se apague o el equipo entre en
 * suspensión por inactividad. No impide la suspensión al cerrar la tapa de la notebook.
 */
export const useWakeLock = (active = true) => {
    useEffect(() => {
        if (!active || !('wakeLock' in navigator)) return;
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
    }, [active]);
};
