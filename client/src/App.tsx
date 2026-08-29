import React, { useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useMediaSession } from './hooks/useMediaSession';
import { useStore } from './store';
import { HomeTab } from './pages/HomeTab';
import { SearchTab } from './pages/SearchTab';
import { QueueTab } from './pages/QueueTab';
import { SettingsTab } from './pages/SettingsTab';
import { NowPlayingScreen } from './components/NowPlayingScreen';
import { MiniPlayer } from './components/MiniPlayer';
import { PairingScreen } from './components/PairingScreen';
import { BottomNav } from './components/BottomNav';

export default function App() {
  const { send } = useWebSocket();
  useMediaSession();
  const { activeTab, authenticated, connected, showNowPlaying, player, setTab } = useStore();

  useEffect(() => {
    if (connected && authenticated) {
      send({ type: 'GET_STATE' });
    }
  }, [connected, authenticated, send]);

  if (!authenticated) {
    return <PairingScreen />;
  }

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] w-full sm:max-w-md md:max-w-lg mx-auto bg-bg overflow-hidden shadow-2xl relative sm:border-x sm:border-border/30">
      {showNowPlaying && <NowPlayingScreen />}

      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'search' && <SearchTab />}
        {activeTab === 'queue' && <QueueTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>

      {player.videoId && !showNowPlaying && activeTab !== 'home' && <MiniPlayer />}

      <BottomNav />
    </div>
  );
}


