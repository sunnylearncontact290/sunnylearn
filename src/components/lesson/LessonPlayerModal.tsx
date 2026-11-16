import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Volume2,
  Check,
  ArrowRight,
  Sparkles,
  Trophy,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import {
  CurriculumLesson,
  CurriculumExercise,
  ContentType,
  JLPTLevel
} from '../../types';
import { useApp, CompleteCurriculumLessonDetails } from '../../context/AppContext';
import { generateExercisesForLesson } from '../../data/curriculumGenerator';
import { speechService } from '../../services/speech';
import { triggerHapticFeedback } from '../../services/nativePlatform';
import { JapaneseText } from '../common/JapaneseText';

interface LessonPlayerModalProps {
  lesson: CurriculumLesson | null;
  wasAlreadyCompleted?: boolean;
  nextLesson?: CurriculumLesson | null;
  onClose: () => void;
  onLessonComplete: (
    lessonId: string,
    earnedXP: number,
    details?: CompleteCurriculumLessonDetails
  ) => void;
  onStartNextLesson?: (next: CurriculumLesson) => void;
  onPracticeMissed?: (missedIds: string[]) => void;
}

export const LessonPlayerModal: React.FC<LessonPlayerModalProps> = ({
  lesson,
  wasAlreadyCompleted = false,
  nextLesson = null,
  onClose,
  onLessonComplete,
  onStartNextLesson,
  onPracticeMissed
}) => {
  const { data, userProgress } = useApp();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedTiles, setSelectedTiles] = useState<{ id: string; text: string }[]>([]);
  const [availableTiles, setAvailableTiles] = useState<{ id: string; text: string }[]>([]);
  const [checkState, setCheckState] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [isFinished, setIsFinished] = useState(false);

  // Real session telemetry
  const [sessionXP, setSessionXP] = useState(0);
  const [correctGradedCount, setCorrectGradedCount] = useState(0);
  const [totalGradedCount, setTotalGradedCount] = useState(0);
  const [correctItems, setCorrectItems] = useState<Array<{ id: string; type: ContentType; level?: JLPTLevel }>>([]);
  const [missedItems, setMissedItems] = useState<Array<{ id: string; type: ContentType; level?: JLPTLevel }>>([]);

  // Anti-farming / duplicate dispatch guard per lesson session
  const hasDispatchedCompletion = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset full state whenever a new lesson opens (e.g. clicking "Дараагийн хичээл")
  useEffect(() => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setSelectedTiles([]);
    setAvailableTiles([]);
    setCheckState('idle');
    setIsFinished(false);
    setSessionXP(0);
    setCorrectGradedCount(0);
    setTotalGradedCount(0);
    setCorrectItems([]);
    setMissedItems([]);
    hasDispatchedCompletion.current = false;
  }, [lesson?.id]);

  // Generate exercises for this lesson using real datasets & SRS history
  const exercises = useMemo(() => {
    if (!lesson) return [];
    return generateExercisesForLesson(
      lesson,
      data.vocabulary || [],
      data.kanji || [],
      data.grammar || [],
      userProgress.itemStudyRecords || {}
    );
  }, [lesson?.id, data.vocabulary, data.kanji, data.grammar]);

  const currentExercise: CurriculumExercise | undefined = exercises[currentIndex];

  // Reset per-question interaction state
  useEffect(() => {
    if (currentExercise) {
      setSelectedAnswer(null);
      setCheckState('idle');
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }

      if (currentExercise.type === 'sentence_scramble' && currentExercise.wordTiles) {
        setSelectedTiles([]);
        setAvailableTiles([...currentExercise.wordTiles]);
      } else {
        setSelectedTiles([]);
        setAvailableTiles([]);
      }

      if (
        (currentExercise.type === 'vocab_intro' || currentExercise.type === 'kanji_intro') &&
        currentExercise.targetJapanese
      ) {
        speechService.play(currentExercise.targetJapanese, {
          reading: currentExercise.targetReading
        });
      }
    }
  }, [currentIndex, currentExercise]);

  if (!lesson || exercises.length === 0) return null;

  const isIntroCard =
    currentExercise?.type === 'vocab_intro' ||
    currentExercise?.type === 'kanji_intro' ||
    currentExercise?.type === 'grammar_intro';

  const progressPercent = isFinished
    ? 100
    : Math.min(100, Math.round((currentIndex / exercises.length) * 100));

  const accuracyPercent =
    totalGradedCount > 0 ? Math.round((correctGradedCount / totalGradedCount) * 100) : 100;

  const earnedFinalXP = wasAlreadyCompleted ? 0 : lesson.xpReward || 15;

  const handlePlayAudio = (text: string, reading?: string) => {
    triggerHapticFeedback('light');
    speechService.play(text, reading ? { reading } : undefined);
  };

  const handleSelectTile = (tile: { id: string; text: string }) => {
    if (checkState !== 'idle') return;
    triggerHapticFeedback('light');
    setAvailableTiles(prev => prev.filter(t => t.id !== tile.id));
    setSelectedTiles(prev => [...prev, tile]);
  };

  const handleDeselectTile = (tile: { id: string; text: string }) => {
    if (checkState !== 'idle') return;
    triggerHapticFeedback('light');
    setSelectedTiles(prev => prev.filter(t => t.id !== tile.id));
    setAvailableTiles(prev => [...prev, tile]);
  };

  const handleCheck = () => {
    if (!currentExercise) return;

    // Intro cards immediately advance on primary tap
    if (isIntroCard) {
      triggerHapticFeedback('light');
      handleNext(correctItems, missedItems, correctGradedCount, totalGradedCount);
      return;
    }

    let isCorrect = false;
    if (currentExercise.type === 'sentence_scramble') {
      const userSentence = selectedTiles.map(t => t.text).join('').replace(/\s+/g, '');
      const expected = currentExercise.correctAnswer.replace(/\s+/g, '');
      isCorrect = userSentence === expected;
    } else {
      isCorrect = selectedAnswer === currentExercise.correctAnswer;
    }

    const nextTotal = totalGradedCount + 1;
    setTotalGradedCount(nextTotal);

    if (isCorrect) {
      triggerHapticFeedback('success');
      setCheckState('correct');
      setCorrectGradedCount(prev => prev + 1);
      if (!wasAlreadyCompleted) {
        setSessionXP(prev => prev + 2);
      }
      if (currentExercise.itemId && currentExercise.itemType) {
        setCorrectItems(prev => [
          ...prev,
          {
            id: currentExercise.itemId!,
            type: currentExercise.itemType!,
            level: lesson.jlptLevel
          }
        ]);
      }
      if (currentExercise.targetJapanese) {
        speechService.play(currentExercise.targetJapanese, {
          reading: currentExercise.targetReading
        });
      }
    } else {
      triggerHapticFeedback('error');
      setCheckState('incorrect');
      if (currentExercise.itemId && currentExercise.itemType) {
        setMissedItems(prev => [
          ...prev,
          {
            id: currentExercise.itemId!,
            type: currentExercise.itemType!,
            level: lesson.jlptLevel
          }
        ]);
      }
    }
  };

  const handleNext = (
    curCorrectItems = correctItems,
    curMissedItems = missedItems,
    curCorrectCount = correctGradedCount,
    curTotalCount = totalGradedCount
  ) => {
    triggerHapticFeedback('light');
    if (currentIndex + 1 < exercises.length) {
      setCurrentIndex(prev => prev + 1);
      return;
    }

    if (!hasDispatchedCompletion.current) {
      hasDispatchedCompletion.current = true;
      const finalAcc = curTotalCount > 0 ? Math.round((curCorrectCount / curTotalCount) * 100) : 100;
      setIsFinished(true);
      onLessonComplete(lesson.id, wasAlreadyCompleted ? 0 : lesson.xpReward || 15, {
        lessonTitle: lesson.title,
        level: lesson.jlptLevel,
        vocabIds: lesson.vocabIds,
        kanjiIds: lesson.kanjiIds,
        grammarIds: lesson.grammarIds,
        correctItems: curCorrectItems,
        missedItems: curMissedItems,
        accuracyPercent: finalAcc,
        isReviewOrCheckpoint: lesson.type === 'review' || lesson.type === 'boss_challenge'
      });
    } else {
      setIsFinished(true);
    }
  };

  const renderJapaneseWithReading = (japanese: string, reading?: string) => {
    return <JapaneseText text={japanese} reading={reading} showFurigana={true} />;
  };

  const uniqueMissedIds = Array.from(new Set(missedItems.map(m => m.id)));

  const modalContent = (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 select-none"
      role="dialog"
      aria-modal="true"
      aria-label={lesson.title}
    >
      <div className="w-full h-[100dvh] sm:h-auto sm:max-h-[90dvh] sm:max-w-xl bg-white dark:bg-[#150F12] sm:rounded-3xl border-0 sm:border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col">
        {/* ========================================================= */}
        {/* PINNED TOP BAR (Safe Area Top Aware)                      */}
        {/* ========================================================= */}
        <div
          className="flex items-center gap-3 px-4 sm:px-6 pb-3 border-b border-stone-100 dark:border-stone-800/80 shrink-0 bg-white dark:bg-[#150F12]"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center rounded-xl text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Хичээлээс гарах"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex-1 h-2.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#CC0000] to-[#FF3366] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-stone-500 dark:text-stone-400 shrink-0 tabular-nums">
            {!isFinished && (
              <span>
                {currentIndex + 1}/{exercises.length}
              </span>
            )}
            {!wasAlreadyCompleted && sessionXP > 0 && (
              <span className="text-amber-600 dark:text-amber-400 font-black">
                +{sessionXP} XP
              </span>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* SCROLLABLE MIDDLE CONTENT                                 */}
        {/* ========================================================= */}
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col"
        >
          {isFinished ? (
            /* ========================================== */
            /* FAST REWARDING VICTORY SCREEN              */
            /* ========================================== */
            <div className="flex-1 flex flex-col items-center justify-center text-center py-4 space-y-5 animate-scale-up my-auto">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#CC0000] to-[#FF3366] flex items-center justify-center text-white shadow-xl shadow-red-500/25">
                {lesson.type === 'boss_challenge' ? (
                  <Trophy className="w-10 h-10 text-amber-200" />
                ) : (
                  <Check className="w-10 h-10 stroke-[3.2]" />
                )}
              </div>

              <div className="space-y-1.5 max-w-sm">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  ✓ {lesson.type === 'boss_challenge' ? 'Бүлгийн сорил амжилттай' : 'Хичээл дууслаа'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 leading-tight">
                  {lesson.title}
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                  {wasAlreadyCompleted
                    ? 'Өмнө нь дууссан хичээлийг амжилттай давтлаа.'
                    : 'Энэ хичээлийн үг, ханз болон дасгал таны явцад хадгалагдлаа.'}
                </p>
              </div>

              {/* Crisp Real Outcome Metrics */}
              <div className="grid grid-cols-3 gap-2.5 w-full max-w-sm pt-1">
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50">
                  <div className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400">
                    XP оноо
                  </div>
                  <div className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-300 tabular-nums mt-0.5">
                    +{earnedFinalXP}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                  <div className="text-[10px] font-bold uppercase text-stone-500 dark:text-stone-400">
                    Үзсэн үг/ханз
                  </div>
                  <div className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100 tabular-nums mt-0.5">
                    {lesson.vocabIds.length + lesson.kanjiIds.length + lesson.grammarIds.length}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50">
                  <div className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
                    Оновчтой
                  </div>
                  <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-300 tabular-nums mt-0.5">
                    {accuracyPercent}%
                  </div>
                </div>
              </div>

              {uniqueMissedIds.length > 0 && onPracticeMissed && (
                <button
                  type="button"
                  onClick={() => onPracticeMissed(uniqueMissedIds)}
                  className="w-full max-w-sm min-h-[44px] py-2.5 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span>Алдсан {uniqueMissedIds.length} зүйлээ даруй давтах</span>
                </button>
              )}
            </div>
          ) : currentExercise ? (
            /* ========================================== */
            /* ACTIVE EXERCISE CONTENT                    */
            /* ========================================== */
            <div className="space-y-4 my-auto py-1">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                  {lesson.jlptLevel} · {lesson.type === 'boss_challenge' ? 'Сорил' : lesson.type === 'review' ? 'Давтлага' : `Хичээл ${lesson.lessonNumber}`}
                </span>
                <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100 leading-snug">
                  {currentExercise.prompt}
                </h3>
              </div>

              {/* 1. VOCAB INTRO */}
              {currentExercise.type === 'vocab_intro' && (
                <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-stone-50 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800 text-center space-y-3">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl sm:text-4xl font-black font-jp text-stone-900 dark:text-stone-100">
                      {renderJapaneseWithReading(
                        currentExercise.targetJapanese,
                        currentExercise.targetReading
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handlePlayAudio(currentExercise.targetJapanese, currentExercise.targetReading)
                      }
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-[#CC0000] dark:text-[#FF6699] transition-colors cursor-pointer shrink-0"
                      aria-label="Дуудлага сонсох"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="text-lg sm:text-xl font-black text-[#CC0000] dark:text-[#FF6699] pt-2 border-t border-stone-200/70 dark:border-stone-800">
                    {currentExercise.targetMongolian}
                  </div>

                  {currentExercise.exampleJapanese && (
                    <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 text-left space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm font-bold font-jp text-stone-900 dark:text-stone-100">
                          {renderJapaneseWithReading(
                            currentExercise.exampleJapanese,
                            currentExercise.exampleReading
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handlePlayAudio(
                              currentExercise.exampleJapanese!,
                              currentExercise.exampleReading
                            )
                          }
                          className="p-1.5 rounded-lg text-[#CC0000] dark:text-[#FF6699] hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0 cursor-pointer"
                          aria-label="Өгүүлбэр сонсох"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                      {currentExercise.exampleMongolian && (
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          {currentExercise.exampleMongolian}
                        </p>
                      )}
                    </div>
                  )}

                  {!currentExercise.exampleJapanese && currentExercise.explanation && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                      {currentExercise.explanation}
                    </p>
                  )}
                </div>
              )}

              {/* 2. KANJI INTRO */}
              {currentExercise.type === 'kanji_intro' && (
                <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-stone-50 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800 space-y-3">
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 flex items-center justify-center shadow-inner">
                      <span className="text-5xl font-black font-jp text-stone-900 dark:text-stone-100">
                        {currentExercise.targetJapanese}
                      </span>
                    </div>
                    <div className="text-left space-y-1">
                      <div className="text-lg sm:text-xl font-black text-[#CC0000] dark:text-[#FF6699]">
                        {currentExercise.targetMongolian}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handlePlayAudio(currentExercise.targetJapanese, currentExercise.targetReading)
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-[#CC0000] dark:text-[#FF6699] text-xs font-bold cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Дуудлага сонсох</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-stone-200/70 dark:border-stone-800">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800">
                      <span className="text-[10px] font-bold uppercase text-stone-400 block">
                        Оньёми (音)
                      </span>
                      <span className="font-bold font-jp text-stone-900 dark:text-stone-100 mt-0.5 block">
                        {currentExercise.onyomi || '—'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800">
                      <span className="text-[10px] font-bold uppercase text-stone-400 block">
                        Күньёми (訓)
                      </span>
                      <span className="font-bold font-jp text-stone-900 dark:text-stone-100 mt-0.5 block">
                        {currentExercise.kunyomi || '—'}
                      </span>
                    </div>
                  </div>

                  {currentExercise.exampleJapanese && (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 text-xs flex items-center justify-between gap-2">
                      <div>
                        <span className="font-extrabold font-jp text-stone-900 dark:text-stone-100">
                          {currentExercise.exampleJapanese}
                        </span>
                        {currentExercise.exampleReading && (
                          <span className="text-stone-400 ml-1.5 font-jp">
                            ({currentExercise.exampleReading})
                          </span>
                        )}
                      </div>
                      <span className="text-stone-600 dark:text-stone-300 font-semibold">
                        {currentExercise.exampleMongolian}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 3. GRAMMAR INTRO */}
              {currentExercise.type === 'grammar_intro' && (
                <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-stone-50 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        Дүрмийн хэлбэр
                      </span>
                      <div className="text-2xl sm:text-3xl font-black font-jp text-stone-900 dark:text-stone-100 mt-0.5">
                        {currentExercise.targetJapanese}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePlayAudio(currentExercise.targetJapanese)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-red-500/10 text-[#CC0000] dark:text-[#FF6699] shrink-0 cursor-pointer"
                      aria-label="Сонсох"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="text-base sm:text-lg font-extrabold text-[#CC0000] dark:text-[#FF6699]">
                    {currentExercise.targetMongolian}
                  </div>

                  {currentExercise.structure && (
                    <div className="px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 text-xs font-mono text-stone-700 dark:text-stone-300">
                      Бүтэц: {currentExercise.structure}
                    </div>
                  )}

                  {currentExercise.exampleJapanese && (
                    <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm font-bold font-jp text-stone-900 dark:text-stone-100">
                          {renderJapaneseWithReading(
                            currentExercise.exampleJapanese,
                            currentExercise.exampleReading
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handlePlayAudio(
                              currentExercise.exampleJapanese!,
                              currentExercise.exampleReading
                            )
                          }
                          className="p-1.5 rounded-lg text-[#CC0000] dark:text-[#FF6699] hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0 cursor-pointer"
                          aria-label="Жишээ сонсох"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                      {currentExercise.exampleMongolian && (
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          {currentExercise.exampleMongolian}
                        </p>
                      )}
                    </div>
                  )}

                  {currentExercise.explanation && (
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-3">
                      {currentExercise.explanation}
                    </p>
                  )}
                </div>
              )}

              {/* 4. MULTIPLE CHOICE */}
              {currentExercise.type === 'multiple_choice' && (
                <div className="space-y-3">
                  <div className="flex flex-col items-center justify-center gap-1.5 p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 text-center">
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <span className="text-2xl sm:text-3xl font-black font-jp text-stone-900 dark:text-stone-100">
                        {renderJapaneseWithReading(
                          currentExercise.targetJapanese,
                          currentExercise.targetReading
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handlePlayAudio(
                            currentExercise.targetJapanese.replace(/（\s*_____\s*）/g, ''),
                            currentExercise.targetReading
                          )
                        }
                        className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500/20 text-[#CC0000] dark:text-[#FF6699] transition-colors cursor-pointer shrink-0"
                        aria-label="Дуудлага сонсох"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>
                    {currentExercise.structure && (
                      <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                        {currentExercise.structure}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentExercise.options?.map((opt, idx) => {
                      const isSelected = selectedAnswer === opt;
                      const isCorrectOpt =
                        checkState !== 'idle' && opt === currentExercise.correctAnswer;
                      const isWrongSelected =
                        checkState === 'incorrect' && isSelected && !isCorrectOpt;

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={checkState !== 'idle'}
                          onClick={() => {
                            triggerHapticFeedback('light');
                            setSelectedAnswer(opt);
                          }}
                          className={`min-h-[48px] p-3.5 rounded-2xl text-left font-bold text-sm border-2 transition-all cursor-pointer flex items-center gap-2 ${
                            isCorrectOpt
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                              : isWrongSelected
                              ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                              : isSelected
                              ? 'border-[#CC0000] bg-red-50 dark:bg-red-950/30 text-[#CC0000] dark:text-[#FF6699]'
                              : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 hover:border-stone-300 dark:hover:border-stone-700'
                          }`}
                        >
                          <span className="text-xs text-stone-400 font-mono shrink-0">
                            {idx + 1}.
                          </span>
                          <span className="leading-snug">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5. SENTENCE SCRAMBLE */}
              {currentExercise.type === 'sentence_scramble' && (
                <div className="space-y-3.5">
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 text-center font-bold text-xs sm:text-sm text-stone-800 dark:text-stone-200">
                    “{currentExercise.targetMongolian}”
                  </div>

                  <div className="min-h-[60px] p-3 rounded-2xl bg-stone-100 dark:bg-stone-900/80 border-2 border-dashed border-stone-300 dark:border-stone-700 flex flex-wrap items-center gap-2">
                    {selectedTiles.length === 0 ? (
                      <span className="text-xs text-stone-400 dark:text-stone-500 mx-auto">
                        Үгсийг дарааллаар нь сонгоно уу
                      </span>
                    ) : (
                      selectedTiles.map(tile => (
                        <button
                          key={tile.id}
                          type="button"
                          disabled={checkState !== 'idle'}
                          onClick={() => handleDeselectTile(tile)}
                          className="min-h-[40px] px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#CC0000] to-[#FF3366] text-white font-bold text-sm font-jp shadow-xs cursor-pointer active:scale-95 transition-transform"
                        >
                          {tile.text}
                        </button>
                      ))
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    {availableTiles.map(tile => (
                      <button
                        key={tile.id}
                        type="button"
                        disabled={checkState !== 'idle'}
                        onClick={() => handleSelectTile(tile)}
                        className="min-h-[42px] px-3.5 py-2 rounded-xl bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 hover:border-red-400 text-stone-800 dark:text-stone-200 font-bold text-sm font-jp shadow-2xs cursor-pointer active:scale-95 transition-all"
                      >
                        {tile.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* ========================================================= */}
        {/* PINNED BOTTOM ACTION BAR (Never clipped behind bottom nav) */}
        {/* ========================================================= */}
        <div
          className={`shrink-0 px-4 sm:px-6 pt-3 border-t transition-colors duration-200 ${
            !isFinished && checkState === 'correct'
              ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-900'
              : !isFinished && checkState === 'incorrect'
              ? 'bg-rose-50 dark:bg-rose-950/90 border-rose-200 dark:border-rose-900'
              : 'bg-white dark:bg-[#120B0E] border-stone-200 dark:border-stone-800'
          }`}
          style={{ paddingBottom: 'max(1.125rem, env(safe-area-inset-bottom, 0px))' }}
        >
          {isFinished ? (
            <div className="flex flex-col sm:flex-row gap-2.5">
              {nextLesson && onStartNextLesson ? (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="sm:w-1/3 min-h-[48px] py-3 px-4 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-bold text-sm hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                  >
                    Зам руу буцах
                  </button>
                  <button
                    type="button"
                    onClick={() => onStartNextLesson(nextLesson)}
                    className="sm:flex-1 min-h-[48px] py-3 px-6 rounded-2xl bg-gradient-to-r from-[#CC0000] via-[#FF0000] to-[#FF3366] text-white font-black text-sm sm:text-base shadow-lg shadow-red-500/25 hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Дараагийн хичээл</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full min-h-[48px] py-3 px-6 rounded-2xl bg-gradient-to-r from-[#CC0000] via-[#FF0000] to-[#FF3366] text-white font-black text-sm sm:text-base shadow-lg shadow-red-500/25 hover:opacity-95 active:scale-98 transition-all cursor-pointer"
                >
                  Үргэлжлүүлэх
                </button>
              )}
            </div>
          ) : (
            <>
              {checkState === 'correct' && (
                <div className="flex items-center justify-between gap-2 mb-2.5 text-emerald-700 dark:text-emerald-300 font-black text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Зөв хариуллаа!</span>
                  </div>
                  {!wasAlreadyCompleted && <span className="tabular-nums">+2 XP</span>}
                </div>
              )}

              {checkState === 'incorrect' && (
                <div className="mb-2.5 text-rose-700 dark:text-rose-300 space-y-1">
                  <div className="font-extrabold text-xs">Зөв хариулт:</div>
                  <div className="text-xs font-bold bg-white/80 dark:bg-black/30 px-2.5 py-1.5 rounded-xl line-clamp-2">
                    {currentExercise?.explanation || currentExercise?.correctAnswer}
                  </div>
                </div>
              )}

              {checkState === 'idle' ? (
                <button
                  type="button"
                  disabled={
                    currentExercise?.type === 'multiple_choice'
                      ? !selectedAnswer
                      : currentExercise?.type === 'sentence_scramble'
                      ? selectedTiles.length === 0
                      : false
                  }
                  onClick={handleCheck}
                  className="w-full min-h-[48px] py-3 px-6 rounded-2xl bg-gradient-to-r from-[#CC0000] via-[#FF0000] to-[#FF3366] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm sm:text-base shadow-md shadow-red-500/25 cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <span>{isIntroCard ? 'Ойлголоо, үргэлжлүүлэх' : 'Шалгах'}</span>
                  {isIntroCard && <ArrowRight className="w-4 h-4" />}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleNext()}
                  className={`w-full min-h-[48px] py-3 px-6 rounded-2xl text-white font-black text-sm sm:text-base shadow-md cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-2 ${
                    checkState === 'correct'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                      : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  }`}
                >
                  <span>Үргэлжлүүлэх</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
};
