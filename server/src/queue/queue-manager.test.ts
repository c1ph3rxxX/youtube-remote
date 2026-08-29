import { queueManager } from './queue-manager';

const mockItem = (n: number) => ({
  videoId: `vid${n}`,
  title: `Song ${n}`,
  channel: `Artist ${n}`,
  thumbnail: `https://example.com/thumb${n}.jpg`,
  duration: n * 60,
  source: 'youtube' as const,
});

beforeEach(() => {
  queueManager.clear();
});

describe('QueueManager', () => {
  test('adds items to end', () => {
    queueManager.addToEnd(mockItem(1));
    queueManager.addToEnd(mockItem(2));
    expect(queueManager.getQueue()).toHaveLength(2);
  });

  test('removes items', () => {
    const item = queueManager.addToEnd(mockItem(1));
    queueManager.remove(item.id);
    expect(queueManager.getQueue()).toHaveLength(0);
  });

  test('clears queue', () => {
    queueManager.addToEnd(mockItem(1));
    queueManager.addToEnd(mockItem(2));
    queueManager.clear();
    expect(queueManager.getQueue()).toHaveLength(0);
  });

  test('reorders queue', () => {
    const a = queueManager.addToEnd(mockItem(1));
    const b = queueManager.addToEnd(mockItem(2));
    const c = queueManager.addToEnd(mockItem(3));
    queueManager.reorder([c.id, a.id, b.id]);
    const q = queueManager.getQueue();
    expect(q[0].videoId).toBe('vid3');
    expect(q[1].videoId).toBe('vid1');
    expect(q[2].videoId).toBe('vid2');
  });

  test('playNow sets current index', () => {
    queueManager.addToEnd(mockItem(1));
    queueManager.playNow(mockItem(2));
    const current = queueManager.getCurrent();
    expect(current?.videoId).toBe('vid2');
  });
});
