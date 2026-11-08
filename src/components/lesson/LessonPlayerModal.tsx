import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Volume2,
  Check,
  ArrowRight,
  Sparkles,
  Trophy,
  RotateCcw,
  Zap,
  HelpCircle
} from 'lucide-react';
import { CurriculumLesson, CurriculumExercise } from '../../types';
import { useApp } from '../../context/AppContext';
import { generateExercisesForLesson } from '../../data/curriculumGenerator';
import { speechService } from '../../services/speech';
import { triggerHapticFeedback } from '../../services/nativePlatform';
import { InteractiveJapaneseSentence } from '../learn/InteractiveJapaneseSentence';

interface LessonPlayerModalProps {
  lesson: CurriculumLesson | null;
  onClose: () => void;
  onLessonComplete: (lessonId: string, earnedXP: number) => void;
}

export const LessonPlayerModal: React.FC<LessonPlayerModalProps> = ({
  lesson,
  onClose,
  onLessonComplete
}) => {
  const { data, userProgress, toggleLearnVocab } = useApp();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedTiles, setSelectedTiles] = useState<{ id: string; text: string }[]>([]);
  const [availableTiles, setAvailableTiles] = useState<{ id: string; text: string }[]>([]);
  const [checkState, setCheckState] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [isFinished, setIsFinished] = useState(false);
  const [sessionXP, setSessionXP] = useState(0);

  // Generate exercises for this lesson
  const exercises = useMemo(() => {
    if (!lesson) return [];
    return generateExercisesForLesson(
      lesson,
      data.vocabulary || [],
      data.kanji || [],
      data.grammar || []
    );
  }, [lesson, data.vocabulary, data.kanji, data.grammar]);

  const currentExercise: CurriculumExercise | undefined = exercises[currentIndex];

  // Reset exercise state when question changes
  useEffect(() => {
    if (currentExercise) {
      setSelectedAnswer(null);
      setCheckState('idle');

      if (currentExercise.type === 'sentence_scramble' && currentExercise.wordTiles) {
        setSelectedTiles([]);
        setAvailableTiles([...currentExercise.wordTiles]);
      }

      // Auto-pronounce Japanese word on intro card
      if (currentExercise.type === 'vocab_intro' && currentExercise.targetJapanese) {
        speechService.play(currentExercise.targetJapanese, {
          rate: userProgress.settings?.speechRate || 0.9
        });
      }
    }
  }, [currentIndex, currentExercise, userProgress.settings?.speechRate]);

  if (!lesson || exercises.length === 0) return null;

  const progressPercent = Math.min(100, Math.round(((currentIndex) / exercises.length) * 100));

  const handlePlayAudio = (text: string) => {
    triggerHapticFeedback('light');
    speechService.play(text, {
      rate: userProgress.settings?.speechRate || 0.9
    });
  };

  // Scramble tile interaction
  const handleSelectTile = (tile: { id: string; text: string }) => {
    triggerHapticFeedback('light');
    setAvailableTiles(prev => prev.filter(t => t.id !== tile.id));
    setSelectedTiles(prev => [...prev, tile]);
  };

  const handleDeselectTile = (tile: { id: string; text: string }) => {
    triggerHapticFeedback('light');
    setSelectedTiles(prev => prev.filter(t => t.id !== tile.id));
    setAvailableTiles(prev => [...prev, tile]);
  };

  const handleCheck = () => {
    if (!currentExercise) return;

    let isCorrect = false;

    if (currentExercise.type === 'vocab_intro') {
      isCorrect = true;
    } else if (currentExercise.type === 'sentence_scramble') {
      const userSentence = selectedTiles.map(t => t.text).join('').replace(/\s+/g, '');
      const expected = currentExercise.correctAnswer.replace(/\s+/g, '');
      isCorrect = userSentence === expected;
    } else {
      isCorrect = selectedAnswer === currentExercise.correctAnswer;
    }

    if (isCorrect) {
      triggerHapticFeedback('success');
      setCheckState('correct');
      setSessionXP(prev => prev + 2);

      // Auto-pronounce correct Japanese sentence
      if (currentExercise.targetJapanese) {
        speechService.play(currentExercise.targetJapanese);
      }
    } else {
      triggerHapticFeedback('error');
      setCheckState('incorrect');
    }
  };

  const handleNext = () => {
    triggerHapticFeedback('light');
    if (currentIndex + 1 < exercises.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Finished all exercises
      const finalXP = lesson.xpReward || 15;
      setIsFinished(true);
      onLessonComplete(lesson.id, finalXP);

      // Automatically mark vocabulary items in this lesson as learned
      if (lesson.vocabIds) {
        lesson.vocabIds.forEach(id => {
          if (!userProgress.learnedVocabIds?.includes(id)) {
            toggleLearnVocab(id);
          }
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fade-in select-none">
      <div className="w-full max-w-xl bg-white dark:bg-[#150F12] rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col min-h-[520px] max-h-[92vh] my-auto">
        
        {/* ========================================================= */}
        {/* TOP BAR: Close, Progress, Lesson Number                  */}
        {/* ========================================================= */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100 dark:border-stone-800/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Гарах"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Animated Progress bar */}
          <div className="flex-1 h-3 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#CC0000] to-[#FF3366] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center gap-1 text-xs font-black text-amber-500">
            <Sparkles className="w-4 h-4 fill-amber-400" />
            <span>+{sessionXP} XP</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MAIN BODY: Active Exercise Canvas or Victory Screen       */}
        {/* ========================================================= */}
        <div className="flex-1 p-5 sm:p-7 overflow-y-auto flex flex-col justify-between">
          {isFinished ? (
            /* ========================================== */
            /* LESSON VICTORY CELEBRATION                 */
            /* ========================================== */
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6 space-y-5 animate-scale-up">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 to-red-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/25">
                  <Trophy className="w-12 h-12" />
                </div>
                <span className="absolute -bottom-1 -right-1 text-2xl">🎉</span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-2xl font-black text-stone-900 dark:text-stone-100">
                  Баяр хүргэе! Хичээл амжилттай дууслаа!
                </h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                  Та {lesson.title} хичээлийг амжилттай суралцаж мэдлэгээ бататгалаа.
                </p>
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="px-5 py-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-center">
                  <div className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase">Урамшуулал</div>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-300">+{lesson.xpReward} XP</div>
                </div>
                <div className="px-5 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 text-center">
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase">Оновчтой</div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-300">100%</div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full max-w-sm py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#CC0000] via-[#FF0000] to-[#FF3366] text-white font-black text-base shadow-lg shadow-red-500/25 hover:opacity-95 active:scale-98 transition-all cursor-pointer"
              >
                Үргэлжлүүлэх
              </button>
            </div>
          ) : currentExercise ? (
            /* ========================================== */
            /* ACTIVE EXERCISE VIEW                       */
            /* ========================================== */
            <div className="space-y-5">
              {/* Exercise prompt */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  Асуулт {currentIndex + 1} / {exercises.length}
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-100">
                  {currentExercise.prompt}
                </h3>
              </div>

              {/* VOCAB INTRO CARD */}
              {currentExercise.type === 'vocab_intro' && (
                <div className="p-6 rounded-3xl bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-900 dark:to-[#1C1417] border border-stone-200 dark:border-stone-800 text-center space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-stone-100">
                      {currentExercise.targetJapanese}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePlayAudio(currentExercise.targetJapanese)}
                      className="p-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-[#CC0000] dark:text-[#FF3366] transition-colors cursor-pointer"
                      title="Дуудлага сонсох"
                    >
                      <Volume2 className="w-6 h-6" />
                    </button>
                  </div>

                  {currentExercise.targetReading && (
                    <div className="text-base text-stone-500 dark:text-stone-400 font-mono">
                      【 {currentExercise.targetReading} 】
                    </div>
                  )}

                  <div className="text-xl sm:text-2xl font-bold text-[#CC0000] dark:text-[#FF6699] pt-2 border-t border-stone-200/60 dark:border-stone-800">
                    {currentExercise.targetMongolian}
                  </div>

                  {currentExercise.explanation && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 italic">
                      {currentExercise.explanation}
                    </p>
                  )}
                </div>
              )}

              {/* MULTIPLE CHOICE / KANJI */}
              {currentExercise.type === 'multiple_choice' && (
                <div className="space-y-4">
                  {/* Target Japanese Display */}
                  <div className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 text-center">
                    <span className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100">
                      {currentExercise.targetJapanese}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePlayAudio(currentExercise.targetJapanese)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-[#CC0000] dark:text-[#FF3366] transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* 4 Choices */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentExercise.options?.map((opt, idx) => {
                      const isSelected = selectedAnswer === opt;
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={checkState !== 'idle'}
                          onClick={() => {
                            triggerHapticFeedback('light');
                            setSelectedAnswer(opt);
                          }}
                          className={`p-4 rounded-2xl text-left font-bold text-sm sm:text-base border-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#CC0000] bg-red-50 dark:bg-red-950/30 text-[#CC0000] dark:text-[#FF3366] shadow-sm'
                              : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 hover:border-stone-300 dark:hover:border-stone-700'
                          }`}
                        >
                          <span className="inline-block w-6 text-xs text-stone-400 font-mono">
                            {idx + 1}.
                          </span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SENTENCE SCRAMBLE */}
              {currentExercise.type === 'sentence_scramble' && (
                <div className="space-y-4">
                  {/* Mongolian prompt sentence */}
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-center font-bold text-sm text-stone-800 dark:text-stone-200">
                    "{currentExercise.targetMongolian}"
                  </div>

                  {/* Assembled sentence drop zone */}
                  <div className="min-h-[58px] p-2.5 rounded-2xl bg-stone-100 dark:bg-stone-900/80 border-2 border-dashed border-stone-300 dark:border-stone-700 flex flex-wrap items-center gap-2">
                    {selectedTiles.length === 0 ? (
                      <span className="text-xs text-stone-400 dark:text-stone-500 mx-auto">
                        Үгсийг дарааллаар нь товшиж эвлүүлнэ үү
                      </span>
                    ) : (
                      selectedTiles.map(tile => (
                        <button
                          key={tile.id}
                          type="button"
                          disabled={checkState !== 'idle'}
                          onClick={() => handleDeselectTile(tile)}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#CC0000] to-[#FF3366] text-white font-bold text-sm shadow-xs cursor-pointer active:scale-95 transition-transform"
                        >
                          {tile.text}
                        </button>
                      ))
                    )}
                  </div>

                  {/* Available word tiles pool */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    {availableTiles.map(tile => (
                      <button
                        key={tile.id}
                        type="button"
                        disabled={checkState !== 'idle'}
                        onClick={() => handleSelectTile(tile)}
                        className="px-4 py-2.5 rounded-xl bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 hover:border-red-400 text-stone-800 dark:text-stone-200 font-bold text-sm shadow-2xs cursor-pointer active:scale-95 transition-all"
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
        {/* BOTTOM DRAWER / CHECK SHEET                               */}
        {/* ========================================================= */}
        {!isFinished && (
          <div
            className={`p-4 sm:p-5 border-t transition-colors duration-300 shrink-0 ${
              checkState === 'correct'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900'
                : checkState === 'incorrect'
                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900'
                : 'bg-white dark:bg-[#120B0E] border-stone-200 dark:border-stone-800'
            }`}
          >
            {checkState === 'correct' && (
              <div className="flex items-center justify-between gap-3 mb-3 animate-fade-in">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-black text-base">
                  <Check className="w-6 h-6 stroke-[3]" />
                  <span>Маш сайн! Зөв хариуллаа.</span>
                </div>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  +2 XP
                </span>
              </div>
            )}

            {checkState === 'incorrect' && (
              <div className="space-y-1 mb-3 animate-fade-in text-rose-700 dark:text-rose-300">
                <div className="font-extrabold text-sm">
                  Зөв хариулт:
                </div>
                <div className="text-sm font-bold bg-white/70 dark:bg-black/30 p-2.5 rounded-xl">
                  {currentExercise?.explanation || currentExercise?.correctAnswer}
                </div>
              </div>
            )}

            {/* Action buttons */}
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
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#CC0000] via-[#FF0000] to-[#FF3366] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm sm:text-base shadow-md shadow-red-500/25 cursor-pointer active:scale-98 transition-all"
              >
                {currentExercise?.type === 'vocab_intro' ? 'Ойлголоо, үргэлжлүүлэх' : 'Шалгах'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className={`w-full py-3.5 px-6 rounded-2xl text-white font-black text-sm sm:text-base shadow-md cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-2 ${
                  checkState === 'correct'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                }`}
              >
                <span>Үргэлжлүүлэх</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
