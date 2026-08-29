import React, { useState } from 'react';
import { usePlayer } from '../hooks/usePlayer';
import { useStore } from '../store';

function getDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPad/i.test(ua)) return 'iPad';
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/Android/i.test(ua)) {
    const match = ua.match(/Android[^;]+;\s*([^;)]+)/);
    if (match && match[1]) {
      const model = match[1].replace(/Build\/.*/, '').trim();
      return `Android (${model})`;
    }
    return 'Android Phone';
  }
  if (/Macintosh/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Mobile Browser';
}

export function PairingScreen() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { pair } = usePlayer();
  const { connected, setAuthenticated } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim();
    if (cleanPin.length !== 4) { setError('PIN must be 4 digits'); return; }
    setError('');
    setLoading(true);

    const deviceName = getDeviceName();

    // 1. Try WebSocket pairing
    pair(cleanPin, deviceName);

    // 2. Also try direct HTTP pairing fallback
    try {
      const res = await fetch('/api/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: cleanPin, name: deviceName }),
      });
      const data = await res.json();
      if (data.ok && data.token) {
        setAuthenticated(true, data.token);
        setLoading(false);
        return;
      }
    } catch {}

    // Wait up to 1.5s for WebSocket if HTTP didn't catch it
    setTimeout(() => {
      setLoading(false);
      if (!useStore.getState().authenticated) {
        setError('Incorrect PIN. Please enter the 4-digit code shown on your laptop terminal.');
      }
    }, 1500);
  };

  return (
    <div className="min-h-[100dvh] h-full w-full bg-bg flex flex-col items-center justify-center px-6 py-8 gap-8 max-w-md mx-auto select-none overflow-y-auto">
      <div className="text-center">
        <div className="text-6xl mb-3 animate-bounce">🎵</div>
        <h1 className="text-2xl font-bold text-white tracking-tight">YouTube Remote</h1>
        <p className="text-text-dim text-sm mt-1.5">Connect to your home theater</p>
      </div>

      <div className="w-full max-w-xs">
        <div className={`flex items-center gap-2 mb-6 justify-center text-xs font-medium px-3 py-1.5 rounded-full bg-surface border border-border/80 w-fit mx-auto ${
          connected ? 'text-accent' : 'text-red-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-accent' : 'bg-red-400'}`} />
          {connected ? 'Server found' : 'Looking for server...'}
        </div>

        {connected && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-center text-text-dim text-xs">
              Enter the 4-digit PIN shown on your server terminal
            </p>
            <input
              type="number"
              inputMode="numeric"
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.slice(0, 4))}
              className="bg-card border border-border rounded-2xl px-4 py-3.5 text-2xl text-center text-white tracking-[0.5em] font-mono focus:outline-none focus:border-accent shadow-inner transition-colors"
              maxLength={4}
              autoFocus
            />
            {error && <p className="text-red-400 text-xs text-center font-medium bg-red-400/10 py-2 rounded-xl">{error}</p>}
            <button
              type="submit"
              disabled={pin.length !== 4 || loading}
              className="bg-accent text-black font-bold py-3.5 rounded-2xl text-base disabled:opacity-40 shadow-lg shadow-accent/20 active:scale-95 transition-all"
            >
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

