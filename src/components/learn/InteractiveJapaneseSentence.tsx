import React, { useState, useMemo } from 'react';
import { tokenizeJapaneseSentence, DetailedWordInfo } from '../../utils/japaneseTokenizer';
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
  const { data } = useApp();
  const [selectedWord, setSelectedWord] = useState<DetailedWordInfo | null>(null);

  const tokens = useMemo(() => {
    return tokenizeJapaneseSentence(sentence, data.vocabulary || [], data.kanji || []);
  }, [sentence, data.vocabulary, data.kanji]);

  if (!sentence) return null;

  return (
    <>
      <div className={`font-jp leading-relaxed ${className}`}>
        <p className="inline flex-wrap items-baseline">
          {tokens.map((token, idx) => {
            if (token.isPunctuation) {
              return (
                <span key={`${token.surface}-${idx}`} className="text-stone-700 dark:text-stone-300 select-none">
                  {token.surface}
                </span>
              );
            }

            return (
              <span
                key={`${token.surface}-${idx}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedWord(token);
                }}
                className="inline-block px-0.5 py-0.5 mx-[1px] rounded transition-all duration-150 cursor-pointer text-stone-900 dark:text-stone-100 font-bold border-b border-dotted border-stone-300/80 dark:border-stone-700 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 dark:hover:text-red-400 active:scale-95"
                title={`"${token.surface}" толь бичиг, тайлбар, ханзны 書き順 харах`}
              >
                {token.surface}
              </span>
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
