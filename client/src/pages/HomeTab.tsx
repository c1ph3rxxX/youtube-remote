import React from 'react';
import { useStore } from '../store';
import { usePlayer } from '../hooks/usePlayer';
import { EqualizerWave } from '../components/EqualizerWave';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Volume1,
  Minus,
  Plus,
  Radio,
  Sparkles,
  Maximize2,
  Tv,
} from 'lucide-react';

function fmt(s: number) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function HomeTab() {
  const { player, connected, setShowNowPlaying, setTab, setSearchQuery } = useStore();
  const { play, pause, next, previous, seek, setVolume, setMute } = usePlayer();

  const volumePresets = [25, 50, 75, 100];
  const quickGenres = [
    { label: '🔥 Trending Hits', query: 'Top trending songs' },
    { label: '🎧 Lofi Chill', query: 'Lofi hip hop beats chill' },
    { label: '💃 Party & Dance', query: 'Party dance hits' },
    { label: '☕ Acoustic Morning', query: 'Acoustic calm morning songs' },
  ];

  return (
    <div className="flex flex-col min-h-full pt-safe px-4 pb-nav max-w-md mx-auto w-full select-none">
      {/* Top App Header */}
      <div className="flex items-center justify-between py-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent to-emerald-400 flex items-center justify-center text-black shadow-glow">
            <Radio size={18} className="text-black stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base tracking-tight leading-none">YouTube Remote</h1>
            <p className="text-[11px] text-text-dim mt-0.5 flex items-center gap-1 font-medium">
              <Tv size={11} className="text-accent" /> Living Room Audio
            </p>
          </div>
        </div>

        {/* Live Status Beacon */}
        <div
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-md border ${
            connected
              ? 'bg-accent/10 border-accent/30 text-accent'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-accent shadow-glow animate-pulse' : 'bg-red-400'}`} />
          {connected ? 'Connected' : 'Offline'}
        </div>
      </div>

      {player.videoId ? (
        <div className="flex flex-col gap-4 my-auto py-2">
          {/* Hero Now Playing Glass Card */}
          <div className="relative group">
            {/* Ambient artwork backlight */}
            {player.thumbnail && (
              <div
                className="absolute -inset-1 rounded-3xl opacity-50 blur-xl transition-all duration-700 pointer-events-none"
                style={{
                  backgroundImage: `url(${player.thumbnail})`,
                  backgroundSize: 'cover',
                }}
              />
            )}

            <div
              className="relative w-full aspect-video rounded-2xl overflow-hidden bg-card cursor-pointer shadow-2xl border border-white/10 group active:scale-[0.99] transition-all"
              onClick={() => setShowNowPlaying(true)}
            >
              {player.thumbnail ? (
                <img src={player.thumbnail} alt={player.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-card">
                  <span className="text-5xl">🎵</span>
                </div>
              )}

              {/* Glass overlay pill */}
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center gap-2 shadow-sm">
                <EqualizerWave playing={player.playing} size="sm" color="#10b981" />
                <span className="text-white text-[11px] font-semibold tracking-wide uppercase">
                  {player.playing ? 'Now Playing' : 'Paused'}
                </span>
              </div>

              {/* Expand Hint */}
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white/80 text-xs flex items-center gap-1">
                <Maximize2 size={12} />
                <span>Full</span>
              </div>
            </div>
          </div>

          {/* Track Info */}
          <div onClick={() => setShowNowPlaying(true)} className="cursor-pointer">
            <h2 className="text-white text-lg font-bold line-clamp-2 leading-snug drop-shadow-sm">{player.title}</h2>
            <p className="text-text-dim text-sm mt-0.5 font-medium truncate">{player.channel}</p>
          </div>

          {/* Progress Timeline Slider */}
          <div className="space-y-1">
            <input
              type="range"
              min={0}
              max={player.duration || 100}
              value={player.currentTime}
              className="w-full accent-accent"
              onChange={(e) => seek(Number(e.target.value))}
            />
            <div className="flex justify-between text-text-dim text-xs font-mono font-medium">
              <span>{fmt(player.currentTime)}</span>
              <span>{fmt(player.duration)}</span>
            </div>
          </div>

          {/* Control Deck */}
          <div className="flex items-center justify-between px-1 py-1">
            <button
              onClick={previous}
              className="w-12 h-12 flex items-center justify-center text-white/80 hover:text-white active:scale-85 transition-all rounded-full hover:bg-white/[0.08]"
              aria-label="Previous"
            >
              <SkipBack size={24} className="fill-current" />
            </button>

            <button
              onClick={() => seek(Math.max(0, player.currentTime - 10))}
              className="w-10 h-10 rounded-full flex flex-col items-center justify-center text-text-dim hover:text-white active:scale-90 transition-all bg-white/[0.05] border border-white/10"
              aria-label="-10s"
            >
              <RotateCcw size={15} />
              <span className="text-[9px] font-bold mt-0.5 leading-none">10</span>
            </button>

            {/* Glowing Hero Play Button */}
            <button
              onClick={() => (player.playing ? pause() : play())}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-accent to-emerald-400 flex items-center justify-center text-black shadow-glow active:scale-90 transition-all hover:brightness-110"
              aria-label={player.playing ? 'Pause' : 'Play'}
            >
              {player.playing ? (
                <Pause size={28} className="fill-black text-black" />
              ) : (
                <Play size={30} className="fill-black text-black ml-0.5" />
              )}
            </button>

            <button
              onClick={() => seek(Math.min(player.duration, player.currentTime + 10))}
              className="w-10 h-10 rounded-full flex flex-col items-center justify-center text-text-dim hover:text-white active:scale-90 transition-all bg-white/[0.05] border border-white/10"
              aria-label="+10s"
            >
              <RotateCw size={15} />
              <span className="text-[9px] font-bold mt-0.5 leading-none">10</span>
            </button>

            <button
              onClick={next}
              className="w-12 h-12 flex items-center justify-center text-white/80 hover:text-white active:scale-85 transition-all rounded-full hover:bg-white/[0.08]"
              aria-label="Next"
            >
              <SkipForward size={24} className="fill-current" />
            </button>
          </div>

          {/* Volume Control Card */}
          <div className="bg-white/[0.04] backdrop-blur-xl rounded-2xl p-3 border border-white/10 shadow-glass-card">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setVolume(Math.max(0, player.volume - 5))}
                className="w-8 h-8 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white flex items-center justify-center active:scale-90 transition-transform flex-shrink-0 border border-white/5"
                aria-label="Volume Down"
              >
                <Minus size={15} />
              </button>

              <button
                onClick={() => setMute(!player.muted)}
                className="text-white/80 hover:text-white p-1 flex-shrink-0 active:scale-90 transition-transform"
                aria-label="Toggle mute"
              >
                {player.muted || player.volume === 0 ? (
                  <VolumeX size={19} className="text-red-400" />
                ) : player.volume < 50 ? (
                  <Volume1 size={19} className="text-accent" />
                ) : (
                  <Volume2 size={19} className="text-accent" />
                )}
              </button>

              <input
                type="range"
                min={0}
                max={100}
                value={player.muted ? 0 : player.volume}
                className="flex-1 accent-accent min-w-[70px]"
                onChange={(e) => setVolume(Number(e.target.value))}
              />

              <span className="text-white font-mono text-xs font-semibold w-10 text-right flex-shrink-0">
                {player.muted ? '0%' : `${player.volume}%`}
              </span>

              <button
                onClick={() => setVolume(Math.min(100, player.volume + 5))}
                className="w-8 h-8 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white flex items-center justify-center active:scale-90 transition-transform flex-shrink-0 border border-white/5"
                aria-label="Volume Up"
              >
                <Plus size={15} />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/[0.06]">
              {volumePresets.map((pct) => (
                <button
                  key={pct}
                  onClick={() => setVolume(pct)}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-all active:scale-95 ${
                    player.volume === pct && !player.muted
                      ? 'bg-accent text-black shadow-sm font-bold'
                      : 'bg-white/[0.04] text-text-dim hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State with Quick Play suggestions */
        <div className="flex-1 flex flex-col justify-center my-auto py-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-tr from-accent/20 to-accent-cyan/20 border border-accent/30 flex items-center justify-center shadow-glow">
              <Sparkles size={36} className="text-accent animate-pulse" />
            </div>
            <h2 className="text-white text-xl font-bold">Ready to Play</h2>
            <p className="text-text-dim text-xs mt-1 max-w-xs mx-auto">
              Your audio is connected to your TV. Pick a vibe or search to start streaming.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {quickGenres.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setSearchQuery(item.query);
                  setTab('search');
                }}
                className="p-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-2xl text-left active:scale-95 transition-all shadow-sm group"
              >
                <p className="text-white text-xs font-semibold group-hover:text-accent transition-colors">
                  {item.label}
                </p>
                <p className="text-muted text-[10px] mt-0.5">Quick search ➔</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
