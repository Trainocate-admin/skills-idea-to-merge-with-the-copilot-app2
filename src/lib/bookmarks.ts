// Pure helpers for Mona's Bookmark Manager App.
//
// Kept free of any browser-only APIs (no localStorage, no DOM) so they can be
// unit tested with a plain test runner and safely imported from the
// client-side <script> boundary in src/components/Bookmarks.astro.

export const STORAGE_KEY = 'mona-bookmarks';

const BASE62_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export interface Bookmark {
  url: string;
  slug: string;
}

/**
 * Normalise a user-typed URL: trims whitespace, adds an "https://" scheme
 * when none is present, and validates the result via the URL constructor.
 * Returns null when the input can't be turned into a valid URL.
 */
export function normalizeUrl(input: string): string | null {
  const trimmed = (input ?? '').trim();
  if (!trimmed) return null;

  const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed);
  const candidate = hasScheme ? trimmed : `https://${trimmed}`;

  try {
    return new URL(candidate).toString();
  } catch {
    return null;
  }
}

/** Generates a random base62 string of the given length. */
export function randomBase62(length = 4): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += BASE62_CHARS[Math.floor(Math.random() * BASE62_CHARS.length)];
  }
  return out;
}

/** Generates a short "mona-" prefixed slug, e.g. "mona-7fk2". */
export function generateSlug(): string {
  return `mona-${randomBase62(4)}`;
}

/** Formats a bookmark for display with the exact " :: " separator. */
export function formatBookmark(bookmark: Bookmark): string {
  return `${bookmark.url} :: ${bookmark.slug}`;
}

function isBookmark(value: unknown): value is Bookmark {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.url === 'string' &&
    candidate.url.length > 0 &&
    typeof candidate.slug === 'string' &&
    candidate.slug.length > 0
  );
}

/**
 * Parses a raw string read from storage into a validated array of
 * bookmarks. Never throws: empty, corrupted (invalid JSON), legacy
 * (non-array, or array of the wrong shape), or otherwise malformed values
 * all resolve to an empty array (or have their bad entries dropped).
 */
export function parseStoredBookmarks(raw: string | null | undefined): Bookmark[] {
  if (!raw) return [];

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(data)) return [];
  return data.filter(isBookmark);
}

/** Serialises a bookmark list for storage. */
export function serializeBookmarks(bookmarks: Bookmark[]): string {
  return JSON.stringify(bookmarks);
}
