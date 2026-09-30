import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Smartphone, Loader2 } from 'lucide-react';
import { peerService } from '../../services/peerService';
import { toast } from '../../store/toastStore';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export const RemoteControlQR: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [peerId, setPeerId] = useState<string | null>(peerService.hostId);
    const [connected, setConnected] = useState(peerService.connectedCount);

    useEffect(() => {
        peerService.initializeHost(setPeerId);
        return peerService.onConnectionsChange(setConnected);
    }, []);

    // Misma ruta que la app (no /remote), así funciona en cualquier hosting estático
    const remoteUrl = peerId ? `${window.location.origin}${window.location.pathname}?id=${peerId}` : '';

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(remoteUrl);
            toast.success('Enlace copiado');
        } catch {
            toast.error('No se pudo copiar');
        }
    };

    return (
        <Modal onClose={onClose} size="sm" title="Control remoto" description="Manejá el reloj y los jugadores desde el celular." icon={<Smartphone className="w-5 h-5 text-primary" />} accent="primary">
            <div className="flex flex-col items-center gap-5">
                {!peerId ? (
                    <div className="w-[232px] h-[232px] flex flex-col items-center justify-center gap-3 text-primary">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-xs text-gray-400">Generando enlace…</span>
                    </div>
                ) : (
                    <>
                        <div className="bg-white p-4 rounded-xl">
                            <QRCodeSVG value={remoteUrl} size={200} />
                        </div>
                        <div className={`text-xs font-bold flex items-center gap-2 ${connected > 0 ? 'text-primary' : 'text-gray-500'}`}>
                            <span className={`w-2 h-2 rounded-full ${connected > 0 ? 'bg-primary animate-pulse' : 'bg-gray-600'}`} />
                            {connected > 0 ? `${connected} dispositivo(s) conectado(s)` : 'Esperando conexión…'}
                        </div>
                        <div className="w-full flex gap-2">
                            <div className="flex-1 min-w-0 bg-black/30 border border-white/5 px-3 py-2 rounded-lg text-[11px] font-mono text-gray-400 truncate" title={remoteUrl}>
                                {remoteUrl}
                            </div>
                            <Button variant="outline" size="icon" onClick={copy} aria-label="Copiar enlace"><Copy className="w-4 h-4" /></Button>
                        </div>
                        <p className="text-[11px] text-gray-500 text-center leading-relaxed">
                            El enlace se mantiene aunque recargues la página. Ambos dispositivos necesitan internet (la conexión es directa entre ellos).
                        </p>
                    </>
                )}
            </div>
        </Modal>
    );
};
