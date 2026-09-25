import React from 'react';
import { RoleplayScenario, JLPTLevel } from '../../types';
import { LevelBadge } from '../common/LevelBadge';
import { ArrowRight, Target, User, Bot } from 'lucide-react';

interface RoleplayCardProps {
  scenario: RoleplayScenario;
  selectedLevel: JLPTLevel;
  onSelect: (scenario: RoleplayScenario) => void;
}

export const RoleplayCard: React.FC<RoleplayCardProps> = ({
  scenario,
  selectedLevel,
  onSelect
}) => {
  const isLevelRecommended = scenario.recommendedLevels.includes(selectedLevel);

  return (
    <div
      onClick={() => onSelect(scenario)}
      className="group relative flex flex-col justify-between p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs hover:shadow-md hover:border-red-400/80 dark:hover:border-red-500/60 transition-all duration-200 cursor-pointer text-left"
    >
      <div className="space-y-4">
        {/* Top bar: Icon, Level badges, Recommended tag */}
        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200/70 dark:border-orange-900/50 flex items-center justify-center text-2xl sm:text-3xl shrink-0 group-hover:scale-105 transition-transform">
            {scenario.icon}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {scenario.recommendedLevels.map(lvl => (
              <LevelBadge
                key={lvl}
                level={lvl}
                size="sm"
                className={lvl === selectedLevel ? 'ring-2 ring-red-500 ring-offset-1 dark:ring-offset-stone-900' : ''}
              />
            ))}
          </div>
        </div>

        {/* Titles */}
        <div className="space-y-1">
          <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100 group-hover:text-[#EF233C] dark:group-hover:text-red-400 transition-colors font-jp flex items-center gap-2">
            {scenario.titleJapanese}
          </h3>
          <p className="text-xs sm:text-sm font-bold text-stone-700 dark:text-stone-300">
            {scenario.titleMongolian}
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 pt-1 leading-relaxed">
            {scenario.descriptionMongolian}
          </p>
        </div>

        {/* Role assignments badge */}
        <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] sm:text-xs">
          <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 flex items-center gap-1.5 truncate">
            <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="text-stone-500 dark:text-stone-400 shrink-0">Та:</span>
            <span className="font-semibold text-stone-800 dark:text-stone-200 truncate">{scenario.userRole}</span>
          </div>

          <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 flex items-center gap-1.5 truncate">
            <Bot className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span className="text-stone-500 dark:text-stone-400 shrink-0">AI:</span>
            <span className="font-semibold text-stone-800 dark:text-stone-200 truncate">{scenario.aiRole}</span>
          </div>
        </div>

        {/* Objectives count and short goal */}
        <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 pt-1">
          <Target className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          <span className="font-semibold text-stone-700 dark:text-stone-300">
            {scenario.objectives.length} даалгавар:
          </span>
          <span className="truncate">{scenario.shortObjective}</span>
        </div>
      </div>

      {/* Bottom action */}
      <div className="pt-5 mt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
        {isLevelRecommended ? (
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50">
            JLPT {selectedLevel} тохирно
          </span>
        ) : (
          <span className="text-[11px] text-stone-400 font-medium">
            Бүх түвшинд тохируулах боломжтой
          </span>
        )}

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#EF233C] to-orange-600 hover:opacity-95 text-white font-bold text-xs shadow-md shadow-red-500/20 group-hover:scale-102 transition-all cursor-pointer"
        >
          <span>Эхлэх</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
