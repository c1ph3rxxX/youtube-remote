import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { usePlayer } from '../hooks/usePlayer';
import {
  Settings,
  Tv,
  Volume2,
  Moon,
  Smartphone,
  Server,
  RefreshCw,
  LogOut,
  Trash2,
  CheckCircle2,
  XCircle,
  KeyRound,
  Copy,
  Check,
  Plus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface AudioSink {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
}
interface Device {
  id: number;
  name: string;
  createdAt: string;
  lastSeen: string;
}

export function SettingsTab() {
  const { player, connected } = useStore();
  const { setSleepTimer } = usePlayer();
  const [sinks, setSinks] = useState<AudioSink[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [browserStatus, setBrowserStatus] = useState(false);
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [sleepMinutes, setSleepMinutes] = useState<number | null>(null);
  const [restarting, setRestarting] = useState(false);
  const [pairingPin, setPairingPin] = useState<string>('••••');
  const [copiedPin, setCopiedPin] = useState(false);
  const [regeneratingPin, setRegeneratingPin] = useState(false);

  const token = localStorage.getItem('yt-remote-token') || '';
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch('/api/audio/sinks', { headers })
      .then((r) => r.json())
      .then((d) => setSinks(d.sinks || []))
      .catch(() => {});
    fetch('/api/devices', { headers })
      .then((r) => r.json())
      .then((d) => setDevices(d.devices || []))
      .catch(() => {});
    fetch('/api/browser/status', { headers })
      .then((r) => r.json())
      .then((d) => setBrowserStatus(d.running))
      .catch(() => {});
    fetch('/api/status')
      .then((r) => r.json())
      .then((d) => setServerInfo(d))
      .catch(() => {});
    fetch('/api/pairing/current', { headers })
      .then((r) => r.json())
      .then((d) => {
        if (d.pin) setPairingPin(d.pin);
      })
      .catch(() => {});
  }, []);

  const handleCopyPin = () => {
    if (pairingPin && pairingPin !== '••••') {
      navigator.clipboard.writeText(pairingPin);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  const handleRegeneratePin = async () => {
    setRegeneratingPin(true);
    try {
      const res = await fetch('/api/pairing/regenerate', { method: 'POST', headers });
      const data = await res.json();
      if (data.pin) setPairingPin(data.pin);
    } catch {}
    setRegeneratingPin(false);
  };

  const restartBrowser = async () => {
    setRestarting(true);
    await fetch('/api/browser/restart', { method: 'POST', headers });
    setTimeout(() => {
      fetch('/api/browser/status', { headers })
        .then((r) => r.json())
        .then((d) => {
          setBrowserStatus(d.running);
          setRestarting(false);
        });
    }, 4000);
  };

  const setSink = async (sinkId: string) => {
    await fetch('/api/audio/sink', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sinkId }),
    });
    fetch('/api/audio/sinks', { headers })
      .then((r) => r.json())
      .then((d) => setSinks(d.sinks || []));
  };

  const removeDevice = async (id: number) => {
    await fetch(`/api/devices/${id}`, { method: 'DELETE', headers });
    setDevices(devices.filter((d) => d.id !== id));
  };

  const handleSleepTimer = (minutes: number | null) => {
    setSleepMinutes(minutes);
    setSleepTimer(minutes);
  };

  const disconnect = () => {
    localStorage.removeItem('yt-remote-token');
    window.location.reload();
  };

  return (
    <div className="flex flex-col pt-safe pb-nav overflow-y-auto max-w-md mx-auto w-full select-none px-4">
      <div className="flex items-center gap-2 pt-3 pb-4">
        <Settings size={20} className="text-accent" />
        <h1 className="text-white font-bold text-lg tracking-tight">Settings & System</h1>
      </div>

      {/* 1. Pair New Device Card */}
      <Section title="Pair New Device" icon={KeyRound}>
        <div className="p-4 flex flex-col items-center justify-center text-center gap-3">
          <p className="text-text-dim text-xs">
            Open <span className="text-white font-mono font-semibold">{serverInfo?.ip ? `http://${serverInfo.ip}:4000` : 'YouTube Remote'}</span> on any new phone or tablet and enter this 4-digit code:
          </p>

          <div className="flex items-center gap-3 bg-white/[0.06] border border-white/15 px-6 py-3 rounded-2xl shadow-glow">
            <span className="text-3xl font-black font-mono tracking-[0.4em] text-white">
              {pairingPin}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1 w-full">
            <button
              onClick={handleCopyPin}
              className="flex-1 py-2.5 px-3 rounded-xl bg-accent text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              {copiedPin ? <Check size={14} className="stroke-[3]" /> : <Copy size={14} />}
              <span>{copiedPin ? 'Copied to Clipboard!' : 'Copy PIN'}</span>
            </button>

            <button
              onClick={handleRegeneratePin}
              disabled={regeneratingPin}
              className="py-2.5 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-white/10 active:scale-95 transition-all"
              title="Generate a new PIN"
            >
              <RefreshCw size={13} className={regeneratingPin ? 'animate-spin' : ''} />
              <span>New Code</span>
            </button>
          </div>
        </div>
      </Section>

      {/* 2. Chrome TV Playback Engine */}
      <Section title="Playback Engine" icon={Tv}>
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-white text-xs font-semibold">Chrome Engine</p>
            <p className="text-text-dim text-[11px] mt-0.5">Desktop YouTube Instance</p>
          </div>
          <span
            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
              browserStatus ? 'bg-accent/15 text-accent' : 'bg-red-500/15 text-red-400'
            }`}
          >
            {browserStatus ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
            <span>{browserStatus ? 'Active' : 'Offline'}</span>
          </span>
        </div>

        <button
          onClick={restartBrowser}
          disabled={restarting}
          className="w-full text-left px-4 py-3 text-accent text-xs font-bold hover:bg-white/[0.04] active:bg-white/[0.08] flex items-center gap-2 transition-colors border-t border-white/[0.06]"
        >
          <RefreshCw size={14} className={restarting ? 'animate-spin' : ''} />
          <span>{restarting ? 'Restarting Chrome Engine...' : 'Restart Playback Browser'}</span>
        </button>
      </Section>

      {/* 3. Audio Sinks */}
      {sinks.length > 0 && (
        <Section title="Audio Output Device" icon={Volume2}>
          {sinks.map((sink) => (
            <button
              key={sink.id}
              onClick={() => setSink(sink.id)}
              className="w-full flex items-center justify-between px-4 py-3 active:bg-white/[0.08] hover:bg-white/[0.04] transition-colors text-left border-b border-white/[0.05] last:border-0"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    sink.isDefault ? 'bg-accent shadow-glow' : 'bg-white/20'
                  }`}
                />
                <span className="text-white text-xs font-medium truncate">{sink.name}</span>
              </div>
              {sink.isDefault && (
                <span className="text-accent text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent/15 border border-accent/30 flex-shrink-0">
                  Active
                </span>
              )}
            </button>
          ))}
        </Section>
      )}

      {/* 4. Sleep Timer */}
      <Section title="Sleep Timer" icon={Moon}>
        <div className="p-3">
          <div className="grid grid-cols-4 gap-2">
            {[null, 15, 30, 60].map((m) => (
              <button
                key={m ?? 'off'}
                onClick={() => handleSleepTimer(m)}
                className={`py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                  sleepMinutes === m
                    ? 'bg-accent text-black shadow-glow font-extrabold'
                    : 'bg-white/[0.05] text-white hover:bg-white/[0.09] border border-white/10'
                }`}
              >
                {m === null ? 'Off' : `${m}m`}
              </button>
            ))}
          </div>

          {player.sleepTimerEnd && (
            <p className="text-accent text-[11px] font-medium mt-2.5 text-center">
              Playback stops automatically at {new Date(player.sleepTimerEnd).toLocaleTimeString()}
            </p>
          )}
        </div>
      </Section>

      {/* 5. Connected Devices */}
      <Section title="Paired Devices" icon={Smartphone}>
        {devices.map((device) => (
          <div
            key={device.id}
            className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05] last:border-0"
          >
            <div>
              <p className="text-white text-xs font-semibold">{device.name}</p>
              <p className="text-muted text-[10px]">
                Paired on {new Date(device.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => removeDevice(device.id)}
              className="text-red-400 text-xs font-bold px-2.5 py-1 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 active:scale-95 transition-all flex items-center gap-1"
            >
              <Trash2 size={12} />
              <span>Remove</span>
            </button>
          </div>
        ))}

        <button
          onClick={disconnect}
          className="w-full text-left px-4 py-3 text-red-400 text-xs font-bold hover:bg-red-500/10 active:bg-red-500/20 flex items-center gap-2 transition-colors border-t border-white/[0.06]"
        >
          <LogOut size={14} />
          <span>Disconnect This Phone</span>
        </button>
      </Section>

      {/* 6. Server Health Info */}
      <Section title="Server Information" icon={Server}>
        <Row label="Remote Status" value={connected ? '🟢 Connected' : '🔴 Offline'} />
        {serverInfo && (
          <>
            <Row label="Server IP & Port" value={`${serverInfo.ip}:${serverInfo.port}`} />
            <Row label="Version" value={serverInfo.version || '1.0.0'} />
          </>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-1.5 px-1">
        {Icon && <Icon size={13} className="text-accent" />}
        <p className="text-muted text-[11px] uppercase tracking-wider font-bold">{title}</p>
      </div>
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-glass-card">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.05] last:border-0">
      <span className="text-white text-xs font-medium">{label}</span>
      <span className="text-text-dim text-xs font-mono">{value}</span>
    </div>
  );
}
