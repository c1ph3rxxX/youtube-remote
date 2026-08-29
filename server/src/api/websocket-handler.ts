import type { FastifyInstance } from 'fastify';
import type { SocketStream } from '@fastify/websocket';
import { browserManager } from '../browser/browser-manager';
import { playerState } from '../player/player-state';
import { queueManager } from '../queue/queue-manager';
import { getVideoInfo, getRelatedVideos, getSuggestedMusic } from '../search/youtube-search';
import { getFavorites, addFavorite, removeFavorite } from '../db/favorites';
import { getHistory, addToHistory, removeFromHistory, clearHistory } from '../db/history';
import { getDevices, removeDevice } from '../db/devices';
import { consumePin, isAuthenticated } from '../auth/pairing';
import { getAudioSinks, setDefaultSink } from '../audio/audio';
import { nanoid } from 'nanoid';
import { logger } from '../logger';
import type { ClientMessage, QueueItem } from '../types';

const clients = new Map<string, { socket: SocketStream; authenticated: boolean }>();

export function broadcast(message: object) {
  const data = JSON.stringify(message);
  for (const [, client] of clients) {
    if (client.socket.socket.readyState === 1 && client.authenticated) {
      client.socket.socket.send(data);
    }
  }
}

export function broadcastState() {
  const state = playerState.get();
  broadcast({ type: 'PLAYER_STATE', state });
}

export function broadcastQueue() {
  broadcast({
    type: 'QUEUE_UPDATED',
    queue: queueManager.getQueue(),
    suggested: queueManager.getSuggested(),
  });
}

export function registerWebSocketHandler(fastify: FastifyInstance) {
  fastify.get('/ws', { websocket: true }, (socket: SocketStream) => {
    const clientId = nanoid();
    clients.set(clientId, { socket, authenticated: false });
    logger.info(`WebSocket client connected: ${clientId}`);

    socket.socket.send(JSON.stringify({ type: 'AUTH_REQUIRED' }));

    socket.socket.on('message', async (raw: Buffer) => {
      let msg: ClientMessage;
      try {
        msg = JSON.parse(raw.toString()) as ClientMessage;
      } catch {
        socket.socket.send(JSON.stringify({ type: 'ERROR', message: 'Invalid message format' }));
        return;
      }

      const client = clients.get(clientId)!;

      if (msg.type === 'PAIR') {
        const token = consumePin(msg.pin, msg.deviceName || 'Mobile Device');
        if (token) {
          clients.set(clientId, { ...client, authenticated: true });
          socket.socket.send(JSON.stringify({ type: 'PAIR_SUCCESS', token }));
          socket.socket.send(JSON.stringify({ type: 'PLAYER_STATE', state: playerState.get() }));
          socket.socket.send(JSON.stringify({ type: 'QUEUE_UPDATED', queue: queueManager.getQueue(), suggested: queueManager.getSuggested() }));
        } else {
          socket.socket.send(JSON.stringify({ type: 'ERROR', message: 'Invalid or expired PIN', code: 'INVALID_PIN' }));
        }
        return;
      }

      if (msg.type === 'AUTH') {
        if (isAuthenticated(msg.token)) {
          clients.set(clientId, { ...client, authenticated: true });
          socket.socket.send(JSON.stringify({ type: 'AUTH_SUCCESS' }));
          socket.socket.send(JSON.stringify({ type: 'PLAYER_STATE', state: playerState.get() }));
          socket.socket.send(JSON.stringify({ type: 'QUEUE_UPDATED', queue: queueManager.getQueue() }));
        } else {
          socket.socket.send(JSON.stringify({ type: 'AUTH_REQUIRED' }));
        }
        return;
      }

      if (!client.authenticated) {
        socket.socket.send(JSON.stringify({ type: 'AUTH_REQUIRED' }));
        return;
      }

      try {
        await handleMessage(msg, socket);
      } catch (err) {
        logger.error({ err }, 'Error handling WS message');
        socket.socket.send(JSON.stringify({ type: 'ERROR', message: 'Server error' }));
      }
    });

    socket.socket.on('close', () => {
      clients.delete(clientId);
      logger.info(`WebSocket client disconnected: ${clientId}`);
    });

    socket.socket.on('error', () => {
      clients.delete(clientId);
    });
  });
}

