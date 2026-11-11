import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Hash,
  Grid,
  CheckCheck,
  PenTool,
  Sparkles,
} from 'lucide-react';
import { KanjiItem } from '../../types';
import { KanjiStrokeOrder } from './KanjiStrokeOrder';
import { LevelBadge } from '../common/LevelBadge';
import { AudioButton } from '../common/AudioButton';
import { extractKanjiPronunciation } from '../../services/speech';
import { loadKanjiStrokeData, KanjiStrokeData } from '../../utils/kanjiVG';

export interface KanjiStrokeModalProps {
  isOpen: boolean;
  onClose: () => void;
  kanjiItem: KanjiItem | null;
}

export const KanjiStrokeModal: React.FC<KanjiStrokeModalProps> = ({
  isOpen,
  onClose,
  kanjiItem,
}) => {
  const [data, setData] = useState<KanjiStrokeData | null>(null);
  const [currentStroke, setCurrentStroke] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showNumbers, setShowNumbers] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);

  // Load stroke data for step strip & total count
  useEffect(() => {
    if (!kanjiItem || !isOpen) return;

    let isCancelled = false;
    setCurrentStroke(1);
    setIsPlaying(true);

    loadKanjiStrokeData(kanjiItem.kanji).then(res => {
      if (!isCancelled && res) {
        setData(res);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [kanjiItem, isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, data, currentStroke]);

  const totalStrokes = data?.strokeCount || 1;

  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    setCurrentStroke(prev => Math.max(1, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setIsPlaying(false);
    setCurrentStroke(prev => Math.min(totalStrokes, prev + 1));
  }, [totalStrokes]);

  const handleReplay = useCallback(() => {
    setCurrentStroke(1);
    setIsPlaying(true);
  }, []);

  const handleShowAll = useCallback(() => {
    setIsPlaying(false);
    setCurrentStroke(totalStrokes);
  }, [totalStrokes]);

  const pronunciation = useMemo(() => {
    if (!kanjiItem) return null;
    return extractKanjiPronunciation(kanjiItem);
  }, [kanjiItem]);

  if (!isOpen || !kanjiItem) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-4 bg-black/65 dark:bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-xl sm:max-w-2xl lg:max-w-3xl rounded-3xl bg-white dark:bg-[#150E11] border border-[rgba(255,51,102,0.20)] dark:border-[rgba(255,51,102,0.28)] shadow-2xl overflow-hidden flex flex-col my-auto transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="relative px-4 sm:px-5 py-3 border-b border-stone-100 dark:border-stone-800/80 bg-gradient-to-r from-[#FFF9FA] to-white dark:from-[#1C1014] dark:to-[#150E11] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF0000] to-[#FF3366] text-white flex items-center justify-center font-extrabold text-xl font-jp shadow-sm shadow-red-500/25 shrink-0">
              {kanjiItem.kanji}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100 flex items-center gap-1.5 font-jp">
                  <span>{kanjiItem.kanji}</span>
                  <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                    書き順 (Зурлагын дараалал)
                  </span>
                </h2>
                <LevelBadge level={kanjiItem.jlptLevel} size="sm" />
                {data && (
                  <span className="px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/60 text-[#CC0000] dark:text-[#FF6699] text-[11px] font-extrabold border border-red-200/60 dark:border-red-900/50">
                    {data.strokeCount} 画
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-stone-600 dark:text-stone-300 truncate">
                {kanjiItem.mongolian}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {pronunciation && (
              <AudioButton
                text={pronunciation.text}
                reading={pronunciation.reading}
                id={`modal_kanji_${kanjiItem.id}`}
                size="sm"
                title={`"${kanjiItem.kanji}" дуудлага сонсох`}
              />
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              title="Хаах (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY - 2-column zero-scroll layout on desktop */}
        <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-center">
          {/* LEFT COLUMN: Animated Canvas + Complete Playback Controls */}
          <div className="flex flex-col items-center justify-center space-y-2.5">
            <div className="relative flex items-center justify-center w-full max-w-[210px] aspect-square mx-auto">
              <KanjiStrokeOrder
                kanji={kanjiItem.kanji}
                size={200}
                isPlaying={isPlaying}
                onPlayingChange={setIsPlaying}
                currentStroke={currentStroke}
                onStrokeChange={(stroke) => setCurrentStroke(stroke)}
                onFinish={() => setIsPlaying(false)}
                showNumbers={showNumbers}
                showGrid={showGrid}
                speedMultiplier={speedMultiplier}
              />

              {/* Status Pill overlay at bottom */}
              <div className="absolute bottom-2 inset-x-0 flex items-center justify-center pointer-events-none">
                <div className="px-2.5 py-0.5 rounded-full bg-black/70 dark:bg-black/85 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
                  <PenTool className="w-3 h-3 text-[#FF3366]" />
                  <span>
                    {currentStroke === totalStrokes && !isPlaying
                      ? '✓ Бүрэн дууссан'
                      : `${currentStroke}-р зурлага`}
                  </span>
                  <span className="text-white/60">/</span>
                  <span className="text-white/80">{totalStrokes}</span>
                </div>
              </div>
            </div>

            {/* FULL PLAYBACK CONTROLS (Prev, Play/Pause, Next, Replay) */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-2xl bg-stone-50 dark:bg-stone-900/80 border border-stone-200/60 dark:border-stone-800/80 w-full max-w-[260px]">
              {/* Prev Stroke */}
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStroke <= 1}
                className="p-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Өмнөх зурлага (←)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Play / Pause Toggle Button */}
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex-1 py-1.5 px-3 rounded-lg bg-gradient-to-r from-[#FF0000] to-[#FF3366] hover:from-[#CC0000] hover:to-[#FF0000] text-white font-extrabold text-xs shadow-xs shadow-red-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title={isPlaying ? 'Түр зогсоох (Space)' : 'Зурлагыг тоглуулах (Space)'}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-white" />
                    <span>Зогсоох</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{currentStroke >= totalStrokes ? 'Дахин' : 'Тоглуулах'}</span>
                  </>
                )}
              </button>

              {/* Next Stroke */}
              <button
                type="button"
                onClick={handleNext}
                disabled={currentStroke >= totalStrokes}
                className="p-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Дараагийн зурлага (→)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Replay */}
              <button
                type="button"
                onClick={handleReplay}
                className="p-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-all cursor-pointer"
                title="Эхнээс нь дахин тоглуулах"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Readings, Toggles & Example Words */}
          <div className="flex flex-col justify-between space-y-2.5 min-w-0">
            {/* Readings Box */}
            <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800/80">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Онь (音):
                </span>
                <span className="font-bold text-stone-900 dark:text-stone-100 font-jp text-xs truncate block">
                  {kanjiItem.onyomi || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Күн (訓):
                </span>
                <span className="font-bold text-stone-900 dark:text-stone-100 font-jp text-xs truncate block">
                  {kanjiItem.kunyomi || '—'}
                </span>
              </div>
            </div>

            {/* Display Toggles (Grid & Numbers) */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setShowGrid(!showGrid)}
                className={`flex-1 py-1 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  showGrid
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50 text-[#CC0000] dark:text-[#FF6699]'
                    : 'bg-stone-50 dark:bg-stone-900/50 border-stone-200 dark:border-stone-800 text-stone-500'
                }`}
              >
                <Grid className="w-3 h-3" />
                <span>Шугам {showGrid ? 'Нээлттэй' : 'Хаалттай'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowNumbers(!showNumbers)}
                className={`flex-1 py-1 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  showNumbers
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50 text-[#CC0000] dark:text-[#FF6699]'
                    : 'bg-stone-50 dark:bg-stone-900/50 border-stone-200 dark:border-stone-800 text-stone-500'
                }`}
              >
                <Hash className="w-3 h-3" />
                <span>Дугаар {showNumbers ? 'Нээлттэй' : 'Хаалттай'}</span>
              </button>
            </div>

            {/* Example Words (Up to 3 items) */}
            {kanjiItem.exampleWords && kanjiItem.exampleWords.length > 0 ? (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                  Холбоо үгс:
                </span>
                <div className="space-y-1 max-h-[140px] overflow-y-auto pr-0.5">
                  {kanjiItem.exampleWords.slice(0, 3).map((ew, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200/50 dark:border-stone-800/60 flex items-center justify-between gap-1 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-stone-900 dark:text-stone-100 font-jp">
                            {ew.word}
                          </span>
                          <span className="text-[10px] text-stone-400 font-jp">
                            [{ew.reading}]
                          </span>
                        </div>
                        <p className="text-[11px] text-red-600 dark:text-red-400 font-medium truncate">
                          {ew.mongolian}
                        </p>
                      </div>
                      <AudioButton
                        text={ew.word}
                        reading={ew.reading}
                        id={`modal_ew_${kanjiItem.id}_${idx}`}
                        size="xs"
                        variant="ghost"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/40 border border-dashed border-stone-200 dark:border-stone-800 text-center">
                <p className="text-xs text-stone-400">
                  Зурлагын дарааллыг сайтар ажиглан бичиж дасгал хийгээрэй.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-4 sm:px-5 py-2.5 border-t border-stone-100 dark:border-stone-800/80 bg-stone-50/50 dark:bg-stone-900/30 flex items-center justify-between text-xs text-stone-400 shrink-0">
          <span className="flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-[#FF3366]" />
            <span>KanjiVG стандарт зурлагын дараалал</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Хаах
          </button>
        </div>
      </div>
    </div>
  );
};
