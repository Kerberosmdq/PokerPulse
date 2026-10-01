import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Smartphone, Loader2, Users, ShieldCheck } from 'lucide-react';
import { peerService } from '../../services/peerService';
import { toast } from '../../store/toastStore';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import { organizerLink, playerLink } from '../../utils/links';

type Audience = 'players' | 'admin';

export const RemoteControlQR: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [peerId, setPeerId] = useState<string | null>(peerService.hostId);
    const [counts, setCounts] = useState(peerService.connectionCounts);
    const [audience, setAudience] = useState<Audience>('players');

    useEffect(() => {
        peerService.initializeHost(setPeerId);
        return peerService.onConnectionsChange(() => setCounts(peerService.connectionCounts));
    }, []);

    const url = !peerId ? '' : audience === 'admin' ? organizerLink(peerId, peerService.adminKey) : playerLink(peerId);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            toast.success(audience === 'admin' ? 'Enlace del organizador copiado (no lo compartas)' : 'Enlace para jugadores copiado');
        } catch {
            toast.error('No se pudo copiar');
        }
    };

    return (
        <Modal onClose={onClose} size="sm" title="Conectar celulares" description="Cada uno escanea el QR con la cámara del celular." icon={<Smartphone className="w-5 h-5 text-primary" />} accent="primary">
            <div className="flex flex-col items-center gap-4">
                <div className="w-full grid grid-cols-2 gap-1 bg-black/30 p-1 rounded-xl border border-white/5" role="tablist">
                    {([['players', 'Jugadores', Users], ['admin', 'Organizador', ShieldCheck]] as const).map(([id, label, Icon]) => (
                        <button
                            key={id}
                            role="tab"
                            aria-selected={audience === id}
                            onClick={() => setAudience(id)}
                            className={cn('h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors', audience === id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white')}
                        >
                            <Icon className="w-3.5 h-3.5" /> {label}
                        </button>
                    ))}
                </div>

                <p className="text-xs text-gray-400 text-center leading-relaxed min-h-[2.5rem]">
                    {audience === 'players'
                        ? 'Para que cada jugador vea el reloj, las ciegas, sus fichas y use el asistente de manos. Solo pueden mirar: no tocan el torneo.'
                        : 'Control completo desde tu celular: reloj, re-entradas y eliminaciones. Lleva una clave: no lo compartas.'}
                </p>

                {!peerId ? (
                    <div className="w-[232px] h-[232px] flex flex-col items-center justify-center gap-3 text-primary">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-xs text-gray-400">Generando enlace…</span>
                    </div>
                ) : (
                    <>
                        <div className={cn('bg-white p-4 rounded-xl', audience === 'admin' && 'ring-4 ring-warning/60')}>
                            <QRCodeSVG value={url} size={200} />
                        </div>
                        <div className="text-xs font-bold flex items-center gap-3 text-gray-400">
                            <span className="flex items-center gap-1.5">
                                <span className={cn('w-2 h-2 rounded-full', counts.players > 0 ? 'bg-primary animate-pulse' : 'bg-gray-600')} />
                                {counts.players} jugador{counts.players === 1 ? '' : 'es'}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className={cn('w-2 h-2 rounded-full', counts.admins > 0 ? 'bg-warning animate-pulse' : 'bg-gray-600')} />
                                {counts.admins} organizador{counts.admins === 1 ? '' : 'es'}
                            </span>
                        </div>
                        <div className="w-full flex gap-2">
                            <div className="flex-1 min-w-0 bg-black/30 border border-white/5 px-3 py-2 rounded-lg text-[11px] font-mono text-gray-400 truncate" title={audience === 'admin' ? undefined : url}>
                                {audience === 'admin' ? url.replace(/#clave=.*/, '#clave=••••••') : url}
                            </div>
                            <Button variant="outline" size="icon" onClick={copy} aria-label="Copiar enlace"><Copy className="w-4 h-4" /></Button>
                        </div>
                        <p className="text-[11px] text-gray-500 text-center leading-relaxed">
                            Los enlaces siguen funcionando aunque recargues la página. Los celulares necesitan internet.
                        </p>
                    </>
                )}
            </div>
        </Modal>
    );
};
