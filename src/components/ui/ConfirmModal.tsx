import React from 'react';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmModalProps {
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    isDestructive = false,
    onConfirm,
    onCancel,
}) => (
    <Modal
        onClose={onCancel}
        size="sm"
        title={title}
        accent={isDestructive ? 'danger' : 'primary'}
        icon={isDestructive ? <AlertTriangle className="w-5 h-5 text-accent" /> : undefined}
    >
        <p className="text-sm text-gray-300 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end mt-6">
            <Button variant="ghost" size="sm" onClick={onCancel}>
                {cancelText}
            </Button>
            <Button variant={isDestructive ? 'danger' : 'primary'} size="sm" onClick={onConfirm}>
                {confirmText}
            </Button>
        </div>
    </Modal>
);
