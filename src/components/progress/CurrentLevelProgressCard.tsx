import React from 'react';
import { JLPTLevel } from '../../types';
import { Target, BookOpen, Layers, Award } from 'lucide-react';
import { LevelBadge } from '../common/LevelBadge';

interface CurrentLevelProgressCardProps {
  level: JLPTLevel;
  stats: {
    overallPct: number;
    learnedItems: number;
    totalItems: number;
    vocabPct: number;
    learnedVocab: number;
    totalVocab: number;
    kanjiPct: number;
    learnedKanji: number;
    totalKanji: number;
    grammarPct: number;
    learnedGrammar: number;
    totalGrammar: number;
  };
  onSelectLevel: (level: JLPTLevel) => void;
}

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

export const CurrentLevelProgressCard: React.FC<CurrentLevelProgressCardProps> = ({
  level,
  stats,
  onSelectLevel
}) => {
  return (
    <div
      id="section-current-level-progress"
      className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-5"
    >
      {/* Top row: Label, level switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100">
                Одоогийн JLPT түвшин ба нийт явц
              </h2>
              <LevelBadge level={level} size="sm" />
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Өдөр тутмын даалгавар болон явцын статистик сонгосон түвшнээс хамаарна
            </p>
          </div>
        </div>

        {/* Level Switcher */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-stone-100 dark:bg-stone-800/80 p-1 rounded-2xl">
          {JLPT_LEVELS.map(lvl => {
            const isActive = lvl === level;
            return (
              <button
                key={lvl}
                id={`progress-level-btn-${lvl}`}
                type="button"
                onClick={() => onSelectLevel(lvl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                {lvl}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main progress bar & percentage */}
      <div className="space-y-2.5">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
              {stats.overallPct}%
            </span>
            <span className="text-xs sm:text-sm font-semibold text-stone-500 dark:text-stone-400">
              ({stats.learnedItems} / {stats.totalItems} нийт агуулга эзэмшсэн)
            </span>
          </div>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
            {stats.overallPct === 100 ? 'Бүх агуулгыг эзэмшсэн 🎉' : `${100 - stats.overallPct}% үлдсэн`}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 sm:h-3.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, stats.overallPct))}%` }}
          />
        </div>
      </div>

      {/* 3 Categories Mini Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {/* Vocabulary */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block">Үг цээжлэлт</span>
              <span className="text-[11px] text-stone-400">
                {stats.learnedVocab} / {stats.totalVocab} үг
              </span>
            </div>
          </div>
          <span className="text-sm font-black text-stone-900 dark:text-stone-100">
            {stats.vocabPct}%
          </span>
        </div>

        {/* Kanji */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block">Ханз эзэмшилт</span>
              <span className="text-[11px] text-stone-400">
                {stats.learnedKanji} / {stats.totalKanji} ханз
              </span>
            </div>
          </div>
          <span className="text-sm font-black text-stone-900 dark:text-stone-100">
            {stats.kanjiPct}%
          </span>
        </div>

        {/* Grammar */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Award className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block">Дүрэм эзэмшилт</span>
              <span className="text-[11px] text-stone-400">
                {stats.learnedGrammar} / {stats.totalGrammar} дүрэм
              </span>
            </div>
          </div>
          <span className="text-sm font-black text-stone-900 dark:text-stone-100">
            {stats.grammarPct}%
          </span>
        </div>
      </div>
    </div>
  );
};
