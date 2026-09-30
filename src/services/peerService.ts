import Peer, { type DataConnection } from 'peerjs';
import { useGameStore } from '../store/gameStore';
import { toast } from '../store/toastStore';
import type { BlindLevel, PokerGameStore, Player, ThemeId, TournamentSettings } from '../types';
import { getAddonStatus, getPoolBreakdown, getRebuyStatus } from '../utils/rules';

/** Estado que el anfitrión comparte con los controles remotos. */
export interface RemoteSnapshot {
    players: Pick<Player, 'id' | 'name' | 'chips' | 'status' | 'rebuys' | 'addons' | 'bountiesWon'>[];
    blindsStructure: BlindLevel[];
    currentLevelIndex: number;
    timerSecondsRemaining: number;
    isPaused: boolean;
    prizePool: number;
    gameState: PokerGameStore['gameState'];
    rebuyAmount: number;
    addonAmount: number;
    tournamentName: string;
    theme: ThemeId;
    /** Premios a repartir (sin bounties ni comisión) */
    prizeNet: number;
    bountyAmount: number;
    rules: Pick<TournamentSettings, 'rebuyUntilLevel' | 'maxRebuys' | 'addonUntilLevel' | 'maxAddons'>;
}

export type RemoteAction =
    | { action: 'PAUSE' | 'PLAY' | 'NEXT_LEVEL' | 'PREV_LEVEL' }
    | { action: 'ADJUST_TIMER'; payload: { seconds: number } }
    | { action: 'REBUY' | 'ADDON' | 'AWAY'; payload: { playerId: string } }
    | { action: 'BUST'; payload: { playerId: string; eliminatorId?: string } }
    | { action: 'STATE_UPDATE'; payload: RemoteSnapshot };

export type RemoteStatus = 'connecting' | 'connected' | 'reconnecting' | 'failed';

const HOST_ID_KEY = 'nexpulse-host-id';
const KEEPALIVE_MS = 4000;
const STALE_MS = 12000;
const MAX_RETRIES = 8;

const randomHostId = () => `nexpulse-${crypto.randomUUID().slice(0, 8)}`;

const snapshot = (s: PokerGameStore): RemoteSnapshot => ({
    players: s.players.map(({ id, name, chips, status, rebuys, addons, bountiesWon }) => ({ id, name, chips, status, rebuys, addons, bountiesWon })),
    blindsStructure: s.blindsStructure,
    currentLevelIndex: s.currentLevelIndex,
    timerSecondsRemaining: s.timerSecondsRemaining,
    isPaused: s.isPaused,
    prizePool: s.prizePool,
    gameState: s.gameState,
    rebuyAmount: s.rebuyAmount,
    addonAmount: s.addonAmount,
    tournamentName: s.tournamentName,
    theme: s.theme,
    prizeNet: getPoolBreakdown(s).net,
    bountyAmount: s.bountyAmount,
    rules: { rebuyUntilLevel: s.rebuyUntilLevel, maxRebuys: s.maxRebuys, addonUntilLevel: s.addonUntilLevel, maxAddons: s.maxAddons },
});

class PeerService {
    private peer: Peer | null = null;
    private connections: DataConnection[] = [];
    private storeUnsubscribe: (() => void) | null = null;
    private keepalive: ReturnType<typeof setInterval> | null = null;
    private lastSent = '';
    private hostIdListeners: ((id: string) => void)[] = [];
    private connectionListeners: ((count: number) => void)[] = [];

    // ================= Anfitrión =================

    /** Hay un ID guardado: el control remoto ya se usó en este dispositivo. */
    hasHostHistory() {
        return !!localStorage.getItem(HOST_ID_KEY);
    }

    get hostId() {
        return this.peer?.open ? this.peer.id : null;
    }

    get connectedCount() {
        return this.connections.filter(c => c.open).length;
    }

    onConnectionsChange(listener: (count: number) => void) {
        this.connectionListeners.push(listener);
        return () => { this.connectionListeners = this.connectionListeners.filter(l => l !== listener); };
    }

