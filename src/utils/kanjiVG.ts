/**
 * KanjiVG Utility & Stroke Order Data Loader for SunnyLearn
 * Source: KanjiVG (https://github.com/KanjiVG/kanjivg)
 * Open-source Japanese Kanji Stroke Order SVG Dataset
 */

export interface StrokePath {
  id: string;
  index: number; // 0-based
  d: string;
  type?: string;
}

export interface StrokeNumber {
  index: number; // 1-based
  text: string;
  transform?: string;
  x?: number;
  y?: number;
}

export interface KanjiStrokeData {
  kanji: string;
  id: string; // 5-digit hex code e.g. "09ad8"
  strokeCount: number;
  strokes: StrokePath[];
  numbers: StrokeNumber[];
  viewBox: string;
}

// In-memory session cache to prevent redundant fetches
const strokeCache = new Map<string, KanjiStrokeData>();
const pendingFetches = new Map<string, Promise<KanjiStrokeData | null>>();

/**
 * Converts a single Japanese Kanji character into its KanjiVG 5-digit hex identifier.
 * Example: '日' -> '065e5', '一' -> '04e00', '高' -> '09ad8'
 */
export function getKanjiVGId(kanji: string): string {
  if (!kanji || kanji.length === 0) return '';
  const codePoint = kanji.codePointAt(0);
  if (!codePoint) return '';
  return codePoint.toString(16).padStart(5, '0').toLowerCase();
}

/**
 * Robustly parses KanjiVG SVG content into structured StrokePath and StrokeNumber objects.
 * Supports both DOMParser in browser environments and Regex extraction as safe fallback.
 */
export function parseKanjiVGSvg(svgText: string, kanji: string, id: string): KanjiStrokeData | null {
  if (!svgText || !svgText.includes('<svg')) {
    return null;
  }

  const strokes: StrokePath[] = [];
  const numbers: StrokeNumber[] = [];
  let viewBox = '0 0 109 109';

  // 1. Extract viewBox
  const vbMatch = svgText.match(/viewBox="([^"]+)"/i);
  if (vbMatch) {
    viewBox = vbMatch[1];
  }

  // 2. Try DOMParser if available (Standard browser environment)
  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, 'image/svg+xml');

      // Check for XML parse errors
      const parserError = doc.querySelector('parsererror');
      if (!parserError) {
        // Extract paths: prefer inside StrokePaths group or all paths with d
        const pathElements = doc.querySelectorAll('path[d]');
        pathElements.forEach((el, index) => {
          const d = el.getAttribute('d');
          if (d && d.trim().length > 0) {
            strokes.push({
              id: el.getAttribute('id') || `kvg:${id}-s${index + 1}`,
              index,
              d: d.trim(),
              type: el.getAttribute('kvg:type') || undefined,
            });
          }
        });

        // Extract numbers
        const textElements = doc.querySelectorAll('text');
        textElements.forEach(el => {
          const text = (el.textContent || '').trim();
          const num = parseInt(text, 10);
          if (!isNaN(num)) {
            const transform = el.getAttribute('transform') || undefined;
            const x = el.getAttribute('x') ? parseFloat(el.getAttribute('x')!) : undefined;
            const y = el.getAttribute('y') ? parseFloat(el.getAttribute('y')!) : undefined;
            numbers.push({
              index: num,
              text,
              transform,
              x,
              y,
            });
          }
        });

        if (strokes.length > 0) {
          return {
            kanji,
            id,
            strokeCount: strokes.length,
            strokes,
            numbers,
            viewBox,
          };
        }
      }
    } catch {
      // Fall through to regex parser
    }
  }

  // 3. Fallback Regex Parsing (fast & universally robust)
  // Extract all <path ... d="..." ...>
  const pathRegex = /<path\s+[^>]*d="([^"]+)"[^>]*>/gi;
  let pathMatch: RegExpExecArray | null;
  let strokeIdx = 0;
  while ((pathMatch = pathRegex.exec(svgText)) !== null) {
    const fullTag = pathMatch[0];
    const d = pathMatch[1];
    const idMatch = fullTag.match(/id="([^"]+)"/i);
    const typeMatch = fullTag.match(/kvg:type="([^"]+)"/i);

    strokes.push({
      id: idMatch ? idMatch[1] : `kvg:${id}-s${strokeIdx + 1}`,
      index: strokeIdx,
      d: d.trim(),
      type: typeMatch ? typeMatch[1] : undefined,
    });
    strokeIdx++;
  }

  // Extract all <text ...>1</text>
  const textRegex = /<text\s+([^>]*)>([^<]+)<\/text>/gi;
  let textMatch: RegExpExecArray | null;
  while ((textMatch = textRegex.exec(svgText)) !== null) {
    const attrs = textMatch[1];
    const textVal = textMatch[2].trim();
    const num = parseInt(textVal, 10);
    if (!isNaN(num)) {
      const transformMatch = attrs.match(/transform="([^"]+)"/i);
      const xMatch = attrs.match(/x="([^"]+)"/i);
      const yMatch = attrs.match(/y="([^"]+)"/i);

      numbers.push({
        index: num,
        text: textVal,
        transform: transformMatch ? transformMatch[1] : undefined,
        x: xMatch ? parseFloat(xMatch[1]) : undefined,
        y: yMatch ? parseFloat(yMatch[1]) : undefined,
      });
    }
  }

  if (strokes.length === 0) {
    return null;
  }

  return {
    kanji,
    id,
    strokeCount: strokes.length,
    strokes,
    numbers,
    viewBox,
  };
}

