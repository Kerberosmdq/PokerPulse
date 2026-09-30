import type { ThemeId } from '../types';

export const THEMES: { id: ThemeId; name: string; colors: [string, string] }[] = [
    { id: 'cyberpunk', name: 'Cyberpunk', colors: ['#00ff9d', '#00d4ff'] },
    { id: 'montecarlo', name: 'Monte Carlo', colors: ['#d4af37', '#f3e5ab'] },
    { id: 'vegas', name: 'Classic Vegas', colors: ['#22c55e', '#ef4444'] },
    { id: 'royal', name: 'Royal Blue', colors: ['#60a5fa', '#cbd5e1'] },
];
