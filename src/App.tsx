import { useState, useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { Wizard } from './components/Wizard/Wizard';
import { Dashboard } from './components/Dashboard/Dashboard';
import { RemoteClient } from './components/Remote/RemoteClient';

import { LandingPage } from './components/Landing/LandingPage';

function App() {
  const { gameState } = useGameStore();
  const [isRemote, setIsRemote] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('id') || window.location.pathname === '/remote') {
      setIsRemote(true);
    }
  }, []);

  if (isRemote) {
    return <RemoteClient />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-primary selection:text-black relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />
      </div>

      <div className="relative z-10">
        {gameState === 'landing' && <LandingPage />}
        {gameState === 'setup' && <Wizard />}
        {gameState === 'active' && <Dashboard />}
        {gameState === 'paused' && <Dashboard />}
        {gameState === 'finished' && <Dashboard />}
      </div>
    </div>
  );
}

export default App;
