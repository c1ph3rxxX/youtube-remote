import { db } from './database';
import type { QueueItem } from '../types';

export function saveQueue(queue: QueueItem[], currentIndex: number): void {
  const data = JSON.stringify({ queue, currentIndex });
  db.prepare('INSERT OR REPLACE INTO queue_persist (id, data) VALUES (1, ?)').run(data);
}

export function loadQueue(): { queue: QueueItem[]; currentIndex: number } | null {
  const row = db.prepare('SELECT data FROM queue_persist WHERE id = 1').get() as { data: string } | null;
  if (!row) return null;
  try {
    return JSON.parse(row.data);
  } catch {
    return null;
  }
}
