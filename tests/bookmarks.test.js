import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeUrl,
  generateSlug,
  parseStoredBookmarks,
  serializeBookmarks,
  formatBookmark,
  isValidBookmark,
} from '../src/lib/bookmarks.js';

describe('normalizeUrl', () => {
  test('adds https:// when no scheme is present', () => {
    assert.equal(normalizeUrl('example.com'), 'https://example.com/');
  });

  test('a URL with and without "https://" normalises to the same saved value', () => {
    assert.equal(normalizeUrl('example.com'), normalizeUrl('https://example.com'));
    assert.equal(
      normalizeUrl('www.example.com/path'),
      normalizeUrl('https://www.example.com/path'),
    );
  });

  test('preserves an explicit http:// scheme', () => {
    assert.equal(normalizeUrl('http://example.com'), 'http://example.com/');
  });

  test('trims surrounding whitespace', () => {
    assert.equal(normalizeUrl('  example.com  '), 'https://example.com/');
  });

  test('throws for empty input', () => {
    assert.throws(() => normalizeUrl(''), TypeError);
    assert.throws(() => normalizeUrl('   '), TypeError);
  });

  test('throws for input that is not a valid URL even after adding a scheme', () => {
    assert.throws(() => normalizeUrl('not a url'), TypeError);
  });
});

describe('generateSlug', () => {
  test('has a "mona-" prefix', () => {
    const slug = generateSlug();
    assert.match(slug, /^mona-[0-9a-zA-Z]+$/);
  });

  test('is deterministic given a fixed entropy source', () => {
    const constantRandom = () => 0;
    assert.equal(generateSlug(constantRandom, 4), 'mona-0000');
  });
});

describe('parseStoredBookmarks', () => {
  test('recovers from an empty value', () => {
    assert.deepEqual(parseStoredBookmarks(''), []);
    assert.deepEqual(parseStoredBookmarks(null), []);
    assert.deepEqual(parseStoredBookmarks(undefined), []);
  });

  test('recovers from a corrupted (invalid JSON) value', () => {
    assert.deepEqual(parseStoredBookmarks('{not json'), []);
    assert.deepEqual(parseStoredBookmarks('undefined'), []);
  });

  test('recovers from a legacy / non-array value', () => {
    assert.deepEqual(parseStoredBookmarks(JSON.stringify({ url: 'https://example.com' })), []);
    assert.deepEqual(parseStoredBookmarks(JSON.stringify('just a string')), []);
    assert.deepEqual(parseStoredBookmarks(JSON.stringify(42)), []);
  });

  test('drops malformed entries but keeps valid ones', () => {
    const raw = JSON.stringify([
      { url: 'https://example.com', slug: 'mona-abcd' },
      { url: 'https://valid.example', slug: 42 },
      { slug: 'mona-noUrl' },
      null,
      'not-an-object',
      { url: '', slug: 'mona-empty' },
      { url: 'https://ok.example', slug: 'mona-9zzz' },
    ]);
    assert.deepEqual(parseStoredBookmarks(raw), [
      { url: 'https://example.com', slug: 'mona-abcd' },
      { url: 'https://ok.example', slug: 'mona-9zzz' },
    ]);
  });

  test('never throws regardless of input shape', () => {
    const inputs = [null, undefined, '', '   ', '[', '{}', '[1,2,3]', 123, {}];
    for (const input of inputs) {
      assert.doesNotThrow(() => parseStoredBookmarks(input));
    }
  });
});

describe('isValidBookmark', () => {
  test('accepts a well-formed bookmark', () => {
    assert.equal(isValidBookmark({ url: 'https://example.com', slug: 'mona-abcd' }), true);
  });

  test('rejects non-object, null, arrays, and missing fields', () => {
    assert.equal(isValidBookmark(null), false);
    assert.equal(isValidBookmark([]), false);
    assert.equal(isValidBookmark('str'), false);
    assert.equal(isValidBookmark({ url: 'https://example.com' }), false);
    assert.equal(isValidBookmark({ slug: 'mona-abcd' }), false);
  });
});

describe('serializeBookmarks', () => {
  test('round-trips through parseStoredBookmarks', () => {
    const bookmarks = [{ url: 'https://example.com/', slug: 'mona-7fk2' }];
    assert.deepEqual(parseStoredBookmarks(serializeBookmarks(bookmarks)), bookmarks);
  });

  test('serializes a non-array as an empty list', () => {
    assert.equal(serializeBookmarks(undefined), '[]');
  });
});

describe('formatBookmark', () => {
  test('formats as "<url> :: <slug>" with the exact separator', () => {
    const bookmark = { url: 'https://www.example.com', slug: 'mona-7fk2' };
    assert.equal(formatBookmark(bookmark), 'https://www.example.com :: mona-7fk2');
  });
});
