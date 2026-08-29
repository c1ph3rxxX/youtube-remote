export interface PlayerState {
  videoId: string | null;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
  currentTime: number;
  playing: boolean;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  queueIndex: number;
  sleepTimerEnd: number | null;
}

export interface QueueItem {
  id: string;
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
  source: 'youtube' | 'local';
}

export interface SearchResult {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
}

export interface FavoriteItem {
  id: number;
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
  addedAt: string;
}

export interface HistoryItem {
  id: number;
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
  playedAt: string;
}
