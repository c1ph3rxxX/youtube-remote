import React from 'react';

interface EqualizerWaveProps {
  playing?: boolean;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EqualizerWave({ playing = true, color = '#10b981', size = 'md' }: EqualizerWaveProps) {
  const heightClass = size === 'sm' ? 'h-3.5' : size === 'lg' ? 'h-5' : 'h-4';
  const barWidth = size === 'sm' ? 'w-[2px]' : size === 'lg' ? 'w-[3.5px]' : 'w-[2.5px]';

  if (!playing) {
    return (
      <div className={`flex items-end gap-[2px] ${heightClass} px-0.5`}>
        <div className={`${barWidth} h-1 rounded-full opacity-40`} style={{ backgroundColor: color }} />
        <div className={`${barWidth} h-1.5 rounded-full opacity-40`} style={{ backgroundColor: color }} />
        <div className={`${barWidth} h-1 rounded-full opacity-40`} style={{ backgroundColor: color }} />
        <div className={`${barWidth} h-0.5 rounded-full opacity-40`} style={{ backgroundColor: color }} />
      </div>
    );
  }

  return (
    <div className={`eq-container ${heightClass}`}>
      <div className={`eq-bar ${barWidth}`} style={{ backgroundColor: color }} />
      <div className={`eq-bar ${barWidth}`} style={{ backgroundColor: color }} />
      <div className={`eq-bar ${barWidth}`} style={{ backgroundColor: color }} />
      <div className={`eq-bar ${barWidth}`} style={{ backgroundColor: color }} />
    </div>
  );
}
