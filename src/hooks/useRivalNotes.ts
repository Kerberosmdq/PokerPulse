import { useCallback, useEffect, useState } from 'react';
import { emptyNote, recordObservation, toggleTag, undoObservation, type Observation, type RivalNote, type RivalTag } from '../poker/opponents';

// Solo en este celular: las notas sobre los demás nunca se envían a nadie
const NOTES_KEY = 'nexpulse-rivals';

const load = (): Record<string, RivalNote> => {
    try {
        const parsed = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
};

/** Normaliza el nombre para que "juan" y "Juan " sean el mismo rival. */
const keyOf = (name: string) => name.trim().toLowerCase();

export const useRivalNotes = () => {
    const [notes, setNotes] = useState<Record<string, RivalNote>>(load);

    useEffect(() => {
        try {
            localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
        } catch {
            /* sin espacio: las notas quedan solo en memoria */
        }
    }, [notes]);

    const get = useCallback((name: string) => notes[keyOf(name)] ?? emptyNote(name.trim()), [notes]);

    const change = useCallback((name: string, fn: (n: RivalNote) => RivalNote) => {
        setNotes(prev => {
            const key = keyOf(name);
            return { ...prev, [key]: fn(prev[key] ?? emptyNote(name.trim())) };
        });
    }, []);

    return {
        notes,
        get,
        record: (name: string, obs: Observation) => change(name, n => recordObservation(n, obs)),
        undo: (name: string) => change(name, undoObservation),
        toggle: (name: string, tag: RivalTag) => change(name, n => toggleTag(n, tag)),
        add: (name: string) => change(name, n => n),
        remove: (name: string) => setNotes(prev => {
            const next = { ...prev };
            delete next[keyOf(name)];
            return next;
        }),
    };
};

export type RivalNotesApi = ReturnType<typeof useRivalNotes>;
