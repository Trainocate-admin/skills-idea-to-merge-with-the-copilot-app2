// Pure helper functions for the bookmarks feature.
//
// Nothing in this module touches the DOM, localStorage, or any other
// browser-only API — it is safe to import from both the client-side
// <script> in src/components/Bookmarks.astro and from Node-based unit
// tests (see tests/bookmarks.test.js).

export const STORAGE_KEY = 'mona-bookmarks';

const BASE62_CHARS =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Normalise a user-typed URL so "example.com" and "https://example.com"
 * (and "http://example.com") all save as the same value.
 *
 * Accepts a URL with or without a scheme. Adds "https://" when no
 * scheme is present. Throws a TypeError if the result is not a valid URL.
 *
 * @param {string} input
 * @returns {string} the normalised, absolute URL
 */
export function normalizeUrl(input) {
  const trimmed = String(input ?? '').trim();
  if (!trimmed) {
    throw new TypeError('URL is required');
  }

  const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed);
  const candidate = hasScheme ? trimmed : `https://${trimmed}`;

  // Throws TypeError for anything that still isn't a valid absolute URL.
  const url = new URL(candidate);
  return url.toString();
}

/**
 * Generate a short base62 slug with a "mona-" prefix, e.g. "mona-7fk2".
 *
 * @param {() => number} [random] entropy source in [0, 1); defaults to Math.random
 * @param {number} [length] number of base62 characters after the prefix
 * @returns {string}
 */
export function generateSlug(random = Math.random, length = 4) {
  let suffix = '';
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(random() * BASE62_CHARS.length);
    suffix += BASE62_CHARS[index];
  }
  return `mona-${suffix}`;
}

/**
 * Type guard for a single stored bookmark entry.
 *
 * @param {unknown} entry
 * @returns {entry is { url: string, slug: string }}
 */
export function isValidBookmark(entry) {
  return (
    typeof entry === 'object' &&
    entry !== null &&
    !Array.isArray(entry) &&
    typeof entry.url === 'string' &&
    entry.url.trim().length > 0 &&
    typeof entry.slug === 'string' &&
    entry.slug.trim().length > 0
  );
}

/**
 * Parse a raw value read from localStorage (or anywhere else untrusted)
 * into a safe array of bookmarks. Never throws — empty, corrupted,
 * legacy (non-array), or otherwise malformed input all recover to a
 * usable array, dropping any entries that don't look like bookmarks.
 *
 * @param {unknown} raw the raw string read from storage (or null/undefined)
 * @returns {Array<{ url: string, slug: string }>}
 */
export function parseStoredBookmarks(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') {
    return [];
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter(isValidBookmark).map((entry) => ({
    url: entry.url,
    slug: entry.slug,
  }));
}

/**
 * Serialize bookmarks for storage.
 *
 * @param {Array<{ url: string, slug: string }>} bookmarks
 * @returns {string}
 */
export function serializeBookmarks(bookmarks) {
  return JSON.stringify(Array.isArray(bookmarks) ? bookmarks : []);
}

/**
 * Format a bookmark for display with the required " :: " separator,
 * e.g. "https://www.example.com :: mona-7fk2".
 *
 * @param {{ url: string, slug: string }} bookmark
 * @returns {string}
 */
export function formatBookmark(bookmark) {
  return `${bookmark.url} :: ${bookmark.slug}`;
}