    /**
     * Registra al anfitrión en el servidor de señalización con un ID estable, para que los
     * teléfonos puedan reconectarse aunque se recargue la página.
     */
    initializeHost(onId: (id: string) => void) {
        if (this.peer?.open) {
            onId(this.peer.id);
            return;
        }
        this.hostIdListeners.push(onId);
        if (this.peer) return; // Ya se está conectando

        const id = localStorage.getItem(HOST_ID_KEY) ?? randomHostId();
        this.createHostPeer(id);

        if (!this.storeUnsubscribe) {
            this.storeUnsubscribe = useGameStore.subscribe((state) => this.broadcastState(state));
            this.keepalive = setInterval(() => this.broadcastState(useGameStore.getState(), true), KEEPALIVE_MS);
        }
    }

    private createHostPeer(id: string) {
        const peer = new Peer(id);
        this.peer = peer;

        peer.on('open', (openId) => {
            localStorage.setItem(HOST_ID_KEY, openId);
            this.hostIdListeners.forEach(l => l(openId));
            this.hostIdListeners = [];
        });

        peer.on('connection', (conn) => {
            conn.on('open', () => {
                this.connections.push(conn);
                this.notifyConnections();
                conn.send({ action: 'STATE_UPDATE', payload: snapshot(useGameStore.getState()) } satisfies RemoteAction);
                toast.info('📱 Control remoto conectado');
            });
            conn.on('data', (data) => this.handleRemoteAction(data as RemoteAction));
            conn.on('close', () => this.dropConnection(conn));
            conn.on('error', () => this.dropConnection(conn));
        });

        // Se cayó la conexión con el servidor de señalización (red, suspensión): reintentar
        peer.on('disconnected', () => {
            setTimeout(() => { if (!peer.destroyed && peer.disconnected) peer.reconnect(); }, 2000);
        });

        peer.on('error', (err) => {
            if (err.type === 'unavailable-id') {
                // El ID está tomado (otra pestaña abierta con el torneo): usar uno nuevo
                peer.destroy();
                this.createHostPeer(randomHostId());
            } else {
                console.error('PeerJS error:', err);
            }
        });
    }

    private dropConnection(conn: DataConnection) {
        const before = this.connections.length;
        this.connections = this.connections.filter(c => c !== conn);
        if (this.connections.length !== before) this.notifyConnections();
    }

    private notifyConnections() {
        const count = this.connectedCount;
        this.connectionListeners.forEach(l => l(count));
    }

    private broadcastState(state: PokerGameStore, force = false) {
        if (this.connections.length === 0) return;
        const payload = snapshot(state);
        const key = JSON.stringify(payload);
        // Muchos cambios del store (log, config) no afectan al remoto: no reenviar lo mismo
        if (!force && key === this.lastSent) return;
        this.lastSent = key;
        this.connections.forEach(conn => {
            if (conn.open) conn.send({ action: 'STATE_UPDATE', payload } satisfies RemoteAction);
        });
    }

    private handleRemoteAction(data: RemoteAction) {
        const store = useGameStore.getState();
        // Los mensajes llegan de otro dispositivo: validar antes de usar
        const findPlayer = (id: string | undefined) => (id ? store.players.find(p => p.id === id) : undefined);

        switch (data.action) {
            case 'PAUSE':
                store.pauseTimer();
                break;
            case 'PLAY':
                store.startTimer();
                break;
            case 'NEXT_LEVEL':
                store.nextLevel();
                break;
            case 'PREV_LEVEL':
                store.prevLevel();
                break;
            case 'ADJUST_TIMER':
                if (typeof data.payload?.seconds === 'number') store.adjustTimer(data.payload.seconds);
                break;
            case 'REBUY': {
                const player = findPlayer(data.payload?.playerId);
                if (!player) break;
                // Las reglas se validan en el anfitrión: el remoto no puede saltearlas
                const status = getRebuyStatus(store, store.blindsStructure, store.currentLevelIndex, player);
                if (!status.allowed) {
                    toast.warning(`📱 Re-entrada rechazada: ${status.reason}`);
                } else {
                    store.rebuyPlayer(player.id);
                    toast.success(`📱 Re-entrada de ${player.name}`);
                }
                break;
            }
            case 'ADDON': {
                const player = findPlayer(data.payload?.playerId);
                if (!player) break;
                const status = getAddonStatus(store, store.blindsStructure, store.currentLevelIndex, player);
                if (!status.allowed) {
                    toast.warning(`📱 Add-on rechazado: ${status.reason}`);
                } else {
                    store.addonPlayer(player.id);
                    toast.success(`📱 Add-on de ${player.name}`);
                }
                break;
            }
            case 'BUST': {
                const player = findPlayer(data.payload?.playerId);
                if (player && player.status !== 'busted') {
                    const chips = player.chips;
                    store.bustPlayer(player.id, findPlayer(data.payload?.eliminatorId)?.id);
                    toast.warning(`📱 ${player.name} quedó afuera`, { label: 'Deshacer', onClick: () => store.restorePlayer(player.id, chips) });
                }
                break;
            }
            case 'AWAY':
                if (findPlayer(data.payload?.playerId)) store.toggleAway(data.payload.playerId);
                break;
        }
    }

