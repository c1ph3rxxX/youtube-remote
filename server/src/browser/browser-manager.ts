import 'dotenv/config';
import { chromium, Browser, Page, BrowserContext } from 'playwright';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { logger } from '../logger';
import { playerState } from '../player/player-state';
import { queueManager } from '../queue/queue-manager';
import { addToHistory } from '../db/history';

function findChromeExecutable(): string | undefined {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  const platform = process.platform;
  const candidates: string[] = [];

  if (platform === 'win32') {
    const progFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
    const progFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');

    candidates.push(
      path.join(progFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(progFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(progFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(progFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
    );
  } else if (platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
    );
  } else {
    // Linux
    candidates.push(
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium'
    );
  }

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

const PROFILE_DIR = process.env.CHROMIUM_PROFILE_DIR || path.join(os.homedir(), '.youtube-remote', 'chromium-profile');

type StateChangeCallback = (state: ReturnType<typeof playerState.get>) => void;
type QueueEndedCallback = () => void;
type BrowserStatusCallback = (running: boolean, crashed: boolean) => void;
type BroadcastQueueFn = () => void;

class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private isLaunching = false;
  private onStateChange?: StateChangeCallback;
  private onQueueEnded?: QueueEndedCallback;
  private onBrowserStatus?: BrowserStatusCallback;
  private stateInterval?: NodeJS.Timeout;
  broadcastQueueFn?: BroadcastQueueFn;

  setCallbacks(
    onStateChange: StateChangeCallback,
    onQueueEnded: QueueEndedCallback,
    onBrowserStatus: BrowserStatusCallback,
    broadcastQueueFn?: BroadcastQueueFn
  ) {
    this.onStateChange = onStateChange;
    this.onQueueEnded = onQueueEnded;
    this.onBrowserStatus = onBrowserStatus;
    if (broadcastQueueFn) this.broadcastQueueFn = broadcastQueueFn;
  }

  isRunning(): boolean {
    return this.browser !== null && this.page !== null;
  }

  async launch(): Promise<void> {
    if (this.isLaunching || this.isRunning()) return;
    this.isLaunching = true;

    try {
      if (!fs.existsSync(PROFILE_DIR)) {
        fs.mkdirSync(PROFILE_DIR, { recursive: true });
      }

      logger.info('Launching Chromium with stealth configuration...');

      const detectedPath = findChromeExecutable();
      const launchOptions: any = {
        headless: false,
        ignoreDefaultArgs: [
          '--enable-automation',
          '--disable-extensions',
          '--disable-component-extensions-with-background-pages',
          '--disable-default-apps',
          '--disable-component-update',
        ],
        args: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
          '--autoplay-policy=no-user-gesture-required',
          '--disable-features=PreloadMediaEngagementData,Translate,OptimizationHints',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows',
          '--start-maximized',
          '--window-size=1280,720',
        ],
        viewport: null,
        ignoreHTTPSErrors: true,
      };

      if (detectedPath) {
        launchOptions.executablePath = detectedPath;
        logger.info(`Using Chrome binary: ${detectedPath}`);
      } else {
        launchOptions.channel = 'chrome';
        logger.info('Using Playwright default Chrome channel');
      }

      this.context = await chromium.launchPersistentContext(PROFILE_DIR, launchOptions);


      // Stealth, Ad-blocking, 144p Quality & Volume Enforcement Scripts
      await this.context.addInitScript(() => {
        // Mask webdriver
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
        // Spoof languages and plugins
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });

        // Set persistent 144p preference in localStorage
        try {
          localStorage.setItem('yt-player-quality', JSON.stringify({
            data: JSON.stringify({ quality: 144, previousQuality: 144 }),
            expiration: Date.now() + 86400000 * 365,
            creation: Date.now(),
          }));
        } catch {}

        // Enable autoplay in YouTube player so the Next button appears in Chrome controls
        try {
          localStorage.setItem('yt-player-autonav', JSON.stringify({
            data: '1',
            expiration: Date.now() + 86400000 * 365,
            creation: Date.now(),
          }));
          localStorage.setItem('yt-autoplay', 'true');
        } catch {}

        // Background loop: auto-skip ads, lock 144p quality, enforce volume & enable autoplay
        setInterval(() => {
          try {
            // 1. Auto-skip ads
            const skipBtn = document.querySelector('.ytp-skip-ad-button, .ytp-ad-skip-button, .ytp-ad-skip-button-modern, button.ytp-ad-skip-button') as HTMLElement;
            if (skipBtn) skipBtn.click();

            // 2. "Are you still watching?" dialog
            const confirmBtn = document.querySelector('yt-confirm-dialog-renderer #confirm-button button, ytd-popup-container #confirm-button button') as HTMLElement;
            if (confirmBtn) confirmBtn.click();

            // 3. Consent / Sign-in promo overlays
            const consentBtn = document.querySelector('.ytd-consent-bump-v2-lightbox button, #ytd-consent button, ytd-mealbar-promo-renderer #dismiss-button button') as HTMLElement;
            if (consentBtn) consentBtn.click();

            // 4. Retry button if error overlay is shown
            const retryBtn = document.querySelector('.ytp-error .ytp-retry-button, ytd-player-error-message-renderer button') as HTMLElement;
            if (retryBtn) retryBtn.click();

            // 5. Force 144p quality (saves CPU on Intel i3 server)
            const player = (document.getElementById('movie_player') || document.querySelector('.html5-video-player')) as any;
            if (player && typeof player.setPlaybackQualityRange === 'function') {
              const currentQ = player.getPlaybackQuality?.();
              if (currentQ && currentQ !== 'tiny' && currentQ !== 'small') {
                player.setPlaybackQualityRange('tiny', 'small');
                player.setPlaybackQuality('tiny');
              }
            }

            // 6. Ensure Autoplay toggle is ON in YouTube so the Next button is always visible
            const autonavToggle = document.querySelector('.ytp-autonav-toggle-button[aria-checked="false"]') as HTMLElement;
            if (autonavToggle) autonavToggle.click();

            // 7. Enforce saved volume — read from localStorage key we write from Node.js
            //    Enforce both on HTML5 video element AND on YouTube player API (#movie_player)
            const savedVolStr = localStorage.getItem('yt-remote-volume') || '80';
            const savedVol = parseFloat(savedVolStr);
            const savedMuted = localStorage.getItem('yt-remote-muted') === 'true';
            const targetVol = Math.max(0, Math.min(1, savedVol / 100));

            const video = document.querySelector('video') as HTMLVideoElement;
            if (video) {
              if (Math.abs(video.volume - targetVol) > 0.01) {
                video.volume = targetVol;
              }
              if (video.muted !== savedMuted) {
                video.muted = savedMuted;
              }
            }

            if (player && typeof player.setVolume === 'function') {
              const currentPVol = player.getVolume?.();
              if (typeof currentPVol === 'number' && Math.abs(currentPVol - savedVol) > 2) {
                player.setVolume(savedVol);
              }
              if (savedMuted && player.isMuted && !player.isMuted()) {
                player.mute?.();
              } else if (!savedMuted && player.isMuted && player.isMuted()) {
                player.unMute?.();
              }
            }
          } catch {}
        }, 500);
      });

      this.browser = this.context.browser();
      const pages = this.context.pages();
      this.page = pages.length > 0 ? pages[0] : await this.context.newPage();

      // Navigate to YouTube (resilient) and set initial volume
      try {
        await this.page.goto('https://www.youtube.com', { waitUntil: 'domcontentloaded', timeout: 15000 });
        const initialVol = playerState.get().volume;
        await this.page.evaluate((vol: number) => {
          localStorage.setItem('yt-remote-volume', String(vol));
          localStorage.setItem('yt-remote-muted', 'false');
          try {
            localStorage.setItem('yt-player-volume', JSON.stringify({
              data: JSON.stringify({ volume: vol, muted: false }),
              expiration: Date.now() + 86400000 * 365,
              creation: Date.now(),
            }));
            localStorage.setItem('yt-player-autonav', JSON.stringify({
              data: '1',
              expiration: Date.now() + 86400000 * 365,
              creation: Date.now(),
            }));
          } catch {}
        }, initialVol).catch(() => {});
        logger.info('Chromium launched and YouTube loaded');
      } catch (navErr) {
        logger.warn({ err: navErr }, 'Initial YouTube navigation notice (ready for playback)');
      }

      this.context.on('close', () => this.handleCrash());

      this.onBrowserStatus?.(true, false);
      this.startStatePolling();
    } catch (err) {
      logger.error({ err }, 'Failed to launch Chromium');
      this.browser = null;
      this.context = null;
      this.page = null;
      this.onBrowserStatus?.(false, true);
    } finally {
      this.isLaunching = false;
    }
  }

  private async handleCrash() {
    logger.warn('Chromium crashed or closed, attempting restart in 3s...');
    this.browser = null;
    this.context = null;
    this.page = null;
    if (this.stateInterval) clearInterval(this.stateInterval);
    this.onBrowserStatus?.(false, true);
    await new Promise(r => setTimeout(r, 3000));
    await this.launch();
  }

  async playVideo(videoId: string): Promise<void> {
    if (!this.page) throw new Error('Browser not running');
    const savedVolume = playerState.get().volume;
    const savedMuted = playerState.get().muted;

    // Write volume and autoplay settings to localStorage BEFORE navigation
    await this.page.evaluate(([vol, muted]: [number, boolean]) => {
      localStorage.setItem('yt-remote-volume', String(vol));
      localStorage.setItem('yt-remote-muted', String(muted));
      try {
        localStorage.setItem('yt-player-volume', JSON.stringify({
          data: JSON.stringify({ volume: vol, muted }),
          expiration: Date.now() + 86400000 * 365,
          creation: Date.now(),
        }));
        localStorage.setItem('yt-player-autonav', JSON.stringify({
          data: '1',
          expiration: Date.now() + 86400000 * 365,
          creation: Date.now(),
        }));
      } catch {}
    }, [savedVolume, savedMuted] as [number, boolean]).catch(() => {});

    const url = `https://www.youtube.com/watch?v=${videoId}&autoplay=1`;
    logger.info(`Playing video: ${videoId}`);
    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (navErr) {
      logger.warn({ err: navErr }, 'Navigation notice, continuing to playback check');
    }

    // Set volume on video element & movie_player API as soon as available
    try {
      await this.page.waitForSelector('video', { timeout: 10000 });
      await this.page.evaluate(([vol, muted]: [number, boolean]) => {
        const video = document.querySelector('video') as HTMLVideoElement;
        if (video) {
          if (video.paused) video.play().catch(() => {});
          video.volume = Math.max(0, Math.min(1, vol / 100));
          video.muted = muted;
        }
        const player = (document.getElementById('movie_player') || document.querySelector('.html5-video-player')) as any;
        if (player && typeof player.setVolume === 'function') {
          player.setVolume(vol);
          if (muted) player.mute?.(); else player.unMute?.();
        }
      }, [savedVolume, savedMuted] as [number, boolean]);
    } catch (err) {
      logger.warn({ err }, 'Video element timeout');
    }
  }

  async play(): Promise<void> {
    if (!this.page) return;
    await this.page.evaluate(() => {
      const player = (document.getElementById('movie_player') || document.querySelector('.html5-video-player')) as any;
      if (player && typeof player.playVideo === 'function') {
        player.playVideo();
      } else {
        const video = document.querySelector('video') as HTMLVideoElement;
        if (video) video.play();
      }
    });
  }

  async pause(): Promise<void> {
    if (!this.page) return;
    await this.page.evaluate(() => {
      const player = (document.getElementById('movie_player') || document.querySelector('.html5-video-player')) as any;
      if (player && typeof player.pauseVideo === 'function') {
        player.pauseVideo();
      } else {
        const video = document.querySelector('video') as HTMLVideoElement;
        if (video) video.pause();
      }
    });
  }

  async seek(seconds: number): Promise<void> {
    if (!this.page) return;
    await this.page.evaluate((s: number) => {
      const player = (document.getElementById('movie_player') || document.querySelector('.html5-video-player')) as any;
      if (player && typeof player.seekTo === 'function') {
        player.seekTo(s, true);
      } else {
        const video = document.querySelector('video') as HTMLVideoElement;
        if (video) video.currentTime = s;
      }
    }, seconds);
  }

  async setVolume(volume: number): Promise<void> {
    if (!this.page) return;
    const clamped = Math.max(0, Math.min(100, volume));
    await this.page.evaluate((vol: number) => {
      localStorage.setItem('yt-remote-volume', String(vol));
      try {
        localStorage.setItem('yt-player-volume', JSON.stringify({
          data: JSON.stringify({ volume: vol, muted: false }),
          expiration: Date.now() + 86400000 * 365,
          creation: Date.now(),
        }));
      } catch {}
      const player = (document.getElementById('movie_player') || document.querySelector('.html5-video-player')) as any;
      if (player && typeof player.setVolume === 'function') {
        player.setVolume(vol);
        player.unMute?.();
      }
      const video = document.querySelector('video') as HTMLVideoElement;
      if (video) {
        video.volume = vol / 100;
        video.muted = false;
      }
    }, clamped).catch(() => {});
    playerState.update({ volume: clamped, muted: false });
  }

  async setMute(muted: boolean): Promise<void> {
    if (!this.page) return;
    await this.page.evaluate((m: boolean) => {
      localStorage.setItem('yt-remote-muted', String(m));
      const player = (document.getElementById('movie_player') || document.querySelector('.html5-video-player')) as any;
      if (player) {
        if (m) player.mute?.(); else player.unMute?.();
      }
      const video = document.querySelector('video') as HTMLVideoElement;
      if (video) video.muted = m;
    }, muted).catch(() => {});
    playerState.update({ muted });
  }

  async getPlayerInfo(): Promise<{ currentTime: number; duration: number; playing: boolean; volume: number; muted: boolean; videoId: string | null } | null> {
    if (!this.page) return null;
    try {
      return await this.page.evaluate(() => {
        const video = document.querySelector('video') as HTMLVideoElement;
        if (!video) return null;
        const urlMatch = window.location.href.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
        return {
          currentTime: video.currentTime,
          duration: video.duration || 0,
          playing: !video.paused && !video.ended,
          volume: Math.round(video.volume * 100),
          muted: video.muted,
          videoId: urlMatch ? urlMatch[1] : null,
        };
      });
    } catch {
      return null;
    }
  }

  private startStatePolling() {
    if (this.stateInterval) clearInterval(this.stateInterval);
    let lastTrackedVideoId: string | null = null;
    let wasPlaying = false;

    this.stateInterval = setInterval(async () => {
      const info = await this.getPlayerInfo();
      if (!info) return;

      // Detect video change (e.g. user clicked song in Chrome directly OR skipped track)
      const currentStoredState = playerState.get();
      if (info.videoId && (info.videoId !== lastTrackedVideoId || currentStoredState.videoId !== info.videoId || !currentStoredState.title || currentStoredState.title === 'YouTube')) {
        lastTrackedVideoId = info.videoId;

        // Re-apply saved volume immediately to browser
        const savedVol = currentStoredState.volume;
        const savedMuted = currentStoredState.muted;
        if (this.page) {
          await this.page.evaluate(([vol, muted]: [number, boolean]) => {
            const v = document.querySelector('video') as HTMLVideoElement;
            if (v) { v.volume = Math.max(0, Math.min(1, vol / 100)); v.muted = muted; }
            const p = (document.getElementById('movie_player') || document.querySelector('.html5-video-player')) as any;
            if (p && typeof p.setVolume === 'function') {
              p.setVolume(vol);
              if (muted) p.mute?.(); else p.unMute?.();
            }
          }, [savedVol, savedMuted] as [number, boolean]).catch(() => {});
        }

        // Fetch up-to-date metadata from the page (title, channel, thumbnail)
        let meta = await this.getPageMetadata().catch(() => null);
        if (!meta || !meta.title || meta.title === 'YouTube') {
          // Fallback to Innertube video info if page DOM title is not ready yet
          const { getVideoInfo } = await import('../search/youtube-search');
          const fetched = await getVideoInfo(info.videoId);
          if (fetched) {
            meta = { title: fetched.title, channel: fetched.channel, thumbnail: fetched.thumbnail };
          }
        }

        if (meta && meta.title && meta.title !== 'YouTube') {
          const item = {
            id: info.videoId,
            videoId: info.videoId,
            title: meta.title,
            channel: meta.channel,
            thumbnail: meta.thumbnail || `https://i.ytimg.com/vi/${info.videoId}/mqdefault.jpg`,
            duration: info.duration || 0,
            source: 'youtube' as const,
          };

          playerState.update({
            videoId: info.videoId,
            title: meta.title,
            channel: meta.channel,
            thumbnail: meta.thumbnail || `https://i.ytimg.com/vi/${info.videoId}/mqdefault.jpg`,
            duration: info.duration || currentStoredState.duration,
          });

          // Sync queue with current video if not matched
          const currentQueueItem = queueManager.getCurrent();
          if (!currentQueueItem || currentQueueItem.videoId !== info.videoId) {
            queueManager.playNow(item);
          }

          // Broadcast updated video and queue to mobile devices
          const { broadcast, broadcastQueue } = await import('../api/websocket-handler');
          broadcast({ type: 'VIDEO_CHANGED', item });
          broadcastQueue();

          // Fetch and broadcast YouTube's actual sidebar suggestions
          this.fetchAndBroadcastRelated(info.videoId, () => this.broadcastQueueFn?.()).catch(() => {});
        }
      }

      // Detect video ended → advance queue
      if (wasPlaying && !info.playing && info.currentTime > 0 && info.duration > 0 &&
          Math.abs(info.currentTime - info.duration) < 2) {
        this.handleVideoEnded();
      }
      wasPlaying = info.playing;

      // Update state (volume is intentionally NOT overwritten from browser info)
      const state = playerState.update({
        currentTime: info.currentTime,
        duration: info.duration,
        playing: info.playing,
        muted: info.muted,
        videoId: info.videoId ?? undefined,
      });

      this.onStateChange?.(state);
    }, 1000);
  }

  /** Read title, channel, thumbnail directly from the YouTube page DOM */
  private async getPageMetadata(): Promise<{ title: string; channel: string; thumbnail: string } | null> {
    if (!this.page) return null;
    return this.page.evaluate(() => {
      const videoId = (window.location.href.match(/[?&]v=([a-zA-Z0-9_-]{11})/) || [])[1];
      const title =
        (document.querySelector('h1.ytd-video-primary-info-renderer yt-formatted-string, h1.style-scope.ytd-watch-metadata yt-formatted-string, #title h1 yt-formatted-string') as HTMLElement)?.innerText?.trim() ||
        (document.querySelector('ytd-watch-metadata #title yt-formatted-string') as HTMLElement)?.innerText?.trim() ||
        document.title.replace(' - YouTube', '').trim();
      const channel =
        (document.querySelector('#channel-name a, ytd-channel-name a, #owner #channel-name a') as HTMLElement)?.innerText?.trim() || '';
      const thumbnail = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';
      return { title: title || '', channel: channel || '', thumbnail };
    }).catch(() => null);
  }

  /**
   * Reads the exact related/up-next videos that YouTube Chrome is displaying.
   * Extracts links from DOM (modern lockup view model & compact video renderer).
   */
  async getYouTubeRelatedVideos(): Promise<{ videoId: string; title: string; channel: string; thumbnail: string; duration: number }[]> {
    if (!this.page) return [];

    return this.page.evaluate(() => {
      const results: { videoId: string; title: string; channel: string; thumbnail: string; duration: number }[] = [];
      const seenIds = new Set<string>();

      const currentVidMatch = window.location.href.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
      const currentVidId = currentVidMatch ? currentVidMatch[1] : '';

      const parseDurationFromAria = (aria: string): number => {
        const durMatch = aria.match(/(\d+)\s*minute/i);
        const secMatch = aria.match(/(\d+)\s*second/i);
        const hourMatch = aria.match(/(\d+)\s*hour/i);
        return (parseInt(hourMatch?.[1] || '0') * 3600) + (parseInt(durMatch?.[1] || '0') * 60) + parseInt(secMatch?.[1] || '0');
      };

      // Scan all watch links in the page sidebar
      const anchors = Array.from(document.querySelectorAll('a[href*="watch?v="]'));
      for (const a of anchors) {
        const match = (a as HTMLAnchorElement).href.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
        if (!match) continue;
        const id = match[1];
        if (id === currentVidId || seenIds.has(id)) continue;

        let title = '';
        let channel = '';
        let duration = 0;

        const aria = a.getAttribute('aria-label') || '';
        if (aria && !aria.startsWith('Next (') && !aria.startsWith('Previous (')) {
          duration = parseDurationFromAria(aria);
          // Strip duration suffixes like "3 minutes, 40 seconds" from title
          title = aria.replace(/\s*\d+\s*(hours?|minutes?|seconds?|,|\.)+/gi, '').trim();
        }

        const card = a.closest('ytd-compact-video-renderer, ytd-video-renderer, ytd-rich-item-renderer, ytd-lockup-view-model, lockup-view-model, div#dismissible, ytd-item-section-renderer');
        if (card) {
          if (!title) {
            const tEl = card.querySelector('#video-title, #video-title-link, .yt-core-attributed-string, h3');
            title = (tEl as HTMLElement)?.innerText?.trim() || '';
          }
          const cEl = card.querySelector('ytd-channel-name, #channel-name, .ytd-channel-name, [class*="channel"], [class*="byline"]');
          if (cEl) channel = (cEl as HTMLElement)?.innerText?.trim() || '';
        }

        if (id && title && title.length > 2 && !title.includes('Shift+N')) {
          seenIds.add(id);
          results.push({
            videoId: id,
            title,
            channel: channel || 'YouTube',
            thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
            duration,
          });
        }
      }

      return results;
    }).catch(() => []);
  }

  /** Called to scrape YouTube's actual sidebar and broadcast to all connected devices */
  async fetchAndBroadcastRelated(videoId: string, broadcastFn: () => void) {
    let related = await this.getYouTubeRelatedVideos();

    // If empty on first attempt, retry up to 3 times as YouTube renders sidebar asynchronously
    if (related.length === 0) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        await new Promise((r) => setTimeout(r, attempt * 1200));
        related = await this.getYouTubeRelatedVideos();
        if (related.length > 0) break;
      }
    }

    if (related.length > 0) {
      queueManager.setSuggested(
        related.map((r) => ({ ...r, source: 'youtube' as const })),
        videoId
      );
      broadcastFn();
      logger.info(`Loaded ${related.length} authentic suggestions from YouTube watch sidebar`);
    } else {
      logger.warn({ videoId }, 'YouTube sidebar not yet populated');
    }
  }





  private async handleVideoEnded() {
    const current = queueManager.getCurrent();
    if (current) {
      addToHistory({
        videoId: current.videoId,
        title: current.title,
        channel: current.channel,
        thumbnail: current.thumbnail,
        duration: current.duration,
      });
    }

    const state = playerState.get();
    if (state.repeat === 'one' && current) {
      await this.playVideo(current.videoId);
      return;
    }

    const next = queueManager.next(state.shuffle);
    if (next) {
      playerState.update({ videoId: next.videoId, title: next.title, channel: next.channel, thumbnail: next.thumbnail, duration: next.duration });
      await this.playVideo(next.videoId);
    } else if (state.repeat === 'all') {
      queueManager.setIndex(0);
      const first = queueManager.getCurrent();
      if (first) await this.playVideo(first.videoId);
    } else {
      this.onQueueEnded?.();
    }
  }

  async show(): Promise<void> {
    // Browser is already visible since headless: false
    logger.info('Browser is visible on desktop');
  }

  async restart(): Promise<void> {
    if (this.context) {
      try { await this.context.close(); } catch {}
    }
    this.browser = null;
    this.context = null;
    this.page = null;
    if (this.stateInterval) clearInterval(this.stateInterval);
    await this.launch();
  }

  async close(): Promise<void> {
    if (this.stateInterval) clearInterval(this.stateInterval);
    if (this.context) {
      try { await this.context.close(); } catch {}
    }
    this.browser = null;
    this.context = null;
    this.page = null;
  }
}

export const browserManager = new BrowserManager();
