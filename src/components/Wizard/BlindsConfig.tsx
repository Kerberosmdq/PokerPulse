import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Trash2, Plus } from 'lucide-react';
import type { BlindLevel } from '../../types';

export const BlindsConfig: React.FC = () => {
    const { blindsStructure, setBlindsStructure } = useGameStore();

    const handleUpdate = (id: string, field: keyof BlindLevel, value: number | string) => {
        const newBlinds = blindsStructure.map((level) =>
            level.id === id ? { ...level, [field]: value } : level
        );
        setBlindsStructure(newBlinds);
    };

    const handleAddLevel = (index: number) => {
        const prevLevel = blindsStructure[index - 1];
        const newLevel: BlindLevel = {
            id: crypto.randomUUID(),
            type: 'level',
            smallBlind: prevLevel ? prevLevel.smallBlind * 2 : 25,
            bigBlind: prevLevel ? prevLevel.bigBlind * 2 : 50,
            ante: prevLevel ? prevLevel.ante : 0,
            duration: prevLevel ? prevLevel.duration : 20,
        };
        const newStructure = [...blindsStructure];
        newStructure.splice(index, 0, newLevel);
        setBlindsStructure(newStructure);
    };

    const handleAddBreak = (index: number) => {
        const newBreak: BlindLevel = {
            id: crypto.randomUUID(),
            type: 'break',
            smallBlind: 0,
            bigBlind: 0,
            ante: 0,
            duration: 10,
        };
        const newStructure = [...blindsStructure];
        newStructure.splice(index, 0, newBreak);
        setBlindsStructure(newStructure);
    };

    const handleRemoveLevel = (id: string) => {
        setBlindsStructure(blindsStructure.filter((l) => l.id !== id));
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-primary">Estructura de Ciegas</h2>
                <div className="flex gap-2">
                    <Button onClick={() => handleAddBreak(blindsStructure.length)} size="sm" variant="secondary">
                        <Plus className="w-4 h-4 mr-2" /> Añadir Descanso
                    </Button>
                    <Button onClick={() => handleAddLevel(blindsStructure.length)} size="sm" variant="primary">
                        <Plus className="w-4 h-4 mr-2" /> Añadir Nivel
                    </Button>
                </div>
            </div>

            <div className="bg-surface-light rounded-lg overflow-hidden border border-white/10">
                <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-gray-400 uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3">#</th>
                            <th className="px-4 py-3">Tipo</th>
                            <th className="px-4 py-3">Duración (m)</th>
                            <th className="px-4 py-3">Ciega Pequeña</th>
                            <th className="px-4 py-3">Ciega Grande</th>
                            <th className="px-4 py-3">Ante</th>
                            <th className="px-4 py-3 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {blindsStructure.map((level, index) => (
                            <React.Fragment key={level.id}>
                                {/* Insertion Zone */}
                                <tr className="h-2 hover:bg-white/5 group relative">
                                    <td colSpan={7} className="p-0 h-2">
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                            <div className="flex gap-2 pointer-events-auto transform scale-75">
                                                <Button size="sm" variant="secondary" onClick={() => handleAddBreak(index)}>+ Descanso</Button>
                                                <Button size="sm" variant="primary" onClick={() => handleAddLevel(index)}>+ Nivel</Button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>

                                <tr className={`transition-colors ${level.type === 'break' ? 'bg-yellow-500/10 hover:bg-yellow-500/20' : 'hover:bg-white/5'}`}>
                                    <td className="px-4 py-3 font-mono text-gray-500">#{index + 1}</td>
                                    <td className="px-4 py-3 uppercase text-xs font-bold tracking-wider">
                                        {level.type === 'break' ? <span className="text-yellow-400">DESCANSO</span> : <span className="text-primary">NIVEL</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Input
                                            type="number"
                                            className="w-20 bg-black/20 border-white/10 focus:border-primary h-8"
                                            value={level.duration}
                                            onChange={(e) => handleUpdate(level.id, 'duration', parseInt(e.target.value) || 0)}
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        {level.type === 'level' && (
                                            <Input
                                                type="number"
                                                className="w-24 bg-black/20 border-white/10 focus:border-primary h-8"
                                                value={level.smallBlind}
                                                onChange={(e) => handleUpdate(level.id, 'smallBlind', parseInt(e.target.value) || 0)}
                                            />
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {level.type === 'level' && (
                                            <Input
                                                type="number"
                                                className="w-24 bg-black/20 border-white/10 focus:border-primary h-8"
                                                value={level.bigBlind}
                                                onChange={(e) => handleUpdate(level.id, 'bigBlind', parseInt(e.target.value) || 0)}
                                            />
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {level.type === 'level' && (
                                            <Input
                                                type="number"
                                                className="w-20 bg-black/20 border-white/10 focus:border-primary h-8"
                                                value={level.ante}
                                                onChange={(e) => handleUpdate(level.id, 'ante', parseInt(e.target.value) || 0)}
                                            />
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveLevel(level.id)}
                                            className="text-red-500 hover:text-red-400 hover:bg-red-900/20 h-8 w-8 p-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
