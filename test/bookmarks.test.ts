import { describe, expect, it } from 'vitest';
import {
  formatBookmark,
  generateSlug,
  normalizeUrl,
  parseStoredBookmarks,
} from '../src/lib/bookmarks';

describe('normalizeUrl', () => {
  it('normalises a URL without a scheme the same as one with https://', () => {
    expect(normalizeUrl('example.com')).toBe(normalizeUrl('https://example.com'));
  });

  it('adds https:// when no scheme is present', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com/');
  });

  it('preserves an explicit http:// scheme', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com/');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeUrl('  example.com  ')).toBe('https://example.com/');
  });

  it('returns null for empty input', () => {
    expect(normalizeUrl('')).toBeNull();
    expect(normalizeUrl('   ')).toBeNull();
  });

  it('returns null for input that still can\'t form a valid URL', () => {
    expect(normalizeUrl('http://')).toBeNull();
  });
});

describe('generateSlug', () => {
  it('produces a "mona-" prefixed base62 slug', () => {
    expect(generateSlug()).toMatch(/^mona-[A-Za-z0-9]{4}$/);
  });
});

describe('formatBookmark', () => {
  it('formats as "<url> :: <slug>" with the exact " :: " separator', () => {
    expect(formatBookmark({ url: 'https://www.example.com', slug: 'mona-7fk2' })).toBe(
      'https://www.example.com :: mona-7fk2',
    );
  });
});

describe('parseStoredBookmarks', () => {
  it('returns an empty array for empty/missing values', () => {
    expect(parseStoredBookmarks(null)).toEqual([]);
    expect(parseStoredBookmarks(undefined)).toEqual([]);
    expect(parseStoredBookmarks('')).toEqual([]);
  });

  it('recovers from corrupted (invalid JSON) values', () => {
    expect(parseStoredBookmarks('{not json')).toEqual([]);
  });

  it('recovers from legacy / non-array values', () => {
    expect(parseStoredBookmarks('"just a string"')).toEqual([]);
    expect(parseStoredBookmarks('42')).toEqual([]);
    expect(parseStoredBookmarks('{"url":"https://example.com","slug":"mona-abcd"}')).toEqual([]);
  });

  it('drops malformed entries but keeps valid ones', () => {
    const raw = JSON.stringify([
      { url: 'https://example.com/', slug: 'mona-abcd' },
      { url: '', slug: 'mona-efgh' },
      { url: 'https://example.org/', slug: 42 },
      null,
      'not-an-object',
      { slug: 'mona-only-slug' },
      { url: 'https://valid.example/', slug: 'mona-wxyz' },
    ]);

    expect(parseStoredBookmarks(raw)).toEqual([
      { url: 'https://example.com/', slug: 'mona-abcd' },
      { url: 'https://valid.example/', slug: 'mona-wxyz' },
    ]);
  });

  it('never throws regardless of input', () => {
    const inputs = [null, undefined, '', 'not json', '[]', '[1,2,3]', '{}', '[{}]'];
    for (const input of inputs) {
      expect(() => parseStoredBookmarks(input as string | null)).not.toThrow();
    }
  });
});
