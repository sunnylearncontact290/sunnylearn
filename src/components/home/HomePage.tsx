import React, { useMemo, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  Search,
  ArrowRight,
  TrendingUp,
  BookA,
  CheckCircle2,
  Check,
  Star,
  Compass,
  Play,
  X,
  ShieldCheck,
  RotateCcw,
  Layers,
  HelpCircle,
  CheckSquare,
  Target,
  MessagesSquare
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { JLPTLevel } from '../../types';
import { LevelBadge } from '../common/LevelBadge';
import { SunnyLogo } from '../common/SunnyLogo';
import { AudioButton } from '../common/AudioButton';
import { speechService, extractKanjiPronunciation, extractVocabPronunciation } from '../../services/speech';
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
    toggleFavorite,
    currentUser,
    setIsAuthModalOpen,
    isBannerDismissed,
    dismissBanner
  } = useApp();

  const scrollToLevelSelection = () => {
    const el = document.getElementById('level-selection');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStartLearning = (level: JLPTLevel) => {
    setSelectedLevel(level);
    setLearnSubTab('vocab');
    setActiveTab('learn');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubTabSelect = (level: JLPTLevel, subTab: 'vocab' | 'kanji' | 'grammar') => {
    setSelectedLevel(level);
    setLearnSubTab(subTab);
    setActiveTab('learn');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filtered lists based on selected level
  const filteredVocabList = useMemo(() => {
    if (!selectedLevel) return [];
    return (data.vocabulary || []).filter(v => v.jlptLevel === selectedLevel);
  }, [data.vocabulary, selectedLevel]);

  const filteredKanjiList = useMemo(() => {
    if (!selectedLevel) return [];
    return (data.kanji || []).filter(k => k.jlptLevel === selectedLevel);
  }, [data.kanji, selectedLevel]);

  // Word of the day based on selected level
  const vocabOfTheDay = useMemo(() => {
    if (!selectedLevel || filteredVocabList.length === 0) return null;
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
    );
    return filteredVocabList[dayOfYear % filteredVocabList.length];
  }, [filteredVocabList, selectedLevel]);

  // Kanji of the day based on selected level
  const kanjiOfTheDay = useMemo(() => {
    if (!selectedLevel || filteredKanjiList.length === 0) return null;
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
    );
    return filteredKanjiList[(dayOfYear + 2) % filteredKanjiList.length];
  }, [filteredKanjiList, selectedLevel]);

  // Prefetch audio for Daily Highlights so clicking plays in 0ms!
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

  // Total content statistics across ALL JLPT levels (N5 + N4 + N3 + N2 + N1)
  const totalContentStats = useMemo(() => {
    const levels: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
    let totalVocab = 0;
    let totalKanji = 0;
    let totalGrammar = 0;

    if (data.counts) {
      levels.forEach(lvl => {
        const c = data.counts?.[lvl];
        if (c) {
          totalVocab += c.totalVocab || 0;
          totalKanji += c.totalKanji || 0;
          totalGrammar += c.totalGrammar || 0;
        }
      });
    }

    if (totalVocab > 0 || totalKanji > 0 || totalGrammar > 0) {
      return { totalVocab, totalKanji, totalGrammar };
    }

    return {
      totalVocab: (data.vocabulary || []).length,
      totalKanji: (data.kanji || []).length,
      totalGrammar: (data.grammar || []).length
    };
  }, [data.counts, data.vocabulary, data.kanji, data.grammar]);

  // Level configuration items
  const levelConfigs: { level: JLPTLevel; title: string; desc: string; count: string; color: string; ringColor: string }[] = useMemo(() => {
    const getCounts = (lvl: JLPTLevel) => {
      const countDetails = data.counts?.[lvl];
      if (countDetails) {
        return `Үгийн сан ${countDetails.totalVocab} • Ханз ${countDetails.totalKanji} • Дүрэм ${countDetails.totalGrammar}`;
      }
      const vocabCount = (data.vocabulary || []).filter(v => v.jlptLevel === lvl).length;
      const kanjiCount = (data.kanji || []).filter(k => k.jlptLevel === lvl).length;
      const grammarCount = (data.grammar || []).filter(g => g.jlptLevel === lvl).length;
      return `Үгийн сан ${vocabCount} • Ханз ${kanjiCount} • Дүрэм ${grammarCount}`;
    };

    return [
      {
        level: 'N5',
        title: 'Анхан шат 1',
        desc: 'Хирагана, Катакана, өдөр тутмын суурь мэндчилгээ, үндсэн үгс',
        count: getCounts('N5'),
        color: 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20',
        ringColor: 'ring-emerald-500'
      },
      {
        level: 'N4',
        title: 'Анхан шат 2',
        desc: 'Өдөр тутмын энгийн яриа, харилцан яриа ба дүрмийн залгаварууд',
        count: getCounts('N4'),
        color: 'border-sky-300 dark:border-sky-800 bg-sky-50/40 dark:bg-sky-950/20',
        ringColor: 'ring-sky-500'
      },
      {
        level: 'N3',
        title: 'Дунд шат',
        desc: 'Бодит нөхцөл байдалд ашиглах харилцаа, мэдээ нийтлэл ойлгох',
        count: getCounts('N3'),
        color: 'border-orange-300 dark:border-orange-800 bg-orange-50/40 dark:bg-orange-950/20',
        ringColor: 'ring-orange-500'
      },
      {
        level: 'N2',
        title: 'Ахисан шат',
        desc: 'Бизнес, их сургууль, сонин нийтлэл унших гүнзгий чадвар',
        count: getCounts('N2'),
        color: 'border-orange-300 dark:border-orange-800 bg-orange-50/40 dark:bg-orange-950/20',
        ringColor: 'ring-orange-500'
      },
      {
        level: 'N1',
        title: 'Мэргэжлийн шат',
        desc: 'Гүнзгий логик сэтгэлгээ, шинжлэх ухаан, уран зохиол, дээд түвшин',
        count: getCounts('N1'),
        color: 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20',
        ringColor: 'ring-rose-500'
      }
    ];
  }, [data.vocabulary, data.kanji, data.grammar]);

  // Overall and Level-specific user statistics
  const totalLearnedVocab = (userProgress.learnedVocabIds || []).length;
  const totalLearnedKanji = (userProgress.learnedKanjiIds || []).length;
  const totalLearnedGrammar = (userProgress.learnedGrammarIds || []).length;
  const totalItemsLearned = totalLearnedVocab + totalLearnedKanji + totalLearnedGrammar;

  const levelLearnedVocab = useMemo(() => {
    if (!selectedLevel) return totalLearnedVocab;
    const levelVocabIds = new Set((data.vocabulary || []).filter(v => v.jlptLevel === selectedLevel).map(v => v.id));
    return (userProgress.learnedVocabIds || []).filter(id => levelVocabIds.has(id)).length;
  }, [data.vocabulary, selectedLevel, userProgress.learnedVocabIds, totalLearnedVocab]);

  const levelLearnedKanji = useMemo(() => {
    if (!selectedLevel) return totalLearnedKanji;
    const levelKanjiIds = new Set((data.kanji || []).filter(k => k.jlptLevel === selectedLevel).map(k => k.id));
    return (userProgress.learnedKanjiIds || []).filter(id => levelKanjiIds.has(id)).length;
  }, [data.kanji, selectedLevel, userProgress.learnedKanjiIds, totalLearnedKanji]);

  const levelLearnedGrammar = useMemo(() => {
    if (!selectedLevel) return totalLearnedGrammar;
    const levelGrammarIds = new Set((data.grammar || []).filter(g => g.jlptLevel === selectedLevel).map(g => g.id));
    return (userProgress.learnedGrammarIds || []).filter(id => levelGrammarIds.has(id)).length;
  }, [data.grammar, selectedLevel, userProgress.learnedGrammarIds, totalLearnedGrammar]);

  const streakDays = userProgress.streak?.current || 0;

  // Last studied resume action
  const handleResumeStudy = () => {
    if (userProgress.lastStudied) {
      if (userProgress.lastStudied.level) {
        setSelectedLevel(userProgress.lastStudied.level);
      }
      setLearnSubTab(userProgress.lastStudied.subTab || 'vocab');
    } else {
      if (selectedLevel) {
        setLearnSubTab('vocab');
      } else {
        setSelectedLevel('N5');
        setLearnSubTab('vocab');
      }
    }
    setActiveTab('learn');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-8 sm:space-y-12 animate-fade-in">
      {/* 1. HERO INTRODUCTION */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-red-950 text-white p-5 sm:p-8 md:p-12 shadow-2xl border border-stone-800">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 sm:w-96 h-72 sm:h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* SunnyLearn Mascot Logo in Hero */}
        <div className="hidden lg:flex absolute top-10 right-10 z-10 items-center justify-center">
          <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 bg-transparent hover:scale-105 transition-transform">
            <SunnyLogo className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="relative z-10 max-w-3xl space-y-5 sm:space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold backdrop-blur-md">
              <div className="w-4 h-4 rounded-full overflow-hidden shrink-0">
                <SunnyLogo className="w-full h-full object-cover" />
              </div>
              <span>SunnyLearn Платформ</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Монгол хэлээр бүрэн орчуулга ба тайлбартай</span>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight break-words">
              SunnyLearn — Япон хэлийг Монголоор сурах платформ
            </h1>
            <p className="text-stone-300 text-xs sm:text-base leading-relaxed max-w-2xl">
              JLPT N5–N1 түвшний үгийн сан, ханз, дүрмийг монгол тайлбартай суралцаарай.
            </p>
          </div>

          {/* Action buttons inside Hero */}
          <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <button
              onClick={scrollToLevelSelection}
              id="hero-start-btn"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <span>Суралцаж эхлэх</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            <div
              onClick={() => setIsSearchOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2.5 bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 cursor-pointer transition-all text-stone-300 text-xs sm:text-sm font-medium"
            >
              <Search className="w-4 h-4 text-red-400 shrink-0" />
              <span className="truncate">Япон үг, ханз, дүрэм хайх...</span>
            </div>
          </div>

          {/* Quick Stats Banner */}
          <div className="pt-2 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-stone-300">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{totalContentStats.totalVocab} Үгийн сан</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-sky-400" />
              <span>{totalContentStats.totalKanji} Ханз</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span>{totalContentStats.totalGrammar} Дүрэм</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. JLPT LEVEL SELECTION (PLACED FIRST ON TOP) */}
      <section id="level-selection" className="space-y-5 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100">
                JLPT Түвшин сонгох
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
              {selectedLevel ? (
                <>
                  Та одоогоор <span className="font-bold text-red-600 dark:text-red-400">JLPT {selectedLevel}</span> түвшнийг сонгосон байна. Түвшингээ хүссэн үедээ солих боломжтой.
                </>
              ) : (
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  Сурах түвшнээ сонгоорой. Танд тохирох түвшний дагуу агуулгууд харагдана.
                </span>
              )}
            </p>
          </div>

          {selectedLevel && (
            <div className="inline-flex items-center gap-2 self-start sm:self-center px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 text-xs font-bold">
              <Check className="w-3.5 h-3.5" />
              <span>Сонгосон: JLPT {selectedLevel}</span>
            </div>
          )}
        </div>

        {/* Level Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {levelConfigs.map(item => {
            const isSelected = selectedLevel === item.level;
            return (
              <div
                key={item.level}
                onClick={() => setSelectedLevel(item.level)}
                className={`relative p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? `bg-white dark:bg-stone-900 border-red-500 dark:border-red-500 ring-2 ring-red-500/80 shadow-lg shadow-red-500/10 scale-[1.01] sm:scale-[1.02]`
                    : `bg-white dark:bg-stone-900 ${item.color} border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 shadow-sm hover:shadow-md`
                }`}
              >
                {/* Selection indicator pill */}
                {isSelected && (
                  <div className="absolute -top-2.5 right-3.5 sm:right-4 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-extrabold shadow-sm flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Сонгосон</span>
                  </div>
                )}

                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <LevelBadge level={item.level} size="lg" />
                    <span className="text-[11px] font-bold text-stone-400">
                      JLPT
                    </span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                      {item.title}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 sm:mt-1.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 pt-1">
                    {item.count}
                  </div>
                </div>

                {/* Bottom action button */}
                <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartLearning(item.level);
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    <span>Суралцах</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. USER LEARNING PROGRESS (PLACED BELOW LEVEL SELECTION) */}
      <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
                Таны сургалтын явц
              </h2>
              {selectedLevel && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold">
                  JLPT {selectedLevel}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              {selectedLevel
                ? `JLPT ${selectedLevel} түвшинд суралцсан явц болон нийт үзүүлэлт.`
                : 'Түвшингээ сонгосноор тухайн түвшний явц нарийвчлан тооцогдоно.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {totalItemsLearned > 0 && (
              <button
                onClick={handleResumeStudy}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm shadow-red-500/20 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Үргэлжлүүлэх</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('progress')}
              className="text-xs font-bold text-stone-600 dark:text-stone-300 hover:text-red-600 dark:hover:text-red-400 inline-flex items-center gap-1 p-1.5 transition-colors"
            >
              <span>Дэлгэрэнгүй тайлан</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* First time positive guidance when 0 stats */}
        {totalItemsLearned === 0 && (
          <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-orange-600 fill-orange-500" />
              </div>
              <div>
                <p className="font-bold text-stone-900 dark:text-stone-100">
                  Эхний үгээ сураад явцаа эхлүүлээрэй!
                </p>
                <p className="text-stone-500 dark:text-stone-400">
                  Өдөр бүр хэдхэн үг, ханз цээжилснээр тасралтгүй суралцах дадал тогтоно.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleStartLearning(selectedLevel || 'N5')}
              className="px-4 py-2 rounded-xl bg-[#EF233C] hover:bg-[#D90429] text-white font-bold text-xs shrink-0 shadow-xs transition-all cursor-pointer"
            >
              Үгийн сан цээжлэх
            </button>
          </div>
        )}

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
            <span className="text-xs text-stone-500 font-medium">Цээжилсэн үг</span>
            <div className="text-2xl font-extrabold text-stone-900 dark:text-white mt-1">
              {levelLearnedVocab}
            </div>
            <span className="text-[11px] text-stone-400">
              {selectedLevel ? `${selectedLevel} түвшинд` : 'Нийт'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
            <span className="text-xs text-stone-500 font-medium">Сурсан ханз</span>
            <div className="text-2xl font-extrabold text-stone-900 dark:text-white mt-1">
              {levelLearnedKanji}
            </div>
            <span className="text-[11px] text-stone-400">
              {selectedLevel ? `${selectedLevel} түвшинд` : 'Нийт'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
            <span className="text-xs text-stone-500 font-medium">Эзэмшсэн дүрэм</span>
            <div className="text-2xl font-extrabold text-stone-900 dark:text-white mt-1">
              {levelLearnedGrammar}
            </div>
            <span className="text-[11px] text-stone-400">
              {selectedLevel ? `${selectedLevel} түвшинд` : 'Нийт'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
            <span className="text-xs text-stone-500 font-medium">Дараалан суралцсан өдөр</span>
            <div className="text-2xl font-extrabold text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1.5">
              <span>{streakDays}</span>
              <span className="text-xs font-semibold text-stone-500">өдөр</span>
            </div>
            <span className="text-[11px] text-stone-400">Бодит дасгалаар тооцогдоно</span>
          </div>
        </div>

        {/* Guest user non-intrusive banner */}
        {!currentUser && !isBannerDismissed && (
          <div className="p-4 rounded-2xl bg-stone-100/80 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="font-bold text-stone-900 dark:text-stone-100">
                  Таны явц энэ браузерт хадгалагдаж байна.
                </p>
                <p className="text-stone-500 dark:text-stone-400">
                  Google-ээр нэвтэрвэл утас, таблет, бусад төхөөрөмж дээрээ үргэлжлүүлэн суралцах боломжтой.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                Google-ээр үргэлжлүүлэх
              </button>
              <button
                type="button"
                onClick={dismissBanner}
                className="px-2.5 py-1.5 rounded-xl text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 font-medium transition-colors"
              >
                Одоохондоо алгасах
              </button>
            </div>
          </div>
        )}

        {/* Quick Launch: Practice, Quiz & AI Roleplay */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div
            onClick={() => {
              setActiveTab('practice');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="p-4 rounded-2xl bg-gradient-to-br from-red-500/10 via-orange-500/5 to-transparent border border-red-200/80 dark:border-red-900/40 hover:border-red-400 dark:hover:border-red-700 cursor-pointer transition-all hover:scale-[1.01] flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform shrink-0">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">
                  Дасгал ажиллах
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1">
                  {selectedLevel ? `JLPT ${selectedLevel} ` : ''}Интерактив дасгал, угсрах
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-red-600 dark:group-hover:text-red-400 group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>

          <div
            onClick={() => {
              setActiveTab('quiz');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 via-red-500/5 to-transparent border border-orange-200/80 dark:border-orange-900/40 hover:border-orange-400 dark:hover:border-orange-700 cursor-pointer transition-all hover:scale-[1.01] flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                  Сорил шалгалт өгөх
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1">
                  {selectedLevel ? `JLPT ${selectedLevel} ` : ''}Цагтай сорил, 10–25 асуулт
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>

          <div
            onClick={() => {
              setActiveTab('roleplay');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="p-4 rounded-2xl bg-gradient-to-br from-red-500/15 via-orange-500/5 to-transparent border border-red-300/80 dark:border-red-900/60 hover:border-red-500 dark:hover:border-red-600 cursor-pointer transition-all hover:scale-[1.01] flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#EF233C] to-orange-600 text-white flex items-center justify-center shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform shrink-0">
                <MessagesSquare className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">
                    AI Roleplay
                  </h3>
                  <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded-full bg-[#EF233C] text-white leading-tight">
                    Шинэ
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1">
                  Бодит нөхцөл байдалд японоор ярилцах
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-red-600 dark:group-hover:text-red-400 group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
        </div>
      </section>

      {/* 4. DAILY HIGHLIGHTS: WORD OF THE DAY & KANJI OF THE DAY (LEVEL-FILTERED) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              Өдрийн онцлох хичээлүүд
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {selectedLevel
                ? `JLPT ${selectedLevel} түвшинд тохируулсан өдрийн үг болон ханз`
                : 'Түвшнээ сонгосноор танд тохирох өдрийн агуулга харагдана'}
            </p>
          </div>
        </div>

        {/* If no level selected yet, show guided selection prompt */}
        {!selectedLevel ? (
          <div className="p-8 rounded-3xl bg-stone-50 dark:bg-stone-900 border border-dashed border-stone-300 dark:border-stone-700 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Түвшнээ сонговол танд тохирох өдрийн үг, ханз харагдана
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
              Өөрийн суралцах түвшинг (N5–N1) сонгосноор өдөр бүр тохирох шинэ үг, ханз гарч ирнэ.
            </p>
            <div className="pt-2">
              <button
                onClick={scrollToLevelSelection}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20 transition-all"
              >
                Түвшин сонгох
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Word of the Day Card */}
            {vocabOfTheDay ? (() => {
              const vocabPronounce = extractVocabPronunciation(vocabOfTheDay);
              return (
              <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-bold">
                        Өдрийн шинэ үг
                      </span>
                      <LevelBadge level={vocabOfTheDay.jlptLevel} size="sm" />
                      {vocabOfTheDay.partOfSpeech && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-medium">
                          {vocabOfTheDay.partOfSpeech}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => toggleFavorite('vocab', vocabOfTheDay.id)}
                      title="Хадгалах"
                      className="p-1.5 rounded-lg text-stone-400 hover:text-orange-500 transition-colors"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          userProgress.favorites.vocabIds.includes(vocabOfTheDay.id)
                            ? 'fill-orange-400 text-orange-400'
                            : ''
                        }`}
                      />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                      <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-jp">
                          {vocabOfTheDay.japanese}
                        </h3>
                        <span className="text-xs sm:text-sm text-stone-500 font-jp">
                          [{vocabOfTheDay.reading}]
                        </span>
                      </div>
                      <AudioButton
                        text={vocabPronounce.text}
                        reading={vocabPronounce.reading}
                        id={`daily_vocab_main_${vocabOfTheDay.id}`}
                        size="sm"
                        title={`"${vocabOfTheDay.japanese}" дуудлага сонсох`}
                      />
                    </div>
                    <p className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400">
                      {vocabOfTheDay.mongolian}
                    </p>
                    {(() => {
                      const cleanExp = getCleanVocabExplanation(vocabOfTheDay.explanation, vocabOfTheDay.mongolian, vocabOfTheDay.partOfSpeech);
                      return cleanExp ? (
                        <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                          {cleanExp}
                        </p>
                      ) : null;
                    })()}

                    {vocabOfTheDay.exampleSentence && (
                      <div className="mt-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 text-xs space-y-1 border border-stone-200/60 dark:border-stone-700/50">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-stone-900 dark:text-stone-200 font-jp font-medium min-w-0">
                            <span className="break-words">{vocabOfTheDay.exampleSentence}</span>
                          </div>
                          <AudioButton
                            text={vocabOfTheDay.exampleSentence}
                            id={`daily_vocab_ex_${vocabOfTheDay.id}`}
                            size="xs"
                            variant="ghost"
                            title="Жишээ өгүүлбэр сонсох"
                          />
                        </div>
                        <p className="text-stone-500 dark:text-stone-400 italic">
                          {vocabOfTheDay.exampleMongolian}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                  <span className="text-stone-400">JLPT {vocabOfTheDay.jlptLevel}</span>
                  <button
                    onClick={() => handleSubTabSelect(vocabOfTheDay.jlptLevel, 'vocab')}
                    className="font-bold text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Бүх үгийн санг үзэх</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
              );
            })() : (
              <div className="p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col items-center justify-center text-center space-y-2">
                <BookA className="w-8 h-8 text-stone-400" />
                <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                  Энэ түвшний агуулга удахгүй нэмэгдэнэ
                </p>
                <p className="text-xs text-stone-500">
                  {selectedLevel} түвшний үгийн санг бэлтгэж байна.
                </p>
              </div>
            )}

            {/* Kanji of the Day Card */}
            {kanjiOfTheDay ? (() => {
              const kanjiPronounce = extractKanjiPronunciation(kanjiOfTheDay);
              return (
                <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold">
                          Өдрийн ханз
                        </span>
                        <LevelBadge level={kanjiOfTheDay.jlptLevel} size="sm" />
                        {kanjiOfTheDay.strokeCount && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 font-medium">
                            {kanjiOfTheDay.strokeCount} зуралттай
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => toggleFavorite('kanji', kanjiOfTheDay.id)}
                        title="Хадгалах"
                        className="p-1.5 rounded-lg text-stone-400 hover:text-orange-500 transition-colors"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            userProgress.favorites.kanjiIds.includes(kanjiOfTheDay.id)
                              ? 'fill-orange-400 text-orange-400'
                              : ''
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center text-3xl sm:text-4xl font-extrabold font-jp border border-red-200 dark:border-red-900/60 shadow-sm shrink-0">
                        {kanjiOfTheDay.kanji}
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 truncate">
                            {kanjiOfTheDay.mongolian}
                          </h3>
                          <AudioButton
                            text={kanjiPronounce.text}
                            reading={kanjiPronounce.reading}
                            id={`daily_kanji_main_${kanjiOfTheDay.id}`}
                            size="sm"
                            title={`"${kanjiOfTheDay.kanji}" дуудлага сонсох`}
                          />
                        </div>
                        <div className="text-xs space-y-0.5 text-stone-600 dark:text-stone-400">
                          <div className="truncate">
                            <span className="font-semibold text-stone-500">Онь:</span> {kanjiOfTheDay.onyomi || '—'}
                          </div>
                          <div className="truncate">
                            <span className="font-semibold text-stone-500">Күн:</span> {kanjiOfTheDay.kunyomi || '—'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {kanjiOfTheDay.exampleWords && kanjiOfTheDay.exampleWords.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {kanjiOfTheDay.exampleWords.slice(0, 2).map((ew, idx) => (
                          <div key={idx} className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/40 min-w-0 flex items-center justify-between gap-1">
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-stone-900 dark:text-stone-100 font-jp">{ew.word}</span>
                              <span className="text-stone-400 text-[11px] ml-1 font-jp">({ew.reading})</span>
                              <p className="text-stone-500 text-[11px] truncate">{ew.mongolian}</p>
                            </div>
                            <AudioButton
                              text={ew.word}
                              reading={ew.reading}
                              id={`daily_kanji_ew_${kanjiOfTheDay.id}_${idx}`}
                              size="xs"
                              variant="ghost"
                              title={`"${ew.word}" дуудлага сонсох`}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                    <span className="text-stone-400">JLPT {kanjiOfTheDay.jlptLevel}</span>
                    <button
                      onClick={() => handleSubTabSelect(kanjiOfTheDay.jlptLevel, 'kanji')}
                      className="font-bold text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Бүх ханзыг үзэх</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })() : (
              <div className="p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col items-center justify-center text-center space-y-2">
                <Sparkles className="w-8 h-8 text-stone-400" />
                <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                  Энэ түвшний агуулга удахгүй нэмэгдэнэ
                </p>
                <p className="text-xs text-stone-500">
                  {selectedLevel} түвшний ханзыг бэлтгэж байна.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 5. CORE 3 JLPT LEARNING PILLARS & DICTIONARY */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
            Сургалтын үндсэн 3 чиглэл
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            JLPT түвшин бүрийн үгийн сан, ханз, дүрмийн цогц систем
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div
            onClick={() => handleSubTabSelect(selectedLevel || 'N5', 'vocab')}
            className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-emerald-400 dark:hover:border-emerald-700 shadow-sm cursor-pointer transition-all hover:scale-[1.01] sm:hover:scale-[1.02] group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <BookA className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Үгийн сан
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
              Үгийн дуудлага, монгол орчуулга, жишээ өгүүлбэр, цээжлэх флаш-карт.
            </p>
          </div>

          <div
            onClick={() => handleSubTabSelect(selectedLevel || 'N5', 'kanji')}
            className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-sky-400 dark:hover:border-sky-700 shadow-sm cursor-pointer transition-all hover:scale-[1.01] sm:hover:scale-[1.02] group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
              Ханз
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
              Онь, күн дуудлага, монгол утга, зуралтын дараалал ба нийлмэл үгс.
            </p>
          </div>

          <div
            onClick={() => handleSubTabSelect(selectedLevel || 'N5', 'grammar')}
            className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-orange-400 dark:hover:border-orange-700 shadow-sm cursor-pointer transition-all hover:scale-[1.01] sm:hover:scale-[1.02] group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
              Дүрэм
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
              Дүрмийн бүтэц, залгавар, хэрэглээний тайлбар, бодит жишээ өгүүлбэрүүд.
            </p>
          </div>

          <div
            onClick={() => {
              setActiveTab('dictionary');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-rose-400 dark:hover:border-rose-700 shadow-sm cursor-pointer transition-all hover:scale-[1.01] sm:hover:scale-[1.02] group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mb-3">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
              Япон-Монгол Толь
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
              Бүх түвшний үг, ханз, дүрмийн нэгдсэн хурдан хайлт, толь бичиг.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
