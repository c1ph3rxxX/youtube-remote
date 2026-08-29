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
  localPath?: string;
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

export interface PairedDevice {
  id: number;
  token: string;
  name: string;
  createdAt: string;
  lastSeen: string;
}

export interface AudioSink {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
}

// WebSocket message types
export type ClientMessage =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'SEEK'; position: number }
  | { type: 'SET_VOLUME'; volume: number }
  | { type: 'SET_MUTE'; muted: boolean }
  | { type: 'PLAY_VIDEO'; videoId: string; title?: string; channel?: string; thumbnail?: string; duration?: number }
  | { type: 'ADD_TO_QUEUE'; item: Omit<QueueItem, 'id'>; position?: 'end' | 'next' }
  | { type: 'REMOVE_FROM_QUEUE'; id: string }
  | { type: 'REORDER_QUEUE'; ids: string[] }
  | { type: 'CLEAR_QUEUE' }
  | { type: 'SET_SHUFFLE'; shuffle: boolean }
  | { type: 'SET_REPEAT'; repeat: 'none' | 'one' | 'all' }
  | { type: 'GET_STATE' }
  | { type: 'SET_SLEEP_TIMER'; minutes: number | null }
  | { type: 'AUTH'; token: string }
  | { type: 'PAIR'; pin: string; deviceName?: string };

export type ServerMessage =
  | { type: 'PLAYER_STATE'; state: PlayerState }
  | { type: 'QUEUE_UPDATED'; queue: QueueItem[]; suggested?: QueueItem[] }
  | { type: 'VIDEO_CHANGED'; item: QueueItem | null }
  | { type: 'PLAYBACK_STARTED' }
  | { type: 'PLAYBACK_PAUSED' }
  | { type: 'VOLUME_CHANGED'; volume: number; muted: boolean }
  | { type: 'CONNECTION_STATUS'; connected: boolean }
  | { type: 'ERROR'; message: string; code?: string }
  | { type: 'PAIR_SUCCESS'; token: string; deviceId: number }
  | { type: 'AUTH_REQUIRED' }
  | { type: 'AUTH_SUCCESS' }
  | { type: 'BROWSER_STATUS'; running: boolean; crashed: boolean }
  | { type: 'SLEEP_TIMER'; endsAt: number | null };
