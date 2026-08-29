import { nanoid } from 'nanoid';
import { saveQueue, loadQueue } from '../db/queue-persist';
import type { QueueItem } from '../types';

class QueueManager {
  private queue: QueueItem[] = [];
  private currentIndex: number = -1;

  constructor() {
    this.restore();
  }

  restore() {
    try {
      const saved = loadQueue();
      if (saved && Array.isArray(saved.queue)) {
        // Filter out dummy/test items and ensure valid video IDs
        this.queue = saved.queue.filter(item => 
          item && item.videoId && (item.videoId.length === 11 || item.source === 'local')
        );
        this.currentIndex = Math.min(saved.currentIndex, this.queue.length - 1);
      }
    } catch {
      // DB not ready yet
    }
  }

  private persist() {
    saveQueue(this.queue, this.currentIndex);
  }

  getQueue(): QueueItem[] {
    return [...this.queue];
  }

  getCurrent(): QueueItem | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.queue.length) return null;
    return this.queue[this.currentIndex];
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  addToEnd(item: Omit<QueueItem, 'id'>): QueueItem {
    // Avoid duplicate additions in queue
    const existing = this.queue.find(q => q.videoId === item.videoId);
    if (existing) return existing;

    const newItem = { ...item, id: nanoid() };
    this.queue.push(newItem);
    this.persist();
    return newItem;
  }

  addNext(item: Omit<QueueItem, 'id'>): QueueItem {
    // Remove if already exists so it moves to next position
    const existingIdx = this.queue.findIndex(q => q.videoId === item.videoId);
    if (existingIdx !== -1) {
      this.queue.splice(existingIdx, 1);
      if (existingIdx <= this.currentIndex && this.currentIndex > 0) this.currentIndex--;
    }

    const newItem = { ...item, id: nanoid() };
    const insertAt = this.currentIndex + 1;
    this.queue.splice(insertAt, 0, newItem);
    this.persist();
    return newItem;
  }

  playNow(item: Omit<QueueItem, 'id'>): QueueItem {
    const existingIdx = this.queue.findIndex(q => q.videoId === item.videoId);
    if (existingIdx !== -1) {
      this.currentIndex = existingIdx;
      this.persist();
      return this.queue[existingIdx];
    }
    const newItem = { ...item, id: nanoid() };
    const insertAt = this.currentIndex < 0 ? 0 : this.currentIndex + 1;
    this.queue.splice(insertAt, 0, newItem);
    this.currentIndex = insertAt;
    this.persist();
    return newItem;
  }

  remove(id: string): boolean {
    const idx = this.queue.findIndex(q => q.id === id);
    if (idx === -1) return false;
    this.queue.splice(idx, 1);
    if (idx < this.currentIndex) this.currentIndex--;
    else if (idx === this.currentIndex) this.currentIndex = Math.min(this.currentIndex, this.queue.length - 1);
    this.persist();
    return true;
  }

  reorder(ids: string[]): void {
    const currentId = this.getCurrent()?.id;
    const newQueue: QueueItem[] = [];
    for (const id of ids) {
      const item = this.queue.find(q => q.id === id);
      if (item) newQueue.push(item);
    }
    this.queue = newQueue;
    if (currentId) {
      this.currentIndex = this.queue.findIndex(q => q.id === currentId);
    }
    this.persist();
  }

  clear(): void {
    this.queue = [];
    this.currentIndex = -1;
    this.persist();
  }

  private suggested: QueueItem[] = [];

  getSuggested(): QueueItem[] {
    return [...this.suggested];
  }

  setSuggested(items: Omit<QueueItem, 'id'>[], currentVideoId?: string): void {
    const queueVideoIds = new Set(this.queue.map(q => q.videoId));
    // Also exclude the currently playing video
    const current = this.getCurrent();
    if (current) queueVideoIds.add(current.videoId);
    if (currentVideoId) queueVideoIds.add(currentVideoId);

    const seen = new Set<string>();
    const filtered: QueueItem[] = [];

    for (const item of items) {
      if (!item.videoId || item.videoId.length !== 11) continue;
      if (queueVideoIds.has(item.videoId)) continue;
      if (seen.has(item.videoId)) continue;
      seen.add(item.videoId);
      filtered.push({ ...item, id: nanoid() });
    }
    this.suggested = filtered;
  }

  popSuggested(): QueueItem | null {
    const item = this.suggested.shift();
    if (item) {
      this.addToEnd(item);
      return item;
    }
    return null;
  }

  next(shuffle = false): QueueItem | null {
    if (this.queue.length === 0) {
      return this.popSuggested();
    }
    if (shuffle) {
      const nextIdx = Math.floor(Math.random() * this.queue.length);
      this.currentIndex = nextIdx;
      this.persist();
      return this.queue[this.currentIndex];
    }
    
    if (this.currentIndex + 1 < this.queue.length) {
      this.currentIndex++;
      this.persist();
      return this.queue[this.currentIndex];
    }

    // End of user queue -> check suggested
    const autoNext = this.popSuggested();
    if (autoNext) {
      this.currentIndex = this.queue.length - 1;
      this.persist();
      return autoNext;
    }

    return null;
  }

  previous(): QueueItem | null {
    if (this.queue.length === 0) return null;
    this.currentIndex = Math.max(0, this.currentIndex - 1);
    this.persist();
    return this.queue[this.currentIndex];
  }

  setIndex(index: number): QueueItem | null {
    if (index < 0 || index >= this.queue.length) return null;
    this.currentIndex = index;
    this.persist();
    return this.queue[this.currentIndex];
  }
}

export const queueManager = new QueueManager();
