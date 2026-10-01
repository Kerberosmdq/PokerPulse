const base = () => `${window.location.origin}${window.location.pathname}`;

/** Enlace para que los jugadores entren al torneo desde su celular (solo lectura). */
export const playerLink = (hostId: string) => `${base()}?id=${hostId}&rol=jugador`;

/** Enlace del organizador: la clave va después del "#", así no viaja a ningún servidor. */
export const organizerLink = (hostId: string, key: string) => `${base()}?id=${hostId}#clave=${key}`;
