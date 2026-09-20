import React from 'react';
import {
  BookOpen,
  Sparkles,
  BookA
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { JLPTLevel, LearnSubTab } from '../../types';
import { VocabList } from './VocabList';
import { KanjiList } from './KanjiList';
import { GrammarList } from './GrammarList';

export const LearnHub: React.FC = () => {
  const {
    selectedLevel,
    setSelectedLevel,
    learnSubTab,
    setLearnSubTab,
    data
  } = useApp();

  const levels: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
  const effectiveLevel = selectedLevel || 'N5';

  const subTabs: { id: LearnSubTab; label: string; icon: React.ElementType; count?: number }[] = [
    {
      id: 'vocab',
      label: 'Үгийн сан',
      icon: BookA,
      count: (data.vocabulary || []).filter(v => v.jlptLevel === effectiveLevel).length
    },
    {
      id: 'kanji',
      label: 'Ханз',
      icon: Sparkles,
      count: (data.kanji || []).filter(k => k.jlptLevel === effectiveLevel).length
    },
    {
      id: 'grammar',
      label: 'Дүрэм',
      icon: BookOpen,
      count: (data.grammar || []).filter(g => g.jlptLevel === effectiveLevel).length
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in">
      {/* Top Header & JLPT Level Selection Bar */}
      <div className="bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              Сургалтын танхим
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
              JLPT {effectiveLevel} түвшний сургалтын агуулга
            </p>
          </div>

          {/* Level Switcher Pills */}
          <div className="flex items-center justify-between sm:justify-start gap-1 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-xl sm:rounded-2xl w-full sm:w-auto">
            {levels.map(lvl => {
              const isSelected = selectedLevel === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`flex-1 sm:flex-initial px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-extrabold text-center transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 scale-105'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none border-t border-stone-100 dark:border-stone-800 pt-3 sm:pt-4 w-full">
          {subTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = learnSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setLearnSubTab(tab.id)}
                className={`inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-sm'
                    : 'bg-stone-50 dark:bg-stone-800/50 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-red-500 dark:text-red-600' : 'text-stone-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full font-mono ${
                      isActive
                        ? 'bg-stone-800 dark:bg-stone-100 text-stone-200 dark:text-stone-800'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Sub-view Content */}
      <div className="min-h-[500px]">
        {learnSubTab === 'vocab' && <VocabList />}
        {learnSubTab === 'kanji' && <KanjiList />}
        {learnSubTab === 'grammar' && <GrammarList />}
      </div>
    </div>
  );
};
