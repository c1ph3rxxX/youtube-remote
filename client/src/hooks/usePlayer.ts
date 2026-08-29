import { useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import type { QueueItem } from '../types';

export function usePlayer() {
  const { send } = useWebSocket();

  const play = useCallback(() => send({ type: 'PLAY' }), [send]);
  const pause = useCallback(() => send({ type: 'PAUSE' }), [send]);
  const next = useCallback(() => send({ type: 'NEXT' }), [send]);
  const previous = useCallback(() => send({ type: 'PREVIOUS' }), [send]);
  const seek = useCallback((position: number) => send({ type: 'SEEK', position }), [send]);
  const setVolume = useCallback((volume: number) => send({ type: 'SET_VOLUME', volume }), [send]);
  const setMute = useCallback((muted: boolean) => send({ type: 'SET_MUTE', muted }), [send]);
  const setShuffle = useCallback((shuffle: boolean) => send({ type: 'SET_SHUFFLE', shuffle }), [send]);
  const setRepeat = useCallback((repeat: 'none' | 'one' | 'all') => send({ type: 'SET_REPEAT', repeat }), [send]);

  const playVideo = useCallback((videoId: string, meta?: Partial<Pick<QueueItem, 'title' | 'channel' | 'thumbnail' | 'duration'>>) => {
    send({ type: 'PLAY_VIDEO', videoId, ...meta });
  }, [send]);

  const addToQueue = useCallback((item: Omit<QueueItem, 'id'>, position: 'end' | 'next' = 'end') => {
    send({ type: 'ADD_TO_QUEUE', item, position });
  }, [send]);

  const removeFromQueue = useCallback((id: string) => send({ type: 'REMOVE_FROM_QUEUE', id }), [send]);
  const clearQueue = useCallback(() => send({ type: 'CLEAR_QUEUE' }), [send]);
  const setSleepTimer = useCallback((minutes: number | null) => send({ type: 'SET_SLEEP_TIMER', minutes }), [send]);
  const pair = useCallback((pin: string, deviceName?: string) => send({ type: 'PAIR', pin, deviceName }), [send]);

  return { play, pause, next, previous, seek, setVolume, setMute, setShuffle, setRepeat, playVideo, addToQueue, removeFromQueue, clearQueue, setSleepTimer, pair };
}
