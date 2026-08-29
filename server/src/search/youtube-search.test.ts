import { extractVideoId } from './youtube-search';

describe('extractVideoId', () => {
  test('extracts from watch URL', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
  test('extracts from short URL', () => {
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
  test('extracts from shorts URL', () => {
    expect(extractVideoId('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
  test('extracts bare video ID', () => {
    expect(extractVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
  test('returns null for invalid', () => {
    expect(extractVideoId('not-a-url')).toBeNull();
    expect(extractVideoId('https://example.com')).toBeNull();
  });
});
