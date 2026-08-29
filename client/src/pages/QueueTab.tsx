import React from 'react';
import { useStore } from '../store';
import { usePlayer } from '../hooks/usePlayer';
import { EqualizerWave } from '../components/EqualizerWave';
import { Sparkles, Trash2, Plus, X, ListMusic, Play } from 'lucide-react';

function fmt(s: number) {
  if (!s) return '';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function QueueTab() {
  const { queue, suggested, player } = useStore();
  const { playVideo, addToQueue, removeFromQueue, clearQueue } = usePlayer();

  return (
    <div className="flex flex-col h-full pt-safe max-w-md mx-auto w-full select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <ListMusic size={20} className="text-accent" />
          <h1 className="text-white font-bold text-base tracking-tight">Play Queue</h1>
          {queue.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-white/[0.08] text-white/90 text-xs font-semibold">
              {queue.length}
            </span>
          )}
        </div>

        {queue.length > 0 && (
          <button
            onClick={clearQueue}
            className="flex items-center gap-1 text-red-400 text-xs font-semibold px-2.5 py-1 rounded-xl bg-red-500/10 border border-red-500/20 active:scale-95 transition-all hover:bg-red-500/20"
          >
            <Trash2 size={12} />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Queue Body List */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-nav">
        {/* Now Playing Active Card */}
        {player.videoId && (
          <div className="mx-4 mb-4 mt-1">
            <p className="text-muted text-[11px] uppercase tracking-wider mb-2 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Now Playing
            </p>

            <div className="flex items-center gap-3 bg-white/[0.05] border border-white/10 rounded-2xl p-3 shadow-glass-card">
              <div className="relative flex-shrink-0">
                <img
                  src={player.thumbnail}
                  alt={player.title}
                  className="w-14 h-10 rounded-xl object-cover shadow-sm border border-white/10"
                />
                <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                  <EqualizerWave playing={player.playing} size="sm" color="#10b981" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white text-xs sm:text-sm font-semibold truncate leading-tight">{player.title}</p>
                <p className="text-text-dim text-[11px] truncate mt-0.5 font-medium">{player.channel}</p>
              </div>

              {player.playing ? (
                <span className="text-accent text-[11px] font-bold px-2 py-0.5 rounded-full bg-accent/15 border border-accent/30 flex-shrink-0">
                  Playing
                </span>
              ) : (
                <span className="text-muted text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 flex-shrink-0">
                  Paused
                </span>
              )}
            </div>
          </div>
        )}

        {/* User Added Queue */}
        {queue.length > 0 && (
          <div className="mb-4">
            <p className="text-muted text-[11px] uppercase tracking-wider px-4 mb-2 font-bold">
              Up Next ({queue.length})
            </p>
            <div className="divide-y divide-white/[0.04]">
              {queue.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-2.5 active:bg-white/[0.06] hover:bg-white/[0.03] transition-colors group"
                >
                  <span className="text-muted text-xs font-mono w-4 text-center flex-shrink-0 font-bold">
                    {idx + 1}
                  </span>
                  <div className="relative flex-shrink-0">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-13 h-9 rounded-xl object-cover bg-card shadow-sm border border-white/10"
                      loading="lazy"
                    />
                    {item.duration > 0 && (
                      <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-[8px] font-mono text-white px-1 rounded">
                        {fmt(item.duration)}
                      </span>
                    )}
                  </div>

                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() =>
                      playVideo(item.videoId, {
                        title: item.title,
                        channel: item.channel,
                        thumbnail: item.thumbnail,
                        duration: item.duration,
                      })
                    }
                  >
                    <p className="text-white text-xs sm:text-sm font-semibold truncate leading-tight group-hover:text-accent transition-colors">
                      {item.title}
                    </p>
                    <p className="text-text-dim text-[11px] truncate mt-0.5 font-medium">{item.channel}</p>
                  </div>

                  <button
                    onClick={() => removeFromQueue(item.id)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-red-400 active:scale-90 transition-all flex-shrink-0 hover:bg-white/[0.08]"
                    aria-label="Remove from queue"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* YouTube Authentic Suggestions / Autoplay */}
        {suggested && suggested.length > 0 && (
          <div className="mt-2">
            <div className="flex items-center justify-between px-4 mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-accent" />
                <p className="text-white font-bold text-xs uppercase tracking-wider">Suggested by YouTube</p>
              </div>
              <span className="text-text-dim text-[10px] bg-white/[0.06] px-2 py-0.5 rounded-full border border-white/10 font-medium">
                Autoplay next
              </span>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {suggested.map((item) => (
                <div
                  key={item.id || item.videoId}
                  className="flex items-center gap-3 px-4 py-2.5 active:bg-white/[0.06] hover:bg-white/[0.03] transition-colors group"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-13 h-9 rounded-xl object-cover bg-card shadow-sm border border-white/10"
                      loading="lazy"
                    />
                    {item.duration > 0 && (
                      <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-[8px] font-mono text-white px-1 rounded">
                        {fmt(item.duration)}
                      </span>
                    )}
                  </div>

                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() =>
                      playVideo(item.videoId, {
                        title: item.title,
                        channel: item.channel,
                        thumbnail: item.thumbnail,
                        duration: item.duration,
                      })
                    }
                  >
                    <p className="text-white text-xs sm:text-sm font-semibold truncate leading-tight group-hover:text-accent transition-colors">
                      {item.title}
                    </p>
                    <p className="text-text-dim text-[11px] truncate mt-0.5 font-medium">{item.channel}</p>
                  </div>

                  <button
                    onClick={() =>
                      addToQueue({
                        videoId: item.videoId,
                        title: item.title,
                        channel: item.channel,
                        thumbnail: item.thumbnail,
                        duration: item.duration,
                        source: 'youtube',
                      })
                    }
                    className="flex items-center gap-1 text-accent font-bold text-[11px] px-2.5 py-1 bg-accent/15 hover:bg-accent/25 border border-accent/30 rounded-xl active:scale-95 transition-all flex-shrink-0 shadow-sm"
                    aria-label="Add to queue"
                  >
                    <Plus size={12} className="stroke-[3]" />
                    <span>Queue</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {queue.length === 0 && (!suggested || suggested.length === 0) && (
          <div className="flex flex-col items-center justify-center gap-3 text-center px-6 py-16 my-auto">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-3xl">
              📭
            </div>
            <p className="text-white font-bold text-sm">Queue is empty</p>
            <p className="text-text-dim text-xs max-w-xs">
              Search for songs or play a track to let YouTube populate recommendations
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
