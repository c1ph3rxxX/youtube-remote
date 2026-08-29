import React from 'react';
import { useStore } from '../store';
import { usePlayer } from '../hooks/usePlayer';
import { EqualizerWave } from './EqualizerWave';
import { Play, Pause, SkipForward } from 'lucide-react';

export function MiniPlayer() {
  const { player, setShowNowPlaying } = useStore();
  const { play, pause, next } = usePlayer();

  if (!player.videoId) return null;

  return (
    <div className="px-3 pb-2 flex-shrink-0 z-20">
      <div
        className="bg-surface/90 backdrop-blur-2xl border border-white/10 rounded-2xl flex items-center gap-3 px-3 py-2 shadow-2xl active:bg-surface-elevated cursor-pointer select-none transition-all group hover:border-white/20"
        onClick={() => setShowNowPlaying(true)}
      >
        {/* Thumbnail with mini equalizer */}
        <div className="relative flex-shrink-0">
          {player.thumbnail ? (
            <img
              src={player.thumbnail}
              alt={player.title}
              className="w-11 h-11 rounded-xl object-cover bg-card shadow-md border border-white/10"
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-card flex items-center justify-center text-lg border border-white/10">
              🎵
            </div>
          )}

          {player.playing && (
            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
              <EqualizerWave playing={true} size="sm" color="#10b981" />
            </div>
          )}
        </div>

        {/* Title and Channel */}
        <div className="flex-1 min-w-0 pr-1">
          <p className="text-white text-xs sm:text-sm font-semibold truncate leading-tight group-hover:text-accent transition-colors">
            {player.title || 'No title'}
          </p>
          <p className="text-text-dim text-[11px] truncate mt-0.5 font-medium">
            {player.channel || 'Living Room TV'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              player.playing ? pause() : play();
            }}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-accent/15 hover:bg-accent/25 text-accent active:scale-90 transition-all border border-accent/20"
            aria-label={player.playing ? 'Pause' : 'Play'}
          >
            {player.playing ? (
              <Pause size={17} className="fill-accent text-accent" />
            ) : (
              <Play size={17} className="fill-accent text-accent ml-0.5" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/[0.08] text-white/80 hover:text-white active:scale-90 transition-all"
            aria-label="Next track"
          >
            <SkipForward size={18} className="fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}
