import React from 'react';

// Unicode range for Japanese Kanji: Standard CJK Ideographs (4E00-9FFF), Extension A (3400-4DBF), iteration marks (々仝〆〇ヶ)
export const KANJI_REGEX = /[\p{Script=Han}々仝〆〇ヶ\u3400-\u4DBF]/u;
export const KANA_REGEX = /^[ぁ-んァ-ヶー・\s]+$/;
export const HIRAGANA_REGEX = /^[ぁ-んー・\s]+$/;
export const KATAKANA_REGEX = /^[ァ-ヶー・\s]+$/;

/**
 * Checks whether text contains at least one Kanji ideograph.
 */
export function hasKanji(text: string | null | undefined): boolean {
  return text ? KANJI_REGEX.test(text) : false;
}

/**
 * Checks whether text consists purely of Hiragana (no Kanji, no Katakana).
 */
export function isHiraganaOnly(text: string | null | undefined): boolean {
  return text ? HIRAGANA_REGEX.test(text.trim()) : false;
}

/**
 * Checks whether text consists purely of Katakana (no Kanji).
 */
export function isKatakanaOnly(text: string | null | undefined): boolean {
  return text ? KATAKANA_REGEX.test(text.trim()) : false;
}

/**
 * Checks whether a single character is Hiragana or Katakana.
 */
export function isKana(ch: string): boolean {
  return /[ぁ-んァ-ヶー]/.test(ch);
}

export interface RubyChunk {
  text?: string;
  kanji?: string;
  ruby?: string;
}

/**
 * Aligns a Japanese word surface and its phonetic reading into semantic ruby parts.
 *
 * Linguistic rules strictly enforced:
 * 1. Never add Furigana to Hiragana-only words (returns plain text).
 * 2. Never add Furigana to Katakana-only words (returns plain text).
 * 3. Never duplicate existing Hiragana.
 * 4. For Japanese verbs/adjectives containing Kanji and Okurigana, annotate ONLY the Kanji portion.
 * 5. Preserve Okurigana as normal text.
 * 6. Correctly handle compound Kanji words.
 *
 * Example:
 * alignRubyParts("どうぞ", "どうぞ") => [{ text: "どうぞ" }]
 * alignRubyParts("遠慮", "えんりょ") => [{ kanji: "遠慮", ruby: "えんりょ" }]
 * alignRubyParts("食べて", "たべて") => [{ kanji: "食", ruby: "た" }, { text: "べて" }]
 * alignRubyParts("食べる", "たべる") => [{ kanji: "食", ruby: "た" }, { text: "べる" }]
 */
export function alignRubyParts(surface: string, reading?: string): RubyChunk[] {
  if (!surface) return [];

  // Rule 1 & 2: If text does not contain any Kanji (Hiragana-only or Katakana-only),
  // NEVER add Furigana or ruby annotations.
  if (!hasKanji(surface)) {
    return [{ text: surface }];
  }

  // If reading is missing, identical to surface, or contains no kana:
  // Cannot confidently align; display original text rather than guessing incorrectly.
  if (!reading || reading === surface || !KANA_REGEX.test(reading)) {
    return [{ text: surface }];
  }

  const cleanReading = reading.replace(/\s+/g, '');

  // 1. Match leading kana prefix (e.g. お茶 with reading おちゃ -> prefix "お")
  let prefixLen = 0;
  while (
    prefixLen < surface.length &&
    prefixLen < cleanReading.length &&
    isKana(surface[prefixLen]) &&
    surface[prefixLen] === cleanReading[prefixLen]
  ) {
    prefixLen++;
  }
  const prefix = surface.slice(0, prefixLen);
  let sRem = surface.slice(prefixLen);
  let rRem = cleanReading.slice(prefixLen);

  // 2. Match trailing kana suffix (Okurigana, e.g. 食べて with reading たべて -> suffix "べて")
  let suffixLen = 0;
  while (
    suffixLen < sRem.length &&
    suffixLen < rRem.length &&
    isKana(sRem[sRem.length - 1 - suffixLen]) &&
    sRem[sRem.length - 1 - suffixLen] === rRem[rRem.length - 1 - suffixLen]
  ) {
    suffixLen++;
  }
  const suffix = suffixLen > 0 ? sRem.slice(sRem.length - suffixLen) : '';
  const midSurface = suffixLen > 0 ? sRem.slice(0, sRem.length - suffixLen) : sRem;
  const midReading = suffixLen > 0 ? rRem.slice(0, rRem.length - suffixLen) : rRem;

  const result: RubyChunk[] = [];
  if (prefix) result.push({ text: prefix });

  // 3. Check for interior kana anchor in middle segment (e.g. 取り消す with reading とりけす)
  const kanaMatch = midSurface.match(/[ぁ-んァ-ヶー]+/);
  if (kanaMatch && kanaMatch.index !== undefined && kanaMatch.index > 0) {
    const kIndex = kanaMatch.index;
    const kanaStr = kanaMatch[0];
    const leftKanji = midSurface.slice(0, kIndex);
    const rightRest = midSurface.slice(kIndex + kanaStr.length);

    const rKanaIndex = midReading.indexOf(kanaStr);
    if (rKanaIndex > 0) {
      const leftReading = midReading.slice(0, rKanaIndex);
      const rightReading = midReading.slice(rKanaIndex + kanaStr.length);

      result.push(...alignRubyParts(leftKanji, leftReading));
      result.push({ text: kanaStr });
      result.push(...alignRubyParts(rightRest, rightReading));
    } else {
      if (hasKanji(midSurface) && midReading) {
        result.push({ kanji: midSurface, ruby: midReading });
      } else {
        result.push({ text: midSurface });
      }
    }
  } else {
    // Middle segment is pure Kanji block (e.g. 遠慮 -> えんりょ, 食 -> た, 学校 -> がっこう)
    if (hasKanji(midSurface) && midReading) {
      result.push({ kanji: midSurface, ruby: midReading });
    } else {
      result.push({ text: midSurface });
    }
  }

  if (suffix) result.push({ text: suffix });
  return result;
}

