import React from 'react';
import {
  Check,
  Lock,
  Trophy,
  Play,
  RotateCcw
} from 'lucide-react';
import { CurriculumLesson, PathNodeStatus } from '../../types';
import { triggerHapticFeedback } from '../../services/nativePlatform';

interface PathNodeProps {
  lesson: CurriculumLesson;
  status: PathNodeStatus;
  index: number;
  totalInUnit: number;
  unitThemeColor?: string;
  onSelectLesson: (lesson: CurriculumLesson, status: PathNodeStatus) => void;
}

export const PathNode: React.FC<PathNodeProps> = ({
  lesson,
  status,
  index,
  onSelectLesson
}) => {
  // Subtle mobile-safe winding offset (never exceeds +/-16px so 320px viewports stay centered)
  const offsetPattern = [0, -14, -8, 10, 14, 8, -10];
  const xOffset = offsetPattern[index % offsetPattern.length];

  const isCompleted = status === 'completed';
  const isActive = status === 'active';
  const isLocked = status === 'locked';
  const isBoss = lesson.type === 'boss_challenge';
  const isReview = lesson.type === 'review';

  const shortTitle = isBoss
    ? 'Бүлгийн сорил'
    : isReview
    ? 'Дунд давтлага'
    : `Хичээл ${lesson.lessonNumber}`;

  const statusText = isCompleted
    ? 'Дууссан'
    : isActive
    ? 'Одоо сурах'
    : 'Түгжээтэй';

  const handleClick = () => {
    triggerHapticFeedback('light');
    onSelectLesson(lesson, status);
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center my-3 sm:my-4 select-none max-w-full"
      style={{
        transform: `translateX(${xOffset}px)`
      }}
    >
      {/* Clear "Одоо сурах" indicator above the single current lesson */}
      {isActive && (
        <div className="mb-1.5 px-3 py-1 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-[11px] font-black tracking-wide shadow-md whitespace-nowrap">
          Одоо сурах
        </div>
      )}

      {/* Main Accessible Node Button (>= 64px hit target) */}
      <button
        type="button"
        onClick={handleClick}
        aria-label={`${lesson.title} (${statusText})`}
        className={`relative flex items-center justify-center transition-all duration-200 cursor-pointer ${
          isBoss
            ? 'w-[72px] h-[72px] sm:w-[78px] sm:h-[78px] rounded-2xl'
            : isReview
            ? 'w-[66px] h-[66px] sm:w-[70px] sm:h-[70px] rounded-2xl'
            : 'w-[64px] h-[64px] sm:w-[68px] sm:h-[68px] rounded-full'
        } ${
          isActive
            ? 'bg-gradient-to-br from-[#FF1A1A] via-[#CC0000] to-[#990000] text-white shadow-lg shadow-red-500/35 ring-4 ring-[#FF3366]/35 dark:ring-[#FF3366]/55 scale-105'
            : isCompleted
            ? 'bg-gradient-to-br from-[#CC0000] via-[#E11D48] to-[#FF3366] text-white shadow-sm shadow-red-500/20 hover:scale-105 active:scale-95'
            : 'bg-stone-100 dark:bg-stone-800/80 text-stone-400 dark:text-stone-500 border-2 border-stone-200 dark:border-stone-700/80 opacity-85 hover:opacity-100'
        }`}
      >
        <span
          className={`absolute inset-0.5 ${
            isBoss || isReview ? 'rounded-2xl' : 'rounded-full'
          } pointer-events-none border ${
            isCompleted || isActive ? 'border-white/50 opacity-50' : 'border-stone-300/30 dark:border-stone-700/30'
          }`}
        />

        {isCompleted ? (
          <Check className="w-7 h-7 stroke-[3.2] text-white" />
        ) : isActive ? (
          isBoss ? (
            <Trophy className="w-7 h-7 text-amber-300" />
          ) : isReview ? (
            <RotateCcw className="w-6 h-6 text-white stroke-[2.5]" />
          ) : (
            <Play className="w-6 h-6 fill-current text-white ml-0.5" />
          )
        ) : isBoss ? (
          <Trophy className="w-6 h-6 text-stone-400 dark:text-stone-500" />
        ) : isReview ? (
          <RotateCcw className="w-5 h-5 text-stone-400 dark:text-stone-500" />
        ) : (
          <Lock className="w-5 h-5 text-stone-400 dark:text-stone-500" />
        )}
      </button>

      {/* Clean Dual-Coded Text Label Below Node (Icon/Color + Clear Label) */}
      <div className="mt-2 text-center space-y-0.5 max-w-[180px]">
        <div
          className={`text-xs font-extrabold leading-tight truncate ${
            isActive
              ? 'text-[#CC0000] dark:text-[#FF6699]'
              : isCompleted
              ? 'text-stone-800 dark:text-stone-200'
              : 'text-stone-400 dark:text-stone-500'
          }`}
        >
          {shortTitle}
        </div>
        <div
          className={`text-[11px] font-semibold tabular-nums ${
            isCompleted
              ? 'text-emerald-600 dark:text-emerald-400'
              : isActive
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-stone-400 dark:text-stone-500'
          }`}
        >
          {isCompleted ? '✓ Дууссан' : isActive ? `+${lesson.xpReward} XP · ${lesson.estimatedMinutes || 5} мин` : 'Түгжээтэй'}
        </div>
      </div>
    </div>
  );
};
