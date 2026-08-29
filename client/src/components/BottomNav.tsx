import React from 'react';
import { useStore } from '../store';
import { Home, Search, ListMusic, Settings } from 'lucide-react';

const tabs = [
  { id: 'home' as const, icon: Home, label: 'Home' },
  { id: 'search' as const, icon: Search, label: 'Search' },
  { id: 'queue' as const, icon: ListMusic, label: 'Queue' },
  { id: 'settings' as const, icon: Settings, label: 'Settings' },
];

export function BottomNav() {
  const { activeTab, setTab, queue } = useStore();

  return (
    <nav className="flex-shrink-0 flex bg-surface/95 backdrop-blur-2xl border-t border-white/[0.08] safe-bottom select-none z-30">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 min-h-[56px] gap-1 transition-all active:scale-90 relative ${
              isActive ? 'text-accent' : 'text-muted hover:text-white/70'
            }`}
            aria-label={tab.label}
          >
            {/* Top active indicator line */}
            {isActive && (
              <span className="absolute top-0 w-8 h-[2px] rounded-full bg-accent shadow-glow" />
            )}

            <div className="relative">
              <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'} />
              {tab.id === 'queue' && queue.length > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] px-1 rounded-full bg-accent text-[9px] font-bold text-black flex items-center justify-center">
                  {queue.length}
                </span>
              )}
            </div>

            <span className={`text-[10px] font-semibold tracking-tight ${isActive ? 'text-accent' : 'text-muted'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
