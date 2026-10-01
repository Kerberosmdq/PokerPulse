import React, { useMemo, useState } from 'react';
import { Lock, Plus, Undo2, Trash2, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { OBSERVATION_INFO, STYLE_INFO, TAG_INFO, profileOf, type Observation, type RivalTag } from '../../poker/opponents';
import type { RivalNotesApi } from '../../hooks/useRivalNotes';

const OBS_TONE: Record<Observation, string> = {
    fold: 'border-white/10 text-gray-300',
    call: 'border-[#2563eb]/50 text-[#93c5fd]',
    raise: 'border-[#dc2626]/50 text-[#fca5a5]',
    threebet: 'border-[#9333ea]/50 text-[#d8b4fe]',
};

const CONFIDENCE_LABEL = { none: 'sin manos', low: 'pocos datos', medium: 'datos medios', high: 'muchos datos' } as const;
const CONFIDENCE_DOTS = { none: 0, low: 1, medium: 2, high: 3 } as const;

const pct = (n: number) => `${Math.round(n * 100)}%`;

/**
 * Notas privadas sobre los rivales: se anota qué hizo cada uno en las manos que viste y la app
 * calcula su estilo. Todo queda solo en este celular.
 */
export const RivalsTab: React.FC<{ rivals: RivalNotesApi; tablePlayers?: string[] }> = ({ rivals, tablePlayers = [] }) => {
    const [open, setOpen] = useState<string | null>(null);
    const [newName, setNewName] = useState('');

    // Primero los de este torneo, después el resto (lo último anotado arriba)
    const names = useMemo(() => {
        const seen = new Set(tablePlayers.map(n => n.toLowerCase()));
        const others = Object.values(rivals.notes)
            .filter(n => !seen.has(n.name.toLowerCase()))
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .map(n => n.name);
        return { table: tablePlayers, others };
    }, [rivals.notes, tablePlayers]);

    const add = (e: React.FormEvent) => {
        e.preventDefault();
        const clean = newName.trim();
        if (!clean) return;
        rivals.add(clean);
        setOpen(clean);
        setNewName('');
    };

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            <div className="glass-panel rounded-2xl p-4 flex items-start gap-3 text-xs text-gray-400">
                <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p>
                    Tus notas se guardan <b className="text-white">solo en este celular</b>: nadie más las ve. Anotá lo que hizo cada rival antes del flop y el asistente va a ajustar sus consejos cuando elijas <b className="text-white">"¿Quién?"</b>.
                </p>
            </div>

            <form onSubmit={add} className="flex gap-2">
                <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Agregar rival por nombre"
                    aria-label="Nombre del rival"
                    maxLength={30}
                    className="flex-1 min-w-0 h-11 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/60"
                />
                <button type="submit" disabled={!newName.trim()} aria-label="Agregar rival" className="w-11 h-11 rounded-xl bg-primary text-black flex items-center justify-center disabled:opacity-30">
                    <Plus className="w-5 h-5" />
                </button>
            </form>

            {names.table.length > 0 && <Group title="En este torneo" names={names.table} rivals={rivals} open={open} setOpen={setOpen} />}
            {names.others.length > 0 && <Group title={names.table.length > 0 ? 'Otros' : 'Tus rivales'} names={names.others} rivals={rivals} open={open} setOpen={setOpen} removable />}
            {names.table.length === 0 && names.others.length === 0 && (
                <p className="text-center text-sm text-gray-500 py-8">Todavía no anotaste a nadie. Agregá un rival por nombre, o entrá al torneo con el QR para verlos a todos.</p>
            )}
        </div>
    );
};

const Group: React.FC<{ title: string; names: string[]; rivals: RivalNotesApi; open: string | null; setOpen: (n: string | null) => void; removable?: boolean }> = ({ title, names, rivals, open, setOpen, removable }) => (
    <section>
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2">{title}</h2>
        <div className="space-y-2">
            {names.map(name => (
                <RivalCard key={name} name={name} rivals={rivals} expanded={open === name} onToggle={() => setOpen(open === name ? null : name)} removable={removable} />
            ))}
        </div>
    </section>
);

