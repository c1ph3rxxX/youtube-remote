import { Innertube, Parser } from 'youtubei.js';
import { logger } from '../logger';
import type { SearchResult } from '../types';

// Suppress internal AST parsing warnings
try {
  Parser.setParserErrorHandler(() => {});
} catch {}

let innertube: Awaited<ReturnType<typeof Innertube.create>> | null = null;

async function getInnertube() {
  if (!innertube) {
    innertube = await Innertube.create({ retrieve_player: false });
  }
  return innertube;
}

export async function searchYouTube(query: string, limit = 20): Promise<SearchResult[]> {
  try {
    const yt = await getInnertube();
    const results = await yt.search(query, { type: 'video' });
    const videos: SearchResult[] = [];

    for (const item of results.videos) {
      if (videos.length >= limit) break;
      if (!item || item.type !== 'Video') continue;
      const vid = item as any;
      const videoId = vid.id;
      if (!videoId) continue;
      const thumbnail = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
      const durationText = vid.duration?.text || '0:00';
      const duration = parseDuration(durationText);
      videos.push({
        videoId,
        title: vid.title?.text || 'Unknown',
        channel: vid.author?.name || 'Unknown',
        thumbnail,
        duration,
      });
    }
    return videos;
  } catch (err) {
    logger.error({ err }, 'YouTube search failed');
    return [];
  }
}

export async function getVideoInfo(videoId: string): Promise<SearchResult | null> {
  try {
    const yt = await getInnertube();
    const info = await yt.getBasicInfo(videoId);
    const vid = info?.basic_info;
    if (!vid) return null;
    return {
      videoId,
      title: vid.title || 'Unknown',
      channel: vid.channel?.name || 'Unknown',
      thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      duration: vid.duration || 0,
    };
  } catch (err) {
    logger.warn({ err, videoId }, 'Failed to get video info');
    return null;
  }
}

export async function getRelatedVideos(videoId: string, title?: string, channel?: string, limit = 15): Promise<SearchResult[]> {
  try {
    const yt = await getInnertube();

    // Build a smarter query focused on artist/genre rather than exact title
    // This gives varied recommendations instead of the same song
    let query = '';
    if (channel && channel !== 'Unknown') {
      // Primary: search by artist name to get their other songs
      query = channel.replace(/\s*(official|vevo|music|records|topic)\s*/gi, '').trim();
      if (title) {
        // Strip away album/movie names and decorators, keep just core song words
        const coreWords = title
          .replace(/\([^)]*\)|\[[^\]]*\]/g, '')   // remove (brackets) [brackets]
          .replace(/ft\..*|feat\..*|x\s+\w+/gi, '') // remove feat/ft
          .replace(/official.*|video|lyric|audio/gi, '') // remove official/video/lyric
          .trim()
          .split(/\s+/)
          .slice(0, 3)  // just first 3 words of title
          .join(' ');
        if (coreWords) query = `${channel} songs like ${coreWords}`;
        else query = `${channel} best songs`;
      }
    } else if (title) {
      const cleanTitle = title
        .replace(/\([^)]*\)|\[[^\]]*\]/g, '')
        .replace(/ft\..*|feat\..*|official.*|video/gi, '')
        .trim()
        .split(/\s+/)
        .slice(0, 4)
        .join(' ');
      query = `songs like ${cleanTitle}`;
    }

    if (!query) query = 'top music hits playlist';

    const results = await yt.search(query, { type: 'video' });
    const related: SearchResult[] = [];

    for (const item of results.videos) {
      if (related.length >= limit) break;
      if (!item || item.type !== 'Video') continue;
      const vid = item as any;
      const id = vid.id;
      // Skip the currently playing video
      if (!id || id === videoId) continue;
      const durationText = vid.duration?.text || '0:00';
      const dur = parseDuration(durationText);
      // Skip very short clips (< 60 seconds) - likely not full songs
      if (dur > 0 && dur < 60) continue;
      related.push({
        videoId: id,
        title: vid.title?.text || 'Unknown',
        channel: vid.author?.name || 'Unknown',
        thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
        duration: dur,
      });
    }

    return related;
  } catch (err) {
    logger.warn({ err, videoId }, 'Failed to get related videos, fallback to trending');
    return await searchYouTube('popular top music songs', limit);
  }
}

export async function getSuggestedMusic(limit = 15): Promise<SearchResult[]> {
  return await searchYouTube('top trending music songs', limit);
}

export function extractVideoId(input: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function parseDuration(text: string): number {
  const parts = text.split(':').reverse();
  let seconds = 0;
  if (parts[0]) seconds += parseInt(parts[0]) || 0;
  if (parts[1]) seconds += (parseInt(parts[1]) || 0) * 60;
  if (parts[2]) seconds += (parseInt(parts[2]) || 0) * 3600;
  return seconds;
}
