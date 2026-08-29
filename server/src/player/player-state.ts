import type { PlayerState } from '../types';

class PlayerStateManager {
  private state: PlayerState = {
    videoId: null,
    title: '',
    channel: '',
    thumbnail: '',
    duration: 0,
    currentTime: 0,
    playing: false,
    volume: 80,
    muted: false,
    shuffle: false,
    repeat: 'none',
    queueIndex: -1,
    sleepTimerEnd: null,
  };

  get(): PlayerState {
    return { ...this.state };
  }

  update(partial: Partial<PlayerState>): PlayerState {
    this.state = { ...this.state, ...partial };
    return this.get();
  }

  setCurrentTime(time: number): void {
    this.state.currentTime = time;
  }
}

export const playerState = new PlayerStateManager();
