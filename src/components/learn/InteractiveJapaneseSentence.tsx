import React, { useState, useMemo } from 'react';
import { tokenizeJapaneseSentence, DetailedWordInfo } from '../../utils/japaneseTokenizer';
import { hasKanji } from '../../utils/furiganaRenderer';
import { WordDictionaryModal } from './WordDictionaryModal';
import { useApp } from '../../context/AppContext';

export interface InteractiveJapaneseSentenceProps {
  sentence: string;
  reading?: string;
  mongolian?: string;
  className?: string;
}

export const InteractiveJapaneseSentence: React.FC<InteractiveJapaneseSentenceProps> = ({
  sentence,
  reading,
  mongolian,
  className = ''
}) => {
  const { data, userProgress } = useApp();
  const [selectedWord, setSelectedWord] = useState<DetailedWordInfo | null>(null);
  const showFurigana = userProgress.settings?.showFurigana ?? true;

  const tokens = useMemo(() => {
    return tokenizeJapaneseSentence(sentence, data.vocabulary || [], data.kanji || [], reading);
  }, [sentence, data.vocabulary, data.kanji, reading]);

  if (!sentence) return null;

  return (
    <>
      <div className={`font-jp ${showFurigana ? 'leading-[2.2]' : 'leading-relaxed'} ${className}`}>
        <p className="inline">
          {tokens.map((token, idx) => {
            const isKanjiWord = !token.isPunctuation && hasKanji(token.surface);

            // Render accurate semantic HTML <ruby> elements only when Furigana is enabled
            const rubyContent = showFurigana && token.rubyParts && token.rubyParts.length > 0 ? (
              token.rubyParts.map((chunk, cIdx) => {
                if (chunk.kanji) {
                  return (
                    <ruby key={`c-${cIdx}-${chunk.kanji}`} className="ruby-unit">
                      {chunk.kanji}
                      <rt className="ruby-reading">{chunk.ruby}</rt>
                    </ruby>
                  );
                }
                return <span key={`c-${cIdx}`}>{chunk.text}</span>;
              })
            ) : (
              token.surface
            );

            // 1. NON-INTERACTIVE: Hiragana-only, Katakana-only, punctuation, particles
            if (!isKanjiWord) {
              return (
                <span
                  key={`${token.surface}-${idx}`}
                  className="select-text text-stone-900 dark:text-stone-100"
                >
                  {rubyContent}
                </span>
              );
            }

            // 2. INTERACTIVE: Strictly Kanji-containing words ONLY
            return (
              <button
                type="button"
                key={`${token.surface}-${idx}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedWord(token);
                }}
                className="inline px-0.5 mx-[0.5px] rounded transition-all duration-150 cursor-pointer text-stone-900 dark:text-stone-100 font-bold border-b border-dotted border-stone-300/80 dark:border-stone-700 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 dark:hover:text-red-400 active:scale-95 leading-[2.2] bg-transparent text-left font-jp focus:outline-none focus:ring-1 focus:ring-red-400/50"
                title={`"${token.surface}" толь бичиг, тайлбар, ханзны 書き順 харах`}
              >
                {rubyContent}
              </button>
            );
          })}
        </p>
      </div>

      {/* Word Dictionary & Kanji Stroke Popup Modal */}
      <WordDictionaryModal
        isOpen={!!selectedWord}
        onClose={() => setSelectedWord(null)}
        wordInfo={selectedWord}
        sentenceContext={{
          japanese: sentence,
          reading,
          mongolian
        }}
      />
    </>
  );
};
