import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';

const WS_URL = `ws://${window.location.host}/ws`;

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

export function useWebSocket() {
  const { setConnected, setAuthenticated, setPlayer, setQueue, token } = useStore();
  const tokenRef = useRef(token);
  useEffect(() => { tokenRef.current = token; }, [token]);

  const connect = useCallback(() => {
    if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) return;

    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      setConnected(true);
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
      if (tokenRef.current) {
        ws!.send(JSON.stringify({ type: 'AUTH', token: tokenRef.current }));
      }
    };

    ws.onclose = () => {
      setConnected(false);
      ws = null;
      reconnectTimer = setTimeout(connect, 3000);
    };

    ws.onerror = () => { ws?.close(); };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case 'PLAYER_STATE': setPlayer(msg.state); break;
          case 'QUEUE_UPDATED':
            setQueue(msg.queue || []);
            if (msg.suggested) useStore.getState().setSuggested(msg.suggested);
            break;
          case 'AUTH_SUCCESS': setAuthenticated(true); break;
          case 'AUTH_REQUIRED': setAuthenticated(false); break;
          case 'PAIR_SUCCESS':
            setAuthenticated(true, msg.token);
            useStore.getState().setShowNowPlaying(false);
            break;
        }
      } catch {}
    };
  }, [setConnected, setAuthenticated, setPlayer, setQueue]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [connect]);

  const send = useCallback((msg: object) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }, []);

  return { send };
}
