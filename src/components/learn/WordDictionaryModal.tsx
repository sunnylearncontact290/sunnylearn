import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  BookOpen,
  PenTool,
  ArrowLeft,
  Star,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  DetailedWordInfo,
  TokenKanjiInfo,
  tokenizeJapaneseSentence
} from '../../utils/japaneseTokenizer';
import { alignRubyParts, hasKanji } from '../../utils/furiganaRenderer';
import { loadKanjiStrokeData } from '../../utils/kanjiVG';
import { LevelBadge } from '../common/LevelBadge';
import { AudioButton } from '../common/AudioButton';
import { JapaneseText } from '../common/JapaneseText';
import { KanjiStrokeModal } from '../kanji/KanjiStrokeModal';
import { KanjiItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { getCleanVocabExplanation } from '../../utils/vocabUtils';

export interface WordDictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  wordInfo: DetailedWordInfo | null;
  sentenceContext?: {
    japanese: string;
    reading?: string;
    mongolian?: string;
  };
}

export const WordDictionaryModal: React.FC<WordDictionaryModalProps> = ({
  isOpen,
  onClose,
  wordInfo,
  sentenceContext
}) => {
  const { data, userProgress, toggleFavorite } = useApp();

  // Single-layer navigation stack: tapping a word inside an example sentence
  // replaces the displayed word cleanly inside THIS modal instead of stacking modals.
  const [displayedWord, setDisplayedWord] = useState<DetailedWordInfo | null>(wordInfo);
  const [historyStack, setHistoryStack] = useState<DetailedWordInfo[]>([]);
  const [selectedKanjiForStroke, setSelectedKanjiForStroke] = useState<KanjiItem | null>(null);
  const [showFurigana, setShowFurigana] = useState<boolean>(userProgress.settings?.showFurigana ?? true);
  const [strokeCounts, setStrokeCounts] = useState<Record<string, number | null>>({});

  // Sync internal displayedWord when external wordInfo changes or modal opens
  useEffect(() => {
    if (isOpen && wordInfo) {
      setDisplayedWord(wordInfo);
      setHistoryStack([]);
      setSelectedKanjiForStroke(null);
      setShowFurigana(userProgress.settings?.showFurigana ?? true);
    }
  }, [isOpen, wordInfo, userProgress.settings?.showFurigana]);

  // Handle ESC key to close / step back cleanly
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedKanjiForStroke) {
          setSelectedKanjiForStroke(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedKanjiForStroke, onClose]);

  // Load verified KanjiVG stroke counts for each Kanji in displayedWord (cached in kanjiVG.ts)
  useEffect(() => {
    if (!isOpen || !displayedWord || displayedWord.kanjiList.length === 0) return;

    let isCancelled = false;
    const kanjiChars = displayedWord.kanjiList.map(k => k.kanji);

    kanjiChars.forEach(char => {
      if (char in strokeCounts) return;
      loadKanjiStrokeData(char)
        .then(res => {
          if (isCancelled) return;
          setStrokeCounts(prev => ({
            ...prev,
            [char]: res ? res.strokeCount : null
          }));
        })
        .catch(() => {
          if (isCancelled) return;
          setStrokeCounts(prev => ({ ...prev, [char]: null }));
        });
    });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, displayedWord]);

  // Tokenize the word's own example sentence for interactive Kanji-word tapping
  const exampleTokens = useMemo(() => {
    if (!displayedWord?.exampleSentence) return [];
    return tokenizeJapaneseSentence(
      displayedWord.exampleSentence,
      data.vocabulary || [],
      data.kanji || [],
      displayedWord.exampleReading
    );
  }, [
    displayedWord?.exampleSentence,
    displayedWord?.exampleReading,
    data.vocabulary,
    data.kanji
  ]);

  if (!isOpen || !displayedWord) return null;

  // REPLACEMENT PATTERN: Viewing stroke order replaces this modal view cleanly (zero modal stacking)
  if (selectedKanjiForStroke) {
    return (
      <KanjiStrokeModal
        isOpen={true}
        onClose={() => setSelectedKanjiForStroke(null)}
        kanjiItem={selectedKanjiForStroke}
      />
    );
  }

  const handleOpenKanjiStroke = (kInfo: TokenKanjiInfo) => {
    const existing = (data.kanji || []).find(k => k.kanji === kInfo.kanji);
    if (existing) {
      setSelectedKanjiForStroke(existing);
    } else {
      const fallbackItem: KanjiItem = {
        id: `kanji_dynamic_${kInfo.kanji}`,
        kanji: kInfo.kanji,
        onyomi: kInfo.onyomi || '—',
        kunyomi: kInfo.kunyomi || '—',
        mongolian: kInfo.mongolian || 'Ханз үсэг',
        jlptLevel: kInfo.jlptLevel || displayedWord.jlptLevel || 'N5',
        exampleWords: kInfo.exampleWords || [],
        createdAt: new Date().toISOString()
      };
      setSelectedKanjiForStroke(fallbackItem);
    }
  };

  const handleNavigateToToken = (token: DetailedWordInfo) => {
    setHistoryStack(prev => [...prev, displayedWord]);
    setDisplayedWord(token);
  };

  const handleGoBack = () => {
    if (historyStack.length === 0) return;
    const prevWord = historyStack[historyStack.length - 1];
    setHistoryStack(prev => prev.slice(0, -1));
    setDisplayedWord(prevWord);
  };

  const wordDisplayReading = displayedWord.dictionaryReading || displayedWord.reading;
  const wordRubyParts = alignRubyParts(displayedWord.word, wordDisplayReading);
  const cleanExplanation = getCleanVocabExplanation(
    displayedWord.explanation,
    displayedWord.mongolian,
    displayedWord.partOfSpeech
  );
  const isFav = displayedWord.rawItem
    ? (userProgress.favorites?.vocabIds || []).includes(displayedWord.rawItem.id)
    : false;
  const isConjugatedForm =
    displayedWord.surface &&
    displayedWord.word &&
    displayedWord.surface !== displayedWord.word;

  const modalJSX = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in min-h-[100dvh] h-[100dvh] pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] px-[max(0.75rem,env(safe-area-inset-left))]"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-xl my-auto rounded-3xl bg-white dark:bg-[#150E11] border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col relative transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* COMPACT HEADER */}
        <div className="relative px-3.5 sm:px-4 py-2.5 border-b border-stone-100 dark:border-stone-800/80 bg-gradient-to-r from-red-50/60 via-stone-50/50 to-white dark:from-[#1E1115] dark:via-[#180E12] dark:to-[#150E11] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {historyStack.length > 0 ? (
              <button
                type="button"
                onClick={handleGoBack}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold transition-colors shrink-0 cursor-pointer"
                title="Өмнөх үг рүү буцах"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Буцах</span>
              </button>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF0000] to-[#FF3366] text-white flex items-center justify-center shadow-xs shadow-red-500/20 shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-xs sm:text-sm font-black text-stone-900 dark:text-stone-100 truncate">
                  Интерактив толь бичиг
                </h3>
                <LevelBadge level={displayedWord.jlptLevel} size="xs" />
              </div>
              <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 truncate">
                {displayedWord.partOfSpeech}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Furigana ON/OFF Toggle */}
            <button
              type="button"
              onClick={() => setShowFurigana(prev => !prev)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                showFurigana
                  ? 'bg-red-50 dark:bg-red-950/50 text-[#CC0000] dark:text-[#FF6699] border-red-200/80 dark:border-red-900/60'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700'
              }`}
              title={showFurigana ? 'Фуригана нуух' : 'Фуригана харуулах'}
            >
              {showFurigana ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span className="font-jp">ふりがな</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              title="Хаах (ESC)"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* ZERO-SCROLL COMPACT CONTENT CONTAINER */}
        <div className="p-3 sm:p-4 space-y-2.5">
          {/* 1. WORD-FIRST HERO CARD */}
          <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/80 border border-stone-200/70 dark:border-stone-800/80 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 font-jp tracking-tight leading-[1.9]">
                    {showFurigana && hasKanji(displayedWord.word) && wordRubyParts.length > 0 ? (
                      wordRubyParts.map((chunk, idx) =>
                        chunk.kanji ? (
                          <ruby key={`hdr-${idx}-${chunk.kanji}`} className="ruby-unit">
                            {chunk.kanji}
                            <rt className="ruby-reading">{chunk.ruby}</rt>
                          </ruby>
                        ) : (
                          <span key={`hdr-${idx}`}>{chunk.text}</span>
                        )
                      )
                    ) : (
                      displayedWord.word
                    )}
                  </span>

                  {/* Show reading inline ONLY when Furigana is OFF or word has no Kanji */}
                  {(!showFurigana && wordDisplayReading && wordDisplayReading !== displayedWord.word) && (
                    <span className="text-xs sm:text-sm font-bold text-red-600 dark:text-red-400 font-jp">
                      【{wordDisplayReading}】
                    </span>
                  )}
                </div>

                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-stone-200/80 dark:bg-stone-800 text-[10px] font-bold text-stone-700 dark:text-stone-300">
                    {displayedWord.partOfSpeech}
                  </span>
                  {isConjugatedForm && (
                    <span className="px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/50 text-[#CC0000] dark:text-[#FF6699] text-[10px] font-bold font-jp border border-red-200/60 dark:border-red-900/50">
                      Өгүүлбэрт: {displayedWord.surface}
                    </span>
                  )}
                  {displayedWord.isParticle && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                      Дүрмийн нөхцөл
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {displayedWord.rawItem && (
                  <button
                    type="button"
                    onClick={() => toggleFavorite('vocab', displayedWord.rawItem!.id)}
                    className="p-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-400 hover:text-amber-500 transition-colors cursor-pointer"
                    title={isFav ? 'Хадгалснаас хасах' : 'Хадгалах'}
                  >
                    <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                )}
                <AudioButton
                  text={displayedWord.word}
                  reading={wordDisplayReading}
                  id={`dict_modal_${displayedWord.word}`}
                  size="sm"
                  title={`"${displayedWord.word}" дуудлага сонсох`}
                />
              </div>
            </div>

            {/* Mongolian Meaning & Clean Explanation */}
            <div className="pt-1.5 border-t border-stone-200/60 dark:border-stone-800">
              <p className="text-base sm:text-lg font-extrabold text-[#CC0000] dark:text-[#FF6699] leading-snug">
                {displayedWord.mongolian || 'Тодорхойлолтгүй'}
              </p>
              {cleanExplanation && (
                <p className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-400 mt-1 leading-snug bg-white/70 dark:bg-stone-800/50 px-2.5 py-1.5 rounded-xl border border-stone-200/50 dark:border-stone-700/50">
                  {cleanExplanation}
                </p>
              )}
            </div>
          </div>

          {/* 2. INTERACTIVE EXAMPLE SENTENCE */}
          {displayedWord.exampleSentence ? (
            <div className="p-2.5 sm:p-3 rounded-2xl bg-stone-50/90 dark:bg-stone-900/60 border border-stone-200/70 dark:border-stone-800/80 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className={`font-jp text-sm sm:text-base min-w-0 flex-1 [overflow-wrap:anywhere] [word-break:break-word] ${showFurigana ? 'leading-[2.2]' : 'leading-relaxed'}`}>
                  <p className="inline">
                    {exampleTokens.map((token, idx) => {
                      const isKanjiWord = !token.isPunctuation && hasKanji(token.surface);

                      const rubyContent =
                        showFurigana && token.rubyParts && token.rubyParts.length > 0
                          ? token.rubyParts.map((chunk, cIdx) =>
                              chunk.kanji ? (
                                <ruby key={`ex-${idx}-${cIdx}-${chunk.kanji}`} className="ruby-unit">
                                  {chunk.kanji}
                                  <rt className="ruby-reading">{chunk.ruby}</rt>
                                </ruby>
                              ) : (
                                <span key={`ex-${idx}-${cIdx}`}>{chunk.text}</span>
                              )
                            )
                          : token.surface;

                      if (!isKanjiWord) {
                        return (
                          <span
                            key={`ex-${token.surface}-${idx}`}
                            className="select-text text-stone-900 dark:text-stone-100"
                          >
                            {rubyContent}
                          </span>
                        );
                      }

                      const isSameActiveWord =
                        token.word === displayedWord.word && token.surface === displayedWord.surface;

                      return (
                        <button
                          type="button"
                          key={`ex-${token.surface}-${idx}`}
                          onClick={() => {
                            if (!isSameActiveWord) {
                              handleNavigateToToken(token);
                            }
                          }}
                          className={`inline px-0.5 mx-[0.5px] rounded transition-all duration-150 font-bold border-b font-jp text-left focus:outline-none focus:ring-1 focus:ring-red-400/50 ${
                            isSameActiveWord
                              ? 'text-[#CC0000] dark:text-[#FF6699] border-red-400/70 bg-red-50/70 dark:bg-red-950/40 cursor-default'
                              : 'cursor-pointer text-stone-900 dark:text-stone-100 border-dotted border-stone-300/90 dark:border-stone-700 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 dark:hover:text-red-400 active:scale-95 bg-transparent'
                          }`}
                          title={`"${token.surface}" толь бичиг харах`}
                        >
                          {rubyContent}
                        </button>
                      );
                    })}
                  </p>
                </div>

                <AudioButton
                  text={displayedWord.exampleSentence}
                  reading={displayedWord.exampleReading}
                  id={`dict_ex_${displayedWord.word}`}
                  size="xs"
                  variant="ghost"
                  className="shrink-0 mt-0.5"
                  title="Жишээ өгүүлбэр сонсох"
                />
              </div>

              {displayedWord.exampleMongolian && (
                <p className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-400 pt-1.5 border-t border-stone-200/50 dark:border-stone-800/60 leading-snug">
                  {displayedWord.exampleMongolian}
                </p>
              )}
            </div>
          ) : sentenceContext ? (
            <div className="p-2.5 rounded-xl bg-stone-50/80 dark:bg-stone-900/50 border border-dashed border-stone-300 dark:border-stone-700 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-200 font-jp min-w-0 flex-1">
                  <JapaneseText
                    text={sentenceContext.japanese}
                    reading={sentenceContext.reading}
                    showFurigana={showFurigana}
                    vocabulary={data.vocabulary}
                    kanji={data.kanji}
                  />
                </div>
                <AudioButton
                  text={sentenceContext.japanese}
                  reading={sentenceContext.reading}
                  id={`dict_ctx_${displayedWord.word}`}
                  size="xs"
                  variant="ghost"
                  className="shrink-0"
                  title="Өгүүлбэр сонсох"
                />
              </div>
              {sentenceContext.mongolian && (
                <p className="text-[11px] text-stone-500 dark:text-stone-400 italic leading-snug">
                  {sentenceContext.mongolian}
                </p>
              )}
            </div>
          ) : null}

          {/* 3. KANJI CONTAINED IN THE WORD (Strict Kanji-only, with Stroke Count & 書き順) */}
          {displayedWord.kanjiList.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
                <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px] font-extrabold">
                  <PenTool className="w-3.5 h-3.5 text-red-500" />
                  <span>Орсон ханз ба Зурлага</span>
                </span>
                <span className="text-[10px] font-mono text-stone-400">
                  {displayedWord.kanjiList.length} ханз
                </span>
              </div>

              <div
                className={`grid gap-1.5 ${
                  displayedWord.kanjiList.length >= 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
                }`}
              >
                {displayedWord.kanjiList.map((kInfo, idx) => {
                  const strokeCount = strokeCounts[kInfo.kanji];
                  const isStrokeLoaded = kInfo.kanji in strokeCounts;

                  return (
                    <div
                      key={`${kInfo.kanji}-${idx}`}
                      className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Large Kanji Character Box */}
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-[#FF3366] text-white flex items-center justify-center font-black text-lg font-jp shadow-xs shadow-red-500/20 shrink-0">
                          {kInfo.kanji}
                        </div>

                        {/* Kanji Meaning, JLPT, Stroke Count & Readings */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate max-w-[130px]">
                              {kInfo.mongolian}
                            </span>
                            <LevelBadge level={kInfo.jlptLevel} size="xs" />
                            {isStrokeLoaded && (
                              <span className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-[9px] font-mono font-bold text-stone-500 dark:text-stone-400">
                                {strokeCount ? `${strokeCount} зурлага` : 'Зурлагагүй'}
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] text-stone-500 dark:text-stone-400 font-jp truncate mt-0.5">
                            {kInfo.onyomi && kInfo.onyomi !== '—' && (
                              <span className="mr-1.5">
                                <span className="font-semibold text-stone-400">ОН:</span> {kInfo.onyomi}
                              </span>
                            )}
                            {kInfo.kunyomi && kInfo.kunyomi !== '—' && (
                              <span>
                                <span className="font-semibold text-stone-400">КУН:</span> {kInfo.kunyomi}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stroke Order CTA Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenKanjiStroke(kInfo)}
                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/60 text-[#CC0000] dark:text-[#FF6699] font-bold text-[11px] border border-red-200/80 dark:border-red-900/60 transition-colors shrink-0 cursor-pointer"
                        title={`"${kInfo.kanji}" ханзны зурлагын дарааллыг харах`}
                      >
                        <PenTool className="w-3 h-3" />
                        <span>書き順 харах</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* COMPACT FOOTER */}
        <div className="px-3.5 sm:px-4 py-2 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 flex items-center justify-between gap-2 shrink-0">
          <span className="text-[10px] text-stone-400">
            {historyStack.length > 0 ? `Түүх: ${historyStack.length} алхам` : 'SunnyLearn Толь бичиг'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Хаах
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalJSX, document.body)
    : modalJSX;
};
