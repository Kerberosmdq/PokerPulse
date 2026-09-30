import { useEffect, useState } from 'react';
import { useGameStore } from './store/gameStore';
import { Wizard } from './components/Wizard/Wizard';
import { Dashboard } from './components/Dashboard/Dashboard';
import { RemoteClient } from './components/Remote/RemoteClient';
import { LandingPage } from './components/Landing/LandingPage';
import { TVWindow } from './components/Dashboard/TVMode';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from './components/ui/Toaster';
import { soundManager } from './utils/audio';

type AppMode = 'host' | 'remote' | 'tv';

const detectMode = (): AppMode => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('view') === 'tv') return 'tv';
  if (params.get('id') || window.location.pathname === '/remote') return 'remote';
  return 'host';
};

// Textura de ruido embebida (antes se cargaba desde un dominio externo y fallaba sin conexión)
const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E")`;

function App() {
  const gameState = useGameStore(s => s.gameState);
  const theme = useGameStore(s => s.theme);
  const volume = useGameStore(s => s.volume);
  const isMuted = useGameStore(s => s.isMuted);
  const [mode] = useState(detectMode);

  // El tema vive en <html> para que fondo, scrollbars y modales lo hereden
  useEffect(() => {
    const root = document.documentElement;
    root.classList.forEach(c => c.startsWith('theme-') && root.classList.remove(c));
    root.classList.add(`theme-${mode === 'remote' ? 'cyberpunk' : theme}`);
  }, [theme, mode]);

  useEffect(() => {
    if (mode === 'host') soundManager.setVolume(isMuted ? 0 : volume);
  }, [volume, isMuted, mode]);

  if (mode === 'remote') {
    return (
      <>
        <RemoteClient />
        <Toaster />
      </>
    );
  }

  if (mode === 'tv') {
    return <TVWindow />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-white font-sans selection:bg-primary selection:text-black relative transition-colors duration-500">
        {/* Fondo */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/[0.06] rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/[0.06] rounded-full blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay" style={{ backgroundImage: NOISE }} />
        </div>

        <div className="relative z-10">
          {gameState === 'landing' && <LandingPage />}
          {gameState === 'setup' && <Wizard />}
          {(gameState === 'active' || gameState === 'paused' || gameState === 'finished') && <Dashboard />}
        </div>
        <Toaster />
      </div>
    </ErrorBoundary>
  );
}

export default App;