/**
 * Returns clean semantic HTML string with <ruby> and <rt> markup.
 * Example:
 * renderRubyHtml("どうぞ遠慮しないで食べてください。")
 * => "どうぞ<ruby>遠慮<rt>えんりょ</rt></ruby>しないで<ruby>食<rt>た</rt></ruby>べてください。"
 */
export function renderRubyHtml(surface: string, reading?: string): string {
  const parts = alignRubyParts(surface, reading);
  return parts.map(p => (p.kanji ? `<ruby>${p.kanji}<rt>${p.ruby}</rt></ruby>` : p.text || '')).join('');
}

/**
 * Sanitizes existing Japanese text that may contain improper ruby tags or brackets.
 * Strips ruby from Hiragana-only text (e.g. <ruby>どうぞ<rt>どうぞ</rt></ruby> -> どうぞ)
 * and properly aligns Kanji verbs (e.g. <ruby>食べて<rt>たべて</rt></ruby> -> <ruby>食<rt>た</rt></ruby>べて).
 */
export function sanitizeRubyText(input: string): string {
  if (!input) return '';

  let s = input;

  // 1. Sanitize HTML <ruby> tags
  s = s.replace(/<ruby[^>]*>([\s\S]*?)<rt[^>]*>([\s\S]*?)<\/rt>[\s\S]*?<\/ruby>/gi, (_, base, rt) => {
    const cleanBase = base.trim();
    const cleanRt = rt.trim();
    if (!hasKanji(cleanBase)) {
      return cleanBase; // Strip ruby from Hiragana/Katakana!
    }
    const parts = alignRubyParts(cleanBase, cleanRt);
    return parts.map(p => (p.kanji ? `<ruby>${p.kanji}<rt>${p.ruby}</rt></ruby>` : p.text || '')).join('');
  });

  // 2. Sanitize bracketed furigana notation e.g. 漢字（ふりがな）
  s = s.replace(/([^\s（\(\[【]+)\s*[（\(\[【]\s*([ぁ-んァ-ヶー・]+)\s*[）\)\]】]/gu, (_, base, reading) => {
    if (!hasKanji(base)) {
      return base; // Strip bracket annotation from Hiragana/Katakana!
    }
    const parts = alignRubyParts(base, reading);
    return parts.map(p => (p.kanji ? `<ruby>${p.kanji}<rt>${p.ruby}</rt></ruby>` : p.text || '')).join('');
  });

  return s;
}

/**
 * Renders React nodes with semantic <ruby> and <rt> elements.
 */
export function renderRubyNodes(
  surface: string,
  reading?: string,
  keyPrefix: string = 'rb'
): React.ReactNode[] {
  const parts = alignRubyParts(surface, reading);
  return parts.map((part, idx) => {
    if (part.kanji) {
      return React.createElement(
        'ruby',
        { key: `${keyPrefix}-${idx}-${part.kanji}`, className: 'ruby-unit' },
        part.kanji,
        React.createElement('rt', { className: 'ruby-reading' }, part.ruby)
      );
    }
    return React.createElement(React.Fragment, { key: `${keyPrefix}-${idx}` }, part.text || '');
  });
}

/**
 * Strips all ruby tags, annotations, and brackets, returning pure base Japanese text.
 */
export function stripFurigana(text: string): string {
  if (!text) return '';
  let s = text;
  // Remove ruby
  s = s.replace(/<ruby[^>]*>([\s\S]*?)<rt[^>]*>[\s\S]*?<\/rt>[\s\S]*?<\/ruby>/gi, '$1');
  s = s.replace(/<[^>]+>/g, '');
  // Remove bracket annotations: 漢字（ふりがな） -> 漢字, どうぞ（どうぞ） -> どうぞ
  s = s.replace(/([^\s（\(\[【]+)\s*[（\(\[【]\s*[ぁ-んァ-ヶー・\.\-]+\s*[）\)\]】]/gu, '$1');
  return s.trim();
}
