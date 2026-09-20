import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Flame,
  Award,
  BookOpen,
  Languages,
  PenTool,
  RotateCcw,
  Star,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Target,
  Sparkles,
  BarChart2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { JLPTLevel } from '../../types';
import { LevelBadge } from '../common/LevelBadge';
import { learningEngine } from '../../services/learningEngine';

export const ProgressView: React.FC = () => {
  const {
    data,
    userProgress,
    selectedLevel,
    setSelectedLevel,
    setActiveTab,
    setPracticeMissedItems,
    toggleFavorite,
    toggleVocabLearned,
    toggleKanjiLearned,
    toggleGrammarLearned
  } = useApp();

  const [activeTab, setActiveTabLocal] = useState<'overview' | 'weak' | 'history' | 'favorites'>('overview');
  const [viewLevel, setViewLevel] = useState<JLPTLevel>(selectedLevel || 'N5');

  // Keep viewLevel synced if global level changes
  React.useEffect(() => {
    if (selectedLevel) {
      setViewLevel(selectedLevel);
    }
  }, [selectedLevel]);

  const stats = useMemo(() => {
    return learningEngine.getLevelStats(data, viewLevel, userProgress);
  }, [data, viewLevel, userProgress]);

  const streak = userProgress.streak || { current: 0, longest: 0, lastActiveDate: '' };

  // Favorited items
  const favVocab = useMemo(() => {
    return (data.vocabulary || []).filter(v => userProgress.favorites?.vocabIds?.includes(v.id));
  }, [data.vocabulary, userProgress.favorites?.vocabIds]);

  const favKanji = useMemo(() => {
    return (data.kanji || []).filter(k => userProgress.favorites?.kanjiIds?.includes(k.id));
  }, [data.kanji, userProgress.favorites?.kanjiIds]);

  const favGrammar = useMemo(() => {
    return (data.grammar || []).filter(g => userProgress.favorites?.grammarIds?.includes(g.id));
  }, [data.grammar, userProgress.favorites?.grammarIds]);

  const totalWeakCount = stats.weakVocab.length + stats.weakKanji.length + stats.weakGrammar.length;

  const handlePracticeAllWeak = () => {
    const weakIds = [
      ...stats.weakVocab.map(v => v.id),
      ...stats.weakKanji.map(k => k.id),
      ...stats.weakGrammar.map(g => g.id)
    ];
    if (weakIds.length > 0) {
      setPracticeMissedItems(weakIds);
      setActiveTab('practice');
    }
  };

  const levels: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

  // Max activity count in last 7 days for bar chart scaling
  const maxActivityCount = Math.max(5, ...stats.last7Days.map(d => d.count));

  return (
    <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                Миний Явц
              </span>
              <LevelBadge level={viewLevel} size="sm" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              Сургалтын Явцын Самбар
            </h1>
            <p className="text-stone-500 dark:text-stone-400 text-sm">
              Таны цээжилсэн үг, ханз, дүрэм болон дасгал, сорилын үр дүн.
            </p>
          </div>

          {/* Level Switcher */}
          <div className="flex items-center gap-1.5 p-1.5 bg-stone-100 dark:bg-stone-800/70 rounded-2xl border border-stone-200 dark:border-stone-700/60 self-start md:self-auto">
            {levels.map(lvl => (
              <button
                key={lvl}
                type="button"
                onClick={() => {
                  setViewLevel(lvl);
                  setSelectedLevel(lvl);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  viewLevel === lvl
                    ? 'bg-white dark:bg-stone-700 text-amber-600 dark:text-amber-300 shadow-sm'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 border-t border-stone-100 dark:border-stone-800 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTabLocal('overview')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            Ерөнхий самбар
          </button>

          <button
            type="button"
            onClick={() => setActiveTabLocal('weak')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'weak'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            <span>Давтах хэрэгтэй</span>
            {totalWeakCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-200 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                {totalWeakCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTabLocal('history')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            Quiz түүх ({stats.levelQuizzes.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTabLocal('favorites')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'favorites'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            Хадгалсан ({favVocab.length + favKanji.length + favGrammar.length})
          </button>
        </div>
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Bento Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Overall Level Progress */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
                <span className="text-xs font-semibold">Нийт явц ({viewLevel})</span>
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-stone-100">
                {stats.overallPct}%
              </div>
              <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${stats.overallPct}%` }}
                />
              </div>
              <p className="text-xs text-stone-400">
                {stats.learnedItems} / {stats.totalItems} контент эзэмшсэн
              </p>
            </div>

            {/* Daily Streak */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
                <span className="text-xs font-semibold">Дараалсан өдөр</span>
                <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400">
                {streak.current} өдөр
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400">
                Хамгийн урт: <span className="font-bold text-stone-700 dark:text-stone-300">{streak.longest || streak.current} өдөр</span>
              </div>
              <p className="text-xs text-stone-400">
                Өдөр бүр дасгал хийж streak-ээ хадгалаарай
              </p>
            </div>

            {/* Quiz Average */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
                <span className="text-xs font-semibold">Сорилын дундаж</span>
                <Target className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.quizAverage}%
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400">
                Нийт сорил: <span className="font-bold text-stone-700 dark:text-stone-300">{stats.quizCount} удаа</span>
              </div>
              <p className="text-xs text-stone-400">
                Шилдэг оноо: {stats.quizBest}%
              </p>
            </div>

            {/* Practice Accuracy */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
                <span className="text-xs font-semibold">Дасгалын нарийвчлал</span>
                <Award className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-400">
                {stats.practiceAccuracy}%
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400">
                Нийт дасгал: <span className="font-bold text-stone-700 dark:text-stone-300">{stats.practiceCount} удаа</span>
              </div>
              <p className="text-xs text-stone-400">
                Сул зүйлс: {totalWeakCount}
              </p>
            </div>
          </div>

          {/* 7-Day Activity Chart & Category Mastery */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 7-Day Activity Chart */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-amber-500" />
                    Сүүлийн 7 хоногийн идэвх
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Өдөр бүрийн гүйцэтгэсэн дасгал болон сорилын тоо
                  </p>
                </div>
              </div>

              {/* Bar Chart Bars */}
              <div className="flex items-end justify-between gap-2 pt-6 pb-2 h-44 border-b border-stone-100 dark:border-stone-800 px-2">
                {stats.last7Days.map((day, idx) => {
                  const barHeightPct = Math.max(8, Math.round((day.count / maxActivityCount) * 100));

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-[10px] font-bold text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {day.count}
                      </span>
                      <div className="w-full max-w-[32px] bg-stone-100 dark:bg-stone-800 rounded-xl h-full flex items-end overflow-hidden">
                        <div
                          className={`w-full rounded-xl transition-all duration-500 ${
                            day.isToday
                              ? 'bg-amber-500 shadow-md shadow-amber-500/20'
                              : day.count > 0
                              ? 'bg-amber-300 dark:bg-amber-600/60'
                              : 'bg-transparent'
                          }`}
                          style={{ height: `${barHeightPct}%` }}
                        />
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          day.isToday
                            ? 'text-amber-600 dark:text-amber-400 font-bold'
                            : 'text-stone-500 dark:text-stone-400'
                        }`}
                      >
                        {day.dayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-stone-400 pt-1">
                <span>Цэнхэр / Шар багана: суралцсан өдрүүд</span>
                <span>Өнөөдөр: {streak.current > 0 ? 'Идэвхтэй 🔥' : 'Эхлэх'}</span>
              </div>
            </div>

            {/* Category Breakdown (Vocab, Kanji, Grammar) */}
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Түвшний агуулга
              </h3>

              <div className="space-y-4">
                {/* Vocab */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300">
                      <Languages className="w-4 h-4 text-amber-500" />
                      Үгсийн сан
                    </span>
                    <span className="text-stone-500">
                      {stats.learnedVocab} / {stats.totalVocab} ({stats.vocabPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{ width: `${stats.vocabPct}%` }}
                    />
                  </div>
                </div>

                {/* Kanji */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300">
                      <PenTool className="w-4 h-4 text-emerald-500" />
                      Ханз
                    </span>
                    <span className="text-stone-500">
                      {stats.learnedKanji} / {stats.totalKanji} ({stats.kanjiPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${stats.kanjiPct}%` }}
                    />
                  </div>
                </div>

                {/* Grammar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300">
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      Дүрэм
                    </span>
                    <span className="text-stone-500">
                      {stats.learnedGrammar} / {stats.totalGrammar} ({stats.grammarPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all"
                      style={{ width: `${stats.grammarPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Spaced Repetition status */}
              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-2">
                <span className="text-xs font-bold text-stone-400 block uppercase tracking-wider">
                  Ой тогтоолтын түвшин
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-300">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold block text-sm">
                      {stats.masteredCount}
                    </span>
                    Сурсан (Баттай)
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-300">
                    <span className="text-rose-600 dark:text-rose-400 font-bold block text-sm">
                      {stats.reviewNeededCount}
                    </span>
                    Давтах шаардлагатай
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. WEAK ITEMS / NEEDS REVIEW TAB */}
      {activeTab === 'weak' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
                Давтах шаардлагатай зүйлс ({totalWeakCount})
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                Дасгал болон сорилын үед алдаа гаргасан эсвэл хангалттай бататгаагүй зүйлс.
              </p>
            </div>

            {totalWeakCount > 0 && (
              <button
                type="button"
                onClick={handlePracticeAllWeak}
                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 transition-all self-start sm:self-auto"
              >
                <RotateCcw className="w-4 h-4" />
                Эдгээрээр дасгал хийх ({totalWeakCount})
              </button>
            )}
          </div>

          {totalWeakCount === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Сул зүйл алга байна! 🎉
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                Та одоогоор {viewLevel} түвшинд бүх асуултад амжилттай хариулсан байна. Шинэ дасгал эсвэл сорил өгч өөрийгөө сориорой!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Weak Vocab */}
              {stats.weakVocab.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2 px-1">
                    <Languages className="w-4 h-4 text-amber-500" />
                    Давтах үгс ({stats.weakVocab.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {stats.weakVocab.map(v => (
                      <div
                        key={v.id}
                        className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between gap-3"
                      >
                        <div>
                          <span className="text-lg font-bold text-stone-900 dark:text-stone-100 block">
                            {v.japanese}
                          </span>
                          {v.reading && (
                            <span className="text-xs text-stone-500 dark:text-stone-400">
                              【{v.reading}】
                            </span>
                          )}
                          <p className="text-xs text-stone-600 dark:text-stone-300 font-medium mt-1">
                            {v.mongolian}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weak Kanji */}
              {stats.weakKanji.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2 px-1">
                    <PenTool className="w-4 h-4 text-emerald-500" />
                    Давтах ханз ({stats.weakKanji.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {stats.weakKanji.map(k => (
                      <div
                        key={k.id}
                        className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between gap-3"
                      >
                        <div>
                          <span className="text-2xl font-bold text-stone-900 dark:text-stone-100 block">
                            {k.character}
                          </span>
                          <p className="text-xs text-stone-600 dark:text-stone-300 font-medium mt-1">
                            {k.mongolian}
                          </p>
                          <p className="text-[11px] text-stone-400">
                            {k.onyomi} / {k.kunyomi}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weak Grammar */}
              {stats.weakGrammar.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2 px-1">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    Давтах дүрэм ({stats.weakGrammar.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {stats.weakGrammar.map(g => (
                      <div
                        key={g.id}
                        className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-2"
                      >
                        <span className="text-base font-bold text-stone-900 dark:text-stone-100 block">
                          {g.pattern}
                        </span>
                        <p className="text-xs text-stone-600 dark:text-stone-300">
                          {g.meaning}
                        </p>
                        {g.structure && (
                          <p className="text-[11px] text-stone-400">
                            Бүтэц: {g.structure}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. QUIZ HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 px-1">
            {viewLevel} Түвшний Сорилын Түүх
          </h2>

          {stats.levelQuizzes.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
                <Target className="w-8 h-8" />
              </div>
              <p className="text-stone-500 dark:text-stone-400 text-sm">
                Та {viewLevel} түвшинд одоогоор сорил өгөөгүй байна.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('quiz')}
                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
              >
                Сорил эхлүүлэх
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stats.levelQuizzes.map(quiz => {
                const isPassed = quiz.percentage >= 70;
                const formattedDate = new Date(quiz.date).toLocaleDateString('mn-MN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={quiz.id}
                    className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-500 uppercase">
                          {quiz.category} сорил
                        </span>
                        <LevelBadge level={quiz.jlptLevel} size="sm" />
                      </div>
                      <div className="text-lg font-bold text-stone-900 dark:text-stone-100">
                        {quiz.score} / {quiz.total} авсан
                      </div>
                      <div className="text-xs text-stone-400">
                        {formattedDate}
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-2xl font-black block ${
                          isPassed
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {quiz.percentage}%
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isPassed
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {isPassed ? 'Тэнцсэн' : 'Дахин өгөх'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. FAVORITES TAB */}
      {activeTab === 'favorites' && (
        <div className="space-y-6">
          <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 px-1">
            Хадгалсан зүйлс ({favVocab.length + favKanji.length + favGrammar.length})
          </h2>

          {favVocab.length === 0 && favKanji.length === 0 && favGrammar.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center">
                <Star className="w-8 h-8" />
              </div>
              <p className="text-stone-500 dark:text-stone-400 text-sm">
                Танд хадгалсан үг, ханз, дүрэм байхгүй байна. Хичээл үзэхдээ од дарж хадгалаарай!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Favorited Vocab */}
              {favVocab.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                    <Languages className="w-4 h-4 text-amber-500" />
                    Хадгалсан үгс ({favVocab.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {favVocab.map(v => (
                      <div
                        key={v.id}
                        className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-stone-900 dark:text-stone-100">
                              {v.japanese}
                            </span>
                            <LevelBadge level={v.jlptLevel} size="sm" />
                          </div>
                          {v.reading && (
                            <span className="text-xs text-stone-500 dark:text-stone-400">
                              【{v.reading}】
                            </span>
                          )}
                          <p className="text-xs text-stone-600 dark:text-stone-300 font-medium mt-1">
                            {v.mongolian}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleFavorite('vocab', v.id)}
                            className="p-2 rounded-xl text-amber-500 hover:bg-amber-50 dark:hover:bg-stone-800 cursor-pointer"
                            title="Хадгалснаас хасах"
                          >
                            <Star className="w-4 h-4 fill-current" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Favorited Kanji */}
              {favKanji.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-emerald-500" />
                    Хадгалсан ханз ({favKanji.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {favKanji.map(k => (
                      <div
                        key={k.id}
                        className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                              {k.character}
                            </span>
                            <LevelBadge level={k.jlptLevel} size="sm" />
                          </div>
                          <p className="text-xs text-stone-600 dark:text-stone-300 font-medium mt-1">
                            {k.mongolian}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleFavorite('kanji', k.id)}
                            className="p-2 rounded-xl text-amber-500 hover:bg-amber-50 dark:hover:bg-stone-800 cursor-pointer"
                            title="Хадгалснаас хасах"
                          >
                            <Star className="w-4 h-4 fill-current" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Favorited Grammar */}
              {favGrammar.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    Хадгалсан дүрэм ({favGrammar.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {favGrammar.map(g => (
                      <div
                        key={g.id}
                        className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-stone-900 dark:text-stone-100">
                              {g.pattern}
                            </span>
                            <LevelBadge level={g.jlptLevel} size="sm" />
                          </div>
                          <p className="text-xs text-stone-600 dark:text-stone-300">
                            {g.meaning}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleFavorite('grammar', g.id)}
                          className="p-2 rounded-xl text-amber-500 hover:bg-amber-50 dark:hover:bg-stone-800 cursor-pointer shrink-0"
                          title="Хадгалснаас хасах"
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
