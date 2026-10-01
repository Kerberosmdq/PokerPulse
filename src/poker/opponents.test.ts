import { describe, expect, it } from 'vitest';
import { advise, buildChart, playedPercent, type Spot } from './advisor';
import { applyOpponent, emptyNote, profileOf, recordObservation, toggleTag, undoObservation, type Observation, type RivalNote } from './opponents';

const observe = (note: RivalNote, obs: Observation, times: number) => {
    let n = note;
    for (let i = 0; i < times; i++) n = recordObservation(n, obs);
    return n;
};

const spot = (s: Partial<Spot>): Spot => ({ players: 9, position: 'BTN', situation: 'raised', stack: 'deep', raiser: 'middle', ...s });

describe('notas de rivales', () => {
    it('cuenta y deshace observaciones', () => {
        let n = observe(emptyNote('Juan'), 'raise', 2);
        n = recordObservation(n, 'fold');
        expect(n.counts).toMatchObject({ raise: 2, fold: 1 });
        n = undoObservation(n);
        expect(n.counts.fold).toBe(0);
        expect(undoObservation(emptyNote('x')).counts.fold).toBe(0);
    });

    it('las etiquetas se prenden y apagan', () => {
        const n = toggleTag(emptyNote('Ana'), 'station');
        expect(n.tags).toEqual(['station']);
        expect(toggleTag(n, 'station').tags).toEqual([]);
    });
});

describe('perfil', () => {
    it('sin datos no clasifica', () => {
        expect(profileOf(emptyNote('Juan')).style).toBe('unknown');
        expect(profileOf(observe(emptyNote('Juan'), 'raise', 3)).style).toBe('unknown');
    });

    it('con pocas manos no se apura (una racha corta no alcanza)', () => {
        // 6 subidas seguidas: sospechoso, pero con el promedio todavía no llega a "maníaco" extremo
        const p = profileOf(observe(emptyNote('Juan'), 'raise', 6));
        expect(p.pfr).toBeLessThan(0.6);
        expect(p.confidence).toBe('low');
    });

    it('detecta a quien juega poco', () => {
        const p = profileOf(observe(observe(emptyNote('Roca'), 'fold', 28), 'raise', 2));
        expect(p.style).toBe('tight');
        expect(p.confidence).toBe('high');
    });

    it('detecta a quien paga mucho', () => {
        const n = observe(observe(emptyNote('Ana'), 'call', 14), 'fold', 6);
        expect(profileOf(n).style).toBe('station');
    });

    it('detecta a quien sube mucho', () => {
        const n = observe(observe(emptyNote('Luis'), 'raise', 10), 'fold', 10);
        expect(profileOf(n).style).toBe('aggressive');
    });

    it('una etiqueta manual manda sobre las estadísticas', () => {
        const n = toggleTag(observe(emptyNote('Ana'), 'fold', 30), 'aggressive');
        expect(profileOf(n)).toMatchObject({ style: 'aggressive', fromTag: true });
    });
});

describe('ajuste del consejo', () => {
    const tight = profileOf(toggleTag(emptyNote('Juan'), 'tight'));
    const aggressive = profileOf(toggleTag(emptyNote('Luis'), 'aggressive'));
    const station = profileOf(toggleTag(emptyNote('Ana'), 'station'));

    it('contra alguien que juega poco se juega más cerrado', () => {
        const base = playedPercent(buildChart(spot({})));
        const adjusted = applyOpponent(spot({}), 'Juan', tight);
        expect(playedPercent(buildChart(adjusted.spot))).toBeLessThan(base);
        expect(adjusted.note).toContain('Juan juega poco');
    });

    it('contra alguien que sube mucho se defiende con más manos', () => {
        const base = playedPercent(buildChart(spot({})));
        expect(playedPercent(buildChart(applyOpponent(spot({}), 'Luis', aggressive).spot))).toBeGreaterThan(base);
    });

    it('contra alguien que paga todo no se farolea', () => {
        const s = spot({ raiser: 'late' });
        expect(advise(s, 'A5s').action).toBe('threebet');
        expect(advise(applyOpponent(s, 'Ana', station).spot, 'A5s').action).not.toBe('threebet');
        // Las resubidas por valor siguen
        expect(advise(applyOpponent(s, 'Ana', station).spot, 'AA').action).toBe('threebet');
    });

    it('frente al all-in de alguien que sube mucho se paga más', () => {
        const s = spot({ situation: 'allin' });
        expect(advise(s, 'TT').action).toBe('fold');
        expect(advise(applyOpponent(s, 'Luis', aggressive).spot, 'TT').action).toBe('call');
    });

    it('si nadie entró, el rival no cambia nada', () => {
        const s = spot({ situation: 'unopened' });
        expect(applyOpponent(s, 'Juan', tight)).toEqual({ spot: s });
    });
});

describe('texto del consejo con rival', () => {
    it('no menciona una posición que el usuario no eligió', () => {
        const tight = profileOf(toggleTag(emptyNote('Juan'), 'tight'));
        const s: Spot = { players: 9, position: 'BTN', situation: 'raised', stack: 'deep', raiser: 'middle' };
        const reason = advise(applyOpponent(s, 'Juan', tight).spot, 'KQo').reason;
        expect(reason).not.toContain('posición temprana');
        expect(reason).toContain('este rival');
    });
});
