import { useEffect, useState, type RefObject } from 'react';

/** Tamaño actual de un elemento (se actualiza al redimensionar). */
export const useElementSize = (ref: RefObject<HTMLElement | null>) => {
    const [size, setSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            // Redondear evita re-renders por fracciones de píxel
            setSize(prev => (Math.round(prev.width) === Math.round(width) && Math.round(prev.height) === Math.round(height) ? prev : { width, height }));
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, [ref]);

    return size;
};

/** true si la media query coincide (p. ej. '(min-width: 1024px)'). */
export const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);

    useEffect(() => {
        const mql = window.matchMedia(query);
        const onChange = () => setMatches(mql.matches);
        onChange();
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, [query]);

    return matches;
};
