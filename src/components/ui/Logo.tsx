import React, { useId } from 'react';
import { cn } from '../../utils/cn';

/** Isotipo de NexPulse (hexágono + pica + pulso), vectorial y con fondo transparente. */
export const Logo: React.FC<{ className?: string }> = ({ className }) => {
    const gradientId = useId();
    return (
        <svg viewBox="0 0 100 100" fill="none" className={cn('drop-shadow-[0_0_12px_rgba(255,61,100,0.35)]', className)} aria-hidden="true">
            <defs>
                <linearGradient id={gradientId} x1="15" y1="10" x2="85" y2="90" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#ff3d64" />
                    <stop offset="1" stopColor="#a3123e" />
                </linearGradient>
            </defs>
            <g stroke={`url(#${gradientId})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 45.5V32L50 14L81 32V45.5M81 54.5V68L50 86L19 68V54.5" />
                <circle cx="19" cy="50" r="4.5" />
                <circle cx="81" cy="50" r="4.5" />
                <path d="M56 38.5L50.5 32C44 39.5 35.5 45 35.5 53.5C35.5 58.5 39.5 62 44 62C46.5 62 48.5 60.5 49.5 58.5C48.5 63 46.5 66 44.5 68H56.5C54.5 66 52 63 51 58.5" />
                <path d="M53 58.5C55 60.5 58 61 61 59.5" />
                <path d="M42 50H49L52.5 43.5L56 55L59.5 36L64 63L67.5 50H74" />
            </g>
        </svg>
    );
};

export const BrandMark: React.FC<{ className?: string; subtitle?: string }> = ({ className, subtitle }) => (
    <div className={cn('flex items-center gap-2.5 shrink-0', className)}>
        <Logo className="w-10 h-10" />
        <div className="leading-none">
            <span className="block font-black text-xl tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">NEXPULSE</span>
            {subtitle && <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mt-1 truncate max-w-[220px]">{subtitle}</span>}
        </div>
    </div>
);
