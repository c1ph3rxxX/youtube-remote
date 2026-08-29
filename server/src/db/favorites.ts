import { db } from './database';
import type { FavoriteItem } from '../types';

export function getFavorites(): FavoriteItem[] {
  return db.prepare('SELECT id, video_id as videoId, title, channel, thumbnail, duration, added_at as addedAt FROM favorites ORDER BY added_at DESC').all() as FavoriteItem[];
}

export function addFavorite(item: Omit<FavoriteItem, 'id' | 'addedAt'>): FavoriteItem {
  const stmt = db.prepare('INSERT OR REPLACE INTO favorites (video_id, title, channel, thumbnail, duration) VALUES (?, ?, ?, ?, ?)');
  const result = stmt.run(item.videoId, item.title, item.channel, item.thumbnail, item.duration);
  return getFavoriteById(result.lastInsertRowid as number)!;
}

export function removeFavorite(videoId: string): boolean {
  const result = db.prepare('DELETE FROM favorites WHERE video_id = ?').run(videoId);
  return result.changes > 0;
}

export function isFavorite(videoId: string): boolean {
  const row = db.prepare('SELECT 1 FROM favorites WHERE video_id = ?').get(videoId);
  return !!row;
}

function getFavoriteById(id: number): FavoriteItem | null {
  return db.prepare('SELECT id, video_id as videoId, title, channel, thumbnail, duration, added_at as addedAt FROM favorites WHERE id = ?').get(id) as FavoriteItem | null;
}
