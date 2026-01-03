import React, { useEffect, useState } from 'react';
import { peerService } from '../../services/peerService';

import { Button } from '../ui/Button';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';


export const RemoteClient: React.FC = () => {
    const [connected, setConnected] = useState(false);
    const [status, setStatus] = useState('Conectando...');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const hostId = params.get('id');

        if (!hostId) {
            setStatus('ID de anfitrión no proporcionado.');
            return;
        }

        peerService.connectToHost(hostId, () => {
            setConnected(true);
            setStatus('Conectado al Anfitrión');
        });

        return () => {
            peerService.destroy();
        };
    }, []);

    const sendAction = (action: any) => {
        peerService.sendAction(action);
    };

    if (!connected) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p>{status}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6 flex flex-col gap-8">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-primary">Control Remoto PokerPulse</h1>
                <div className="text-xs text-green-500 flex items-center justify-center gap-2 mt-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Conectado
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Button
                    onClick={() => sendAction({ action: 'PAUSE' })}
                    variant="secondary"
                    className="h-24 text-xl flex flex-col gap-2"
                >
                    <Pause className="w-8 h-8" /> Pausar
                </Button>
                <Button
                    onClick={() => sendAction({ action: 'PLAY' })}
                    className="h-24 text-xl flex flex-col gap-2 bg-primary text-black"
                >
                    <Play className="w-8 h-8" /> Iniciar
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => sendAction({ action: 'PREV_LEVEL' })} variant="ghost" className="h-16 border border-surface-light">
                    <SkipBack className="w-6 h-6 mr-2" /> Nivel Ant.
                </Button>
                <Button onClick={() => sendAction({ action: 'NEXT_LEVEL' })} variant="ghost" className="h-16 border border-surface-light">
                    Nivel Sig. <SkipForward className="w-6 h-6 ml-2" />
                </Button>
            </div>

            <div className="bg-surface p-4 rounded-lg border border-surface-light mt-auto">
                <h3 className="text-gray-400 font-bold mb-4 uppercase text-xs tracking-widest text-center">Acciones de Jugador</h3>
                <p className="text-center text-gray-500 text-sm">
                    La selección de jugadores para Re-entrada/Eliminación no está disponible en remoto.
                    <br />
                    (Requiere sincronización de la lista de jugadores)
                </p>
            </div>
        </div>
    );
};
