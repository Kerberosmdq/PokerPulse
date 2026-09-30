import { useEffect, useState } from 'react';

/** Hora actual que se actualiza cada `intervalMs` (para relojes derivados sin romper la pureza del render). */
export const useNow = (intervalMs = 1000, enabled = true) => {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        if (!enabled) return;
        const id = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(id);
    }, [intervalMs, enabled]);
    return now;
};
