import type { FastifyInstance } from 'fastify';
import { playerState } from '../player/player-state';
import { queueManager } from '../queue/queue-manager';
import { getFavorites, addFavorite, removeFavorite, isFavorite } from '../db/favorites';
import { getHistory, removeFromHistory, clearHistory } from '../db/history';
import { getDevices, removeDevice } from '../db/devices';
import { getAudioSinks, setDefaultSink } from '../audio/audio';
import { searchYouTube, extractVideoId, getVideoInfo } from '../search/youtube-search';
import { browserManager } from '../browser/browser-manager';
import { isAuthenticated, getPin, consumePin, forceGeneratePin } from '../auth/pairing';
import { broadcastState, broadcastQueue } from './websocket-handler';
import os from 'os';

function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

export function registerRestRoutes(fastify: FastifyInstance) {
  // Auth middleware for REST API
  fastify.addHook('preHandler', async (request, reply) => {
    const path = request.url;
    // Allow static frontend assets and non-api routes
    if (!path.startsWith('/api')) return;
    // Allow public API routes (status, pairing, search, video-info)
    if (
      path.startsWith('/api/pair') ||
      path.startsWith('/api/status') ||
      path.startsWith('/api/search') ||
      path.startsWith('/api/video-info')
    ) {
      return;
    }
    const token = (request.headers.authorization || '').replace('Bearer ', '');
    if (!isAuthenticated(token)) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  // Status (public)
  fastify.get('/api/status', async () => ({
    ok: true,
    version: '1.0.0',
    ip: getLocalIP(),
    port: parseInt(process.env.PORT || '4000'),
    browserRunning: browserManager.isRunning(),
    hasPairingPin: !!getPin(),
  }));

  // Player state
  fastify.get('/api/player', async () => playerState.get());

  fastify.post('/api/player/play', async () => { await browserManager.play(); playerState.update({ playing: true }); broadcastState(); return { ok: true }; });
  fastify.post('/api/player/pause', async () => { await browserManager.pause(); playerState.update({ playing: false }); broadcastState(); return { ok: true }; });

  fastify.post<{ Body: { position: number } }>('/api/player/seek', async (req) => {
    const { position } = req.body;
    if (typeof position !== 'number' || position < 0) return { error: 'Invalid position' };
    await browserManager.seek(position);
    playerState.update({ currentTime: position });
    broadcastState();
    return { ok: true };
  });

  fastify.post<{ Body: { volume: number } }>('/api/player/volume', async (req) => {
    const { volume } = req.body;
    if (typeof volume !== 'number') return { error: 'Invalid volume' };
    await browserManager.setVolume(volume);
    broadcastState();
    return { ok: true };
  });

  fastify.post<{ Body: { muted: boolean } }>('/api/player/mute', async (req) => {
    await browserManager.setMute(req.body.muted);
    broadcastState();
    return { ok: true };
  });

  fastify.post('/api/player/next', async () => {
    const state = playerState.get();
    const next = queueManager.next(state.shuffle);
    if (next) {
      playerState.update({ videoId: next.videoId, title: next.title, channel: next.channel, thumbnail: next.thumbnail, duration: next.duration, currentTime: 0 });
      await browserManager.playVideo(next.videoId);
      broadcastState();
    }
    return { ok: true };
  });

  fastify.post('/api/player/previous', async () => {
    const prev = queueManager.previous();
    if (prev) {
      playerState.update({ videoId: prev.videoId, title: prev.title, channel: prev.channel, thumbnail: prev.thumbnail, duration: prev.duration, currentTime: 0 });
      await browserManager.playVideo(prev.videoId);
      broadcastState();
    }
    return { ok: true };
  });

  // Queue
  fastify.get('/api/queue', async () => ({ queue: queueManager.getQueue(), currentIndex: queueManager.getCurrentIndex() }));
  fastify.delete('/api/queue', async () => { queueManager.clear(); broadcastQueue(); return { ok: true }; });

  fastify.post<{ Body: { item: any; position?: string } }>('/api/queue/add', async (req) => {
    const { item, position } = req.body;
    if (position === 'next') queueManager.addNext(item);
    else queueManager.addToEnd(item);
    broadcastQueue();
    return { ok: true, queue: queueManager.getQueue() };
  });

  fastify.post<{ Body: { id: string } }>('/api/queue/remove', async (req) => {
    queueManager.remove(req.body.id);
    broadcastQueue();
    return { ok: true };
  });

  fastify.post<{ Body: { ids: string[] } }>('/api/queue/reorder', async (req) => {
    if (Array.isArray(req.body.ids)) {
      queueManager.reorder(req.body.ids);
      broadcastQueue();
    }
    return { ok: true };
  });

  // Search
  fastify.get<{ Querystring: { q: string } }>('/api/search', async (req) => {
    const q = req.query.q;
    if (!q || q.length < 2) return { results: [] };
    const results = await searchYouTube(q.substring(0, 100));
    return { results };
  });

  fastify.get<{ Querystring: { url: string } }>('/api/video-info', async (req) => {
    const { url } = req.query;
    const videoId = extractVideoId(url);
    if (!videoId) return { error: 'Invalid YouTube URL' };
    const info = await getVideoInfo(videoId);
    return info || { error: 'Video not found' };
  });

  // Favorites
  fastify.get('/api/favorites', async () => ({ favorites: getFavorites() }));

  fastify.post<{ Body: any }>('/api/favorites/add', async (req) => {
    const item = addFavorite(req.body as Omit<import('../types').FavoriteItem, 'id' | 'addedAt'>);
    return { ok: true, item };
  });

  fastify.post<{ Body: { videoId: string } }>('/api/favorites/remove', async (req) => {
    removeFavorite(req.body.videoId);
    return { ok: true };
  });

  fastify.get<{ Querystring: { videoId: string } }>('/api/favorites/check', async (req) => ({
    isFavorite: isFavorite(req.query.videoId),
  }));

  // History
  fastify.get('/api/history', async () => ({ history: getHistory() }));
  fastify.delete('/api/history', async () => { clearHistory(); return { ok: true }; });
  fastify.delete<{ Params: { id: string } }>('/api/history/:id', async (req) => {
    removeFromHistory(parseInt(req.params.id));
    return { ok: true };
  });

  // Devices
  fastify.get('/api/devices', async () => ({ devices: getDevices() }));
  fastify.delete<{ Params: { id: string } }>('/api/devices/:id', async (req) => {
    removeDevice(parseInt(req.params.id));
    return { ok: true };
  });

  // Audio sinks
  fastify.get('/api/audio/sinks', async () => ({ sinks: await getAudioSinks() }));
  fastify.post<{ Body: { sinkId: string } }>('/api/audio/sink', async (req) => {
    const ok = await setDefaultSink(req.body.sinkId);
    return { ok };
  });

  // Browser control
  fastify.post('/api/browser/restart', async () => { await browserManager.restart(); return { ok: true }; });
  fastify.post('/api/browser/show', async () => { await browserManager.show(); return { ok: true }; });
  fastify.get('/api/browser/status', async () => ({ running: browserManager.isRunning() }));

  // Pairing management for already authenticated devices
  fastify.get('/api/pairing/current', async () => ({ pin: getPin() }));
  fastify.post('/api/pairing/regenerate', async () => ({ pin: forceGeneratePin() }));

  // Pairing endpoints (public)
  fastify.get('/api/pair/pin', async () => ({ pin: getPin() }));
  fastify.post<{ Body: { pin: string; name?: string } }>('/api/pair', async (req, reply) => {
    const { pin, name } = req.body || {};
    const token = consumePin(pin, name || 'iPhone');
    if (token) {
      return { ok: true, token };
    }
    reply.code(400).send({ ok: false, error: 'Invalid PIN' });
  });
}

