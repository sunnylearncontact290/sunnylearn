import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Flame,
  Zap,
  Sparkles,
  BookOpen,
  ChevronRight,
  RotateCcw,
  BookA,
  X,
  Lock,
  Play,
  ArrowRight,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { JLPTLevel, CurriculumLesson, CurriculumUnit, PathNodeStatus } from '../../types';
import {
  generateCurriculumForLevel,
  computeLevelPathState
} from '../../data/curriculumGenerator';
import { PathNode } from './PathNode';
import { UnitHeader } from './UnitHeader';
import { LessonPlayerModal } from '../lesson/LessonPlayerModal';
import { triggerHapticFeedback } from '../../services/nativePlatform';

export const LearningPathView: React.FC = () => {
  const {
    data,
    selectedLevel,
    userProgress,
    completeCurriculumLesson,
    setActiveTab,
    setLearnSubTab,
    setPracticeMissedItems
  } = useApp();

  const currentLevel: JLPTLevel = selectedLevel || 'N5';

  const [activeLessonSession, setActiveLessonSession] = useState<{
    lesson: CurriculumLesson;
    wasAlreadyCompleted: boolean;
  } | null>(null);
  const [selectedPathLesson, setSelectedPathLesson] = useState<{
    lesson: CurriculumLesson;
    status: PathNodeStatus;
  } | null>(null);
  const [guidebookUnit, setGuidebookUnit] = useState<CurriculumUnit | null>(null);
  const [expandedUnitIds, setExpandedUnitIds] = useState<Record<string, boolean>>({});

  // Build full curriculum for active JLPT level directly from existing real datasets
  const units = useMemo(() => {
    return generateCurriculumForLevel(
      currentLevel,
      data.vocabulary || [],
      data.kanji || [],
      data.grammar || []
    );
  }, [currentLevel, data.vocabulary, data.kanji, data.grammar]);

  // Single O(N) pass for all lesson statuses, active focus node, and unit progress
  const pathState = useMemo(() => {
    return computeLevelPathState(units, userProgress);
  }, [units, userProgress]);

  // Flat ordered lesson list to resolve "Next Lesson" cleanly inside Victory Screen
  const flatLessons = useMemo(() => {
    return units.flatMap(u => u.lessons);
  }, [units]);

  // Auto-expand the unit containing the current active lesson when level or active unit changes
  useEffect(() => {
    const activeId = pathState.nextActiveUnit?.id || units[0]?.id;
    if (activeId) {
      setExpandedUnitIds({ [activeId]: true });
    }
  }, [currentLevel, pathState.nextActiveUnit?.id]);

  // Due / Weak SRS items count for the current level
  const dueReviewCount = useMemo(() => {
    const records = userProgress.itemStudyRecords || {};
    const now = Date.now();
    let count = 0;
    for (const key in records) {
      const rec = records[key];
      if (!rec || rec.jlptLevel !== currentLevel) continue;
      const isDue = rec.nextReviewDate && new Date(rec.nextReviewDate).getTime() <= now;
      const needsReview = rec.masteryStatus === 'review_needed' || rec.incorrectCount > rec.correctCount;
      if (isDue || needsReview) count++;
    }
    return count;
  }, [userProgress.itemStudyRecords, currentLevel]);

  const streakCount = userProgress.streak?.current || userProgress.gamification?.currentStreak || 0;
  const dailyXP = userProgress.gamification?.dailyXP || 0;
  const dailyGoalXP = userProgress.gamification?.dailyGoalXP || 20;
  const dailyGoalPercent = Math.min(100, Math.round((dailyXP / dailyGoalXP) * 100));

  const nextLessonForActiveSession = useMemo(() => {
    if (!activeLessonSession) return null;
    const idx = flatLessons.findIndex(l => l.id === activeLessonSession.lesson.id);
    if (idx >= 0 && idx + 1 < flatLessons.length) {
      return flatLessons[idx + 1];
    }
    return null;
  }, [activeLessonSession, flatLessons]);

  const handleToggleUnit = (unitId: string) => {
    triggerHapticFeedback('light');
    setExpandedUnitIds(prev => ({
      ...prev,
      [unitId]: !prev[unitId]
    }));
  };

  const handleJumpToUnit = (unitId: string) => {
    if (!unitId) return;
    triggerHapticFeedback('light');
    setExpandedUnitIds(prev => ({
      ...prev,
      [unitId]: true
    }));
    setTimeout(() => {
      const el = document.getElementById(`unit-anchor-${unitId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleStartFocusLesson = () => {
    if (!pathState.nextActiveLesson) return;
    triggerHapticFeedback('light');
    const st = pathState.lessonStatusMap[pathState.nextActiveLesson.id];
    setActiveLessonSession({
      lesson: pathState.nextActiveLesson,
      wasAlreadyCompleted: st === 'completed'
    });
  };

  const levelVocabCount = useMemo(
    () => (data.vocabulary || []).filter(v => v.jlptLevel === currentLevel).length,
    [data.vocabulary, currentLevel]
  );
  const levelKanjiCount = useMemo(
    () => (data.kanji || []).filter(k => k.jlptLevel === currentLevel).length,
    [data.kanji, currentLevel]
  );
  const levelGrammarCount = useMemo(
    () => (data.grammar || []).filter(g => g.jlptLevel === currentLevel).length,
    [data.grammar, currentLevel]
  );

  const primaryCtaLabel =
    pathState.completedCount === 0
      ? 'Эхний хичээлээ эхлэх'
      : pathState.completedCount < pathState.totalCount
      ? 'Үргэлжлүүлэн сурах'
      : 'Нэгдсэн сорил давтах';

  return (
    <div className="w-full space-y-5 sm:space-y-6 pb-8">
      {/* ========================================================= */}
      {/* 1. GUIDED HERO CARD ("What should I study now?")          */}
      {/* Syncs cleanly with Header JLPT Selector (no duplicate pills) */}
      {/* ========================================================= */}
      <section className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 text-xs font-extrabold text-stone-500 dark:text-stone-400">
              <span className="font-mono font-black text-[#CC0000] dark:text-[#FF6699]">
                JLPT {currentLevel}
              </span>
              <span>·</span>
              <span className="tabular-nums">
                {units.length} бүлэг · {pathState.completedCount}/{pathState.totalCount} хичээл ({pathState.progressPercent}%)
              </span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight leading-snug">
              {pathState.nextActiveUnit
                ? `Бүлэг ${pathState.nextActiveUnit.unitNumber}: ${pathState.nextActiveUnit.title}`
                : `JLPT ${currentLevel} Сургалтын Зам`}
            </h2>

            {pathState.nextActiveLesson && (
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 line-clamp-2">
                Дараагийн алхам: <strong className="text-stone-800 dark:text-stone-200">{pathState.nextActiveLesson.title}</strong> · {pathState.nextActiveLesson.estimatedMinutes || 5} мин · +{pathState.nextActiveLesson.xpReward} XP
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {pathState.nextActiveLesson && (
              <button
                type="button"
                onClick={handleStartFocusLesson}
                className="min-h-[48px] px-5 sm:px-6 py-3 rounded-2xl bg-gradient-to-r from-[#CC0000] via-[#FF0000] to-[#FF3366] text-white font-black text-sm sm:text-base shadow-lg shadow-red-500/25 hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current shrink-0" />
                <span>{primaryCtaLabel}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            )}

            {dueReviewCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback('light');
                  setActiveTab('practice');
                }}
                className="min-h-[48px] px-4 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-[#CC0000] dark:text-[#FF6699]" />
                <span>Давтах ({dueReviewCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Clean Progress Bar + Chapter Jump Selector for long paths (N1 has 36 units) */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#CC0000] to-[#FF3366] transition-all duration-500"
                style={{ width: `${pathState.progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-stone-500 dark:text-stone-400 tabular-nums shrink-0">
              {pathState.progressPercent}%
            </span>
          </div>

          {units.length > 1 && (
            <div className="flex items-center gap-2 shrink-0">
              <label
                htmlFor="path-chapter-jump"
                className="text-xs font-bold text-stone-500 dark:text-stone-400 whitespace-nowrap"
              >
                Бүлэг рүү очих:
              </label>
              <select
                id="path-chapter-jump"
                value={pathState.nextActiveUnit?.id || units[0]?.id || ''}
                onChange={e => handleJumpToUnit(e.target.value)}
                className="min-h-[38px] max-w-[210px] px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 cursor-pointer"
              >
                {units.map(u => {
                  const st = pathState.unitStatsMap[u.id];
                  const marker = st?.isCompleted ? '✓ ' : st?.hasActive ? '▶ ' : '';
                  return (
                    <option key={u.id} value={u.id}>
                      {marker}Бүлэг {u.unitNumber}: {u.title}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. RESPONSIVE ROADMAP LAYOUT                              */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CENTER ROADMAP: Collapsible Units + Sectioned Winding Nodes */}
        <main className="lg:col-span-8 w-full space-y-4">
          {units.map(unit => {
            const unitStats = pathState.unitStatsMap[unit.id] || {
              completedCount: 0,
              totalCount: unit.lessons.length,
              isCompleted: false,
              hasActive: false,
              progressPercent: 0
            };
            const isExpanded = Boolean(expandedUnitIds[unit.id]);
            const isUnitLocked = !unitStats.isCompleted && !unitStats.hasActive && unitStats.completedCount === 0;

            return (
              <section key={unit.id} className="w-full space-y-3">
                <UnitHeader
                  unit={unit}
                  completedCount={unitStats.completedCount}
                  totalCount={unitStats.totalCount}
                  isCurrentUnit={unitStats.hasActive}
                  isUnitCompleted={unitStats.isCompleted}
                  isUnitLocked={isUnitLocked}
                  isExpanded={isExpanded}
                  onToggleExpand={handleToggleUnit}
                  onOpenGuidebook={u => setGuidebookUnit(u)}
                />

                {isExpanded && (
                  <div className="relative w-full py-2 px-2 flex flex-col items-center overflow-hidden">
                    {unit.lessons.map((lesson, lessonIdx) => {
                      const status = pathState.lessonStatusMap[lesson.id] || 'locked';
                      const prevStatus =
                        lessonIdx > 0
                          ? pathState.lessonStatusMap[unit.lessons[lessonIdx - 1].id]
                          : undefined;

                      // Subtle section labels inside a unit transitioning between Completed -> Current -> Locked
                      const showCompletedBanner = lessonIdx === 0 && status === 'completed';
                      const showCurrentBanner = status === 'active' && lessonIdx > 0 && prevStatus === 'completed';
                      const showUpcomingBanner =
                        status === 'locked' &&
                        lessonIdx > 0 &&
                        (prevStatus === 'active' || prevStatus === 'completed');

                      return (
                        <React.Fragment key={lesson.id}>
                          {showCompletedBanner && (
                            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 my-1">
                              Дууссан хичээлүүд
                            </div>
                          )}
                          {showCurrentBanner && (
                            <div className="w-40 border-t border-stone-200 dark:border-stone-800 my-2 pt-2 text-center text-[11px] font-bold uppercase tracking-wider text-[#CC0000] dark:text-[#FF6699]">
                              Одоогийн алхам
                            </div>
                          )}
                          {showUpcomingBanner && (
                            <div className="w-40 border-t border-stone-200 dark:border-stone-800 my-2 pt-2 text-center text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                              Дараагийн шат
                            </div>
                          )}

                          <PathNode
                            lesson={lesson}
                            status={status}
                            index={lessonIdx}
                            totalInUnit={unit.lessons.length}
                            unitThemeColor={unit.themeColor}
                            onSelectLesson={(l, s) => setSelectedPathLesson({ lesson: l, status: s })}
                          />
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </main>

        {/* RIGHT SIDEBAR (Desktop): Daily Progress, Review & Library Shortcuts */}
        <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
          {/* Daily XP & Streak */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 fill-amber-500" />
                </div>
                <div>
                  <div className="text-lg font-black text-stone-900 dark:text-stone-100 tabular-nums">
                    {streakCount} өдөр
                  </div>
                  <div className="text-[11px] font-semibold text-stone-400">
                    Тасралтгүй суралцалт
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center justify-end gap-1 text-sm font-black text-stone-900 dark:text-stone-100 tabular-nums">
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>{dailyXP}/{dailyGoalXP} XP</span>
                </div>
                <div className="text-[11px] text-stone-400">Өдрийн зорилго</div>
              </div>
            </div>

            <div className="w-full h-2.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 transition-all duration-500"
                style={{ width: `${dailyGoalPercent}%` }}
              />
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              {dailyGoalPercent >= 100
                ? 'Өнөөдрийн зорилго биеллээ! Цуврал амжилттай хадгалагдлаа.'
                : `Өдрийн зорилгодоо хүрэхэд дахин ${Math.max(0, dailyGoalXP - dailyXP)} XP шаардлагатай.`}
            </p>
          </div>

          {/* Spaced Repetition Review Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-[#990000] to-[#CC0000] text-white space-y-3 shadow-lg shadow-red-950/20">
            <div className="space-y-1">
              <div className="text-[11px] font-black uppercase tracking-wider text-white/80">
                SRS Давтлага · {currentLevel}
              </div>
              <h4 className="text-base font-black">
                {dueReviewCount > 0
                  ? `Давтах ${dueReviewCount} агуулга бэлэн`
                  : 'Сурсан үгсээ бататгах'}
              </h4>
              <p className="text-xs text-white/85 leading-relaxed">
                Зам дээр хийсэн алдаа болон мартагдаж болзошгүй үгсийг ухаалаг системээр сэргээн давтаарай.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback('light');
                setActiveTab('practice');
              }}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-white text-[#990000] font-black text-xs hover:bg-stone-50 active:scale-98 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Давтлага эхлүүлэх</span>
            </button>
          </div>

          {/* Direct Library Reference Links */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 space-y-2">
            <div className="text-xs font-bold text-stone-500 dark:text-stone-400 px-1">
              Бие даасан сан ({currentLevel}):
            </div>
            <button
              type="button"
              onClick={() => {
                setLearnSubTab('vocab');
                setActiveTab('learn');
              }}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 hover:bg-red-50 dark:hover:bg-red-950/30 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center justify-between border border-stone-200/70 dark:border-stone-800 cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-2">
                <BookA className="w-4 h-4 text-[#CC0000]" />
                Үгийн сан ({levelVocabCount})
              </span>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </button>

            <button
              type="button"
              onClick={() => {
                setLearnSubTab('kanji');
                setActiveTab('learn');
              }}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 hover:bg-red-50 dark:hover:bg-red-950/30 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center justify-between border border-stone-200/70 dark:border-stone-800 cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Ханзны сан ({levelKanjiCount})
              </span>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </button>

            <button
              type="button"
              onClick={() => {
                setLearnSubTab('grammar');
                setActiveTab('learn');
              }}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 hover:bg-red-50 dark:hover:bg-red-950/30 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center justify-between border border-stone-200/70 dark:border-stone-800 cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-rose-500" />
                Дүрмийн сан ({levelGrammarCount})
              </span>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </button>
          </div>
        </aside>
      </div>

      {/* ========================================================= */}
      {/* 3. PORTALED LESSON INTRO SHEET (Never hidden behind nav)  */}
      {/* ========================================================= */}
      {selectedPathLesson &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label={selectedPathLesson.lesson.title}
          >
            <div
              className="fixed inset-0"
              onClick={() => setSelectedPathLesson(null)}
            />
            <div
              className="relative z-10 w-full sm:max-w-md bg-white dark:bg-[#181114] rounded-t-3xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl px-5 pt-5 sm:p-6 space-y-4 max-h-[82dvh] overflow-y-auto"
              style={{
                paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))'
              }}
            >
              {/* Drag / Header Metadata */}
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-100 dark:border-stone-800">
                <span className="text-xs font-black uppercase tracking-wider text-stone-600 dark:text-stone-300">
                  {selectedPathLesson.lesson.type === 'boss_challenge'
                    ? 'Бүлгийн Сорил'
                    : selectedPathLesson.lesson.type === 'review'
                    ? 'Дунд Давтлага'
                    : `Хичээл ${selectedPathLesson.lesson.lessonNumber}`}
                </span>

                <div className="flex items-center gap-3">
                  {selectedPathLesson.status === 'completed' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      Дууссан
                    </span>
                  ) : (
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                      +{selectedPathLesson.lesson.xpReward} XP
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedPathLesson(null)}
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                    aria-label="Хаах"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Compact Lesson Summary */}
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-stone-900 dark:text-stone-100 leading-snug">
                  {selectedPathLesson.lesson.title}
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                  {selectedPathLesson.lesson.description}
                </p>
              </div>

              {/* Compact Inline Metadata (Zero Pill Stacking) */}
              <div className="flex items-center flex-wrap gap-2 text-xs font-semibold text-stone-600 dark:text-stone-400 py-2.5 px-3.5 rounded-2xl bg-stone-50 dark:bg-stone-900/70 border border-stone-200/60 dark:border-stone-800">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#CC0000]" />
                  {selectedPathLesson.lesson.estimatedMinutes || 5} мин
                </span>
                <span>·</span>
                <span>{selectedPathLesson.lesson.totalExercises} дасгал</span>
                <span>·</span>
                <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                  JLPT {selectedPathLesson.lesson.jlptLevel}
                </span>
              </div>

              {/* Action Area */}
              {selectedPathLesson.status === 'locked' ? (
                <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800/80 text-center text-xs font-bold text-stone-500 dark:text-stone-400 flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4 shrink-0 text-stone-400" />
                  <span>Өмнөх хичээлийг дуусгаснаар энэ хичээл автоматаар нээгдэнэ.</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedPathLesson.lesson;
                    const wasDone = selectedPathLesson.status === 'completed';
                    setSelectedPathLesson(null);
                    setActiveLessonSession({ lesson: target, wasAlreadyCompleted: wasDone });
                  }}
                  className="w-full min-h-[50px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#CC0000] via-[#FF0000] to-[#FF3366] text-white font-black text-sm sm:text-base shadow-lg shadow-red-500/25 hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {selectedPathLesson.status === 'completed' ? (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Дахин давтах</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Хичээл эхлүүлэх</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================= */}
      {/* 4. PORTALED INTERACTIVE LESSON PLAYER MODAL               */}
      {/* ========================================================= */}
      {activeLessonSession && (
        <LessonPlayerModal
          lesson={activeLessonSession.lesson}
          wasAlreadyCompleted={activeLessonSession.wasAlreadyCompleted}
          nextLesson={nextLessonForActiveSession}
          onClose={() => setActiveLessonSession(null)}
          onLessonComplete={(id, xp, details) => {
            completeCurriculumLesson(id, xp, details);
          }}
          onStartNextLesson={next => {
            const st = pathState.lessonStatusMap[next.id];
            setActiveLessonSession({
              lesson: next,
              wasAlreadyCompleted: st === 'completed'
            });
          }}
          onPracticeMissed={missedIds => {
            setActiveLessonSession(null);
            setPracticeMissedItems(missedIds);
            setActiveTab('practice');
          }}
        />
      )}

      {/* ========================================================= */}
      {/* 5. PORTALED UNIT GUIDEBOOK MODAL                          */}
      {/* ========================================================= */}
      {guidebookUnit &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`Бүлэг ${guidebookUnit.unitNumber} хөтөч`}
          >
            <div className="fixed inset-0" onClick={() => setGuidebookUnit(null)} />
            <div
              className="relative z-10 w-full sm:max-w-2xl bg-white dark:bg-[#150F12] rounded-t-3xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[86dvh]"
            >
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-stone-100 dark:border-stone-800 shrink-0">
                <div className="min-w-0 pr-3">
                  <span className="text-[11px] font-black uppercase text-[#CC0000] dark:text-[#FF6699] tracking-wider block">
                    Бүлэг {guidebookUnit.unitNumber} · Хөтөч
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100 truncate">
                    {guidebookUnit.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setGuidebookUnit(null)}
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
                  aria-label="Хаах"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                  {guidebookUnit.mongolianDescription}
                </p>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-black uppercase text-stone-400 tracking-wider">
                    Энэ бүлэгт багтсан хичээлүүд ({guidebookUnit.lessons.length})
                  </h4>
                  <div className="space-y-2">
                    {guidebookUnit.lessons.map(l => {
                      const st = pathState.lessonStatusMap[l.id] || 'locked';
                      return (
                        <div
                          key={l.id}
                          className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-3"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="text-xs font-black text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                              {st === 'completed' && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              )}
                              <span className="truncate">{l.title}</span>
                            </div>
                            <div className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1">
                              {l.description}
                            </div>
                          </div>
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0 tabular-nums">
                            {st === 'completed' ? 'Дууссан' : `+${l.xpReward} XP`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div
                className="px-5 sm:px-6 pt-3 border-t border-stone-100 dark:border-stone-800 shrink-0 bg-white dark:bg-[#150F12]"
                style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
              >
                <button
                  type="button"
                  onClick={() => setGuidebookUnit(null)}
                  className="w-full min-h-[48px] py-3 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity"
                >
                  Хаах
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
