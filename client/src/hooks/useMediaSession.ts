import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { usePlayer } from './usePlayer';

// A valid 1s mono 8kHz WAV silence — loops to keep iOS media session alive
const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

export function useMediaSession() {
  const { player } = useStore();
  const { play, pause, next, previous, seek, setVolume } = usePlayer();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volumeSyncRef = useRef<number>(player.volume);

  // ── 1. Create silent audio element once ──────────────────────────────────
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio(SILENT_WAV);
      audio.loop = true;
      audio.preload = 'auto';
      audioRef.current = audio;
    }

    const startAudio = () => {
      const audio = audioRef.current;
      if (audio && audio.paused) {
        audio.play().catch(() => {});
      }
    };

    // Listen on any user interaction to keep audio active on mobile devices
    window.addEventListener('touchstart', startAudio, { passive: true });
    window.addEventListener('touchend', startAudio, { passive: true });
    window.addEventListener('click', startAudio);
    window.addEventListener('pointerdown', startAudio, { passive: true });

    return () => {
      window.removeEventListener('touchstart', startAudio);
      window.removeEventListener('touchend', startAudio);
      window.removeEventListener('click', startAudio);
      window.removeEventListener('pointerdown', startAudio);
    };
  }, []);

  // Sync playback state with background audio so mobile OS keeps lock screen active
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (player.playing) {
      if (audio.paused) {
        audio.play().catch(() => {});
      }
    } else {
      if (!audio.paused) {
        audio.pause();
      }
    }
  }, [player.playing]);

  // ── 3. Hardware volume button bridge ──────────────────────────────────────
  //    Sync silent audio volume to player volume. When user presses hardware
  //    volume buttons, iOS changes audio.volume and fires onvolumechange.
  //    We forward that delta to the server so the real YouTube volume changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Keep silent audio volume in sync with player volume
    const targetVol = Math.max(0.01, Math.min(1, player.volume / 100));
    if (Math.abs(audio.volume - targetVol) > 0.01) {
      audio.volume = targetVol;
    }
    volumeSyncRef.current = player.volume;

    const handleVolumeChange = () => {
      const newVol = Math.round(audio.volume * 100);
      // Only forward if meaningfully different (avoids feedback loops)
      if (Math.abs(newVol - volumeSyncRef.current) >= 3) {
        volumeSyncRef.current = newVol;
        setVolume(newVol);
      }
    };

    audio.addEventListener('volumechange', handleVolumeChange);
    return () => audio.removeEventListener('volumechange', handleVolumeChange);
  }, [player.volume, setVolume]);

  // ── 4. Lock Screen / Control Center MediaSession ──────────────────────────
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    if (player.videoId && player.title) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: player.title || 'YouTube Remote',
        artist: player.channel || 'Home Theater',
        album: 'YouTube Remote ▶ Home Theater',
        artwork: player.thumbnail
          ? [
              { src: player.thumbnail, sizes: '96x96',   type: 'image/jpeg' },
              { src: player.thumbnail, sizes: '128x128', type: 'image/jpeg' },
              { src: player.thumbnail, sizes: '192x192', type: 'image/jpeg' },
              { src: player.thumbnail, sizes: '512x512', type: 'image/jpeg' },
            ]
          : [],
      });
    }

    navigator.mediaSession.playbackState = player.playing ? 'playing' : 'paused';

    navigator.mediaSession.setActionHandler('play', () => play());
    navigator.mediaSession.setActionHandler('pause', () => pause());
    navigator.mediaSession.setActionHandler('stop', () => pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => previous());
    navigator.mediaSession.setActionHandler('nexttrack', () => next());
    navigator.mediaSession.setActionHandler('seekto', (d) => {
      if (typeof d.seekTime === 'number') seek(d.seekTime);
    });
    navigator.mediaSession.setActionHandler('seekbackward', () =>
      seek(Math.max(0, player.currentTime - 10))
    );
    navigator.mediaSession.setActionHandler('seekforward', () =>
      seek(Math.min(player.duration, player.currentTime + 10))
    );

    // Provide seek bar position on lock screen (iOS 15+ / Android)
    if (player.duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: player.duration,
          position: Math.min(player.currentTime, player.duration),
          playbackRate: 1,
        });
      } catch { /* older iOS versions may not support setPositionState */ }
    }
  }, [player, play, pause, next, previous, seek]);
}