    // ================= Control remoto (cliente) =================

    private clientState: {
        hostId: string;
        onStatus: (s: RemoteStatus) => void;
        onState: (s: RemoteSnapshot) => void;
        retries: number;
        lastMessageAt: number;
        retryTimer?: ReturnType<typeof setTimeout>;
        watchdog?: ReturnType<typeof setInterval>;
    } | null = null;

    connectToHost(hostId: string, onStatus: (s: RemoteStatus) => void, onState: (s: RemoteSnapshot) => void) {
        this.disconnectClient();
        this.clientState = { hostId, onStatus, onState, retries: 0, lastMessageAt: Date.now() };
        onStatus('connecting');
        this.openClientConnection();

        // Si el anfitrión deja de enviar (el keepalive llega cada 4 s), reconectar
        this.clientState.watchdog = setInterval(() => {
            const cs = this.clientState;
            if (cs && this.connections.length > 0 && Date.now() - cs.lastMessageAt > STALE_MS) {
                this.scheduleClientRetry();
            }
        }, 3000);
    }

    retryClient() {
        if (!this.clientState) return;
        this.clientState.retries = 0;
        this.clientState.onStatus('connecting');
        this.openClientConnection();
    }

    private openClientConnection() {
        const cs = this.clientState;
        if (!cs) return;
        this.peer?.destroy();
        this.connections = [];

        const peer = new Peer();
        this.peer = peer;

        peer.on('open', () => {
            const conn = peer.connect(cs.hostId, { reliable: true });
            conn.on('open', () => {
                this.connections = [conn];
                cs.retries = 0;
                cs.lastMessageAt = Date.now();
                cs.onStatus('connected');
            });
            conn.on('data', (data) => {
                cs.lastMessageAt = Date.now();
                const msg = data as RemoteAction;
                if (msg.action === 'STATE_UPDATE') cs.onState(msg.payload);
            });
            // Ignorar eventos de peers viejos que destruimos a propósito al reintentar
            conn.on('close', () => { if (this.peer === peer) this.scheduleClientRetry(); });
            conn.on('error', () => { if (this.peer === peer) this.scheduleClientRetry(); });
        });

        peer.on('error', () => { if (this.peer === peer) this.scheduleClientRetry(); });
    }

    private scheduleClientRetry() {
        const cs = this.clientState;
        if (!cs || cs.retryTimer) return;
        this.connections = [];
        if (cs.retries >= MAX_RETRIES) {
            cs.onStatus('failed');
            return;
        }
        cs.onStatus('reconnecting');
        const delay = Math.min(10000, 1000 * 2 ** cs.retries);
        cs.retries++;
        cs.retryTimer = setTimeout(() => {
            cs.retryTimer = undefined;
            this.openClientConnection();
        }, delay);
    }

    private disconnectClient() {
        if (!this.clientState) return;
        clearTimeout(this.clientState.retryTimer);
        clearInterval(this.clientState.watchdog);
        this.clientState = null;
    }

    sendAction(action: RemoteAction) {
        let sent = false;
        this.connections.forEach(conn => {
            if (conn.open) {
                conn.send(action);
                sent = true;
            }
        });
        return sent;
    }

    destroy() {
        this.disconnectClient();
        this.peer?.destroy();
        this.peer = null;
        this.connections = [];
        this.storeUnsubscribe?.();
        this.storeUnsubscribe = null;
        if (this.keepalive) clearInterval(this.keepalive);
        this.keepalive = null;
    }
}

export const peerService = new PeerService();
