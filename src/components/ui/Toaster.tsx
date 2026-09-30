import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { useToastStore, type ToastTone } from '../../store/toastStore';

const TONES: Record<ToastTone, { icon: React.ElementType; className: string }> = {
    success: { icon: CheckCircle2, className: 'text-primary' },
    info: { icon: Info, className: 'text-secondary' },
    warning: { icon: AlertTriangle, className: 'text-warning' },
    error: { icon: XCircle, className: 'text-accent' },
};

export const Toaster: React.FC = () => {
    const { toasts, dismiss } = useToastStore();

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 w-[calc(100%-2rem)] max-w-md pointer-events-none" aria-live="polite">
            <AnimatePresence initial={false}>
                {toasts.map((t) => {
                    const { icon: Icon, className } = TONES[t.tone];
                    return (
                        <motion.div
                            key={t.id}
                            layout
                            initial={{ opacity: 0, y: 16, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.96 }}
                            className="pointer-events-auto w-full flex items-center gap-3 bg-surface-light/95 backdrop-blur border border-white/10 rounded-xl px-4 py-3 shadow-2xl"
                        >
                            <Icon className={`w-4 h-4 shrink-0 ${className}`} />
                            <span className="text-sm text-gray-100 flex-1">{t.message}</span>
                            {t.action && (
                                <button
                                    onClick={() => { t.action!.onClick(); dismiss(t.id); }}
                                    className="text-xs font-black uppercase tracking-wider text-primary hover:underline shrink-0"
                                >
                                    {t.action.label}
                                </button>
                            )}
                            <button onClick={() => dismiss(t.id)} aria-label="Cerrar aviso" className="text-gray-500 hover:text-white shrink-0">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
