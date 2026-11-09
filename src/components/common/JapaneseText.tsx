import React, { useMemo } from 'react';
import { tokenizeJapaneseSentence, DetailedWordInfo } from '../../utils/japaneseTokenizer';
import { hasKanji } from '../../utils/furiganaRenderer';

export interface JapaneseTextProps {
  /**
   * Raw Japanese text or sentence (e.g. "彼は会議で新しい方針を唱えた。").
   */
  text: string;

  /**
   * Optional authoritative reading in Hiragana/Katakana.
   * If provided, guarantees 100% reading accuracy matching against Kanji components.
   */
  reading?: string;

  /**
   * Whether to display Furigana ruby annotations above Kanji.
   * Defaults to true. If false, renders pure clean Japanese text.
   */
  showFurigana?: boolean;

  /**
   * If true, clicking on Kanji words triggers onWordClick callback.
   * Defaults to false (clean readable inline text).
   */
  interactive?: boolean;

  /**
   * Callback when an interactive Kanji word is clicked.
   */
  onWordClick?: (word: DetailedWordInfo) => void;

  /**
   * Additional CSS classes.
   */
  className?: string;
}

/**
 * JapaneseText: Reusable, bulletproof Japanese text renderer.
 *
 * Enforces strict pedagogical and typographic standards:
 * 1. Uses semantic HTML <ruby> and <rt> markup: <ruby>漢字<rt>かんじ</rt></ruby>.
 * 2. Furigana stays centered directly above the corresponding Kanji compound or verb stem.
 * 3. Normal Japanese text flows naturally without artificial spaces between words.
 * 4. Punctuation stays tightly connected with preceding text without breaking onto empty lines.
 * 5. Handles line-wrapping gracefully on narrow mobile screens ([overflow-wrap:anywhere]).
 * 6. Never renders duplicate phonetic lines beneath the sentence.
 * 7. Never adds furigana to Hiragana-only or Katakana-only words.
 * 8. Furigana ON/OFF remains fully functional.
 */
export const JapaneseText: React.FC<JapaneseTextProps> = ({
  text,
  reading,
  showFurigana = true,
  interactive = false,
  onWordClick,
  className = ''
}) => {
  if (!text) return null;

  // When Furigana is toggled OFF, render pure Japanese text cleanly
  if (!showFurigana) {
    const clean = text
      .replace(/<ruby[^>]*>([\s\S]*?)<rt[^>]*>[\s\S]*?<\/rt>[\s\S]*?<\/ruby>/gi, '$1')
      .replace(/<[^>]+>/g, '')
      .replace(/([^\s（\(\[【]+)\s*[（\(\[【]\s*[ぁ-んァ-ヶー・\.\-]+\s*[）\)\]】]/gu, '$1')
      .trim();

    return (
      <span className={`font-jp select-text [overflow-wrap:anywhere] [word-break:break-word] ${className}`.trim()}>
        {clean}
      </span>
    );
  }

  // Tokenize the sentence with optional authoritative reading
  const tokens = useMemo(() => {
    return tokenizeJapaneseSentence(text, [], [], reading);
  }, [text, reading]);

  return (
    <span className={`font-jp select-text [overflow-wrap:anywhere] [word-break:break-word] leading-[2.1] ${className}`.trim()}>
      {tokens.map((token, tIdx) => {
        const isKanji = !token.isPunctuation && hasKanji(token.surface);

        // 1. Token has ruby breakdown parts
        const content = token.rubyParts && token.rubyParts.length > 0 ? (
          token.rubyParts.map((part, pIdx) => {
            if (part.kanji) {
              return (
                <ruby key={`r-${tIdx}-${pIdx}-${part.kanji}`} className="ruby-unit">
                  {part.kanji}
                  <rt className="ruby-reading">{part.ruby}</rt>
                </ruby>
              );
            }
            return <React.Fragment key={`t-${tIdx}-${pIdx}`}>{part.text}</React.Fragment>;
          })
        ) : (
          token.surface
        );

        // 2. Interactive Kanji word click handler
        if (interactive && isKanji && onWordClick) {
          return (
            <button
              type="button"
              key={`w-${tIdx}-${token.surface}`}
              onClick={(e) => {
                e.stopPropagation();
                onWordClick(token);
              }}
              className="inline p-0 m-0 border-b border-dotted border-stone-300 dark:border-stone-700 hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 font-inherit bg-transparent cursor-pointer transition-colors focus:outline-none"
              title={`"${token.surface}" толь харах`}
            >
              {content}
            </button>
          );
        }

        // 3. Normal non-interactive text node
        return (
          <React.Fragment key={`w-${tIdx}-${token.surface}`}>
            {content}
          </React.Fragment>
        );
      })}
    </span>
  );
};
