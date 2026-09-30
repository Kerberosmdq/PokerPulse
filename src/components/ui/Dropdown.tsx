import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/cn';

interface DropdownProps {
    trigger: (props: { open: boolean; toggle: () => void }) => React.ReactNode;
    children: (close: () => void) => React.ReactNode;
    align?: 'left' | 'right';
    className?: string;
}

/** Menú desplegable: se cierra con clic afuera o Esc. */
export const Dropdown: React.FC<DropdownProps> = ({ trigger, children, align = 'right', className }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    return (
        <div ref={ref} className="relative">
            {trigger({ open, toggle: () => setOpen(o => !o) })}
            {open && (
                <div
                    role="menu"
                    className={cn(
                        'absolute top-full mt-2 z-40 bg-surface border border-white/10 rounded-xl shadow-2xl p-2 min-w-56',
                        align === 'right' ? 'right-0' : 'left-0',
                        className
                    )}
                >
                    {children(() => setOpen(false))}
                </div>
            )}
        </div>
    );
};

export const MenuItem: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: React.ReactNode; danger?: boolean; hint?: string }> = ({ icon, danger, hint, className, children, ...props }) => (
    <button
        role="menuitem"
        type="button"
        className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-left transition-colors',
            danger ? 'text-accent hover:bg-accent/10' : 'text-gray-200 hover:bg-white/5',
            className
        )}
        {...props}
    >
        {icon && <span className="w-4 h-4 shrink-0 flex items-center justify-center opacity-80">{icon}</span>}
        <span className="flex-1">{children}</span>
        {hint && <kbd className="text-[10px] font-mono text-gray-500 border border-white/10 rounded px-1.5">{hint}</kbd>}
    </button>
);

export const MenuLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 pt-2 pb-1">{children}</div>
);
