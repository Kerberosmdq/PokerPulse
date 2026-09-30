import { Component } from 'react';
import type { ReactNode } from 'react';
import { STORAGE_KEY } from '../store/gameStore';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    confirmReset: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, confirmReset: false };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error) {
        console.error('ErrorBoundary caught:', error);
    }

    handleReload = () => {
        window.location.reload();
    };

    // Si el estado guardado está dañado, recargar vuelve a fallar: esta es la salida
    handleResetData = () => {
        if (!this.state.confirmReset) {
            this.setState({ confirmReset: true });
            return;
        }
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-background flex items-center justify-center p-6">
                    <div className="glass-panel p-8 rounded-2xl border border-accent/20 max-w-sm w-full text-center space-y-6">
                        <div className="text-5xl">⚠️</div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white">Algo salió mal</h2>
                            <p className="text-sm text-gray-400">
                                La aplicación encontró un error inesperado. El torneo está guardado: probá recargar.
                            </p>
                        </div>

                        <details className="text-left bg-white/5 p-4 rounded-lg border border-white/5 max-h-32 overflow-y-auto">
                            <summary className="text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer">
                                Detalles técnicos
                            </summary>
                            <p className="text-[11px] text-gray-500 font-mono mt-2 whitespace-pre-wrap break-words">
                                {this.state.error?.message}
                            </p>
                        </details>

                        <div className="space-y-2">
                            <button
                                onClick={this.handleReload}
                                className="w-full h-11 rounded-lg bg-primary text-black font-bold uppercase tracking-wider text-sm hover:brightness-110 active:scale-95 transition"
                            >
                                Recargar
                            </button>
                            <button
                                onClick={this.handleResetData}
                                className="w-full h-10 rounded-lg text-accent text-xs font-bold uppercase tracking-wider hover:bg-accent/10 transition"
                            >
                                {this.state.confirmReset ? 'Confirmar: borrar torneo en curso' : 'Si sigue fallando: reiniciar datos'}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
