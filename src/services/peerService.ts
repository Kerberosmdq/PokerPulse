import Peer, { type DataConnection } from 'peerjs';
import { useGameStore } from '../store/gameStore';

// Define the shape of data sent between peers
export interface RemoteAction {
    action: 'PAUSE' | 'PLAY' | 'REBUY' | 'BUST' | 'NEXT_LEVEL' | 'PREV_LEVEL';
    payload?: any;
}

class PeerService {
    private peer: Peer | null = null;
    private connections: DataConnection[] = [];

    initialize(onId: (id: string) => void) {
        // Clean up existing peer if any
        if (this.peer) {
            this.peer.destroy();
        }

        this.peer = new Peer();

        this.peer.on('open', (id) => {
            console.log('My peer ID is: ' + id);
            onId(id);
        });

        this.peer.on('connection', (conn) => {
            console.log('Incoming connection', conn);
            this.connections.push(conn);

            conn.on('data', (data: any) => {
                console.log('Received data', data);
                this.handleRemoteAction(data);
            });

            conn.on('close', () => {
                this.connections = this.connections.filter(c => c !== conn);
            });
        });

        this.peer.on('error', (err) => {
            console.error('PeerJS error:', err);
        });
    }

    connectToHost(hostId: string, onConnect?: () => void) {
        if (this.peer) {
            this.peer.destroy();
        }

        this.peer = new Peer();
        this.peer.on('open', () => {
            const conn = this.peer!.connect(hostId);
            conn.on('open', () => {
                console.log('Connected to host');
                this.connections.push(conn);
                if (onConnect) onConnect();
            });

            conn.on('error', (err) => {
                console.error('Connection error:', err);
            });
        });
    }

    sendAction(action: RemoteAction) {
        this.connections.forEach(conn => {
            if (conn.open) {
                conn.send(action);
            }
        });
    }

    private handleRemoteAction(data: RemoteAction) {
        const store = useGameStore.getState();

        switch (data.action) {
            case 'PAUSE':
                store.pauseTimer();
                break;
            case 'PLAY':
                store.startTimer();
                break;
            case 'REBUY':
                if (data.payload?.playerId) {
                    store.rebuyPlayer(data.payload.playerId);
                }
                break;
            case 'BUST':
                if (data.payload?.playerId) {
                    store.bustPlayer(data.payload.playerId);
                }
                break;
            case 'NEXT_LEVEL':
                store.nextLevel();
                break;
            case 'PREV_LEVEL':
                store.prevLevel();
                break;
        }
    }

    destroy() {
        this.peer?.destroy();
        this.peer = null;
        this.connections = [];
    }
}

export const peerService = new PeerService();
