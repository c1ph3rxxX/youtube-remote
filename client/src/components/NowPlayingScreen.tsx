import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { usePlayer } from '../hooks/usePlayer';
import { EqualizerWave } from './EqualizerWave';
import {
  ChevronDown,
  Heart,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Volume1,
  Shuffle,
  Repeat,
  Repeat1,
  ExternalLink,
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react';

function fmt(s: number) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function NowPlayingScreen() {
  const { player, setShowNowPlaying } = useStore();
  const { play, pause, next, previous, seek, setVolume, setMute, setShuffle, setRepeat } = usePlayer();
  const [localTime, setLocalTime] = useState(player.currentTime);
  const [dragging, setDragging] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isHeartPopping, setIsHeartPopping] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!dragging) setLocalTime(player.currentTime);
  }, [player.currentTime, dragging]);

  useEffect(() => {
    if (player.playing && !dragging) {
      intervalRef.current = setInterval(() => setLocalTime((t) => Math.min(t + 1, player.duration)), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [player.playing, dragging, player.duration]);

  const handleFavorite = async () => {
    if (!player.videoId) return;
    setIsHeartPopping(true);
    setIsFavorited(!isFavorited);
    setTimeout(() => setIsHeartPopping(false), 400);

    const token = localStorage.getItem('yt-remote-token') || '';
    try {
      await fetch('/api/favorites/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          videoId: player.videoId,
          title: player.title,
          channel: player.channel,
          thumbnail: player.thumbnail,
          duration: player.duration,
        }),
      });
    } catch {}
  };

  const nextRepeat = () => {
    const order: Array<'none' | 'one' | 'all'> = ['none', 'all', 'one'];
    const idx = order.indexOf(player.repeat);
    setRepeat(order[(idx + 1) % order.length]);
  };

  const volumePresets = [25, 50, 75, 100];

  return (
    <div className="fixed inset-0 z-50 bg-[#08090d] flex flex-col overflow-hidden select-none">
      {/* Dynamic Ambient Background Mesh */}
      {player.thumbnail ? (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -inset-10 opacity-35 scale-125 filter blur-3xl transition-all duration-1000"
            style={{
              backgroundImage: `url(${player.thumbnail})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#08090d]/80 to-[#08090d]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/15 via-transparent to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-surface via-bg to-bg" />
      )}

      {/* Main Content Container */}
      <div className="relative flex-1 flex flex-col justify-between pt-safe px-5 pb-5 overflow-y-auto overscroll-contain max-w-md w-full mx-auto min-h-0 z-10">
        {/* Header Bar */}
        <div className="flex items-center justify-between flex-shrink-0 py-2">
          <button
            onClick={() => setShowNowPlaying(false)}
            className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white rounded-full bg-white/[0.06] backdrop-blur-md border border-white/10 active:scale-90 transition-all shadow-sm"
            aria-label="Collapse"
          >
            <ChevronDown size={22} />
          </button>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/10 shadow-sm">
            <EqualizerWave playing={player.playing} size="sm" color="#10b981" />
            <span className="text-white/90 font-medium text-xs tracking-wider uppercase">
              {player.playing ? 'Playing on TV' : 'Paused'}
            </span>
          </div>

          <button
            onClick={handleFavorite}
            className={`w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.06] backdrop-blur-md border border-white/10 active:scale-90 transition-all shadow-sm ${
              isFavorited ? 'text-accent-pink bg-accent-pink/15 border-accent-pink/30' : 'text-white/80 hover:text-white'
            } ${isHeartPopping ? 'scale-125' : ''}`}
            aria-label="Favorite"
          >
            <Heart size={20} className={isFavorited ? 'fill-accent-pink text-accent-pink' : ''} />
          </button>
        </div>

        {/* Floating Album Art Card */}
        <div className="flex-1 min-h-[160px] max-h-[310px] flex items-center justify-center my-auto py-3">
          <div className="relative group w-full max-w-[280px] sm:max-w-[310px] aspect-video">
            {/* Ambient artwork shadow */}
            {player.thumbnail && (
              <div
                className="absolute -inset-1 rounded-3xl opacity-60 blur-xl transition-all duration-700 group-hover:opacity-85"
                style={{
                  backgroundImage: `url(${player.thumbnail})`,
                  backgroundSize: 'cover',
                }}
              />
            )}

            {player.thumbnail ? (
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-card">
                <img
                  src={player.thumbnail}
                  alt={player.title}
                  className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
              </div>
            ) : (
              <div className="relative w-full h-full rounded-2xl bg-card/80 backdrop-blur-xl flex flex-col items-center justify-center border border-white/10 shadow-2xl">
                <span className="text-6xl animate-pulse">🎵</span>
              </div>
            )}
          </div>
        </div>

        {/* Track Info */}
        <div className="my-2 flex-shrink-0">
          <h2 className="text-white text-lg sm:text-xl font-bold leading-snug line-clamp-2 drop-shadow-sm">
            {player.title || 'Nothing playing'}
          </h2>
          <p className="text-text-dim text-sm mt-1 font-medium truncate flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block flex-shrink-0" />
            {player.channel || 'Home Theater Audio'}
          </p>
        </div>

        {/* Timeline Progress Slider */}
        <div className="my-2 flex-shrink-0">
          <input
            type="range"
            min={0}
            max={player.duration || 100}
            value={localTime}
            className="w-full accent-accent"
            onChange={(e) => {
              setDragging(true);
              setLocalTime(Number(e.target.value));
            }}
            onMouseUp={() => {
              seek(localTime);
              setDragging(false);
            }}
            onTouchEnd={() => {
              seek(localTime);
              setDragging(false);
            }}
          />
          <div className="flex justify-between text-text-dim text-xs font-mono font-medium mt-1">
            <span>{fmt(localTime)}</span>
            <span>{fmt(player.duration)}</span>
          </div>
        </div>

        {/* Primary Playback Controls */}
        <div className="flex items-center justify-between my-2 px-1 flex-shrink-0">
          <button
            onClick={previous}
            className="w-12 h-12 flex items-center justify-center text-white/80 hover:text-white active:scale-85 transition-all rounded-full hover:bg-white/[0.08]"
            aria-label="Previous"
          >
            <SkipBack size={26} className="fill-current" />
          </button>

          <button
            onClick={() => seek(Math.max(0, localTime - 10))}
            className="w-10 h-10 rounded-full flex flex-col items-center justify-center text-text-dim hover:text-white active:scale-90 transition-all bg-white/[0.05] border border-white/10"
            aria-label="-10s"
          >
            <RotateCcw size={16} />
            <span className="text-[9px] font-bold mt-0.5 leading-none">10</span>
          </button>

          {/* Glowing Hero Play Button */}
          <button
            onClick={() => (player.playing ? pause() : play())}
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-accent to-emerald-400 flex items-center justify-center text-black shadow-glow active:scale-90 transition-all duration-200 hover:brightness-110"
            aria-label={player.playing ? 'Pause' : 'Play'}
          >
            {player.playing ? (
              <Pause size={32} className="fill-black text-black ml-0" />
            ) : (
              <Play size={34} className="fill-black text-black ml-1" />
            )}
          </button>

          <button
            onClick={() => seek(Math.min(player.duration, localTime + 10))}
            className="w-10 h-10 rounded-full flex flex-col items-center justify-center text-text-dim hover:text-white active:scale-90 transition-all bg-white/[0.05] border border-white/10"
            aria-label="+10s"
          >
            <RotateCw size={16} />
            <span className="text-[9px] font-bold mt-0.5 leading-none">10</span>
          </button>

          <button
            onClick={next}
            className="w-12 h-12 flex items-center justify-center text-white/80 hover:text-white active:scale-85 transition-all rounded-full hover:bg-white/[0.08]"
            aria-label="Next"
          >
            <SkipForward size={26} className="fill-current" />
          </button>
        </div>

        {/* Tactile Volume Control Section */}
        <div className="my-2 bg-white/[0.04] backdrop-blur-xl rounded-2xl p-3 border border-white/10 shadow-glass-card flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setVolume(Math.max(0, player.volume - 5))}
              className="w-8 h-8 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white flex items-center justify-center active:scale-90 transition-transform flex-shrink-0 border border-white/5"
              aria-label="Volume Down"
            >
              <Minus size={16} />
            </button>

            <button
              onClick={() => setMute(!player.muted)}
              className="text-white/80 hover:text-white p-1 flex-shrink-0 active:scale-90 transition-transform"
              aria-label="Toggle mute"
            >
              {player.muted || player.volume === 0 ? (
                <VolumeX size={20} className="text-red-400" />
              ) : player.volume < 50 ? (
                <Volume1 size={20} className="text-accent" />
              ) : (
                <Volume2 size={20} className="text-accent" />
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
              <Plus size={16} />
            </button>
          </div>

          {/* Quick Preset Volume Chips */}
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

        {/* Secondary Options: Shuffle, Repeat, External */}
        <div className="flex items-center justify-around pt-1 flex-shrink-0 safe-bottom">
          <button
            onClick={() => setShuffle(!player.shuffle)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all active:scale-90 ${
              player.shuffle
                ? 'bg-accent/20 text-accent border border-accent/30 shadow-glow'
                : 'bg-white/[0.04] text-text-dim hover:text-white border border-white/5'
            }`}
            aria-label="Shuffle"
          >
            <Shuffle size={15} />
            <span>Shuffle</span>
          </button>

          <button
            onClick={nextRepeat}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all active:scale-90 ${
              player.repeat !== 'none'
                ? 'bg-accent/20 text-accent border border-accent/30 shadow-glow'
                : 'bg-white/[0.04] text-text-dim hover:text-white border border-white/5'
            }`}
            aria-label="Repeat"
          >
            {player.repeat === 'one' ? <Repeat1 size={15} /> : <Repeat size={15} />}
            <span>{player.repeat === 'one' ? 'Repeat 1' : player.repeat === 'all' ? 'Repeat All' : 'Repeat'}</span>
          </button>

          {player.videoId && (
            <a
              href={`https://www.youtube.com/watch?v=${player.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/[0.04] text-text-dim hover:text-white border border-white/5 backdrop-blur-md active:scale-90 transition-all"
              aria-label="Open on YouTube"
            >
              <ExternalLink size={14} />
              <span>YouTube</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
