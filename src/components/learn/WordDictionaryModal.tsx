import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  BookOpen,
  PenTool,
} from 'lucide-react';
import { DetailedWordInfo, TokenKanjiInfo } from '../../utils/japaneseTokenizer';
import { LevelBadge } from '../common/LevelBadge';
import { AudioButton } from '../common/AudioButton';
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
  const { data } = useApp();
  const [selectedKanjiForStroke, setSelectedKanjiForStroke] = useState<KanjiItem | null>(null);

  // Handle ESC key to close modal
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

  if (!isOpen || !wordInfo) return null;

  // REPLACEMENT PATTERN: If user wants to view stroke order, render ONLY the KanjiStrokeModal
  // This completely eliminates multi-layer stacking and prevents modal collisions.
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
    // Look up full KanjiItem from database if present
    const existing = (data.kanji || []).find(k => k.kanji === kInfo.kanji);
    if (existing) {
      setSelectedKanjiForStroke(existing);
    } else {
      // Dynamic fallback KanjiItem
      const fallbackItem: KanjiItem = {
        id: `kanji_dynamic_${kInfo.kanji}`,
        kanji: kInfo.kanji,
        onyomi: kInfo.onyomi || '—',
        kunyomi: kInfo.kunyomi || '—',
        mongolian: kInfo.mongolian || 'Ханз үсэг',
        jlptLevel: kInfo.jlptLevel || wordInfo.jlptLevel || 'N5',
        exampleWords: kInfo.exampleWords || [],
        createdAt: new Date().toISOString()
      };
      setSelectedKanjiForStroke(fallbackItem);
    }
  };

  const cleanExplanation = getCleanVocabExplanation(
    wordInfo.explanation,
    wordInfo.mongolian,
    wordInfo.partOfSpeech
  );

  const modalJSX = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in min-h-[100dvh] h-[100dvh] pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] px-[max(0.75rem,env(safe-area-inset-left))]"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#150E11] border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col relative transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* COMPACT HEADER */}
        <div className="relative px-4 py-3 border-b border-stone-100 dark:border-stone-800/80 bg-gradient-to-r from-red-50/60 via-stone-50/50 to-white dark:from-[#1E1115] dark:via-[#180E12] dark:to-[#150E11] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF0000] to-[#FF3366] text-white flex items-center justify-center shadow-xs shadow-red-500/20 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm font-black text-stone-900 dark:text-stone-100">
                  Интерактив толь бичиг
                </h3>
                <LevelBadge level={wordInfo.jlptLevel} size="xs" />
              </div>
              <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                {wordInfo.partOfSpeech}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shrink-0 cursor-pointer"
            title="Хаах (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ZERO-SCROLL COMPACT CONTENT CONTAINER (NO INNER SCROLLBAR) */}
        <div className="p-3.5 sm:p-4 space-y-3">
          {/* MAIN WORD HERO CARD */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-900/80 border border-stone-200/70 dark:border-stone-800/80 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 font-jp tracking-tight">
                    {wordInfo.word}
                  </span>
                  {wordInfo.reading && wordInfo.reading !== wordInfo.word && (
                    <span className="text-sm sm:text-base font-bold text-red-600 dark:text-red-400 font-jp">
                      【{wordInfo.reading}】
                    </span>
                  )}
                </div>

                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-stone-200/80 dark:bg-stone-800 text-[10px] font-bold text-stone-700 dark:text-stone-300">
                    {wordInfo.partOfSpeech}
                  </span>
                  {wordInfo.isParticle && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                      Дүрмийн нөхцөл
                    </span>
                  )}
                </div>
              </div>

              <AudioButton
                text={wordInfo.word}
                reading={wordInfo.reading}
                id={`dict_modal_${wordInfo.word}`}
                size="sm"
                title={`"${wordInfo.word}" дуудлага сонсох`}
              />
            </div>

            {/* Mongolian Definition & Clean Usage */}
            <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800">
              <p className="text-base font-extrabold text-[#CC0000] dark:text-[#FF6699] leading-snug">
                {wordInfo.mongolian || 'Тодорхойлолтгүй'}
              </p>
              {cleanExplanation && (
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed bg-white/70 dark:bg-stone-800/50 p-2 rounded-xl border border-stone-200/50 dark:border-stone-700/50">
                  {cleanExplanation}
                </p>
              )}
            </div>
          </div>

          {/* KANJI BREAKDOWN SECTION (Compact cards with stroke CTA) */}
          {wordInfo.kanjiList.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
                <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] font-extrabold">
                  <PenTool className="w-3.5 h-3.5 text-red-500" />
                  <span>Ханз ба Зурлагын дараалал</span>
                </span>
                <span className="text-[10px] font-mono text-stone-400">
                  {wordInfo.kanjiList.length} ханз
                </span>
              </div>

              <div className="space-y-1.5">
                {wordInfo.kanjiList.map((kInfo, idx) => (
                  <div
                    key={`${kInfo.kanji}-${idx}`}
                    className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2.5 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Kanji Character Box */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-[#FF3366] text-white flex items-center justify-center font-black text-xl font-jp shadow-xs shadow-red-500/20 shrink-0">
                        {kInfo.kanji}
                      </div>

                      {/* Kanji Readings & Meaning */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                            {kInfo.mongolian}
                          </span>
                          <LevelBadge level={kInfo.jlptLevel} size="xs" />
                        </div>

                        <div className="text-[10px] text-stone-500 dark:text-stone-400 font-jp truncate mt-0.5">
                          {kInfo.onyomi && kInfo.onyomi !== '—' && (
                            <span className="mr-2">
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
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/60 text-[#CC0000] dark:text-[#FF6699] font-bold text-xs border border-red-200/80 dark:border-red-900/60 transition-colors shrink-0 cursor-pointer"
                      title={`"${kInfo.kanji}" ханзны зурлагын дарааллыг харах`}
                    >
                      <PenTool className="w-3 h-3" />
                      <span>書き順 харах</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SENTENCE CONTEXT (COMPACT 1-LINE DISPLAY) */}
          {sentenceContext && (
            <div className="p-2.5 rounded-xl bg-stone-50/80 dark:bg-stone-900/50 border border-dashed border-stone-300 dark:border-stone-700 space-y-0.5">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-stone-400 block">
                Өгүүлбэр дэх хэрэглээ:
              </span>
              <p className="text-xs font-bold text-stone-800 dark:text-stone-200 font-jp leading-snug truncate">
                {sentenceContext.japanese}
              </p>
              {sentenceContext.mongolian && (
                <p className="text-[11px] text-stone-500 italic truncate">
                  {sentenceContext.mongolian}
                </p>
              )}
            </div>
          )}
        </div>

        {/* COMPACT FOOTER */}
        <div className="px-4 py-2.5 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 flex items-center justify-end shrink-0">
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

