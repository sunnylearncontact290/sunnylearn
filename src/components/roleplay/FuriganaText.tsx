import React from 'react';
import { tokenizeJapaneseSentence } from '../../utils/japaneseTokenizer';
import { stripFurigana as cleanFurigana } from '../../utils/furiganaRenderer';

interface FuriganaTextProps {
  text: string;
  className?: string;
  showFurigana?: boolean;
  isUser?: boolean;
}

export { cleanFurigana as stripFurigana };

/**
 * Renders Japanese text with native semantic <ruby> and <rt> annotations.
 * Readings appear directly centered ABOVE the complete Kanji compound or verb stem.
 *
 * Requirements strictly fulfilled:
 * 1. Word-level Furigana (e.g. <ruby>三人<rt>さんにん</rt></ruby>, <ruby>大丈夫<rt>だいじょうぶ</rt></ruby>).
 * 2. Okurigana separation on verbs (e.g. <ruby>寝<rt>ね</rt></ruby>られなかった, <ruby>降<rt>ふ</rt></ruby>りました).
 * 3. Never adds Furigana to Hiragana-only, Katakana-only words, or grammatical particles.
 * 4. High-contrast white text and readings inside user message bubbles.
 * 5. Full support for multi-line text and long responses without horizontal overflow.
 * 6. Clean rendering when showFurigana is false.
 */
export const FuriganaText: React.FC<FuriganaTextProps> = ({
  text,
  className = '',
  showFurigana = true,
  isUser = false
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
  // Split by newlines to preserve multi-line structure
  const lines = text.split('\n');
  const renderedLines: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    if (!line.trim()) {
      if (lineIdx < lines.length - 1) {
        renderedLines.push(<br key={`br-${lineIdx}`} />);
      }
      return;
    }

    // Tokenize into context-aware word units with word-level ruby breakdown
    const tokens = tokenizeJapaneseSentence(line);
    const lineNodes: React.ReactNode[] = [];

    tokens.forEach((token, tIdx) => {
      // 1. Punctuation or Kana-only words: render directly as plain text
      if (token.isPunctuation || !token.containsKanji || !token.rubyParts || token.rubyParts.length === 0) {
        lineNodes.push(
          <span key={`w-${lineIdx}-${tIdx}`}>
            {token.surface}
          </span>
        );
        return;
      }

      // 2. Kanji words with ruby parts: render native semantic <ruby> and <rt>
      token.rubyParts.forEach((part, pIdx) => {
        if (part.kanji) {
          lineNodes.push(
            <ruby
              key={`rb-${lineIdx}-${tIdx}-${pIdx}-${part.kanji}`}
              className="ruby-unit"
            >
              {part.kanji}
              <rt
                className={`ruby-reading ${
                  isUser
                    ? 'text-white/95 [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]'
                    : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                {part.ruby}
              </rt>
            </ruby>
          );
        } else if (part.text) {
          lineNodes.push(
            <span key={`tx-${lineIdx}-${tIdx}-${pIdx}`}>
              {part.text}
            </span>
          );
        }
      });
    });

    renderedLines.push(
      <span key={`line-${lineIdx}`}>
        {lineNodes}
      </span>
    );

    if (lineIdx < lines.length - 1) {
      renderedLines.push(<br key={`br-${lineIdx}`} />);
    }
  });

  const lineSpacing = className.includes('leading-') ? '' : 'leading-[2.2]';

  return (
    <span
      className={`font-jp inline-block w-full max-w-full break-words [overflow-wrap:anywhere] [word-break:break-word] whitespace-pre-wrap select-text ${lineSpacing} ${className}`.trim()}
    >
      {renderedLines}
    </span>
  );
};
