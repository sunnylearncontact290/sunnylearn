import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Volume2,
  Sparkles,
  PenTool,
  Info,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { DetailedWordInfo, TokenKanjiInfo } from '../../utils/japaneseTokenizer';
import { LevelBadge } from '../common/LevelBadge';
import { AudioButton } from '../common/AudioButton';
import { KanjiStrokeModal } from '../kanji/KanjiStrokeModal';
import { KanjiItem, JLPTLevel } from '../../types';
import { useApp } from '../../context/AppContext';

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

  if (!isOpen || !wordInfo) return null;

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

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in"
        onClick={e => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#150E11] border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col my-auto transition-all"
          onClick={e => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="relative px-5 py-4 border-b border-stone-100 dark:border-stone-800/80 bg-gradient-to-r from-red-50/60 via-stone-50/50 to-white dark:from-[#1E1115] dark:via-[#180E12] dark:to-[#150E11] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF0000] to-[#FF3366] text-white flex items-center justify-center shadow-sm shadow-red-500/20 shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
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
              onClick={onClose}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shrink-0"
              title="Хаах"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* BODY */}
          <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* MAIN WORD HERO CARD */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/80 border border-stone-200/70 dark:border-stone-800/80 space-y-2.5">
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
                    <span className="px-2 py-0.5 rounded-md bg-stone-200/80 dark:bg-stone-800 text-[11px] font-bold text-stone-700 dark:text-stone-300">
                      {wordInfo.partOfSpeech}
                    </span>
                    {wordInfo.isParticle && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                        Дүрмийн нөхцөл
                      </span>
                    )}
                  </div>
                </div>

                <AudioButton
                  text={wordInfo.word}
                  reading={wordInfo.reading}
                  id={`dict_modal_${wordInfo.word}`}
                  size="md"
                  title={`"${wordInfo.word}" дуудлага сонсох`}
                />
              </div>

              {/* Mongolian Definition */}
              <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 block mb-0.5">
                  Монгол утга:
                </span>
                <p className="text-base font-bold text-stone-900 dark:text-stone-100 leading-snug">
                  {wordInfo.mongolian || 'Тодорхойлолтгүй'}
                </p>
                {wordInfo.explanation && (
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-1.5 leading-relaxed bg-white/70 dark:bg-stone-800/50 p-2.5 rounded-xl border border-stone-200/50 dark:border-stone-700/50">
                    {wordInfo.explanation}
                  </p>
                )}
              </div>
            </div>

            {/* KANJI BREAKDOWN SECTION */}
            {wordInfo.kanjiList.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-red-500" />
                    <span>Ханзны задаргаа ба Зурлагын дараалал (書き順)</span>
                  </h4>
                  <span className="text-[11px] font-bold text-stone-400">
                    {wordInfo.kanjiList.length} ханз
                  </span>
                </div>

                <div className="space-y-2.5">
                  {wordInfo.kanjiList.map((kInfo, idx) => (
                    <div
                      key={`${kInfo.kanji}-${idx}`}
                      className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-red-300 dark:hover:border-red-900/60 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Large Kanji Display */}
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-[#FF3366] text-white flex items-center justify-center font-black text-2xl font-jp shadow-sm shadow-red-500/20 shrink-0">
                          {kInfo.kanji}
                        </div>

                        {/* Kanji Readings & Meaning */}
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                              {kInfo.mongolian}
                            </span>
                            <LevelBadge level={kInfo.jlptLevel} size="xs" />
                          </div>

                          <div className="text-[11px] space-y-0.5 text-stone-500 dark:text-stone-400 font-jp">
                            {kInfo.onyomi && kInfo.onyomi !== '—' && (
                              <p>
                                <span className="font-semibold text-stone-400">ОН:</span> {kInfo.onyomi}
                              </p>
                            )}
                            {kInfo.kunyomi && kInfo.kunyomi !== '—' && (
                              <p>
                                <span className="font-semibold text-stone-400">КУН:</span> {kInfo.kunyomi}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stroke Order CTA Button */}
                      <button
                        onClick={() => handleOpenKanjiStroke(kInfo)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/60 text-[#CC0000] dark:text-[#FF6699] font-bold text-xs border border-red-200/80 dark:border-red-900/60 transition-colors shrink-0 cursor-pointer"
                        title={`"${kInfo.kanji}" ханзны зурлагын дарааллыг харах`}
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>書き順 харах</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SENTENCE CONTEXT (WHERE WORD WAS CLICKED) */}
            {sentenceContext && (
              <div className="p-3.5 rounded-2xl bg-stone-50/80 dark:bg-stone-900/50 border border-dashed border-stone-300 dark:border-stone-700 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 block">
                  Өгүүлбэр дэх хэрэглээ:
                </span>
                <p className="text-xs font-bold text-stone-800 dark:text-stone-200 font-jp leading-relaxed">
                  {sentenceContext.japanese}
                </p>
                {sentenceContext.mongolian && (
                  <p className="text-[11px] text-stone-500 italic">
                    {sentenceContext.mongolian}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="px-5 py-3 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Хаах
            </button>
          </div>
        </div>
      </div>

      {/* Embedded KanjiVG Stroke Order Modal */}
      <KanjiStrokeModal
        isOpen={!!selectedKanjiForStroke}
        onClose={() => setSelectedKanjiForStroke(null)}
        kanjiItem={selectedKanjiForStroke}
      />
    </>
  );
};
