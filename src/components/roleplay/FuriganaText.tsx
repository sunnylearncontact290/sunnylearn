import React from 'react';
import { alignRubyParts, hasKanji, stripFurigana as cleanFurigana } from '../../utils/furiganaRenderer';

interface FuriganaTextProps {
  text: string;
  className?: string;
  showFurigana?: boolean;
}

export { cleanFurigana as stripFurigana };

// Match bracket annotations like 漢字（ふりがな） or existing <ruby>base<rt>reading</rt></ruby>
const ANNOTATION_REGEX = /<ruby[^>]*>([\s\S]*?)<rt[^>]*>([\s\S]*?)<\/rt>[\s\S]*?<\/ruby>|([^\s（\(\[【<]+)\s*[（\(\[【]\s*([ぁ-んァ-ヶー・]+)\s*[）\)\]】]/g;

/**
 * Renders Japanese text with native semantic <ruby> and <rt> annotations.
 * Readings appear directly ABOVE the Kanji.
 * Strictly guarantees that Furigana is NEVER added to Hiragana-only or Katakana-only words.
 * Correctly aligns Okurigana on verbs (e.g. <ruby>食<rt>た</rt></ruby>べる).
 * When Furigana is OFF, all reading annotations are stripped cleanly.
 */
export const FuriganaText: React.FC<FuriganaTextProps> = ({
  text,
  className = '',
  showFurigana = true
}) => {
  if (!text) return null;

  // When Furigana is OFF:
  // Strip all reading brackets and ruby cleanly to leave pure, normal Japanese text.
  if (!showFurigana) {
    const cleanText = cleanFurigana(text);
    const lineSpacing = className.includes('leading-') ? '' : 'leading-relaxed';
    return (
      <span
        className={`font-jp inline-block w-full max-w-full break-words [overflow-wrap:anywhere] [word-break:break-word] whitespace-pre-wrap select-text ${lineSpacing} ${className}`.trim()}
      >
        {cleanText}
      </span>
    );
  }

  // When Furigana is ON:
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const regex = new RegExp(ANNOTATION_REGEX.source, 'g');

  while ((match = regex.exec(text)) !== null) {
    // Append preceding plain text
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Match group 1 & 2: <ruby>BASE<rt>READING</rt></ruby>
    // Match group 3 & 4: WORD（READING）
    const base = match[1] || match[3] || '';
    const reading = match[2] || match[4] || '';

    // Linguistic Rule: If base text does not contain Kanji, NEVER add Furigana!
    if (!hasKanji(base)) {
      parts.push(base);
    } else {
      const aligned = alignRubyParts(base, reading);
      aligned.forEach((chunk, cIdx) => {
        if (chunk.kanji) {
          parts.push(
            <ruby key={`rb-${match!.index}-${cIdx}-${chunk.kanji}`} className="ruby-unit">
              {chunk.kanji}
              <rt className="ruby-reading">{chunk.ruby}</rt>
            </ruby>
          );
        } else if (chunk.text) {
          parts.push(chunk.text);
        }
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Append any trailing plain text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  const lineSpacing = className.includes('leading-') ? '' : 'leading-[2.2]';

  return (
    <span
      className={`font-jp inline-block w-full max-w-full break-words [overflow-wrap:anywhere] [word-break:break-word] whitespace-pre-wrap select-text ${lineSpacing} ${className}`.trim()}
    >
      {parts}
    </span>
  );
};
