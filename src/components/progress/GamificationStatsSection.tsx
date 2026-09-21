import React from 'react';
import { Flame, Star, Trophy, Calendar, Sparkles } from 'lucide-react';
import { GamificationProgress } from '../../types';
import { calculateLearnerLevel, getTokyoDateString } from '../../services/gamificationEngine';

interface GamificationStatsSectionProps {
  gamification: GamificationProgress;
}

export const GamificationStatsSection: React.FC<GamificationStatsSectionProps> = ({
  gamification
}) => {
  const todayTokyo = getTokyoDateString();
  const currentStreak = gamification.currentStreak || 0;
  const longestStreak = Math.max(currentStreak, gamification.longestStreak || 0);
  const completedToday = (gamification.completedGoalDates || []).includes(todayTokyo);
  const totalCompletedDays = (gamification.completedGoalDates || []).length;

  const learnerLevel = calculateLearnerLevel(gamification.totalXP || 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      {/* 1. STREAK CARD */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-sm flex flex-col justify-between space-y-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
              Тасралтгүй суралцахуй
            </span>
            <span className="text-xs font-semibold text-stone-400">
              Өдөр бүр 20 XP
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <div className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span className="text-orange-500">🔥</span>
              <span>{currentStreak} өдрийн streak</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300">
            {completedToday ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <span>✅ Өнөөдрийн 20 XP зорилгоо биелүүлж streak-ээ амжилттай үргэлжлүүллээ!</span>
              </span>
            ) : currentStreak > 0 ? (
              <span>
                Өнөөдөр 20 XP цуглуулан <strong className="text-orange-600 dark:text-orange-400">{currentStreak + 1} дахь</strong> өдрийн streak-ээ хадгалаарай!
              </span>
            ) : (
              <span>
                Өнөөдрийн 20 XP зорилгоо биелүүлж <strong className="text-orange-600 dark:text-orange-400">1 өдрийн streak</strong> эхлүүлээрэй!
              </span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
          <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-800">
            <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-500" />
              <span>Хамгийн урт streak</span>
            </div>
            <div className="text-lg font-black text-stone-900 dark:text-stone-100 mt-1">
              {longestStreak} өдөр
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-800">
            <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-emerald-500" />
              <span>Нийт биелүүлсэн</span>
            </div>
            <div className="text-lg font-black text-stone-900 dark:text-stone-100 mt-1">
              {totalCompletedDays} өдөр
            </div>
          </div>
        </div>
      </div>

      {/* 2. LEARNER LEVEL & TOTAL XP CARD */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-sm flex flex-col justify-between space-y-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              SunnyLearn Түвшин
            </span>
            <span className="text-xs font-semibold text-stone-400">
              Нийт: <strong className="text-stone-800 dark:text-stone-200">{learnerLevel.totalXP.toLocaleString()} XP</strong>
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <div className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span className="text-amber-500">⭐</span>
              <span>Level {learnerLevel.level}</span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400">
              {learnerLevel.title}
            </span>
          </div>

          {/* Level Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-stone-500 dark:text-stone-400">
              <span>Дараагийн түвшин хүртэл</span>
              <span className="text-stone-900 dark:text-stone-100">
                {learnerLevel.totalXP.toLocaleString()} / {learnerLevel.nextXP.toLocaleString()} XP
              </span>
            </div>
            <div className="w-full bg-stone-100 dark:bg-stone-800 h-3 rounded-full overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${learnerLevel.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Энэ түвшинд {learnerLevel.nextXP - learnerLevel.totalXP} XP дутуу байна</span>
          </div>
          <span className="text-[11px] font-semibold text-stone-400">
            {learnerLevel.progressPercent}%
          </span>
        </div>
      </div>
    </div>
  );
};
