import React from 'react';
import {
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Languages,
  PenTool,
  Target,
  ArrowRight
} from 'lucide-react';
import { JLPTLevel, GamificationProgress } from '../../types';
import { DAILY_GOAL_XP, DAILY_MISSION_TARGETS, XP_REWARDS } from '../../services/gamificationEngine';

interface DailyMissionSectionProps {
  level: JLPTLevel;
  gamification: GamificationProgress;
  onNavigateTab: (tab: 'learn' | 'quiz', subTab?: 'vocab' | 'kanji' | 'grammar') => void;
}

export const DailyMissionSection: React.FC<DailyMissionSectionProps> = ({
  level,
  gamification,
  onNavigateTab
}) => {
  const taskProgress = gamification.dailyTaskProgress?.[level] || {
    vocabCount: 0,
    kanjiCount: 0,
    grammarCount: 0,
    quizCount: 0
  };

  const dailyXP = gamification.dailyXP || 0;
  const goalXP = gamification.dailyGoalXP || DAILY_GOAL_XP;
  const xpPercent = Math.min(100, Math.round((dailyXP / goalXP) * 100));
  const isGoalAchieved = dailyXP >= goalXP;

  const tasks = [
    {
      id: 'vocab',
      title: '5 үг сурах',
      typeLabel: 'Үг',
      icon: Languages,
      current: taskProgress.vocabCount,
      target: DAILY_MISSION_TARGETS.VOCAB,
      xpReward: `+${XP_REWARDS.VOCAB} XP / үг`,
      isDone: taskProgress.vocabCount >= DAILY_MISSION_TARGETS.VOCAB,
      action: () => onNavigateTab('learn', 'vocab'),
      actionLabel: 'Үг цээжлэх'
    },
    {
      id: 'kanji',
      title: '2 ханз сурах',
      typeLabel: 'Ханз',
      icon: PenTool,
      current: taskProgress.kanjiCount,
      target: DAILY_MISSION_TARGETS.KANJI,
      xpReward: `+${XP_REWARDS.KANJI} XP / ханз`,
      isDone: taskProgress.kanjiCount >= DAILY_MISSION_TARGETS.KANJI,
      action: () => onNavigateTab('learn', 'kanji'),
      actionLabel: 'Ханз сурах'
    },
    {
      id: 'grammar',
      title: '1 дүрэм сурах',
      typeLabel: 'Дүрэм',
      icon: BookOpen,
      current: taskProgress.grammarCount,
      target: DAILY_MISSION_TARGETS.GRAMMAR,
      xpReward: `+${XP_REWARDS.GRAMMAR} XP / дүрэм`,
      isDone: taskProgress.grammarCount >= DAILY_MISSION_TARGETS.GRAMMAR,
      action: () => onNavigateTab('learn', 'grammar'),
      actionLabel: 'Дүрэм үзэх'
    },
    {
      id: 'quiz',
      title: '5 асуулттай Quiz дуусгах',
      typeLabel: 'Quiz',
      icon: Target,
      current: taskProgress.quizCount,
      target: DAILY_MISSION_TARGETS.QUIZ,
      xpReward: `+${XP_REWARDS.QUIZ} XP / сорил`,
      isDone: taskProgress.quizCount >= DAILY_MISSION_TARGETS.QUIZ,
      action: () => onNavigateTab('quiz'),
      actionLabel: 'Сорил эхлэх'
    }
  ];

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-sm space-y-6">
      {/* Header with Goal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
              Өдөр тутмын даалгавар
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
              {level} түвшин
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
            🔥 ӨНӨӨДРИЙН ДААЛГАВАР
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            Өнөөдрийн зорилго: <span className="font-bold text-amber-600 dark:text-amber-400">{goalXP} XP</span> цуглуулах
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-stone-400 dark:text-stone-500 bg-stone-50 dark:bg-stone-800/60 px-3 py-1.5 rounded-xl border border-stone-200/60 dark:border-stone-700/50 self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5 text-stone-400" />
          <span>00:00 (Токиогийн цагаар) шинэчлэгдэнэ</span>
        </div>
      </div>

      {/* Daily XP Progress Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-200">
              Өнөөдрийн XP явц:
            </span>
            <span className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400">
              {dailyXP} / {goalXP} XP
            </span>
            {dailyXP > goalXP && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                (+{dailyXP - goalXP} нэмэлт)
              </span>
            )}
          </div>

          {isGoalAchieved ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Зорилго биеллээ!</span>
            </div>
          ) : (
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              {goalXP - dailyXP} XP үлдсэн
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-stone-200 dark:bg-stone-800 h-3 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isGoalAchieved
                ? 'bg-gradient-to-r from-amber-500 to-emerald-500'
                : 'bg-amber-500'
            }`}
            style={{ width: `${xpPercent}%` }}
          />
        </div>

        {isGoalAchieved && (
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-1">
            <span>🎉 Өнөөдрийн зорилго биеллээ! Маргааш дахин шинэ зорилго тавигдана.</span>
          </p>
        )}
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {tasks.map(task => {
          const Icon = task.icon;
          const taskPercent = Math.min(100, Math.round((task.current / task.target) * 100));

          return (
            <div
              key={task.id}
              className={`relative rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between space-y-4 ${
                task.isDone
                  ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30 shadow-sm'
                  : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800 hover:border-amber-500/40'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      task.isDone
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                    {task.xpReward}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    {task.title}
                  </h3>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                      {task.typeLabel}
                    </span>
                    <span
                      className={`text-sm font-extrabold ${
                        task.isDone
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-stone-900 dark:text-stone-100'
                      }`}
                    >
                      {task.current} / {task.target}
                      {task.isDone && ' ✓'}
                    </span>
                  </div>
                </div>

                {/* Task progress bar */}
                <div className="w-full bg-stone-200 dark:bg-stone-700/60 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      task.isDone ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${taskPercent}%` }}
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={task.action}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  task.isDone
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25'
                    : 'bg-stone-900 dark:bg-stone-700 text-white hover:bg-amber-600 dark:hover:bg-amber-500 shadow-sm'
                }`}
              >
                <span>{task.isDone ? 'Суралцсан ✓' : task.actionLabel}</span>
                {!task.isDone && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
