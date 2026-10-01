import { describe, expect, it } from 'vitest';
import { organizerLink, playerLink } from './links';

describe('enlaces para celulares', () => {
    it('el de jugadores no lleva clave', () => {
        const url = playerLink('nexpulse-abc');
        expect(url).toContain('?id=nexpulse-abc&rol=jugador');
        expect(url).not.toContain('clave');
    });

    it('la clave del organizador va después del # (no viaja al servidor)', () => {
        const url = new URL(organizerLink('nexpulse-abc', 'secreta123'));
        expect(url.search).toBe('?id=nexpulse-abc');
        expect(url.hash).toBe('#clave=secreta123');
    });
});
