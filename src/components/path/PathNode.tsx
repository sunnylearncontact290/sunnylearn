import React, { useState } from 'react';
import {
  Check,
  Lock,
  Star,
  Trophy,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  BookOpen
} from 'lucide-react';
import { CurriculumLesson, PathNodeStatus } from '../../types';
import { triggerHapticFeedback } from '../../services/nativePlatform';

interface PathNodeProps {
  lesson: CurriculumLesson;
  status: PathNodeStatus;
  index: number;
  totalInUnit: number;
  unitThemeColor?: string;
  onSelectLesson: (lesson: CurriculumLesson) => void;
}

export const PathNode: React.FC<PathNodeProps> = ({
  lesson,
  status,
  index,
  totalInUnit,
  unitThemeColor = '#CC0000',
  onSelectLesson
}) => {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  // Winding horizontal offset pattern: Center -> Left -> Center -> Right -> Center -> Left ...
  // Creates an organic, thumb-friendly curved path
  const offsetPattern = [0, -42, -18, 24, 46, 12, -28];
  const xOffset = offsetPattern[index % offsetPattern.length];

  const isCompleted = status === 'completed';
  const isActive = status === 'active';
  const isLocked = status === 'locked';
  const isBoss = lesson.type === 'boss_challenge';

  const handleClick = () => {
    triggerHapticFeedback('light');
    if (isLocked) {
      setIsTooltipOpen(prev => !prev);
      return;
    }
    // If active or completed, open modal/tooltip to confirm or launch directly
    setIsTooltipOpen(prev => !prev);
  };

  const handleStart = () => {
    triggerHapticFeedback('medium');
    setIsTooltipOpen(false);
    onSelectLesson(lesson);
  };

  return (
    <div
      className="relative flex flex-col items-center my-3 sm:my-4 transition-transform duration-300"
      style={{
        transform: `translateX(${xOffset}px)`
      }}
    >
      {/* Active node mascot / encouragement badge */}
      {isActive && (
        <div className="absolute -top-7 animate-bounce flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#CC0000] to-[#FF3366] text-white text-[11px] font-black uppercase tracking-wider shadow-lg shadow-red-500/30 z-20 whitespace-nowrap">
          <Zap className="w-3 h-3 fill-current text-amber-300" />
          <span>Эхлэх цэг</span>
        </div>
      )}

      {/* Main Node Button */}
      <button
        type="button"
        onClick={handleClick}
        disabled={isLocked && !isTooltipOpen}
        aria-label={`${lesson.title} - ${status}`}
        className={`relative flex items-center justify-center transition-all duration-300 cursor-pointer select-none ${
          isBoss
            ? 'w-18 h-18 sm:w-20 sm:h-20 rounded-3xl'
            : 'w-15 h-15 sm:w-16 sm:h-16 rounded-full'
        } ${
          isActive
            ? 'scale-110 shadow-[0_0_24px_rgba(255,0,0,0.4)] ring-4 ring-[#FF3366]/40 dark:ring-[#FF3366]/60 animate-pulse'
            : 'hover:scale-105 active:scale-95'
        } ${
          isCompleted
            ? 'bg-gradient-to-br from-[#CC0000] via-[#E11D48] to-[#FF3366] text-white shadow-md shadow-red-500/20'
            : isActive
            ? 'bg-gradient-to-br from-[#FF0000] via-[#CC0000] to-[#990000] text-white shadow-lg shadow-red-500/30'
            : 'bg-stone-200 dark:bg-stone-800/90 text-stone-400 dark:text-stone-500 border border-stone-300/60 dark:border-stone-700/60'
        }`}
      >
        {/* Subtle inner highlight border */}
        <span
          className={`absolute inset-0.5 rounded-full pointer-events-none opacity-40 border ${
            isCompleted || isActive ? 'border-white/60' : 'border-stone-400/20'
          }`}
        />

        {/* Node Center Icon */}
        {isCompleted ? (
          <Check className="w-7 h-7 sm:w-8 sm:h-8 stroke-[3] text-white drop-shadow-sm" />
        ) : isActive ? (
          isBoss ? (
            <Trophy className="w-7 h-7 text-amber-300 fill-amber-300/20 animate-spin-slow" />
          ) : (
            <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current text-white ml-0.5" />
          )
        ) : isLocked ? (
          <Lock className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
        ) : (
          <Star className="w-6 h-6 text-white" />
        )}

        {/* Small XP badge below the circle */}
        <span
          className={`absolute -bottom-2 px-2 py-0.5 rounded-full text-[10px] font-black border shadow-2xs whitespace-nowrap ${
            isCompleted
              ? 'bg-emerald-500 text-white border-emerald-400'
              : isActive
              ? 'bg-amber-400 text-stone-900 border-amber-300'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border-stone-300 dark:border-stone-700'
          }`}
        >
          {isCompleted ? 'Дууссан' : `+${lesson.xpReward} XP`}
        </span>
      </button>

      {/* Floating Action Card / Popover */}
      {isTooltipOpen && (
        <>
          {/* Backdrop dismiss */}
          <div
            className="fixed inset-0 z-30 bg-transparent"
            onClick={() => setIsTooltipOpen(false)}
          />

          <div
            className="absolute top-20 z-40 w-72 sm:w-80 p-4.5 rounded-2xl bg-white dark:bg-[#1A1215] border border-stone-200 dark:border-stone-800 shadow-2xl space-y-3 animate-fade-in text-left pointer-events-auto"
            style={{
              left: '50%',
              transform: 'translateX(-50%)'
            }}
          >
            {/* Header with Lesson Type badge & title */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                  {lesson.type === 'boss_challenge'
                    ? 'Бүлгийн Сорил'
                    : lesson.type === 'review'
                    ? 'Нэгдсэн Давтлага'
                    : `Хичээл ${lesson.lessonNumber}`}
                </span>
                <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  +{lesson.xpReward} XP
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-stone-100">
                {lesson.title}
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                {lesson.description}
              </p>
            </div>

            {/* Quick content summary */}
            <div className="flex items-center gap-3 text-xs text-stone-600 dark:text-stone-400 pt-1 border-t border-stone-100 dark:border-stone-800/80">
              <span className="flex items-center gap-1 font-semibold">
                <BookOpen className="w-3.5 h-3.5 text-[#CC0000]" />
                {lesson.totalExercises} дасгал
              </span>
              <span>·</span>
              <span className="text-stone-400 dark:text-stone-500">
                JLPT {lesson.jlptLevel}
              </span>
            </div>

            {/* Primary Action Button */}
            {isLocked ? (
              <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-center text-xs font-bold text-stone-500 dark:text-stone-400 flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Өмнөх хичээлийг дуусгаж нээнэ үү</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleStart}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#CC0000] via-[#FF0000] to-[#FF3366] hover:opacity-95 active:scale-98 text-white font-black text-xs sm:text-sm shadow-md shadow-red-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {isCompleted ? (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Дахин давтах (+{Math.floor(lesson.xpReward / 2)} XP)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Хичээл эхлүүлэх</span>
                  </>
                )}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
