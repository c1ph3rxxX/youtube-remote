import 'dotenv/config';
import Fastify from 'fastify';
import fastifyWebSocket from '@fastify/websocket';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { logger } from './logger';
import { initDatabase } from './db/database';
import { browserManager } from './browser/browser-manager';
import { playerState } from './player/player-state';
import { queueManager } from './queue/queue-manager';
import { registerWebSocketHandler, broadcast, broadcastState, broadcastQueue } from './api/websocket-handler';
import { registerRestRoutes } from './api/rest-routes';
import { generatePin } from './auth/pairing';

const PORT = parseInt(process.env.PORT || '4000');
const HOST = process.env.HOST || '0.0.0.0';

function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}

async function main() {
  // Init database
  initDatabase();
  // Restore persisted queue after DB is ready
  queueManager.restore();


  const fastify = Fastify({ logger: false });

  await fastify.register(fastifyCors, { origin: true });
  await fastify.register(fastifyWebSocket);

  // Serve frontend (built files)
  const frontendDist = path.join(__dirname, '../../client/dist');
  if (fs.existsSync(frontendDist)) {
    await fastify.register(fastifyStatic, {
      root: frontendDist,
      prefix: '/',
    });
    fastify.setNotFoundHandler((request, reply) => {
      if (!request.url.startsWith('/api') && !request.url.startsWith('/ws')) {
        reply.sendFile('index.html');
      } else {
        reply.code(404).send({ error: 'Not found' });
      }
    });
  }

  // Register routes
  registerWebSocketHandler(fastify);
  registerRestRoutes(fastify);

  // Setup browser callbacks
  browserManager.setCallbacks(
    (state) => broadcast({ type: 'PLAYER_STATE', state }),
    () => { logger.info('Queue ended'); broadcast({ type: 'PLAYER_STATE', state: playerState.get() }); },
    (running, crashed) => broadcast({ type: 'BROWSER_STATUS', running, crashed }),
    () => broadcastQueue()
  );

  await fastify.listen({ port: PORT, host: HOST });

  const ip = getLocalIP();
  const pin = generatePin();

  logger.info('\n');
  logger.info('╭──────────────────────────────────────╮');
  logger.info('│  🎵 YouTube Remote                   │');
  logger.info('│                                      │');
  logger.info(`│  Open on your iPhone:                │`);
  logger.info(`│  http://${ip}:${PORT}             │`);
  logger.info('│                                      │');
  logger.info(`│  Pairing PIN: ${pin}                  │`);
  logger.info('╰──────────────────────────────────────╯');
  logger.info('\n');

  // Launch browser
  logger.info('Launching Chromium browser...');
  await browserManager.launch();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Shutting down...');
    await browserManager.close();
    await fastify.close();
    process.exit(0);
  });
}

main().catch((err) => {
  logger.error({ err }, 'Fatal error');
  process.exit(1);
});
