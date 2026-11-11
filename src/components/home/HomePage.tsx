import React, { useMemo, useEffect, useState } from 'react';
import {
  Compass,
  ArrowRight,
  TrendingUp,
  BookA,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Check,
  Flame,
  Star,
  Play,
  RotateCcw,
  Target,
  Search,
  MessagesSquare,
  AlertCircle,
  HelpCircle,
  Bot,
  Mic,
  PenTool,
  Volume2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { JLPTLevel, KanjiItem } from '../../types';
import { LevelBadge } from '../common/LevelBadge';
import { SunnyLogo } from '../common/SunnyLogo';
import { AudioButton } from '../common/AudioButton';
import { speechService, extractKanjiPronunciation, extractVocabPronunciation } from '../../services/speech';
import { ensureGamificationProgress, getTokyoDateString } from '../../services/gamificationEngine';
import { learningEngine } from '../../services/learningEngine';
import { InteractiveJapaneseSentence } from '../learn/InteractiveJapaneseSentence';
import { KanjiStrokeModal } from '../kanji/KanjiStrokeModal';
import { loadKanjiStrokeData } from '../../utils/kanjiVG';
import { getCleanVocabExplanation } from '../../utils/vocabUtils';

export const HomePage: React.FC = () => {
  const {
    data,
    setActiveTab,
    selectedLevel,
    setSelectedLevel,
    effectiveLevel,
    setLearnSubTab,
    setIsSearchOpen,
    userProgress,
    currentUser,
    isPublicBeta,
    setIsFeedbackModalOpen,
    setPracticeMissedItems
  } = useApp();

  // Gamification progress & today's date
  const gamification = useMemo(() => {
    return ensureGamificationProgress(userProgress).gamification!;
  }, [userProgress]);

  const streakDays = userProgress.streak?.current || gamification.currentStreak || 0;
  const todayXP = gamification.todayXp || 0;

  // Level content pool
  const levelVocab = useMemo(() => {
    return (data.vocabulary || []).filter(v => v.jlptLevel === effectiveLevel);
  }, [data.vocabulary, effectiveLevel]);

  const levelKanji = useMemo(() => {
    return (data.kanji || []).filter(k => k.jlptLevel === effectiveLevel);
  }, [data.kanji, effectiveLevel]);

  const levelGrammar = useMemo(() => {
    return (data.grammar || []).filter(g => g.jlptLevel === effectiveLevel);
  }, [data.grammar, effectiveLevel]);

  // Learned counts in current level
  const learnedVocabCount = useMemo(() => {
    const ids = new Set((userProgress.learnedVocabIds || []));
    return levelVocab.filter(v => ids.has(v.id)).length;
  }, [levelVocab, userProgress.learnedVocabIds]);

  const learnedKanjiCount = useMemo(() => {
    const ids = new Set((userProgress.learnedKanjiIds || []));
    return levelKanji.filter(k => ids.has(k.id)).length;
  }, [levelKanji, userProgress.learnedKanjiIds]);

  const learnedGrammarCount = useMemo(() => {
    const ids = new Set((userProgress.learnedGrammarIds || []));
    return levelGrammar.filter(g => ids.has(g.id)).length;
  }, [levelGrammar, userProgress.learnedGrammarIds]);

  const totalLevelItems = levelVocab.length + levelKanji.length + levelGrammar.length;
  const totalLevelLearned = learnedVocabCount + learnedKanjiCount + learnedGrammarCount;
  const totalGlobalLearned = (userProgress.learnedVocabIds?.length || 0) +
    (userProgress.learnedKanjiIds?.length || 0) +
    (userProgress.learnedGrammarIds?.length || 0);

  // Due SRS Reviews calculation
  const dueReviews = useMemo(() => {
    const records = userProgress.itemStudyRecords || {};
    const now = Date.now();
    let count = 0;
    for (const id in records) {
      const rec = records[id];
      if (rec && rec.nextReviewDate && new Date(rec.nextReviewDate).getTime() <= now) {
        count++;
      }
    }
    return count;
  }, [userProgress.itemStudyRecords]);

  // Daily Missions status
  const missions = gamification.dailyMissions || [];
  const completedMissionsCount = missions.filter(m => m.completed).length;

  // Weak/missed items from quizzes & practice
  const missedItemIds = useMemo(() => {
    const weakVocab = (userProgress.quizMistakes || []).filter(m => m.jlptLevel === effectiveLevel);
    const studyRecords = userProgress.itemStudyRecords || {};
    const reviewNeeded = Object.keys(studyRecords).filter(id => {
      const r = studyRecords[id];
      return r && (r.masteryStatus === 'review_needed' || r.incorrectCount > 0);
    });
    return Array.from(new Set([...weakVocab.map(v => v.questionId), ...reviewNeeded]));
  }, [userProgress.quizMistakes, userProgress.itemStudyRecords, effectiveLevel]);

  // Word of the day based on level
  const vocabOfTheDay = useMemo(() => {
    if (levelVocab.length === 0) return null;
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
    );
    return levelVocab[dayOfYear % levelVocab.length];
  }, [levelVocab]);

  // Kanji of the day based on level
  const kanjiOfTheDay = useMemo(() => {
    if (levelKanji.length === 0) return null;
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
    );
    return levelKanji[(dayOfYear + 3) % levelKanji.length];
  }, [levelKanji]);

  // Interactive stroke modal & stroke count for Kanji of the Day
  const [selectedStrokeKanji, setSelectedStrokeKanji] = useState<KanjiItem | null>(null);
  const [dailyKanjiStrokes, setDailyKanjiStrokes] = useState<number | null>(null);

  useEffect(() => {
    if (!kanjiOfTheDay) {
      setDailyKanjiStrokes(null);
      return;
    }
    let isCancelled = false;
    loadKanjiStrokeData(kanjiOfTheDay.kanji).then(data => {
      if (!isCancelled && data) {
        setDailyKanjiStrokes(data.strokeCount);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [kanjiOfTheDay]);

  // Audio prefetch
  useEffect(() => {
    if (vocabOfTheDay) {
      const vp = extractVocabPronunciation(vocabOfTheDay);
      speechService.prefetch(vp.text, vp.reading);
    }
    if (kanjiOfTheDay) {
      const kp = extractKanjiPronunciation(kanjiOfTheDay);
      speechService.prefetch(kp.text, kp.reading);
    }
  }, [vocabOfTheDay, kanjiOfTheDay]);

  // SMART CONTINUE LEARNING ACTION (Phase 6.1)
  const handleSmartContinue = () => {
    // 1. If due SRS reviews exist, prioritize review
    if (dueReviews > 0) {
      setLearnSubTab('vocab');
      setActiveTab('learn');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 2. If user studied recently, resume that subTab
    if (userProgress.lastStudied?.subTab) {
      setLearnSubTab(userProgress.lastStudied.subTab);
      setActiveTab('learn');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 3. Default to the Learning Path
    setLearnSubTab('path');
    setActiveTab('learn');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShortcutClick = (subTab: 'vocab' | 'kanji' | 'grammar') => {
    setLearnSubTab(subTab);
    setActiveTab('learn');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePracticeMissed = () => {
    if (missedItemIds.length > 0) {
      setPracticeMissedItems(missedItemIds);
      setActiveTab('practice');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in pb-safe">
      {/* COMPACT PUBLIC BETA STRIP */}
      {isPublicBeta && (
        <section className="rounded-xl sm:rounded-2xl bg-stone-900 border border-stone-800 px-3.5 sm:px-5 py-2.5 shadow-xs flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-[#FF6699] text-[10px] font-black uppercase tracking-wider shrink-0 border border-red-500/30">
              PUBLIC BETA
            </span>
            <span className="text-stone-300 text-xs sm:text-sm font-medium truncate">
              SunnyLearn 2.0 нээлттэй туршилт явагдаж байна (JLPT N5–N1 бүх хичээл нээлттэй)
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsFeedbackModalOpen(true)}
            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-stone-200 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <MessagesSquare className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">Санал хүсэлт</span>
          </button>
        </section>
      )}

      {/* ========================================================= */}
      {/* 1. HERO DASHBOARD: Welcome, Primary CTA & Quick Search    */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#1E0E13] via-[#2A121A] to-[#160B0E] text-white p-5 sm:p-8 md:p-10 shadow-xl border border-red-500/20">
        <div className="relative z-10 max-w-3xl space-y-4 sm:space-y-5">
          {/* Welcome Tag & JLPT Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-[#FF6699] text-xs font-extrabold">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>JLPT {effectiveLevel} Түвшин</span>
            </div>
            {currentUser && (
              <span className="text-xs text-stone-400 font-medium">
                • {currentUser.name}
              </span>
            )}
          </div>

          {/* Heading: Minimal, Warm Greeting */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
              Сайн уу! Өнөөдөр япон хэлээ үргэлжлүүлцгээе.
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
              Таны сонгосон JLPT {effectiveLevel} түвшний үгийн сан, ханз, дүрмийн агуулга бэлэн байна.
            </p>
          </div>

          {/* ONE PRIMARY ACTION: "Үргэлжлүүлэн сурах →" */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={handleSmartContinue}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#CC0000] via-[#FF0000] to-[#FF3366] hover:opacity-95 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-500/25 active:scale-98 transition-all"
            >
              <Play className="w-4 h-4 fill-white shrink-0" />
              <span>{totalGlobalLearned > 0 ? 'Үргэлжлүүлэн сурах' : 'Суралцаж эхлэх'}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            {/* Quick Dictionary Search trigger */}
            <div
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl px-4 py-3 cursor-pointer transition-all text-stone-300 text-xs sm:text-sm font-medium"
            >
              <Search className="w-4 h-4 text-red-400 shrink-0" />
              <span className="truncate">Япон үг, ханз хайх...</span>
            </div>
          </div>
        </div>

        {/* Mascot in Hero Card */}
        <div className="hidden md:flex absolute top-8 right-8 z-10 items-center justify-center">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl border border-white/20 bg-transparent">
            <SunnyLogo className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. TODAY'S LEARNING SUMMARY (Phase 2.3 C)                */}
      {/* Compact indicators: Mission, Due Reviews, XP, Streak      */}
      {/* ========================================================= */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Goal */}
        <div
          onClick={() => setActiveTab('progress')}
          className="p-4 rounded-2xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 shadow-2xs hover:border-red-400 transition-all cursor-pointer space-y-1"
        >
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Өдрийн зорилго</span>
            <Target className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100">
            {completedMissionsCount} / {Math.max(3, missions.length)}
          </div>
          <span className="text-[11px] text-stone-400">даалгавар биелсэн</span>
        </div>

        {/* Due Reviews */}
        <div
          onClick={() => {
            setLearnSubTab('vocab');
            setActiveTab('learn');
          }}
          className="p-4 rounded-2xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 shadow-2xs hover:border-red-400 transition-all cursor-pointer space-y-1"
        >
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Давтах карт (SRS)</span>
            <RotateCcw className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100">
            {dueReviews}
          </div>
          <span className="text-[11px] text-stone-400">
            {dueReviews > 0 ? 'давтлага хийх шаардлагатай' : 'давтах агуулга алга'}
          </span>
        </div>

        {/* Daily XP */}
        <div
          onClick={() => setActiveTab('progress')}
          className="p-4 rounded-2xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 shadow-2xs hover:border-red-400 transition-all cursor-pointer space-y-1"
        >
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Өдрийн оноо</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100">
            {todayXP} <span className="text-xs font-bold text-stone-400 font-sans">XP</span>
          </div>
          <span className="text-[11px] text-stone-400">өнөөдөр цуглуулсан</span>
        </div>

        {/* Current Streak */}
        <div
          onClick={() => setActiveTab('progress')}
          className="p-4 rounded-2xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 shadow-2xs hover:border-red-400 transition-all cursor-pointer space-y-1"
        >
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Тасралтгүй суралцсан</span>
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-orange-600 dark:text-orange-400">
            {streakDays} <span className="text-xs font-bold text-stone-500 font-sans">өдөр</span>
          </div>
          <span className="text-[11px] text-stone-400">бодит дасгалаар тооцогдоно</span>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. THREE COMPACT LEARNING SHORTCUTS (Phase 2.3 D)         */}
      {/* Үгийн сан | Ханз | Дүрэм                                   */}
      {/* ========================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-stone-800 dark:text-stone-200">
            JLPT {effectiveLevel} Хичээлүүд
          </h2>
          <span className="text-xs font-bold text-stone-400">
            Нийт {totalLevelLearned} / {totalLevelItems} сурсан
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          {/* 1. Үгийн сан */}
          <div
            onClick={() => handleShortcutClick('vocab')}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 hover:border-[#CC0000] dark:hover:border-[#FF3366] shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-[#CC0000] dark:text-[#FF6699] flex items-center justify-center font-bold">
                  <BookA className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-bold text-stone-400">
                  {learnedVocabCount} / {levelVocab.length}
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100 group-hover:text-[#CC0000] dark:group-hover:text-[#FF6699] transition-colors">
                  Үгийн сан
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  JLPT {effectiveLevel} түвшний үгс, уншлага, жишээ өгүүлбэр
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5 pt-2 border-t border-stone-100 dark:border-stone-800/80">
              <div className="w-full h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#CC0000] to-[#FF3366] transition-all duration-300"
                  style={{
                    width: `${Math.round((learnedVocabCount / Math.max(1, levelVocab.length)) * 100)}%`
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-stone-400">
                <span>{Math.round((learnedVocabCount / Math.max(1, levelVocab.length)) * 100)}%</span>
                <span className="text-[#CC0000] dark:text-[#FF6699] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  Нээх →
                </span>
              </div>
            </div>
          </div>

          {/* 2. Ханз */}
          <div
            onClick={() => handleShortcutClick('kanji')}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 hover:border-[#CC0000] dark:hover:border-[#FF3366] shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-bold text-stone-400">
                  {learnedKanjiCount} / {levelKanji.length}
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100 group-hover:text-[#CC0000] dark:group-hover:text-[#FF6699] transition-colors">
                  Ханз
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Зурлагын дараалал, оныонми, күнъёми уншлага, холбоо үгс
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5 pt-2 border-t border-stone-100 dark:border-stone-800/80">
              <div className="w-full h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
                  style={{
                    width: `${Math.round((learnedKanjiCount / Math.max(1, levelKanji.length)) * 100)}%`
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-stone-400">
                <span>{Math.round((learnedKanjiCount / Math.max(1, levelKanji.length)) * 100)}%</span>
                <span className="text-orange-600 dark:text-orange-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  Нээх →
                </span>
              </div>
            </div>
          </div>

          {/* 3. Дүрэм */}
          <div
            onClick={() => handleShortcutClick('grammar')}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 hover:border-[#CC0000] dark:hover:border-[#FF3366] shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-bold text-stone-400">
                  {learnedGrammarCount} / {levelGrammar.length}
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100 group-hover:text-[#CC0000] dark:group-hover:text-[#FF6699] transition-colors">
                  Дүрэм
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Бүтэц, холболтын дүрэм, бодит амьдралын жишээ өгүүлбэрүүд
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5 pt-2 border-t border-stone-100 dark:border-stone-800/80">
              <div className="w-full h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                  style={{
                    width: `${Math.round((learnedGrammarCount / Math.max(1, levelGrammar.length)) * 100)}%`
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-stone-400">
                <span>{Math.round((learnedGrammarCount / Math.max(1, levelGrammar.length)) * 100)}%</span>
                <span className="text-blue-600 dark:text-blue-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  Нээх →
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* AI EXPERIENCES SECTION (Phase 7)                          */}
      {/* 1. Sunny AI (Tutor), 2. AI Roleplay, 3. Free Conversation */}
      {/* ========================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-stone-800 dark:text-stone-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-red-500 fill-red-500" />
            <span>Хиймэл оюуны туслахууд</span>
          </h2>
          <span className="text-xs text-stone-400">24/7 япон хэлний дадлага</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Card 1: Sunny AI Tutor */}
          <div
            onClick={() => {
              setActiveTab('ai');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 hover:border-[#CC0000] dark:hover:border-[#FF3366] shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-[#CC0000] dark:text-[#FF6699] flex items-center justify-center font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100 group-hover:text-[#CC0000] dark:group-hover:text-[#FF6699] transition-colors">
                  Sunny AI Багш
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                  Япон хэлний үг, дүрмийн нарийн ялгаа, сорилын алдааг монголоор задлан тайлбарлана.
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs font-bold text-[#CC0000] dark:text-[#FF6699]">
              <span>Асуулт асуух</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 2: AI Roleplay */}
          <div
            onClick={() => {
              setActiveTab('roleplay');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 hover:border-orange-500 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                <MessagesSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  AI Roleplay
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                  Конбини, ресторан, ярилцлага зэрэг бодит нөхцөлд дүрд хувиран японоор ярилцана.
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs font-bold text-orange-600 dark:text-orange-400">
              <span>Дүрд тоглох</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 3: Free Voice Conversation */}
          <div
            onClick={() => {
              setActiveTab('roleplay');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 hover:border-emerald-500 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Чөлөөт дуут яриа
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                  Sunny-тай ямар нэг сэдэв сонгохгүйгээр өдөр тутмын чөлөөтэй дуут харилцан яриа өрнүүлнэ.
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span>Дуугаар ярих</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. OPTIONAL PERSONALIZED ERROR REVIEW (Phase 6.4)         */}
      {/* Rendered only if user has mistakes in quiz/practice       */}
      {/* ========================================================= */}
      {missedItemIds.length > 0 && (
        <section className="p-4 sm:p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-stone-900 dark:text-stone-100 text-sm">
                Алдаагаа бататгах: Танд давтах {missedItemIds.length} асуулт байна.
              </p>
              <p className="text-stone-600 dark:text-stone-400 mt-0.5">
                Өмнө нь буруу хариулсан асуултуудаа дахин ажиллаж, Sunny AI-аас дүрмийн тайлбар аваарай.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePracticeMissed}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span>Алдаагаа давтах</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>
      )}

      {/* ========================================================= */}
      {/* 5. DAILY FEATURED HIGHLIGHTS (Word & Kanji of the Day)    */}
      {/* Clean, compact, NO inner scrollbars                       */}
      {/* ========================================================= */}
      {(vocabOfTheDay || kanjiOfTheDay) && (
        <section className="space-y-3">
          <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-stone-800 dark:text-stone-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Өдрийн онцлох үг & ханз (JLPT {effectiveLevel})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {/* Word of the day */}
            {vocabOfTheDay && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3.5">
                {/* Header row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider">
                      Өдрийн үг
                    </span>
                    <LevelBadge level={vocabOfTheDay.jlptLevel} size="xs" />
                    {vocabOfTheDay.partOfSpeech && (
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-[10px] font-bold">
                        {vocabOfTheDay.partOfSpeech}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <AudioButton
                      text={vocabOfTheDay.japanese}
                      reading={vocabOfTheDay.reading}
                      id={`home_daily_vocab_${vocabOfTheDay.id}`}
                      size="xs"
                    />
                  </div>
                </div>

                {/* Main word display */}
                <div className="space-y-1">
                  <div className="flex items-baseline flex-wrap gap-2">
                    <span className="text-2xl sm:text-3xl font-black font-jp text-stone-900 dark:text-stone-100">
                      {vocabOfTheDay.japanese}
                    </span>
                    {vocabOfTheDay.reading && (
                      <span className="text-sm font-mono text-stone-400 font-jp">
                        【{vocabOfTheDay.reading}】
                      </span>
                    )}
                  </div>
                  <p className="text-base font-extrabold text-[#CC0000] dark:text-[#FF6699]">
                    {vocabOfTheDay.mongolian}
                  </p>
                  {(() => {
                    const cleanExp = getCleanVocabExplanation(
                      vocabOfTheDay.explanation,
                      vocabOfTheDay.mongolian,
                      vocabOfTheDay.partOfSpeech
                    );
                    return cleanExp ? (
                      <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed pt-0.5">
                        {cleanExp}
                      </p>
                    ) : null;
                  })()}
                </div>

                {/* Interactive example sentence with Mongolian translation */}
                {vocabOfTheDay.exampleSentence && (
                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/70 dark:border-stone-800 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase text-stone-400 tracking-wider">
                      <span>Жишээ өгүүлбэр</span>
                      <span className="text-stone-400/80 normal-case font-normal text-[10px]">
                        (Ханзан дээр дарж толь бичиг, зурлага харах)
                      </span>
                    </div>
                    <InteractiveJapaneseSentence
                      sentence={vocabOfTheDay.exampleSentence}
                      reading={vocabOfTheDay.exampleReading}
                      mongolian={vocabOfTheDay.exampleMongolian}
                      className="text-sm font-jp leading-relaxed"
                    />
                    {vocabOfTheDay.exampleMongolian && (
                      <div className="text-xs text-stone-600 dark:text-stone-300 font-medium pt-1.5 border-t border-stone-200/50 dark:border-stone-800/80 leading-relaxed">
                        {vocabOfTheDay.exampleMongolian}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Action */}
                <button
                  type="button"
                  onClick={() => {
                    setLearnSubTab('vocab');
                    setActiveTab('learn');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-auto"
                >
                  <span>Бүх үгс үзэх (JLPT {effectiveLevel})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Kanji of the day */}
            {kanjiOfTheDay && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3.5">
                {/* Header row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider">
                      Өдрийн ханз
                    </span>
                    <LevelBadge level={kanjiOfTheDay.jlptLevel} size="xs" />
                    {dailyKanjiStrokes && (
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-[10px] font-mono font-bold">
                        {dailyKanjiStrokes} зурлага
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {(() => {
                      const kp = extractKanjiPronunciation(kanjiOfTheDay);
                      return (
                        <AudioButton
                          text={kp.text}
                          reading={kp.reading}
                          id={`home_daily_kanji_${kanjiOfTheDay.id}`}
                          size="xs"
                        />
                      );
                    })()}
                  </div>
                </div>

                {/* Main Kanji box & Onyomi / Kunyomi */}
                <div className="flex items-start gap-3.5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/30 dark:to-stone-900 border border-red-100 dark:border-red-900/30 flex items-center justify-center shrink-0 shadow-inner">
                    <span className="text-4xl sm:text-5xl font-black font-jp text-stone-900 dark:text-stone-100">
                      {kanjiOfTheDay.kanji}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="text-base sm:text-lg font-black text-[#CC0000] dark:text-[#FF6699]">
                      {kanjiOfTheDay.mongolian}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-xs pt-0.5">
                      <div className="p-1.5 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                        <span className="text-[10px] font-bold text-stone-400 block uppercase tracking-wider">
                          Оньёми (音):
                        </span>
                        <span className="font-bold font-jp text-stone-800 dark:text-stone-200 truncate block mt-0.5">
                          {kanjiOfTheDay.onyomi?.trim() ? kanjiOfTheDay.onyomi : '—'}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                        <span className="text-[10px] font-bold text-stone-400 block uppercase tracking-wider">
                          Күньёми (訓):
                        </span>
                        <span className="font-bold font-jp text-stone-800 dark:text-stone-200 truncate block mt-0.5">
                          {kanjiOfTheDay.kunyomi?.trim() ? kanjiOfTheDay.kunyomi : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Relevant example compound words */}
                {kanjiOfTheDay.exampleWords && kanjiOfTheDay.exampleWords.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider block">
                      Холбоо үгс:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {kanjiOfTheDay.exampleWords.slice(0, 2).map((ex, exIdx) => (
                        <div
                          key={exIdx}
                          className="p-1.5 px-2 rounded-lg bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800/80 text-xs flex items-center justify-between gap-1"
                        >
                          <div className="min-w-0 truncate">
                            <span className="font-bold text-stone-900 dark:text-stone-100 font-jp">{ex.word}</span>{' '}
                            <span className="text-stone-400 font-jp text-[11px]">【{ex.reading}】</span>
                            <span className="text-stone-500 dark:text-stone-400 text-[11px] block truncate">
                              {ex.mongolian}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => speechService.play(ex.word, { reading: ex.reading })}
                            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer shrink-0"
                            title="Дуудлага сонсох"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Controls: Stroke order modal & browse all */}
                <div className="space-y-1.5 pt-1 mt-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedStrokeKanji(kanjiOfTheDay)}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Зурлагын дараалал үзэх (書き順)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLearnSubTab('kanji');
                      setActiveTab('learn');
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Бүх ханз үзэх (JLPT {effectiveLevel})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 6. LEARNING PATH TEASER (Secondary to Continue action)    */}
      {/* ========================================================= */}
      <section className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#CC0000] to-[#FF3366] text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-500/20">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
              Интерактив Сургалтын Зам 2.0
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Тоглоомжуулсан шат дараалсан интерактив замаар түвшингөө ахиулаарай.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setLearnSubTab('path');
            setActiveTab('learn');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <span>Замаа харах</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      {/* Interactive Stroke Order Modal for Daily Featured Kanji */}
      <KanjiStrokeModal
        isOpen={!!selectedStrokeKanji}
        onClose={() => setSelectedStrokeKanji(null)}
        kanjiItem={selectedStrokeKanji}
      />
    </div>
  );
};
