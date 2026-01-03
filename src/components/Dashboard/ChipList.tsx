import React from 'react';
import { useGameStore } from '../../store/gameStore';

export const ChipList: React.FC = () => {
    const { chipValues } = useGameStore();

    // Sort chips by value ascending
    const sortedChips = [...chipValues].sort((a, b) => a.value - b.value);

    return (
        <div className="grid grid-cols-2 gap-4">
            {sortedChips.map((chip, index) => (
                <div key={index} className="flex items-center gap-4 bg-surface-light/30 p-3 rounded-xl border border-white/5 group hover:bg-surface-light/50 transition-colors">
                    {/* Next Gen Chip Design */}
                    <div className="relative w-12 h-12 shadow-[0_4px_10px_rgba(0,0,0,0.5)] rounded-full transition-transform group-hover:scale-110 duration-300 shrink-0">
                        {/* Base Color & Edge Spots */}
                        <div
                            className="absolute inset-0 rounded-full border-[6px] border-dashed"
                            style={{
                                borderColor: chip.color === '#000000' ? '#333333' : chip.color,
                                backgroundColor: '#1a1a1a',
                                boxShadow: `inset 0 0 10px rgba(0,0,0,0.8), ${chip.color === '#000000' ? '0 0 5px rgba(255,255,255,0.2)' : 'none'}`
                            }}
                        />

                        {/* Inner Ring */}
                        <div className="absolute inset-[6px] rounded-full border-2 border-white/20 bg-gradient-to-br from-white/10 to-transparent" />

                        {/* Center Value */}
                        <div
                            className="absolute inset-[10px] rounded-full flex items-center justify-center"
                            style={{ backgroundColor: chip.color }}
                        >
                            <div className="w-[90%] h-[90%] rounded-full bg-[#1a1a1a] flex items-center justify-center border border-white/10">
                                <span className="text-[10px] font-black text-white tracking-tighter">
                                    {chip.value >= 1000 ? `${chip.value / 1000}k` : chip.value}
                                </span>
                            </div>
                        </div>

                        {/* Shine Effect */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent opacity-50 pointer-events-none" />
                    </div>

                    <div className="flex flex-col">
                        <span className="font-bold text-white text-xl font-mono tracking-wider drop-shadow-md">
                            {chip.value.toLocaleString()}
                        </span>
                        <div className="h-1 w-full rounded-full mt-1 opacity-50" style={{ backgroundColor: chip.color }} />
                    </div>
                </div>
            ))}
        </div>
    );
};
