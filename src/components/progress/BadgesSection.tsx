import React from 'react';
import {
  Flame,
  Trophy,
  Crown,
  Target,
  Sparkles,
  Award,
  BookOpen,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { GamificationProgress, UserProgress } from '../../types';
import { getBadgesList } from '../../services/gamificationEngine';

interface BadgesSectionProps {
  gamification: GamificationProgress;
  userProgress: UserProgress;
}

export const BadgesSection: React.FC<BadgesSectionProps> = ({
  gamification,
  userProgress
}) => {
  const badges = getBadgesList(gamification, userProgress);
  const unlockedCount = badges.filter(b => b.isUnlocked).length;

  const renderIcon = (name: string, isUnlocked: boolean) => {
    const props = {
      className: `w-5 h-5 ${
        isUnlocked
          ? 'text-amber-500 fill-amber-500'
          : 'text-stone-400 dark:text-stone-500'
      }`
    };

    switch (name) {
      case 'Flame':
        return <Flame {...props} />;
      case 'Trophy':
        return <Trophy {...props} />;
      case 'Crown':
        return <Crown {...props} />;
      case 'Target':
        return <Target {...props} />;
      case 'Sparkles':
        return <Sparkles {...props} />;
      case 'Award':
        return <Award {...props} />;
      case 'BookOpen':
        return <BookOpen {...props} />;
      default:
        return <Award {...props} />;
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span>🏅</span>
            <span>Амжилтын Тэмдгүүд</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            Дараалсан өдөр болон суралцах явцад нээгдэх тусгай цолууд
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
          Нээсэн: {unlockedCount} / {badges.length}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
        {badges.map(badge => (
          <div
            key={badge.id}
            className={`rounded-2xl p-4 border transition-all flex flex-col justify-between space-y-3 ${
              badge.isUnlocked
                ? 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/30 shadow-xs'
                : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200/80 dark:border-stone-800 opacity-80'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  badge.isUnlocked
                    ? 'bg-amber-500/15 dark:bg-amber-500/20'
                    : 'bg-stone-200/70 dark:bg-stone-800'
                }`}
              >
                {renderIcon(badge.iconName, badge.isUnlocked)}
              </div>

              <div
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  badge.isUnlocked
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                    : 'bg-stone-200/60 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                }`}
              >
                {badge.isUnlocked ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Нээгдсэн</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3" />
                    <span>{badge.statusText}</span>
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
                {badge.title}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                {badge.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
