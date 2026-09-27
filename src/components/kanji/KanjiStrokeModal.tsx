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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#150E11] border border-[rgba(255,51,102,0.20)] dark:border-[rgba(255,51,102,0.28)] shadow-2xl overflow-hidden flex flex-col my-auto transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="relative px-5 py-4 border-b border-stone-100 dark:border-stone-800/80 bg-gradient-to-r from-[#FFF9FA] to-white dark:from-[#1C1014] dark:to-[#150E11] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF0000] to-[#FF3366] text-white flex items-center justify-center font-extrabold text-xl font-jp shadow-sm shadow-red-500/25 shrink-0">
              {kanjiItem.kanji}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-stone-900 dark:text-stone-100 flex items-center gap-1.5 font-jp">
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
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              title="Хаах (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Readings Sub-Bar */}
          <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800/80">
            <div>
              <span className="text-[11px] text-stone-400 block font-medium">Онь (Onyomi):</span>
              <span className="font-bold text-stone-900 dark:text-stone-100 font-jp">
                {kanjiItem.onyomi || '—'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-stone-400 block font-medium">Күн (Kunyomi):</span>
              <span className="font-bold text-stone-900 dark:text-stone-100 font-jp">
                {kanjiItem.kunyomi || '—'}
              </span>
            </div>
          </div>

          {/* Large Stroke Animation Canvas */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="relative group">
              <KanjiStrokeOrder
                kanji={kanjiItem.kanji}
                size={260}
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
              <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center pointer-events-none">
                <div className="px-3 py-1 rounded-full bg-black/65 dark:bg-black/80 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md">
                  <PenTool className="w-3 h-3 text-[#FF3366]" />
                  <span>
                    {currentStroke === totalStrokes && !isPlaying
                      ? '✓ Бүх зурлага дууссан'
                      : `${currentStroke}-р зурлага`}
                  </span>
                  <span className="text-white/60">/</span>
                  <span className="text-white/80">{totalStrokes}</span>
                </div>
              </div>
            </div>

            {/* Quick Canvas View Toggles */}
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowNumbers(!showNumbers)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  showNumbers
                    ? 'bg-red-50 dark:bg-red-950/60 text-[#CC0000] dark:text-[#FF6699] border border-red-200 dark:border-red-900/60'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
                title="Зурлагын дугаарыг харуулах / нуух"
              >
                <Hash className="w-3.5 h-3.5" />
                <span>Дугаар (番号)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGrid(!showGrid)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  showGrid
                    ? 'bg-red-50 dark:bg-red-950/60 text-[#CC0000] dark:text-[#FF6699] border border-red-200 dark:border-red-900/60'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
                title="Хүснэгтийн шугамыг харуулах / нуух"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Шугам (Grid)</span>
              </button>

              {/* Speed Controller */}
              <div className="inline-flex items-center rounded-lg bg-stone-100 dark:bg-stone-800 p-0.5 text-[11px] font-bold">
                {[0.75, 1, 1.5].map(spd => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setSpeedMultiplier(spd)}
                    className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                      speedMultiplier === spd
                        ? 'bg-white dark:bg-stone-700 text-[#CC0000] dark:text-[#FF6699] shadow-xs'
                        : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* MAIN PLAYBACK CONTROLS */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/80 border border-stone-200/60 dark:border-stone-800/80">
            {/* Previous Stroke */}
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStroke <= 1}
              className="p-2.5 sm:px-3 sm:py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="Өмнөх зурлага"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Өмнөх</span>
            </button>

            {/* Play / Pause Toggle Button */}
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF0000] to-[#FF3366] hover:from-[#CC0000] hover:to-[#FF0000] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-red-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer min-w-[120px]"
              title={isPlaying ? 'Түр зогсоох (Space)' : 'Зурлагыг тоглох (Space)'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  <span>Түр зогсоох</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>{currentStroke >= totalStrokes ? 'Дахин тоглуулах' : 'Тоглуулах'}</span>
                </>
              )}
            </button>

            {/* Next Stroke */}
            <button
              type="button"
              onClick={handleNext}
              disabled={currentStroke >= totalStrokes}
              className="p-2.5 sm:px-3 sm:py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="Дараах зурлага"
            >
              <span className="hidden sm:inline">Дараах</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Replay Button */}
            <button
              type="button"
              onClick={handleReplay}
              className="p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-700 transition-all shadow-xs cursor-pointer"
              title="Эхнээс нь дахин эхлүүлэх"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Show All Strokes Button */}
            <button
              type="button"
              onClick={handleShowAll}
              className="p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-700 transition-all shadow-xs cursor-pointer"
              title="Бүх зурлагыг бүтнээр харах"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
          </div>

          {/* STROKE STEP STRIP (Jump directly to any stroke) */}
          {data && data.strokeCount > 1 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 dark:text-stone-400">
                <span>Зурлага алхам бүрээр:</span>
                <span>Нийт {data.strokeCount} зурлага</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
                {Array.from({ length: data.strokeCount }).map((_, idx) => {
                  const stepNum = idx + 1;
                  const isActive = currentStroke === stepNum;
                  const isDone = currentStroke > stepNum;

                  return (
                    <button
                      key={stepNum}
                      type="button"
                      onClick={() => {
                        setIsPlaying(false);
                        setCurrentStroke(stepNum);
                      }}
                      className={`h-8 min-w-[32px] px-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center justify-center ${
                        isActive
                          ? 'bg-gradient-to-r from-[#FF0000] to-[#FF3366] text-white shadow-xs scale-105'
                          : isDone
                          ? 'bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-700'
                          : 'bg-stone-100 dark:bg-stone-900/60 text-stone-400 dark:text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800'
                      }`}
                      title={`${stepNum}-р зурлага руу үсрэх`}
                    >
                      {stepNum}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Example Words / Context info if available */}
          {kanjiItem.exampleWords && kanjiItem.exampleWords.length > 0 && (
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                Холбоо үгс:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {kanjiItem.exampleWords.slice(0, 4).map((ew, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200/50 dark:border-stone-800/60 flex items-center justify-between gap-1"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-stone-900 dark:text-stone-100 font-jp">
                        {ew.word}
                      </span>
                      <span className="text-[11px] text-stone-400 font-jp ml-1">
                        [{ew.reading}]
                      </span>
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
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3 border-t border-stone-100 dark:border-stone-800/80 bg-stone-50/50 dark:bg-stone-900/30 flex items-center justify-between text-xs text-stone-400">
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
