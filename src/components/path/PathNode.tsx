import React from 'react';
import {
  Check,
  Lock,
  Star,
  Trophy,
  Play,
  Zap
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
  totalInUnit,
  unitThemeColor = '#CC0000',
  onSelectLesson
}) => {
  // Gentle, stable winding horizontal offset pattern:
  // Stays within safe bounds on 320px–430px mobile screens without clipping or colliding
  const offsetPattern = [0, -18, -8, 12, 20, 8, -12];
  const xOffset = offsetPattern[index % offsetPattern.length];

  const isCompleted = status === 'completed';
  const isActive = status === 'active';
  const isLocked = status === 'locked';
  const isBoss = lesson.type === 'boss_challenge';

  const handleClick = () => {
    triggerHapticFeedback('light');
    onSelectLesson(lesson, status);
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center my-4 sm:my-5 min-h-[105px] transition-transform duration-300 select-none"
      style={{
        transform: `translateX(${xOffset}px)`
      }}
    >
      {/* Active node encouragement badge - cleanly spaced above the node */}
      {isActive && (
        <div className="mb-2 animate-bounce flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#CC0000] to-[#FF3366] text-white text-[11px] font-black uppercase tracking-wider shadow-md shadow-red-500/30 z-10 whitespace-nowrap">
          <Zap className="w-3 h-3 fill-current text-amber-300" />
          <span>Эхлэх цэг</span>
        </div>
      )}

      {/* Main Node Button */}
      <button
        type="button"
        onClick={handleClick}
        aria-label={`${lesson.title} - ${isCompleted ? 'Дууссан' : isActive ? 'Идэвхтэй' : 'Түгжээтэй'}`}
        className={`relative flex items-center justify-center transition-all duration-300 cursor-pointer ${
          isBoss
            ? 'w-18 h-18 sm:w-20 sm:h-20 rounded-3xl'
            : 'w-16 h-16 sm:w-17 sm:h-17 rounded-full'
        } ${
          isActive
            ? 'scale-105 shadow-[0_0_24px_rgba(255,0,0,0.35)] ring-4 ring-[#FF3366]/40 dark:ring-[#FF3366]/60'
            : isLocked
            ? 'opacity-85 hover:opacity-100 hover:scale-102'
            : 'hover:scale-105 active:scale-95'
        } ${
          isCompleted
            ? 'bg-gradient-to-br from-[#CC0000] via-[#E11D48] to-[#FF3366] text-white shadow-md shadow-red-500/25'
            : isActive
            ? 'bg-gradient-to-br from-[#FF1A1A] via-[#CC0000] to-[#990000] text-white shadow-lg shadow-red-500/30'
            : 'bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border-2 border-stone-300/80 dark:border-stone-700/80 shadow-xs'
        }`}
      >
        {/* Subtle inner highlight border for active/completed */}
        <span
          className={`absolute inset-0.5 ${
            isBoss ? 'rounded-3xl' : 'rounded-full'
          } pointer-events-none opacity-40 border ${
            isCompleted || isActive ? 'border-white/70' : 'border-stone-400/20'
          }`}
        />

        {/* Node Center Icon */}
        {isCompleted ? (
          <Check className="w-7 h-7 sm:w-8 sm:h-8 stroke-[3.5] text-white drop-shadow-xs" />
        ) : isActive ? (
          isBoss ? (
            <Trophy className="w-7 h-7 text-amber-300 fill-amber-300/20 animate-spin-slow" />
          ) : (
            <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current text-white ml-0.5" />
          )
        ) : isLocked ? (
          <Lock className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2] text-stone-400 dark:text-stone-500" />
        ) : (
          <Star className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Clean XP badge positioned directly below the button in natural flow */}
      <div className="mt-2 flex items-center justify-center">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black border shadow-2xs whitespace-nowrap transition-colors ${
            isCompleted
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
              : isActive
              ? 'bg-amber-400 text-stone-900 border-amber-300 font-extrabold'
              : 'bg-stone-100 dark:bg-stone-800/90 text-stone-400 dark:text-stone-500 border-stone-200 dark:border-stone-700/80'
          }`}
        >
          {isCompleted ? '✓ Дууссан' : `+${lesson.xpReward} XP`}
        </span>
      </div>
    </div>
  );
};
