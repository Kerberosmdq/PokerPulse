import type { Action } from '../../poker/advisor';

/**
 * Colores fijos por acción (no dependen del tema): así "rojo = subir" significa lo mismo en la
 * guía, en el asistente y en el celular de cada jugador.
 */
export const ACTION_STYLE: Record<Action, { label: string; short: string; bg: string; text: string; ring: string }> = {
    raise: { label: 'Subir', short: 'Subir', bg: '#dc2626', text: '#ffffff', ring: '#f87171' },
    call: { label: 'Pagar', short: 'Pagar', bg: '#2563eb', text: '#ffffff', ring: '#60a5fa' },
    threebet: { label: 'Resubir', short: 'Resubir', bg: '#9333ea', text: '#ffffff', ring: '#c084fc' },
    fourbet: { label: 'Volver a subir', short: '4-bet', bg: '#db2777', text: '#ffffff', ring: '#f472b6' },
    allin: { label: 'All-in', short: 'All-in', bg: '#ea580c', text: '#ffffff', ring: '#fb923c' },
    check: { label: 'Pasar', short: 'Pasar', bg: '#334155', text: '#e2e8f0', ring: '#94a3b8' },
    fold: { label: 'Tirarse', short: 'Tirar', bg: '#141820', text: '#6b7280', ring: '#4b5563' },
};

/**
 * Color del cartel grande de respuesta: igual que la celda, salvo "tirarse", que en la cuadrícula
 * va apagado pero en la respuesta tiene que leerse bien.
 */
export const pillStyle = (action: Action) =>
    action === 'fold' ? { backgroundColor: '#3f3f46', color: '#ffffff' } : { backgroundColor: ACTION_STYLE[action].bg, color: ACTION_STYLE[action].text };

/** Orden en que se muestran en la leyenda (de más agresiva a tirarse). */
export const ACTION_ORDER: Action[] = ['allin', 'fourbet', 'threebet', 'raise', 'call', 'check', 'fold'];
