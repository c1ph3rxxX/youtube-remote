import React, { useCallback, useRef } from 'react';
import { useStore } from '../store';
import { SearchResultItem } from '../components/SearchResultItem';
import { Search, X, Flame, Music, Sparkles, Link, Radio } from 'lucide-react';

export function SearchTab() {
  const { searchQuery, searchResults, searching, setSearchQuery, setSearchResults, setSearching } = useStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const executeSearch = useCallback(
    async (query: string) => {
      if (!query.trim() || query.length < 2) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const token = localStorage.getItem('yt-remote-token') || '';
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    },
    [setSearchResults, setSearching]
  );

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!query.trim() || query.length < 2) {
        setSearchResults([]);
        return;
      }
      debounceRef.current = setTimeout(() => {
        executeSearch(query);
      }, 400);
    },
    [setSearchQuery, setSearchResults, executeSearch]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    executeSearch(searchQuery);
  };

  const handleUrlPaste = async (url: string) => {
    const token = localStorage.getItem('yt-remote-token') || '';
    try {
      const res = await fetch(`/api/video-info?url=${encodeURIComponent(url)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.videoId) setSearchResults([data]);
    } catch {}
  };

  const quickSearches = [
    { name: 'Trending India', icon: Flame, color: 'text-amber-400' },
    { name: 'Arijit Singh', icon: Music, color: 'text-accent' },
    { name: 'Lofi Chill', icon: Radio, color: 'text-accent-cyan' },
    { name: 'Top 50 Global', icon: Sparkles, color: 'text-accent-purple' },
    { name: 'Punjabi Hits', icon: Music, color: 'text-accent-pink' },
    { name: 'Bollywood 90s', icon: Music, color: 'text-emerald-400' },
  ];

  const isUrl = searchQuery.includes('youtube.com') || searchQuery.includes('youtu.be');

  return (
    <div className="flex flex-col h-full pt-safe max-w-md mx-auto w-full select-none">
      {/* Search Header */}
      <form onSubmit={handleSubmit} className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2.5 bg-white/[0.05] focus-within:bg-white/[0.08] border border-white/10 focus-within:border-accent/60 rounded-2xl px-4 py-3 shadow-inner-glow transition-all">
          <Search size={18} className="text-text-dim" />
          <input
            type="search"
            placeholder="Search songs, artists, or paste YouTube link..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder:text-muted focus:outline-none text-xs sm:text-sm font-medium"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="w-6 h-6 rounded-full flex items-center justify-center text-text-dim hover:text-white bg-white/10 active:scale-90 transition-all"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {isUrl && (
          <button
            type="button"
            onClick={() => handleUrlPaste(searchQuery)}
            className="mt-2 w-full bg-gradient-to-r from-accent to-accent-cyan text-black font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-glow"
          >
            <Link size={14} />
            <span>Load YouTube URL</span>
          </button>
        )}
      </form>

      {/* Results / Discovery View */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-nav">
        {searching && (
          <div className="flex flex-col gap-2 px-4 mt-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-3 items-center py-2 animate-pulse">
                <div className="w-16 h-11 rounded-xl bg-white/[0.06] flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-white/[0.08] rounded-md w-3/4" />
                  <div className="h-2.5 bg-white/[0.04] rounded-md w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!searching && searchResults.length > 0 && (
          <div className="divide-y divide-white/[0.05]">
            {searchResults.map((item) => (
              <SearchResultItem key={item.videoId} item={item} />
            ))}
          </div>
        )}

        {!searching && searchQuery.length >= 2 && searchResults.length === 0 && !isUrl && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-3">
              <Search size={28} className="text-muted" />
            </div>
            <p className="text-white font-semibold text-sm">No results for "{searchQuery}"</p>
            <p className="text-muted text-xs mt-1">Try another search or paste a direct YouTube link</p>
          </div>
        )}

        {!searchQuery && (
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-accent" />
              <p className="text-muted text-xs uppercase tracking-wider font-bold">Trending & Genres</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-6">
              {quickSearches.map((tag) => {
                const TagIcon = tag.icon;
                return (
                  <button
                    key={tag.name}
                    onClick={() => {
                      setSearchQuery(tag.name);
                      executeSearch(tag.name);
                    }}
                    className="flex items-center gap-2 px-3.5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-2xl text-xs font-semibold text-text-dim hover:text-white hover:border-accent/40 active:scale-95 transition-all text-left group"
                  >
                    <TagIcon size={14} className={tag.color} />
                    <span className="truncate group-hover:text-white">{tag.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col items-center justify-center py-10 text-center text-muted">
              <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center mb-2">
                <Music size={22} className="text-accent/60" />
              </div>
              <p className="text-xs font-medium text-text-dim">Search millions of songs & artists</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
