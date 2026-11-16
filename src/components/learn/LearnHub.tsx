import React from 'react';
import {
  BookOpen,
  Sparkles,
  BookA,
  Compass
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LearnSubTab } from '../../types';
import { VocabList } from './VocabList';
import { KanjiList } from './KanjiList';
import { GrammarList } from './GrammarList';
import { LearningPathView } from '../path/LearningPathView';

export const LearnHub: React.FC = () => {
  const {
    selectedLevel,
    learnSubTab,
    setLearnSubTab,
    data
  } = useApp();

  const effectiveLevel = selectedLevel || 'N5';

  // Default to 'path' (guided learning roadmap)
  const effectiveSubTab: LearnSubTab = (learnSubTab === 'flashcards' ? 'vocab' : learnSubTab) || 'path';

  const subTabs: { id: LearnSubTab; label: string; icon: React.ElementType; count?: number }[] = [
    {
      id: 'path',
      label: 'Зам',
      icon: Compass
    },
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
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 space-y-4 sm:space-y-5 animate-fade-in">
      {/* Compact Sub-tabs Navigation Bar */}
      <div className="bg-white dark:bg-stone-900 p-2 sm:p-3 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        <div className="grid grid-cols-4 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          {subTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = effectiveSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setLearnSubTab(tab.id)}
                className={`min-h-[44px] flex sm:inline-flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#CC0000] via-[#FF0000] to-[#FF3366] text-white shadow-sm shadow-[#FF0000]/20'
                    : 'bg-stone-50 dark:bg-stone-800/50 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                <span className="truncate">{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`hidden md:inline-block text-[11px] font-mono tabular-nums ${
                      isActive ? 'text-white/85' : 'text-stone-400 dark:text-stone-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="hidden sm:flex items-center gap-2 px-2 text-xs font-bold text-stone-500 dark:text-stone-400 shrink-0">
          <span>Түвшин:</span>
          <span className="font-mono font-black text-[#CC0000] dark:text-[#FF6699]">
            JLPT {effectiveLevel}
          </span>
        </div>
      </div>

      {/* Main Sub-view Content */}
      <div className="min-h-[500px]">
        {effectiveSubTab === 'path' && <LearningPathView />}
        {effectiveSubTab === 'vocab' && <VocabList />}
        {effectiveSubTab === 'kanji' && <KanjiList />}
        {effectiveSubTab === 'grammar' && <GrammarList />}
      </div>
    </div>
  );
};