/**
 * Loads KanjiVG stroke data for a given Kanji character on demand.
 * Fetches from the official KanjiVG jsDelivr CDN with in-memory session caching.
 */
export async function loadKanjiStrokeData(kanji: string): Promise<KanjiStrokeData | null> {
  const cleanChar = (kanji || '').trim();
  if (!cleanChar) return null;

  // First character in case a compound word or sentence was passed
  const singleKanji = Array.from(cleanChar)[0];
  const id = getKanjiVGId(singleKanji);
  if (!id) return null;

  // 1. Check in-memory cache to avoid duplicate network requests
  if (strokeCache.has(singleKanji)) {
    return strokeCache.get(singleKanji)!;
  }

  // 2. Prevent duplicate in-flight requests for the same Kanji
  if (pendingFetches.has(singleKanji)) {
    return pendingFetches.get(singleKanji)!;
  }

  const fetchPromise = (async (): Promise<KanjiStrokeData | null> => {
    let svgText = '';

    // Primary: jsDelivr CDN of official KanjiVG repository
    try {
      const cdnUrl = `https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/${id}.svg`;
      const res = await fetch(cdnUrl);
      if (res.ok) {
        svgText = await res.text();
      }
    } catch (err) {
      console.warn(`[KanjiVG] jsDelivr CDN fetch error for ${singleKanji} (${id}):`, err);
    }

    // Secondary fallback: Raw GitHub CDN
    if (!svgText || !svgText.includes('<svg')) {
      try {
        const rawUrl = `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${id}.svg`;
        const rawRes = await fetch(rawUrl);
        if (rawRes.ok) {
          svgText = await rawRes.text();
        }
      } catch (err) {
        console.warn(`[KanjiVG] GitHub raw fetch error for ${singleKanji} (${id}):`, err);
      }
    }

    if (!svgText || !svgText.includes('<svg')) {
      console.warn(`[KanjiVG] No SVG found for Kanji: "${singleKanji}" (id: ${id})`);
      return null;
    }

    const parsed = parseKanjiVGSvg(svgText, singleKanji, id);
    if (parsed) {
      strokeCache.set(singleKanji, parsed);
    }
    return parsed;
  })();

  pendingFetches.set(singleKanji, fetchPromise);
  try {
    const result = await fetchPromise;
    return result;
  } finally {
    pendingFetches.delete(singleKanji);
  }
}
