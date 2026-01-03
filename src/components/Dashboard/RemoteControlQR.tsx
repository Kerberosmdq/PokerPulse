import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { peerService } from '../../services/peerService';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface RemoteControlQRProps {
    onClose: () => void;
}

export const RemoteControlQR: React.FC<RemoteControlQRProps> = ({ onClose }) => {
    const [peerId, setPeerId] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        peerService.initialize((id) => {
            setPeerId(id);
            setLoading(false);
        });

        // Cleanup handled by service or app unmount, but maybe we want to keep connection open?
        // For now, let's keep it simple.
    }, []);

    const remoteUrl = `${window.location.origin}/remote?id=${peerId}`;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
            <div className="bg-surface border border-surface-light p-8 rounded-lg max-w-sm w-full relative flex flex-col items-center gap-6">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </Button>

                <h2 className="text-2xl font-bold text-white">Control Remoto</h2>

                {loading ? (
                    <div className="w-48 h-48 flex items-center justify-center text-primary animate-pulse">
                        Generando ID...
                    </div>
                ) : (
                    <>
                        <div className="bg-white p-4 rounded-lg">
                            <QRCodeSVG value={remoteUrl} size={200} />
                        </div>
                        <p className="text-center text-gray-400 text-sm">
                            Escanea con tu teléfono para controlar el reloj y las re-entradas.
                        </p>
                        <div className="bg-surface-light p-2 rounded text-xs font-mono text-gray-500 break-all text-center">
                            {remoteUrl}
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
};
