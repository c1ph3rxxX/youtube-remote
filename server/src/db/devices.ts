import { db } from './database';
import type { PairedDevice } from '../types';

export function getDevices(): PairedDevice[] {
  return db.prepare('SELECT id, token, name, created_at as createdAt, last_seen as lastSeen FROM devices ORDER BY created_at DESC').all() as PairedDevice[];
}

export function addDevice(token: string, name: string = 'Device'): PairedDevice {
  // If device with same name already exists, update its token instead of duplicating
  const existing = db.prepare('SELECT id FROM devices WHERE name = ?').get(name) as { id: number } | undefined;
  if (existing) {
    db.prepare("UPDATE devices SET token = ?, last_seen = datetime('now') WHERE id = ?").run(token, existing.id);
    return getDeviceById(existing.id)!;
  }
  const result = db.prepare('INSERT INTO devices (token, name) VALUES (?, ?)').run(token, name);
  return getDeviceById(result.lastInsertRowid as number)!;
}

export function validateToken(token: string): PairedDevice | null {
  const device = db.prepare('SELECT id, token, name, created_at as createdAt, last_seen as lastSeen FROM devices WHERE token = ?').get(token) as PairedDevice | null;
  if (device) {
    db.prepare('UPDATE devices SET last_seen = datetime(\'now\') WHERE token = ?').run(token);
  }
  return device;
}

export function removeDevice(id: number): boolean {
  const result = db.prepare('DELETE FROM devices WHERE id = ?').run(id);
  return result.changes > 0;
}

function getDeviceById(id: number): PairedDevice | null {
  return db.prepare('SELECT id, token, name, created_at as createdAt, last_seen as lastSeen FROM devices WHERE id = ?').get(id) as PairedDevice | null;
}
