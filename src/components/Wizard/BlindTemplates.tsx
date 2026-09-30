import React, { useState } from 'react';
import { Bookmark, Save, Trash2, Upload, Check } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { toast } from '../../store/toastStore';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import { formatChips, totalStructureMinutes } from '../../utils/tournament';

/** Guardar la estructura actual con un nombre y volver a cargarla en otro torneo. */
export const BlindTemplates: React.FC = () => {
    const templates = useGameStore(s => s.blindTemplates);
    const { saveBlindTemplate, loadBlindTemplate, deleteBlindTemplate } = useGameStore.getState();
    const [name, setName] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const exists = templates.some(t => t.name.toLowerCase() === name.trim().toLowerCase());

    const save = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        saveBlindTemplate(name);
        toast.success(exists ? `Estructura "${name.trim()}" actualizada` : `Estructura "${name.trim()}" guardada`);
        setName('');
    };

    return (
        <div className="bg-black/20 border border-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Bookmark className="w-4 h-4 text-secondary" /> Mis estructuras
            </div>

            {templates.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {[...templates].sort((a, b) => b.createdAt - a.createdAt).map(t => {
                        const levels = t.levels.filter(l => l.type === 'level');
                        const minutes = totalStructureMinutes(t.levels);
                        return (
                            <div key={t.id} className="flex items-center gap-1 pl-3 pr-1 py-1 rounded-xl bg-white/[0.04] border border-white/10">
                                <div className="mr-1">
                                    <div className="text-sm font-bold text-white leading-tight">{t.name}</div>
                                    <div className="text-[10px] text-gray-500 font-mono">
                                        {levels.length} niv · {Math.floor(minutes / 60)}h{String(minutes % 60).padStart(2, '0')} · {levels[0] ? `${formatChips(levels[0].smallBlind)}/${formatChips(levels[0].bigBlind)}` : ''}
                                    </div>
                                </div>
                                <button
                                    onClick={() => { loadBlindTemplate(t.id); toast.success(`Cargada: ${t.name}`); }}
                                    title="Cargar esta estructura"
                                    aria-label={`Cargar ${t.name}`}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10"
                                >
                                    <Upload className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirmDelete === t.id) {
                                            deleteBlindTemplate(t.id);
                                            setConfirmDelete(null);
                                        } else {
                                            setConfirmDelete(t.id);
                                        }
                                    }}
                                    onBlur={() => setConfirmDelete(null)}
                                    title={confirmDelete === t.id ? 'Tocá de nuevo para borrar' : 'Borrar'}
                                    aria-label={confirmDelete === t.id ? `Confirmar borrar ${t.name}` : `Borrar ${t.name}`}
                                    className={cn('h-8 rounded-lg flex items-center justify-center transition-all', confirmDelete === t.id ? 'px-2 bg-accent text-white text-[10px] font-bold gap-1' : 'w-8 text-gray-500 hover:text-accent hover:bg-accent/10')}
                                >
                                    {confirmDelete === t.id ? <><Check className="w-3.5 h-3.5" /> Borrar</> : <Trash2 className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-xs text-gray-500">Guardá esta estructura para reutilizarla en los próximos torneos.</p>
            )}

            <form onSubmit={save} className="flex gap-2">
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre (ej: Turbo del viernes)"
                    maxLength={30}
                    aria-label="Nombre de la estructura"
                    className="flex-1 min-w-0 h-9 rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/60"
                />
                <Button type="submit" size="sm" variant="outline" disabled={!name.trim()}>
                    <Save className="w-3.5 h-3.5" /> {exists ? 'Reemplazar' : 'Guardar'}
                </Button>
            </form>
        </div>
    );
};
