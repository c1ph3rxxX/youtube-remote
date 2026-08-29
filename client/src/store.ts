import { create } from 'zustand';
import type { PlayerState, QueueItem, SearchResult } from './types';

const DEFAULT_STATE: PlayerState = {
  videoId: null, title: '', channel: '', thumbnail: '', duration: 0,
  currentTime: 0, playing: false, volume: 80, muted: false,
  shuffle: false, repeat: 'none', queueIndex: -1, sleepTimerEnd: null,
};

interface AppStore {
  // Connection
  connected: boolean;
  authenticated: boolean;
  token: string | null;
  // Player
  player: PlayerState;
  queue: QueueItem[];
  suggested: QueueItem[];
  // UI
  activeTab: 'home' | 'search' | 'queue' | 'settings';
  showNowPlaying: boolean;
  // Search
  searchQuery: string;
  searchResults: SearchResult[];
  searching: boolean;
  // Actions
  setConnected: (v: boolean) => void;
  setAuthenticated: (v: boolean, token?: string) => void;
  setPlayer: (s: PlayerState) => void;
  setQueue: (q: QueueItem[]) => void;
  setSuggested: (s: QueueItem[]) => void;
  setTab: (t: AppStore['activeTab']) => void;
  setShowNowPlaying: (v: boolean) => void;
  setSearchQuery: (q: string) => void;
  setSearchResults: (r: SearchResult[]) => void;
  setSearching: (v: boolean) => void;
}

export const useStore = create<AppStore>((set) => ({
  connected: false,
  authenticated: false,
  token: localStorage.getItem('yt-remote-token'),
  player: DEFAULT_STATE,
  queue: [],
  suggested: [],
  activeTab: 'home',
  showNowPlaying: false,
  searchQuery: '',
  searchResults: [],
  searching: false,
  setConnected: (v) => set({ connected: v }),
  setAuthenticated: (v, token) => {
    if (token) {
      localStorage.setItem('yt-remote-token', token);
      set({ authenticated: v, token });
    } else {
      set({ authenticated: v });
    }
  },
  setPlayer: (s) => set({ player: s }),
  setQueue: (q) => set({ queue: q }),
  setSuggested: (s) => set({ suggested: s }),
  setTab: (t) => set({ activeTab: t }),
  setShowNowPlaying: (v) => set({ showNowPlaying: v }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSearchResults: (r) => set({ searchResults: r }),
  setSearching: (v) => set({ searching: v }),
}));
