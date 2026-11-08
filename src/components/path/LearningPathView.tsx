import React, { useState, useMemo } from 'react';
import {
  Flame,
  Zap,
  Sparkles,
  Trophy,
  BookOpen,
  Award,
  ChevronRight,
  Compass,
  RotateCcw,
  BookA,
  CheckCircle2,
  X,
  Volume2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { JLPTLevel, CurriculumLesson, CurriculumUnit } from '../../types';
import { generateCurriculumForLevel, calculateLessonStatus } from '../../data/curriculumGenerator';
import { PathNode } from './PathNode';
import { UnitHeader } from './UnitHeader';
import { LessonPlayerModal } from '../lesson/LessonPlayerModal';
import { SunnyLogo } from '../common/SunnyLogo';
import { speechService } from '../../services/speech';
import { triggerHapticFeedback } from '../../services/nativePlatform';

export const LearningPathView: React.FC = () => {
  const {
    data,
    selectedLevel,
    setSelectedLevel,
    userProgress,
    completeCurriculumLesson,
    setActiveTab,
    setLearnSubTab
  } = useApp();

  const currentLevel: JLPTLevel = selectedLevel || 'N5';
  const levels: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

  const [activeLessonSession, setActiveLessonSession] = useState<CurriculumLesson | null>(null);
  const [guidebookUnit, setGuidebookUnit] = useState<CurriculumUnit | null>(null);

  // Generate deterministic units & lessons for selected JLPT level
  const units = useMemo(() => {
    return generateCurriculumForLevel(
      currentLevel,
      data.vocabulary || [],
      data.kanji || [],
      data.grammar || []
    );
  }, [currentLevel, data.vocabulary, data.kanji, data.grammar]);

  // Overall level progress calculation
  const { totalLessons, completedLessons, progressPercent } = useMemo(() => {
    let total = 0;
    let completed = 0;
    const completedSet = new Set(userProgress.completedLessonIds || []);

    units.forEach(u => {
      u.lessons.forEach(l => {
        total++;
        if (completedSet.has(l.id)) {
          completed++;
        } else if (l.vocabIds.length > 0) {
          const learnedCount = l.vocabIds.filter(id => (userProgress.learnedVocabIds || []).includes(id)).length;
          if (learnedCount >= Math.ceil(l.vocabIds.length * 0.75)) {
            completed++;
          }
        }
      });
    });

    const percent = Math.min(100, Math.round((completed / (total || 1)) * 100));
    return { totalLessons: total, completedLessons: completed, progressPercent: percent };
  }, [units, userProgress.completedLessonIds, userProgress.learnedVocabIds]);

  // Dynamic mascot greeting based on current local hour
  const mascotGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'Өглөөний мэнд! Хичээлээ шинэ эрч хүчээр эхлүүлээрэй.';
    if (hour >= 11 && hour < 17) return 'Өдрийн мэнд! Өнөөдрийн 20 XP зорилгоо биелүүлээрэй.';
    if (hour >= 17 && hour < 22) return 'Оройн мэнд! Өдөрт сурсан үгсээ давтан бататгаарай.';
    return 'Шөнийн мэнд! Амрахаасаа өмнө 1 богино хичээл суралцаарай.';
  }, []);

  const streakCount = userProgress.streak?.current || userProgress.gamification?.currentStreak || 0;
  const dailyXP = userProgress.gamification?.dailyXP || 0;
  const dailyGoalXP = userProgress.gamification?.dailyGoalXP || 20;
  const dailyGoalPercent = Math.min(100, Math.round((dailyXP / dailyGoalXP) * 100));

  const handleLessonComplete = (lessonId: string, earnedXP: number) => {
    completeCurriculumLesson(lessonId, earnedXP);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      
      {/* ========================================================= */}
      {/* 1. TOP HEADER: Level Selector & Mobile Summary           */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-[#CC0000] to-[#FF3366] text-white flex items-center justify-center shadow-md shadow-red-500/20 shrink-0">
            <Compass className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
                Сургалтын Зам
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 dark:bg-red-950/60 text-[#CC0000] dark:text-[#FF6699] border border-red-200 dark:border-red-900/60">
                JLPT {currentLevel}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Нийт {completedLessons} / {totalLessons} хичээл дууссан ({progressPercent}%)
            </p>
          </div>
        </div>

        {/* Level Selector Pills */}
        <div className="flex items-center justify-between sm:justify-start gap-1 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-2xl w-full sm:w-auto">
          {levels.map(lvl => {
            const isSelected = currentLevel === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => {
                  triggerHapticFeedback('light');
                  setSelectedLevel(lvl);
                }}
                className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#CC0000] to-[#FF3366] text-white shadow-md shadow-red-500/25 scale-105'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                {lvl}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. THREE-COLUMN RESPONSIVE LAYOUT                        */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* ======================================================= */}
        {/* LEFT COLUMN (Desktop): Mascot, Fast Jump, Level Stats    */}
        {/* ======================================================= */}
        <aside className="hidden lg:block lg:col-span-3 space-y-5 sticky top-24">
          {/* Mascot Greeting Box */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-xs shrink-0">
                <SunnyLogo className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider block">
                  Sunny mascot
                </span>
                <span className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
                  Сайн байна уу!
                </span>
              </div>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              {mascotGreeting}
            </p>
          </div>

          {/* Library / Dictionary Quick Jump */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-900 dark:to-[#171013] border border-stone-200 dark:border-stone-800 space-y-2.5">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
              Чөлөөт хайлт & Номын сан:
            </span>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setLearnSubTab('vocab');
                  setActiveTab('learn');
                }}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-stone-800/80 hover:bg-red-50 dark:hover:bg-red-950/30 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center justify-between border border-stone-200/60 dark:border-stone-700/60 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BookA className="w-4 h-4 text-[#CC0000]" />
                  <span>Үгийн сан ({data.vocabulary?.filter(v => v.jlptLevel === currentLevel).length || 0})</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setLearnSubTab('kanji');
                  setActiveTab('learn');
                }}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-stone-800/80 hover:bg-red-50 dark:hover:bg-red-950/30 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center justify-between border border-stone-200/60 dark:border-stone-700/60 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Ханзны сан ({data.kanji?.filter(k => k.jlptLevel === currentLevel).length || 0})</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setLearnSubTab('grammar');
                  setActiveTab('learn');
                }}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-stone-800/80 hover:bg-red-50 dark:hover:bg-red-950/30 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center justify-between border border-stone-200/60 dark:border-stone-700/60 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-rose-500" />
                  <span>Дүрмийн сан ({data.grammar?.filter(g => g.jlptLevel === currentLevel).length || 0})</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              </button>
            </div>
          </div>
        </aside>

        {/* ======================================================= */}
        {/* CENTER COLUMN: The Vertical Winding Learning Path        */}
        {/* ======================================================= */}
        <main className="lg:col-span-6 w-full flex flex-col items-center">
          {units.map((unit, unitIdx) => {
            const unitCompletedCount = unit.lessons.filter(l => {
              const status = calculateLessonStatus(
                l,
                userProgress.learnedVocabIds || [],
                userProgress.learnedKanjiIds || [],
                userProgress.completedLessonIds || []
              );
              return status === 'completed';
            }).length;

            return (
              <div key={unit.id} className="w-full flex flex-col items-center">
                {/* Unit Header Card */}
                <UnitHeader
                  unit={unit}
                  completedCount={unitCompletedCount}
                  totalCount={unit.lessons.length}
                  onOpenGuidebook={u => setGuidebookUnit(u)}
                />

                {/* Nodes on winding path */}
                <div className="relative w-full max-w-sm flex flex-col items-center py-2 sm:py-3">
                  {unit.lessons.map((lesson, lessonIdx) => {
                    const isFirstLesson = unitIdx === 0 && lessonIdx === 0;
                    
                    // Determine previous lesson status
                    let prevStatus;
                    if (lessonIdx > 0) {
                      const prevLesson = unit.lessons[lessonIdx - 1];
                      prevStatus = calculateLessonStatus(
                        prevLesson,
                        userProgress.learnedVocabIds || [],
                        userProgress.learnedKanjiIds || [],
                        userProgress.completedLessonIds || []
                      );
                    } else if (unitIdx > 0) {
                      const prevUnit = units[unitIdx - 1];
                      const lastLessonOfPrev = prevUnit.lessons[prevUnit.lessons.length - 1];
                      prevStatus = calculateLessonStatus(
                        lastLessonOfPrev,
                        userProgress.learnedVocabIds || [],
                        userProgress.learnedKanjiIds || [],
                        userProgress.completedLessonIds || []
                      );
                    }

                    const status = calculateLessonStatus(
                      lesson,
                      userProgress.learnedVocabIds || [],
                      userProgress.learnedKanjiIds || [],
                      userProgress.completedLessonIds || [],
                      isFirstLesson,
                      prevStatus
                    );

                    return (
                      <PathNode
                        key={lesson.id}
                        lesson={lesson}
                        status={status}
                        index={lessonIdx}
                        totalInUnit={unit.lessons.length}
                        unitThemeColor={unit.themeColor}
                        onSelectLesson={l => setActiveLessonSession(l)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </main>

        {/* ======================================================= */}
        {/* RIGHT COLUMN (Desktop): Streak, Daily Mission & XP Ring  */}
        {/* ======================================================= */}
        <aside className="hidden lg:block lg:col-span-3 space-y-5 sticky top-24">
          
          {/* Streak Flame Card */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Flame className="w-6 h-6 fill-amber-500" />
                </div>
                <div>
                  <div className="text-xl font-black text-stone-900 dark:text-stone-100">
                    {streakCount} өдөр
                  </div>
                  <div className="text-[11px] font-bold text-stone-400">
                    Цуврал суралцаж буй
                  </div>
                </div>
              </div>
              <span className="text-xs font-black text-amber-500 px-2 py-0.5 rounded-full bg-amber-500/10">
                🔥 Идэвхтэй
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Өдөр бүр ядаж 1 дасгал хийж streak-ээ таслахгүй үргэлжлүүлээрэй.
            </p>
          </div>

          {/* Daily XP Mission Ring */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-extrabold text-sm">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Өдрийн зорилго</span>
              </div>
              <span className="text-xs font-bold text-stone-400">
                {dailyXP} / {dailyGoalXP} XP
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 transition-all duration-500"
                style={{ width: `${dailyGoalPercent}%` }}
              />
            </div>

            <div className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
              {dailyGoalPercent >= 100
                ? '🎉 Өнөөдрийн 20 XP зорилгоо биеллээ! Маш сайн байна.'
                : `Зорилгодоо хүрэхэд дахин ${Math.max(0, dailyGoalXP - dailyXP)} XP дутуу байна.`}
            </div>
          </div>

          {/* Spaced Repetition Quick Review */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-[#990000] to-[#CC0000] text-white space-y-3 shadow-lg shadow-red-950/20">
            <div className="space-y-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 border border-white/10">
                Давтлага
              </span>
              <h4 className="text-base font-black">
                Эргэн давтах хичээлүүд
              </h4>
              <p className="text-xs text-white/80 leading-relaxed">
                Сурсан үгсээ санах ойдоо бүрэн хадгалахын тулд тогтмол давтаарай.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback('light');
                setActiveTab('practice');
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-white text-[#990000] font-black text-xs hover:bg-stone-50 active:scale-95 transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Давтлага эхлүүлэх</span>
            </button>
          </div>
        </aside>
      </div>

      {/* ========================================================= */}
      {/* 3. INTERACTIVE LESSON PLAYER MODAL                        */}
      {/* ========================================================= */}
      {activeLessonSession && (
        <LessonPlayerModal
          lesson={activeLessonSession}
          onClose={() => setActiveLessonSession(null)}
          onLessonComplete={handleLessonComplete}
        />
      )}

      {/* ========================================================= */}
      {/* 4. UNIT GUIDEBOOK MODAL                                   */}
      {/* ========================================================= */}
      {guidebookUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-[#150F12] rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-5 my-auto max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div>
                <span className="text-[11px] font-black uppercase text-[#CC0000] dark:text-[#FF6699] tracking-wider block">
                  БҮЛЭГ {guidebookUnit.unitNumber} • ХӨТӨЧ
                </span>
                <h3 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
                  {guidebookUnit.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setGuidebookUnit(null)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              {guidebookUnit.mongolianDescription}
            </p>

            {/* List of lessons in this unit */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black uppercase text-stone-400 tracking-wider">
                Энэ бүлэгт багтсан хичээлүүд:
              </h4>
              <div className="grid grid-cols-1 gap-2.5">
                {guidebookUnit.lessons.map(l => (
                  <div
                    key={l.id}
                    className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-black text-stone-900 dark:text-stone-100">
                        {l.title}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">
                        {l.description}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-500 shrink-0">
                      +{l.xpReward} XP
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setGuidebookUnit(null)}
              className="w-full py-3 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity"
            >
              Хаах
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