async function handleMessage(msg: ClientMessage, socket: SocketStream) {
  const send = (data: object) => socket.socket.send(JSON.stringify(data));

  switch (msg.type) {
    case 'GET_STATE':
      send({ type: 'PLAYER_STATE', state: playerState.get() });
      send({ type: 'QUEUE_UPDATED', queue: queueManager.getQueue(), suggested: queueManager.getSuggested() });
      if (queueManager.getQueue().length === 0 && queueManager.getSuggested().length === 0) {
        getSuggestedMusic(10).then(items => {
          queueManager.setSuggested(items.map(i => ({ ...i, source: 'youtube' })));
          broadcastQueue();
        }).catch(() => {});
      }
      break;

    case 'PLAY':
      await browserManager.play();
      playerState.update({ playing: true });
      broadcastState();
      break;

    case 'PAUSE':
      await browserManager.pause();
      playerState.update({ playing: false });
      broadcastState();
      break;

    case 'SEEK':
      if (typeof msg.position === 'number' && msg.position >= 0) {
        await browserManager.seek(msg.position);
        playerState.update({ currentTime: msg.position });
        broadcastState();
      }
      break;

    case 'SET_VOLUME':
      if (typeof msg.volume === 'number') {
        await browserManager.setVolume(msg.volume);
        broadcast({ type: 'VOLUME_CHANGED', volume: msg.volume, muted: playerState.get().muted });
        broadcastState();
      }
      break;

    case 'SET_MUTE':
      await browserManager.setMute(msg.muted);
      broadcast({ type: 'VOLUME_CHANGED', volume: playerState.get().volume, muted: msg.muted });
      broadcastState();
      break;

    case 'PLAY_VIDEO': {
      const videoId = msg.videoId;
      if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        send({ type: 'ERROR', message: 'Invalid video ID' });
        return;
      }
      let info = {
        title: msg.title || '',
        channel: msg.channel || '',
        thumbnail: msg.thumbnail || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
        duration: msg.duration || 0,
      };
      if (!info.title) {
        const fetched = await getVideoInfo(videoId);
        if (fetched) { info.title = fetched.title; info.channel = fetched.channel; info.duration = fetched.duration; }
      }
      const qItem: Omit<QueueItem, 'id'> = { videoId, source: 'youtube', ...info };
      const added = queueManager.playNow(qItem);
      playerState.update({ videoId, title: info.title, channel: info.channel, thumbnail: info.thumbnail, duration: info.duration, playing: true, currentTime: 0 });
      await browserManager.playVideo(videoId);
      broadcast({ type: 'VIDEO_CHANGED', item: added });
      broadcastQueue();
      broadcastState();

      // Fetch related videos directly from YouTube's watch sidebar (what Chrome shows)
      browserManager.fetchAndBroadcastRelated(videoId, () => broadcastQueue()).catch(() => {});
      break;
    }

    case 'ADD_TO_QUEUE': {
      const { item, position } = msg;
      if (position === 'next') queueManager.addNext(item);
      else queueManager.addToEnd(item);
      broadcastQueue();
      break;
    }

    case 'REMOVE_FROM_QUEUE':
      queueManager.remove(msg.id);
      broadcastQueue();
      break;

    case 'REORDER_QUEUE':
      if (Array.isArray(msg.ids)) {
        queueManager.reorder(msg.ids);
        broadcastQueue();
      }
      break;

    case 'CLEAR_QUEUE':
      queueManager.clear();
      broadcastQueue();
      break;

    case 'NEXT': {
      const state = playerState.get();
      let next = queueManager.next(state.shuffle);

      // If user queue is empty, take the top song from YouTube's authentic suggestions
      if (!next && state.videoId) {
        const suggested = queueManager.getSuggested();
        if (suggested.length > 0) {
          const picked = suggested[0];
          queueManager.setSuggested(suggested.slice(1), picked.videoId);
          next = queueManager.addToEnd({ ...picked, source: 'youtube' });
          queueManager.setIndex(queueManager.getQueue().length - 1);
        }
      }

      if (next) {
        playerState.update({ videoId: next.videoId, title: next.title, channel: next.channel, thumbnail: next.thumbnail, duration: next.duration, currentTime: 0 });
        await browserManager.playVideo(next.videoId);
        broadcast({ type: 'VIDEO_CHANGED', item: next });
        broadcastQueue();
        broadcastState();

        // Fetch fresh suggestions from the new YouTube page
        browserManager.fetchAndBroadcastRelated(next.videoId, () => broadcastQueue()).catch(() => {});
      }
      break;
    }

    case 'PREVIOUS': {
      const prev = queueManager.previous();
      if (prev) {
        playerState.update({ videoId: prev.videoId, title: prev.title, channel: prev.channel, thumbnail: prev.thumbnail, duration: prev.duration, currentTime: 0 });
        await browserManager.playVideo(prev.videoId);
        broadcast({ type: 'VIDEO_CHANGED', item: prev });
        broadcastState();
      }
      break;
    }

    case 'SET_SHUFFLE':
      playerState.update({ shuffle: msg.shuffle });
      broadcastState();
      break;

    case 'SET_REPEAT':
      playerState.update({ repeat: msg.repeat });
      broadcastState();
      break;

    case 'SET_SLEEP_TIMER': {
      const endsAt = msg.minutes ? Date.now() + msg.minutes * 60 * 1000 : null;
      playerState.update({ sleepTimerEnd: endsAt });
      broadcast({ type: 'SLEEP_TIMER', endsAt });
      if (endsAt && msg.minutes) {
        setTimeout(async () => {
          await browserManager.pause();
          playerState.update({ playing: false, sleepTimerEnd: null });
          broadcastState();
        }, msg.minutes * 60 * 1000);
      }
      break;
    }
  }
}
