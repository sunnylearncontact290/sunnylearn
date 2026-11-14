/**
 * Mongolian Cyrillic alphabet indexing, normalization, and locale-aware sorting utilities
 * for SunnyLearn 2.0 Dictionary.
 */

export const MONGOLIAN_ALPHABET: readonly string[] = [
  'А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ё', 'Ж', 'З', 'И', 'Й',
  'К', 'Л', 'М', 'Н', 'О', 'Ө', 'П', 'Р', 'С', 'Т', 'У', 'Ү',
  'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ', 'Ы', 'Ь', 'Э', 'Ю', 'Я'
] as const;

const MONGOLIAN_LETTER_SET = new Set<string>(MONGOLIAN_ALPHABET);

const MONGOLIAN_ORDER_MAP = new Map<string, number>(
  MONGOLIAN_ALPHABET.map((letter, idx) => [letter, idx])
);

const LEADING_PUNCTUATION_REGEX = /^[\s"'«»„“”‘’()[\]{}.,:;…\-–—~〜!?/]+/u;
const TRAILING_PUNCTUATION_REGEX = /[\s"'«»„“”‘’()[\]{}.,:;…\-–—~〜!?/]+$/u;

// Singleton Intl.Collator for fast Mongolian Cyrillic alphabetical comparison
let mnCollator: Intl.Collator | null = null;
function getMongolianCollator(): Intl.Collator | null {
  if (mnCollator) return mnCollator;
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.Collator === 'function') {
      mnCollator = new Intl.Collator('mn', { sensitivity: 'base', numeric: true });
      return mnCollator;
    }
  } catch {
    // Fallback handled below
  }
  return null;
}

/**
 * Normalizes a Mongolian string for indexing & sorting without altering the original translation.
 * - Unicode NFC normalization
 * - Trims leading/trailing whitespace
 * - Strips opening quotes, ellipsis, dashes, and punctuation
 * - Case-folded to lowercase in Mongolian locale
 */
export function normalizeMongolianForIndex(text?: string | null): string {
  if (!text || typeof text !== 'string') return '';
  let s = text.normalize('NFC').trim();
  // Strip any leading punctuation/quotes (e.g. "...-аас дээш", "(хүн) ажил", "  Ажил")
  s = s.replace(LEADING_PUNCTUATION_REGEX, '').trim();
  s = s.replace(TRAILING_PUNCTUATION_REGEX, '').trim();
  try {
    return s.toLocaleLowerCase('mn');
  } catch {
    return s.toLowerCase();
  }
}

/**
 * Extracts the primary Mongolian meaning from multi-meaning entries like:
 * "явах, зорчих" or "хайр; дурлал"
 * so entries are indexed under a single primary alphabetical letter rather than duplicated.
 */
export function getPrimaryMongolianMeaning(mongolian?: string | null): string {
  if (!mongolian || typeof mongolian !== 'string') return '';
  const cleaned = mongolian.normalize('NFC').trim();
  if (!cleaned) return '';

  // Split on top-level meaning delimiters (; or , or newline) outside parentheses
  let depth = 0;
  let splitIdx = -1;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === '(' || ch === '（' || ch === '[' || ch === '【') depth++;
    else if ((ch === ')' || ch === '）' || ch === ']' || ch === '】') && depth > 0) depth--;
    else if (depth === 0 && (ch === ';' || ch === ',' || ch === '\n')) {
      splitIdx = i;
      break;
    }
  }

  const primary = splitIdx >= 0 ? cleaned.slice(0, splitIdx) : cleaned;
  return normalizeMongolianForIndex(primary) || normalizeMongolianForIndex(cleaned);
}

/**
 * Returns the uppercase Mongolian Cyrillic initial letter (А..Я, including Ө, Ү, Ё)
 * of the primary Mongolian meaning, or null if it starts with a non-Cyrillic character (e.g. digit).
 */
export function getPrimaryMongolianInitialLetter(mongolian?: string | null): string | null {
  const primary = getPrimaryMongolianMeaning(mongolian);
  if (!primary) return null;

  const chars = Array.from(primary);
  for (const ch of chars) {
    let upper: string;
    try {
      upper = ch.toLocaleUpperCase('mn');
    } catch {
      upper = ch.toUpperCase();
    }
    if (MONGOLIAN_LETTER_SET.has(upper)) {
      return upper;
    }
    // If first substantive character is a digit or Latin letter, don't scan past it
    if (/[\p{L}\p{N}]/u.test(ch)) {
      return null;
    }
  }
  return null;
}

/**
 * Compares two normalized Mongolian strings using locale-aware Mongolian Cyrillic order
 * with a deterministic alphabet-rank fallback for environments lacking ICU 'mn' support.
 */
export function compareMongolianStrings(a: string, b: string): number {
  if (a === b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  const collator = getMongolianCollator();
  if (collator) {
    const cmp = collator.compare(a, b);
    if (cmp !== 0) return cmp;
  }

  // Deterministic Mongolian alphabet rank fallback
  const charsA = Array.from(a);
  const charsB = Array.from(b);
  const len = Math.min(charsA.length, charsB.length);
  for (let i = 0; i < len; i++) {
    const ca = charsA[i].toUpperCase();
    const cb = charsB[i].toUpperCase();
    if (ca === cb) continue;
    const ra = MONGOLIAN_ORDER_MAP.get(ca);
    const rb = MONGOLIAN_ORDER_MAP.get(cb);
    if (ra !== undefined && rb !== undefined) return ra - rb;
    if (ra !== undefined) return -1;
    if (rb !== undefined) return 1;
    return ca < cb ? -1 : 1;
  }
  return charsA.length - charsB.length;
}
