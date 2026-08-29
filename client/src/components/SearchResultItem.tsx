import React, { useState } from 'react';
import { usePlayer } from '../hooks/usePlayer';
import type { SearchResult } from '../types';
import { Play, ListPlus, CornerDownRight, MoreVertical } from 'lucide-react';

function fmt(s: number) {
  if (!s) return '';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function SearchResultItem({ item }: { item: SearchResult }) {
  const { playVideo, addToQueue } = usePlayer();
  const [showMenu, setShowMenu] = useState(false);

  const handlePlay = () => {
    playVideo(item.videoId, {
      title: item.title,
      channel: item.channel,
      thumbnail: item.thumbnail,
      duration: item.duration,
    });
    setShowMenu(false);
  };

  const handleAddToQueue = (position: 'end' | 'next') => {
    addToQueue(
      {
        videoId: item.videoId,
        title: item.title,
        channel: item.channel,
        thumbnail: item.thumbnail,
        duration: item.duration,
        source: 'youtube',
      },
      position
    );
    setShowMenu(false);
  };

  return (
    <div className="relative group">
      <div
        className="flex items-center gap-3 px-4 py-2.5 active:bg-white/[0.06] hover:bg-white/[0.03] transition-colors cursor-pointer"
        onClick={handlePlay}
      >
        {/* Thumbnail with duration overlay badge */}
        <div className="relative flex-shrink-0">
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-16 h-11 rounded-xl object-cover bg-card shadow-sm border border-white/10"
            loading="lazy"
          />
          {item.duration > 0 && (
            <span className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-sm text-[9px] font-mono font-bold text-white px-1.5 py-0.5 rounded-md leading-none">
              {fmt(item.duration)}
            </span>
          )}
        </div>

        {/* Title and metadata */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs sm:text-sm font-semibold line-clamp-2 leading-snug group-hover:text-accent transition-colors">
            {item.title}
          </p>
          <p className="text-text-dim text-[11px] mt-0.5 truncate font-medium">{item.channel}</p>
        </div>

        {/* Action button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-white active:scale-90 transition-all flex-shrink-0 hover:bg-white/[0.06]"
          aria-label="More options"
        >
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Floating Action Menu Modal */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]" onClick={() => setShowMenu(false)} />
          <div className="absolute right-4 top-10 z-50 bg-surface-elevated/95 backdrop-blur-2xl border border-white/15 rounded-2xl overflow-hidden shadow-2xl min-w-[200px] p-1.5 animate-in fade-in zoom-in-95">
            <button
              onClick={handlePlay}
              className="w-full text-left px-3.5 py-2.5 text-white text-xs font-semibold hover:bg-white/[0.08] active:bg-white/[0.12] rounded-xl flex items-center gap-2.5 transition-colors"
            >
              <div className="w-6 h-6 rounded-lg bg-accent/20 text-accent flex items-center justify-center">
                <Play size={12} className="fill-current" />
              </div>
              <span>Play Now</span>
            </button>

            <button
              onClick={() => handleAddToQueue('next')}
              className="w-full text-left px-3.5 py-2.5 text-white text-xs font-semibold hover:bg-white/[0.08] active:bg-white/[0.12] rounded-xl flex items-center gap-2.5 transition-colors"
            >
              <div className="w-6 h-6 rounded-lg bg-accent-cyan/20 text-accent-cyan flex items-center justify-center">
                <CornerDownRight size={13} />
              </div>
              <span>Play Next</span>
            </button>

            <button
              onClick={() => handleAddToQueue('end')}
              className="w-full text-left px-3.5 py-2.5 text-white text-xs font-semibold hover:bg-white/[0.08] active:bg-white/[0.12] rounded-xl flex items-center gap-2.5 transition-colors"
            >
              <div className="w-6 h-6 rounded-lg bg-accent-purple/20 text-accent-purple flex items-center justify-center">
                <ListPlus size={13} />
              </div>
              <span>Add to Queue</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
