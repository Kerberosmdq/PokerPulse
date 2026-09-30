import { create } from 'zustand';

export type ToastTone = 'success' | 'info' | 'warning' | 'error';

export interface Toast {
    id: string;
    message: string;
    tone: ToastTone;
    action?: { label: string; onClick: () => void };
}

interface ToastStore {
    toasts: Toast[];
    push: (toast: Omit<Toast, 'id'>, durationMs?: number) => void;
    dismiss: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set, get) => ({
    toasts: [],
    push: (toast, durationMs = 4000) => {
        const id = crypto.randomUUID();
        // Máximo 3 visibles a la vez
        set({ toasts: [...get().toasts.slice(-2), { ...toast, id }] });
        setTimeout(() => get().dismiss(id), durationMs);
    },
    dismiss: (id) => set({ toasts: get().toasts.filter(t => t.id !== id) }),
}));

export const toast = {
    success: (message: string, action?: Toast['action']) => useToastStore.getState().push({ message, tone: 'success', action }, action ? 6000 : 3500),
    info: (message: string, action?: Toast['action']) => useToastStore.getState().push({ message, tone: 'info', action }, action ? 6000 : 3500),
    warning: (message: string, action?: Toast['action']) => useToastStore.getState().push({ message, tone: 'warning', action }, action ? 6000 : 4500),
    error: (message: string) => useToastStore.getState().push({ message, tone: 'error' }, 5000),
};
