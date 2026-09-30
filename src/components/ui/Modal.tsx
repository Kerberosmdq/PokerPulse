import React, { useEffect, useId, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
    onClose: () => void;
    title?: React.ReactNode;
    icon?: React.ReactNode;
    description?: React.ReactNode;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    /** Borde de color superior */
    accent?: 'primary' | 'warning' | 'danger';
}

const SIZES = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-3xl',
};

const ACCENTS = {
    primary: 'from-primary to-secondary',
    warning: 'from-warning via-primary to-secondary',
    danger: 'from-accent to-accent/40',
};

/** Diálogo accesible: Esc y clic afuera cierran, foco atrapado y devuelto al cerrar. */
export const Modal: React.FC<ModalProps> = ({ onClose, title, icon, description, children, size = 'md', className, accent }) => {
    const titleId = useId();
    const panelRef = useRef<HTMLDivElement>(null);
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    });

    useEffect(() => {
        const previouslyFocused = document.activeElement as HTMLElement | null;
        const panel = panelRef.current;
        const focusables = () => panel?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        // Enfocar el primer control que no sea el botón de cerrar
        const first = [...(focusables() ?? [])].find(el => !el.dataset.modalClose);
        (first ?? panel)?.focus();

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onCloseRef.current();
            } else if (e.key === 'Tab') {
                const list = focusables();
                if (!list || list.length === 0) return;
                const firstEl = list[0];
                const lastEl = list[list.length - 1];
                if (e.shiftKey && document.activeElement === firstEl) {
                    e.preventDefault();
                    lastEl.focus();
                } else if (!e.shiftKey && document.activeElement === lastEl) {
                    e.preventDefault();
                    firstEl.focus();
                }
            }
        };
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('keydown', onKey);
            previouslyFocused?.focus?.();
        };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <motion.div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                tabIndex={-1}
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.18 }}
                className={cn(
                    'relative w-full bg-surface border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[calc(100dvh-2rem)] overflow-hidden focus:outline-none',
                    SIZES[size],
                    className
                )}
            >
                {accent && <div className={cn('absolute top-0 left-0 w-full h-1 bg-gradient-to-r', ACCENTS[accent])} />}

                {title && (
                    <div className="flex items-start gap-3 px-6 pt-6 pb-4">
                        {icon && <div className="shrink-0 mt-0.5">{icon}</div>}
                        <div className="flex-1 min-w-0">
                            <h2 id={titleId} className="text-lg font-black text-white tracking-tight">{title}</h2>
                            {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
                        </div>
                    </div>
                )}

                <button
                    type="button"
                    data-modal-close="true"
                    onClick={onClose}
                    aria-label="Cerrar"
                    className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className={cn('overflow-y-auto px-6 pb-6', !title && 'pt-6')}>{children}</div>
            </motion.div>
        </motion.div>
    );
};
