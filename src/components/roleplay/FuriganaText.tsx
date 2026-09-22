import React from 'react';

interface FuriganaTextProps {
  text: string;
  className?: string;
  showFurigana?: boolean;
}

// Regex matching Kanji sequence followed by Japanese reading inside brackets
// Kanji range: Standard CJK Ideographs (4E00-9FFF), Extension A (3400-4DBF), iteration marks (々仝〆〇ヶ)
// Reading range: Hiragana (ぁ-ん), Katakana (ァ-ヶ), prolonged mark (ー), middle dot (・)
export const FURIGANA_REGEX = /([\u4E00-\u9FFF々仝〆〇ヶ\u3400-\u4DBF]+)\s*[（\(\[【]\s*([ぁ-んァ-ヶー・]+)\s*[）\)\]】]/g;

/**
 * Strips furigana annotations from Japanese text, returning clean normal Japanese.
 * Example: '私（わたし）の名前（なまえ）' -> '私の名前'
 */
export function stripFurigana(text: string): string {
  if (!text) return '';
  return text.replace(FURIGANA_REGEX, '$1').trim();
}

/**
 * Renders Japanese text with native semantic <ruby> and <rt> annotations.
 * Readings appear directly ABOVE the Kanji.
 * When Furigana is OFF, all reading annotations are stripped cleanly,
 * leaving pure Japanese text with zero layout disruption.
 */
export const FuriganaText: React.FC<FuriganaTextProps> = ({
  text,
  className = '',
  showFurigana = true
}) => {
  if (!text) return null;

  // When Furigana is OFF:
  // Strip all reading brackets cleanly to leave pure, normal Japanese text.
  // Zero ruby elements, zero rt elements, zero phantom spacing.
  if (!showFurigana) {
    const cleanText = stripFurigana(text);
    const lineSpacing = className.includes('leading-') ? '' : 'leading-relaxed';
    return (
      <span className={`font-jp whitespace-pre-line ${lineSpacing} ${className}`.trim()}>
        {cleanText}
      </span>
    );
  }

  // When Furigana is ON:
  // Render semantic HTML5 <ruby> and <rt> elements.
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const regex = new RegExp(FURIGANA_REGEX.source, 'g');

  while ((match = regex.exec(text)) !== null) {
    // Append preceding plain text
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const kanji = match[1];
    const reading = match[2];

    parts.push(
      <ruby key={`rb-${match.index}-${kanji}`} className="ruby-unit">
        {kanji}
        <rt className="ruby-reading">{reading}</rt>
      </ruby>
    );

    lastIndex = match.index + match[0].length;
  }

  // Append any trailing plain text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  const lineSpacing = className.includes('leading-') ? '' : 'leading-[2.2]';

  return (
    <span className={`font-jp whitespace-pre-line ${lineSpacing} ${className}`.trim()}>
      {parts}
    </span>
  );
};
