import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Trash2, Plus } from 'lucide-react';
import type { ChipValue } from '../../types';

export const ChipsConfig: React.FC = () => {
    const { chipValues, setChipValues } = useGameStore();

    const handleUpdate = (index: number, field: keyof ChipValue, value: string | number) => {
        const newChips = chipValues.map((chip, i) =>
            i === index ? { ...chip, [field]: value } : chip
        );
        setChipValues(newChips);
    };

    const handleAddChip = () => {
        setChipValues([...chipValues, { color: '#ffffff', value: 0 }]);
    };

    const handleRemoveChip = (index: number) => {
        setChipValues(chipValues.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-primary">Valores de Fichas</h2>
                <Button onClick={handleAddChip} size="sm" variant="secondary">
                    <Plus className="w-4 h-4 mr-2" /> Añadir Ficha
                </Button>
            </div>

            <div className="bg-surface-light rounded-lg overflow-hidden border border-white/10">
                <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-gray-400 uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3">Color</th>
                            <th className="px-4 py-3">Valor</th>
                            <th className="px-4 py-3 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {chipValues.map((chip, index) => (
                            <tr key={index} className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="relative w-10 h-10 shadow-[0_2px_5px_rgba(0,0,0,0.5)] rounded-full">
                                        {/* Base Color & Edge Spots */}
                                        <div
                                            className="absolute inset-0 rounded-full border-[4px] border-dashed"
                                            style={{
                                                borderColor: chip.color === '#000000' ? '#333333' : chip.color,
                                                backgroundColor: '#1a1a1a',
                                                boxShadow: `inset 0 0 8px rgba(0,0,0,0.8), ${chip.color === '#000000' ? '0 0 5px rgba(255,255,255,0.2)' : 'none'}`
                                            }}
                                        />

                                        {/* Inner Ring */}
                                        <div className="absolute inset-[4px] rounded-full border border-white/20 bg-gradient-to-br from-white/10 to-transparent" />

                                        {/* Center Value */}
                                        <div
                                            className="absolute inset-[8px] rounded-full flex items-center justify-center"
                                            style={{ backgroundColor: chip.color }}
                                        >
                                            <div className="w-[90%] h-[90%] rounded-full bg-[#1a1a1a] flex items-center justify-center border border-white/10">
                                                <span className="text-[8px] font-black text-white tracking-tighter">
                                                    {chip.value >= 1000 ? `${chip.value / 1000}k` : chip.value}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Shine Effect */}
                                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent opacity-50 pointer-events-none" />
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <Input
                                        type="number"
                                        className="w-32 bg-black/20 border-white/10 focus:border-primary h-8"
                                        value={chip.value}
                                        onChange={(e) => handleUpdate(index, 'value', parseInt(e.target.value) || 0)}
                                    />
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveChip(index)}
                                        className="text-red-500 hover:text-red-400 hover:bg-red-900/20 h-8 w-8 p-0"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
