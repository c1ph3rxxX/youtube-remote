import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../logger';
import type { AudioSink } from '../types';

const execAsync = promisify(exec);

export async function getAudioSinks(): Promise<AudioSink[]> {
  if (process.platform !== 'linux') {
    return [];
  }
  try {
    // Try wpctl first (PipeWire on Linux)
    const { stdout } = await execAsync('wpctl status');
    const sinks: AudioSink[] = [];
    const lines = stdout.split('\n');
    let inSinks = false;
    for (const line of lines) {
      if (line.includes('Sinks:')) { inSinks = true; continue; }
      if (inSinks && line.includes('Sources:')) break;
      if (inSinks && line.trim()) {
        const match = line.match(/(\*?)\s+(\d+)\.\s+(.+?)\s+(\[.+\])?$/);
        if (match) {
          sinks.push({
            id: match[2],
            name: match[3].trim(),
            description: match[3].trim(),
            isDefault: match[1] === '*',
          });
        }
      }
    }
    return sinks;
  } catch {
    return [];
  }
}

export async function setDefaultSink(sinkId: string): Promise<boolean> {
  if (process.platform !== 'linux') {
    return false;
  }
  try {
    await execAsync(`wpctl set-default ${sinkId}`);
    logger.info(`Audio sink set to ${sinkId}`);
    return true;
  } catch (err) {
    logger.error({ err }, 'Failed to set audio sink');
    return false;
  }
}

export async function setSystemVolume(volume: number): Promise<void> {
  if (process.platform !== 'linux') {
    return;
  }
  const pct = Math.max(0, Math.min(100, volume));
  try {
    await execAsync(`wpctl set-volume @DEFAULT_AUDIO_SINK@ ${pct}%`);
  } catch (err) {
    logger.warn({ err }, 'Failed to set system volume');
  }
}