const RivalCard: React.FC<{ name: string; rivals: RivalNotesApi; expanded: boolean; onToggle: () => void; removable?: boolean }> = ({ name, rivals, expanded, onToggle, removable }) => {
    const note = rivals.get(name);
    const profile = profileOf(note);
    const style = STYLE_INFO[profile.style];
    const [flash, setFlash] = useState<Observation | null>(null);

    const record = (obs: Observation) => {
        rivals.record(name, obs);
        navigator.vibrate?.(10);
        setFlash(obs);
        setTimeout(() => setFlash(null), 350);
    };

    return (
        <div className={cn('glass-panel rounded-2xl overflow-hidden transition-colors', expanded && 'border-primary/30')}>
            <button onClick={onToggle} aria-expanded={expanded} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                <div className="min-w-0 flex-1">
                    <div className="font-bold truncate">{name}</div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-2">
                        <span className={cn('font-bold', style.tone)}>{style.label}</span>
                        {profile.bluffer && <span className="text-accent font-bold">· farolea</span>}
                        <span>· {profile.hands} mano{profile.hands === 1 ? '' : 's'}</span>
                    </div>
                </div>
                <span className="flex gap-0.5" title={CONFIDENCE_LABEL[profile.confidence]} aria-label={`Confianza: ${CONFIDENCE_LABEL[profile.confidence]}`}>
                    {[1, 2, 3].map(i => (
                        <span key={i} className={cn('w-1.5 h-3 rounded-full', i <= CONFIDENCE_DOTS[profile.confidence] ? 'bg-primary' : 'bg-white/10')} />
                    ))}
                </span>
                <ChevronDown className={cn('w-4 h-4 text-gray-500 transition-transform', expanded && 'rotate-180')} />
            </button>

            {expanded && (
                <div className="px-4 pb-4 space-y-4">
                    <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-1.5">¿Qué hizo antes del flop?</div>
                        <div className="grid grid-cols-4 gap-1.5">
                            {(Object.keys(OBSERVATION_INFO) as Observation[]).map(obs => (
                                <button
                                    key={obs}
                                    onClick={() => record(obs)}
                                    title={OBSERVATION_INFO[obs].hint}
                                    className={cn('h-14 rounded-xl border bg-white/[0.03] text-xs font-black flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all', OBS_TONE[obs], flash === obs && 'bg-white/15 scale-95')}
                                >
                                    {OBSERVATION_INFO[obs].label}
                                    <span className="text-[10px] font-mono font-normal text-gray-500">{note.counts[obs]}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {profile.hands > 0 && (
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <Stat label="Juega" value={pct(profile.vpip)} hint="de las manos" />
                            <Stat label="Sube" value={pct(profile.pfr)} hint="de las manos" />
                            <Stat label="Resube" value={pct(profile.threebet)} hint="de las manos" />
                        </div>
                    )}

                    <p className="text-xs text-gray-400">
                        {style.description}
                        {profile.confidence === 'low' && profile.hands > 0 && ' (Todavía son pocas manos: tomalo como una pista.)'}
                    </p>

                    <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-1.5">O marcalo directo</div>
                        <div className="flex flex-wrap gap-1.5">
                            {(Object.keys(TAG_INFO) as RivalTag[]).map(tag => {
                                const active = note.tags.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        onClick={() => rivals.toggle(name, tag)}
                                        aria-pressed={active}
                                        title={TAG_INFO[tag].hint}
                                        className={cn('h-8 px-3 rounded-full text-xs font-bold border transition-colors', active ? 'bg-primary text-black border-primary' : 'border-white/10 text-gray-300 hover:border-white/25')}
                                    >
                                        {TAG_INFO[tag].label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <button onClick={() => rivals.undo(name)} disabled={note.history.length === 0} className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1.5 disabled:opacity-30">
                            <Undo2 className="w-3.5 h-3.5" /> Deshacer último
                        </button>
                        {removable && (
                            <button onClick={() => rivals.remove(name)} className="text-xs font-bold text-accent/80 hover:text-accent flex items-center gap-1.5">
                                <Trash2 className="w-3.5 h-3.5" /> Borrar notas
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const Stat: React.FC<{ label: string; value: string; hint: string }> = ({ label, value, hint }) => (
    <div className="rounded-xl bg-black/25 border border-white/5 py-2">
        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{label}</div>
        <div className="font-mono font-black text-lg">{value}</div>
        <div className="text-[9px] text-gray-600">{hint}</div>
    </div>
);
