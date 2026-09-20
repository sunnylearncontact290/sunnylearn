/**
 * Utility functions for clean vocabulary rendering.
 * Prevents redundant Mongolian meanings from being displayed multiple times
 * while strictly preserving word categories / parts of speech (нэр үг, үйл үг,
 * тэмдэг нэр, дайвар үг, тооны нэр, төлөөний үг, etc.).
 */

const POS_KEYWORDS = [
  'Нэр үг',
  'Үйл үг',
  'Тэмдэг нэр',
  'Дайвар үг',
  'Тооны нэр',
  'Төлөөний үг',
  'Холбоос үг',
  'Нөхцөл',
  'Сул үг',
  'Аялга үг',
  'Оноосон нэр',
  'Бүлэг',
  'р бүлэг',
  'хувирал'
];

/**
 * Normalizes string for comparison (lowercasing, trimming, removing extraneous punctuation)
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[.,;:\-_/()\[\]"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Cleans the explanation string of a vocabulary item so that redundant
 * secondary Mongolian meaning lines (e.g. "Монгол утга: онгоц" or "Нэр үг. Монгол утга: онгоц")
 * are not shown when the main Mongolian meaning is already prominently displayed.
 *
 * If there is genuine, substantive usage explanation, it is preserved.
 * The part of speech badge remains separate and untouched.
 */
export function getCleanVocabExplanation(
  explanation?: string | null,
  mongolian?: string | null,
  _partOfSpeech?: string | null
): string | null {
  if (!explanation || typeof explanation !== 'string') return null;
  let text = explanation.trim();
  if (!text) return null;

  const normMn = mongolian ? normalize(mongolian) : '';

  // 1. If explanation literally equals the mongolian meaning
  if (normMn && normalize(text) === normMn) {
    return null;
  }

  // 2. Redundant pattern check where the ENTIRE explanation consists only of
  // an optional Part-Of-Speech prefix + "Монгол утга: <meaning>"
  // e.g., "Нэр үг. Монгол утга: онгоц" or "Нэр үг / Тэмдэг нэр. Монгол утга: завтай, чөлөөт цаг"
  const fullRedundantRegex = /^(?:(?:Нэр үг|Үйл үг|Тэмдэг нэр|Дайвар үг|Тооны нэр|Төлөөний үг|Холбоос үг|Нөхцөл|Сул үг|Аялга үг|Оноосон нэр|[\w\s\/\(\)\-\,\.]+)*[.:])?\s*(?:Монгол утга|монгол утга)\s*:\s*(.+)$/i;
  const matchFull = text.match(fullRedundantRegex);
  if (matchFull) {
    const extractedMeaning = normalize(matchFull[1]);
    // If the trailing meaning matches or is substantially contained in the main Mongolian meaning
    if (!normMn || extractedMeaning === normMn || normMn.includes(extractedMeaning) || extractedMeaning.includes(normMn)) {
      return null;
    }
  }

  // 3. If there is genuine explanation followed by or containing "Монгол утга: <meaning>"
  // strip only the redundant "Монгол утга: ..." clause
  text = text.replace(/(?:[.;,\s]+)?(?:Монгол утга|монгол утга)\s*:\s*([^.;\n]+)[.;]?/gi, (match, val) => {
    const valNorm = normalize(val);
    if (!normMn || valNorm === normMn || normMn.includes(valNorm) || valNorm.includes(normMn)) {
      return '';
    }
    return match;
  }).trim();

  // 4. If after stripping, the remaining text is only a Part of Speech declaration
  // e.g. "Нэр үг." or "Үйл үг (1-р бүлэг)", remove it as POS is already displayed in the badge
  const isOnlyPos = POS_KEYWORDS.some(kw => {
    const regex = new RegExp(`^(?:${kw}|[\\s\\/\\-\\(\\)\\d.,])*$`, 'i');
    return regex.test(text);
  });
  if (isOnlyPos) {
    return null;
  }

  // If text is now empty or only punctuation
  if (!text || /^[\s.,;:!?-]+$/.test(text)) {
    return null;
  }

  // If text after trimming matches the main mongolian meaning
  if (normMn && normalize(text) === normMn) {
    return null;
  }

  return text;
}
