import { db } from './database';
import type { HistoryItem } from '../types';

export function getHistory(limit = 50): HistoryItem[] {
  return db.prepare('SELECT id, video_id as videoId, title, channel, thumbnail, duration, played_at as playedAt FROM history ORDER BY played_at DESC LIMIT ?').all(limit) as HistoryItem[];
}

export function addToHistory(item: Omit<HistoryItem, 'id' | 'playedAt'>): void {
  db.prepare('INSERT INTO history (video_id, title, channel, thumbnail, duration) VALUES (?, ?, ?, ?, ?)').run(item.videoId, item.title, item.channel, item.thumbnail, item.duration);
  // Keep only last 200 entries
  db.prepare('DELETE FROM history WHERE id NOT IN (SELECT id FROM history ORDER BY played_at DESC LIMIT 200)').run();
}

export function removeFromHistory(id: number): boolean {
  const result = db.prepare('DELETE FROM history WHERE id = ?').run(id);
  return result.changes > 0;
}

export function clearHistory(): void {
  db.prepare('DELETE FROM history').run();
}
