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
  
  // Default to 'path' if learnSubTab is 'flashcards' or undefined
  const effectiveSubTab: LearnSubTab = (learnSubTab === 'flashcards' ? 'vocab' : learnSubTab) || 'path';

  const subTabs: { id: LearnSubTab; label: string; icon: React.ElementType; count?: number; badge?: string }[] = [
    {
      id: 'path',
      label: 'Зам',
      icon: Compass,
      badge: '2.0'
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
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              Сургалтын танхим
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              JLPT {effectiveLevel} түвшний сургалтын хөтөлбөр
            </p>
          </div>
        </div>

        {/* 4 Clean Sub-tabs Navigation (Responsive Grid on Mobile, Flex on Desktop) */}
        <div className="grid grid-cols-4 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 border-t border-stone-100 dark:border-stone-800 pt-3 sm:pt-4 w-full">
          {subTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = effectiveSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setLearnSubTab(tab.id)}
                className={`flex sm:inline-flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#CC0000] via-[#FF0000] to-[#FF3366] text-white shadow-md shadow-[#FF0000]/25'
                    : 'bg-stone-50 dark:bg-stone-800/50 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                <span className="truncate">{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`hidden sm:inline-block text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full font-mono ${
                      isActive
                        ? 'bg-white/20 text-white'
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
        {effectiveSubTab === 'path' && <LearningPathView />}
        {effectiveSubTab === 'vocab' && <VocabList />}
        {effectiveSubTab === 'kanji' && <KanjiList />}
        {effectiveSubTab === 'grammar' && <GrammarList />}
      </div>
    </div>
  );
};
