import React, { useState } from 'react';
import { cn } from '../../utils/cn';

interface NumberFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'min' | 'max' | 'type'> {
    value: number;
    onValueChange: (value: number) => void;
    min?: number;
    max?: number;
    prefix?: string;
}

/**
 * Campo numérico que deja escribir libremente: solo propaga valores válidos mientras se tipea y
 * recién al salir del campo ajusta al mínimo/máximo. (Antes, clampear en cada tecla hacía
 * imposible escribir, p. ej., "120" en un campo con mínimo 20.)
 */
export const NumberField: React.FC<NumberFieldProps> = ({ value, onValueChange, min = 0, max = Number.MAX_SAFE_INTEGER, prefix, className, onBlur, onKeyDown, ...props }) => {
    const [draft, setDraft] = useState<string | null>(null);

    const commit = () => {
        if (draft === null) return;
        const parsed = parseInt(draft, 10);
        const next = Number.isNaN(parsed) ? min : Math.min(max, Math.max(min, parsed));
        if (next !== value) onValueChange(next);
        setDraft(null);
    };

    const input = (
        <input
            {...props}
            type="text"
            inputMode="numeric"
            value={draft ?? String(value)}
            onChange={(e) => {
                const raw = e.target.value.replace(/[^\d]/g, '');
                setDraft(raw);
                const parsed = parseInt(raw, 10);
                if (!Number.isNaN(parsed) && parsed >= min && parsed <= max) onValueChange(parsed);
            }}
            onFocus={(e) => e.target.select()}
            onBlur={(e) => { commit(); onBlur?.(e); }}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); onKeyDown?.(e); }}
            className={cn(
                'h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white font-mono tabular placeholder:text-gray-600 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-colors',
                prefix && 'pl-7',
                className
            )}
        />
    );

    if (!prefix) return input;
    return (
        <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">{prefix}</span>
            {input}
        </div>
    );
};
