import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Star,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Lock,
  Layers,
  PenTool,
  Volume2,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  RotateCcw,
  Play,
  Pause,
  Hash,
  Clock,
  Users,
  Compass,
  Activity,
  CloudSun,
  MessageSquare,
  Calendar,
  MapPin,
  Utensils,
  Building2,
  Newspaper,
  Award,
  GraduationCap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LevelBadge } from '../common/LevelBadge';
import { extractKanjiPronunciation, speechService } from '../../services/speech';
import { KanjiItem, ItemStudyRecord } from '../../types';
import { KanjiStrokeOrder } from '../kanji/KanjiStrokeOrder';
import {
  getTopicsForLevel,
  getTopicStats,
  getOrderedItemsForTopic,
  TopicStats
} from '../../data/curriculumTopics';

const TOPIC_ICONS: Record<string, React.ElementType> = {
  Hash,
  Clock,
  Users,
  Compass,
  BookOpen,
  Activity,
  CloudSun,
  MessageSquare,
  Calendar,
  MapPin,
  Utensils,
  Building2,
  Newspaper,
  Award,
  GraduationCap,
  Layers
};

export const KanjiList: React.FC = () => {
  const {
    data,
    selectedLevel,
    userProgress,
    toggleKanjiLearned,
    toggleFavorite,
    isContentUnlocked,
    setActiveTab,
    setIsAuthModalOpen,
    currentUser
  } = useApp();

  const effectiveLevel = selectedLevel || 'N5';
  const isLevelPremium = effectiveLevel !== 'N5';
  const isUnlocked = isContentUnlocked || !isLevelPremium;
  const levelCounts = data.counts?.[effectiveLevel];
  const lockedCount = isUnlocked ? 0 : (levelCounts?.lockedKanji || 0);

  // Active topic filtering ('all' = all kanji in level, or a specific topic id)
  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [filterLearned, setFilterLearned] = useState<'all' | 'unlearned' | 'learned'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 40;

  // Detail Modal state
  const [activeDetailItem, setActiveDetailItem] = useState<KanjiItem | null>(null);
  const [isDetailFlipped, setIsDetailFlipped] = useState<boolean>(false);
  const [strokeReplayKey, setStrokeReplayKey] = useState<number>(0);
  const [strokeCurrent, setStrokeCurrent] = useState<number>(1);
  const [strokeTotal, setStrokeTotal] = useState<number>(1);
  const [strokeIsPlaying, setStrokeIsPlaying] = useState<boolean>(true);
  const [strokeShowNumbers, setStrokeShowNumbers] = useState<boolean>(true);

  // Reset pagination on filter or topic change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTopicId, search, filterLearned, effectiveLevel]);

  // Reset stroke controls when active kanji changes
  useEffect(() => {
    setStrokeCurrent(1);
    setStrokeIsPlaying(true);
  }, [activeDetailItem]);

  // Topics for the current level
  const availableTopics = useMemo(() => {
    return getTopicsForLevel(effectiveLevel, 'kanji', data.kanji || []);
  }, [effectiveLevel, data.kanji]);

  // Topic stats map
  const topicStatsMap = useMemo(() => {
    const map = new Map<string, TopicStats>();
    const studyRecords = (userProgress.itemStudyRecords || {}) as Record<string, ItemStudyRecord>;
    const pool = (data.kanji || []).filter(k => k.jlptLevel === effectiveLevel);
    for (const topic of availableTopics) {
      map.set(topic.id, getTopicStats(topic, pool, studyRecords));
    }
    return map;
  }, [availableTopics, data.kanji, effectiveLevel, userProgress.itemStudyRecords]);

  // Selected topic object (if not 'all')
  const currentTopic = useMemo(() => {
    if (selectedTopicId === 'all') return null;
    return availableTopics.find(t => t.id === selectedTopicId) || null;
  }, [selectedTopicId, availableTopics]);

  // Base list of items ordered by topic (e.g. N5 Numbers starts with 一, 二, 三, 四, 五, 六, 七, 八, 九, 十...)
  const topicOrderedItems = useMemo(() => {
    const pool = (data.kanji || []).filter(item => {
      if (item.jlptLevel !== effectiveLevel) return false;
      if (!isUnlocked && item.accessTier !== 'FREE') return false;
      return true;
    });

    if (currentTopic) {
      return getOrderedItemsForTopic(currentTopic, pool);
    }
    return pool;
  }, [data.kanji, effectiveLevel, isUnlocked, currentTopic]);

  // Filtered items based on search and learned status
  const displayItems = useMemo(() => {
    return topicOrderedItems.filter(item => {
      const isLearned = (userProgress.learnedKanjiIds || []).includes(item.id);
      if (filterLearned === 'learned' && !isLearned) return false;
      if (filterLearned === 'unlearned' && isLearned) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchKanji = item.kanji.includes(q);
        const matchOnyomi = item.onyomi.toLowerCase().includes(q);
        const matchKunyomi = item.kunyomi.toLowerCase().includes(q);
        const matchMn = item.mongolian.toLowerCase().includes(q);
        if (!matchKanji && !matchOnyomi && !matchKunyomi && !matchMn) return false;
      }
      return true;
    });
  }, [topicOrderedItems, filterLearned, search, userProgress.learnedKanjiIds]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(displayItems.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return displayItems.slice(start, start + ITEMS_PER_PAGE);
  }, [displayItems, currentPage]);

  // Detail index within display items
  const detailIndex = useMemo(() => {
    if (!activeDetailItem) return -1;
    return displayItems.findIndex(i => i.id === activeDetailItem.id);
  }, [activeDetailItem, displayItems]);

  const handleOpenDetail = (item: KanjiItem, showStrokeDirectly = false) => {
    setActiveDetailItem(item);
    setIsDetailFlipped(showStrokeDirectly);
    setStrokeReplayKey(prev => prev + 1);
  };

  const handlePrevDetail = () => {
    if (detailIndex > 0) {
      setActiveDetailItem(displayItems[detailIndex - 1]);
      setStrokeReplayKey(prev => prev + 1);
    }
  };

  const handleNextDetail = () => {
    if (detailIndex >= 0 && detailIndex < displayItems.length - 1) {
      setActiveDetailItem(displayItems[detailIndex + 1]);
      setStrokeReplayKey(prev => prev + 1);
    }
  };

  const handlePlayAudio = (item: KanjiItem) => {
    const pron = extractKanjiPronunciation(item);
    speechService.play(pron.text, {
      reading: pron.reading,
      rate: userProgress.settings?.speechRate || 0.9
    });
  };

  const totalInLevel = (data.kanji || []).filter(k => k.jlptLevel === effectiveLevel).length;
  const learnedInLevel = (data.kanji || []).filter(
    k => k.jlptLevel === effectiveLevel && (userProgress.learnedKanjiIds || []).includes(k.id)
  ).length;

  return (
    <div className="space-y-5 animate-fade-in pb-safe">
      {/* Premium Preview Info Banner */}
      {isLevelPremium && !isUnlocked && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FF0000]/10 via-[#FF3366]/5 to-transparent border border-[rgba(255,51,102,0.18)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF0000] to-[#FF3366] text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>JLPT {effectiveLevel} Ханз — Танилцуулга хувилбар</span>
                <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-[#CC0000] dark:text-red-300 text-[10px] font-bold">
                  {displayItems.length} ханз нээлттэй
                </span>
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                Энэ түвшний {lockedCount > 0 ? `${lockedCount} ханз` : 'бүх ханз'} болон N4-N1 бүрэн санг нээхийн тулд Premium аваарай.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (!currentUser) {
                setIsAuthModalOpen(true);
              } else {
                setActiveTab('premium');
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#CC0000] via-[#FF0000] to-[#FF3366] hover:opacity-95 text-white font-extrabold text-xs shadow-md shadow-red-500/20 transition-all shrink-0 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Premium нээх (¥480 / 30 хоног)</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. TOPIC SELECTION CHIPS BAR (Semantic Curriculum Topics) */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-[#150F12] p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#CC0000] dark:text-[#FF4D4D]" />
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-stone-800 dark:text-stone-200">
              Ханзны сэдэв сонгох
            </h2>
          </div>
          <span className="text-[11px] font-mono font-bold text-stone-500 dark:text-stone-400">
            Нийт {totalInLevel} ханз ({learnedInLevel} сурсан)
          </span>
        </div>

        {/* Scrollable Topic Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          {/* "Бүгд" (All) Chip */}
          <button
            type="button"
            onClick={() => setSelectedTopicId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              selectedTopicId === 'all'
                ? 'bg-gradient-to-r from-[#CC0000] to-[#FF3366] text-white shadow-sm shadow-red-500/25'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Бүгд ({totalInLevel})</span>
          </button>

          {/* Semantic Topic Chips */}
          {availableTopics.map(topic => {
            const Icon = TOPIC_ICONS[topic.iconName] || Layers;
            const isSelected = selectedTopicId === topic.id;
            const stats = topicStatsMap.get(topic.id);
            const count = stats?.total || 0;

            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => setSelectedTopicId(topic.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#CC0000] to-[#FF3366] text-white shadow-sm shadow-red-500/25'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : ''}`} />
                <span>{topic.titleMongolian}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. SEARCH, FILTER & ACTIVE TOPIC CONTROLS                 */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#150F12] p-3 sm:p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`${effectiveLevel} ханз, оныонми, күнъёми, монгол утгаар хайх...`}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Status filter */}
          <select
            value={filterLearned}
            onChange={e => setFilterLearned(e.target.value as any)}
            className="px-3 py-2 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 focus:outline-none cursor-pointer"
          >
            <option value="all">Бүх ханз</option>
            <option value="unlearned">Сураагүй</option>
            <option value="learned">Сурсан</option>
          </select>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. MULTI-CARD RESPONSIVE LEARNING GRID                    */}
      {/* Mobile: 2 cols, Tablet: 3 cols, Desktop: 4-5 cols        */}
      {/* ========================================================= */}
      {displayItems.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#150F12] rounded-3xl border border-stone-200 dark:border-stone-800 text-stone-400">
          <BookOpen className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-600 mb-2" />
          <p className="text-sm font-semibold">Шүүлтүүрт тохирох ханз олдсонгүй.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3.5">
            {paginatedItems.map((item, idx) => {
              const isLearned = (userProgress.learnedKanjiIds || []).includes(item.id);
              const isFav = (userProgress.favorites?.kanjiIds || []).includes(item.id);
              const itemIndex = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenDetail(item, false)}
                  className={`p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#160E12] border transition-all duration-200 flex flex-col justify-between cursor-pointer group relative shadow-2xs hover:shadow-md hover:-translate-y-0.5 ${
                    isLearned
                      ? 'border-emerald-200/90 dark:border-emerald-900/50 bg-emerald-50/15 dark:bg-emerald-950/10'
                      : 'border-stone-200/80 dark:border-stone-800/80 hover:border-[#CC0000] dark:hover:border-[#FF3366]'
                  }`}
                >
                  {/* Top bar: Index + Learned Checkmark */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider truncate">
                      #{itemIndex} • {item.jlptLevel}
                    </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleKanjiLearned(item.id);
                    }}
                    className={`p-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                      isLearned
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/50'
                        : 'text-stone-300 dark:text-stone-600 hover:text-stone-500'
                    }`}
                    title={isLearned ? 'Сурсан' : 'Сурсанд тооцох'}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Center Hero Kanji, Mongolian Meaning (Clean: No Readings on compact card) */}
                <div className="text-center my-auto py-2 space-y-1.5">
                  <div className="text-4xl sm:text-5xl font-black font-jp text-stone-900 dark:text-stone-100 group-hover:text-[#CC0000] dark:group-hover:text-[#FF6699] transition-colors leading-none tracking-wide">
                    {item.kanji}
                  </div>

                  <div className="text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-200 line-clamp-1 leading-snug">
                    {item.mongolian}
                  </div>
                </div>

                {/* Bottom Bar: Audio, Stroke Shortcut & Star */}
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-stone-100 dark:border-stone-800/70">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayAudio(item);
                    }}
                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-[#CC0000] dark:text-[#FF6699] transition-colors cursor-pointer"
                    title={`"${item.kanji}" дуудлага сонсох`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(item, true);
                      }}
                      className="p-1 text-stone-400 hover:text-[#CC0000] dark:hover:text-[#FF6699] rounded transition-colors cursor-pointer"
                      title={`"${item.kanji}" зурлагын дараалал харах`}
                    >
                      <PenTool className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite('kanji', item.id);
                      }}
                      className="p-1 text-stone-400 hover:text-amber-500 transition-colors cursor-pointer"
                      title="Хадгалах"
                    >
                      <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

          {/* ========================================================= */}
          {/* PAGINATION CONTROLS (40 items/page)                       */}
          {/* ========================================================= */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 sm:pt-6 border-t border-stone-200 dark:border-stone-800 text-xs font-semibold">
              <div className="text-stone-500 dark:text-stone-400">
                Нийт <span className="font-bold text-stone-900 dark:text-stone-100">{displayItems.length}</span> ханзнаас{' '}
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1} – {Math.min(currentPage * ITEMS_PER_PAGE, displayItems.length)}
                </span>
                -г харуулж байна (Хуудас {currentPage} / {totalPages})
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => {
                    setCurrentPage(prev => Math.max(1, prev - 1));
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed text-stone-700 dark:text-stone-300 font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Өмнөх</span>
                </button>

                {/* Quick numbered page buttons */}
                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = currentPage;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => {
                          setCurrentPage(pageNum);
                          window.scrollTo({ top: 300, behavior: 'smooth' });
                        }}
                        className={`w-8 h-8 rounded-xl font-bold transition-colors cursor-pointer text-xs ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-[#CC0000] to-[#FF3366] text-white shadow-xs'
                            : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => {
                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed text-stone-700 dark:text-stone-300 font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Дараах</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. DETAIL VIEW MODAL ON CARD TAP (Flippable Card)         */}
      {/* Natural height, NO internal scrollbars, smooth Prev/Next  */}
      {/* ========================================================= */}
      {activeDetailItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm overflow-y-auto animate-fade-in min-h-[100dvh] h-[100dvh] pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] px-[max(0.75rem,env(safe-area-inset-left))]"
          onClick={e => {
            if (e.target === e.currentTarget) {
              setActiveDetailItem(null);
            }
          }}
        >
          <div
            className="w-full max-w-xl sm:max-w-2xl lg:max-w-3xl rounded-3xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 shadow-2xl p-3.5 sm:p-5 space-y-2.5 sm:space-y-3.5 relative animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <LevelBadge level={activeDetailItem.jlptLevel} size="xs" />
                <span className="text-xs font-bold text-stone-500 dark:text-stone-400 font-jp">
                  漢字 • #{detailIndex + 1}
                </span>
                <span className="text-[11px] font-mono text-stone-400">
                  ({detailIndex + 1} / {displayItems.length})
                </span>
                {strokeTotal > 1 && (
                  <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-[10px] font-mono font-bold">
                    {strokeTotal} зурлага
                  </span>
                )}
              </div>

              {/* Front/Back Flip Toggle Button & Close */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsDetailFlipped(prev => !prev)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    isDetailFlipped
                      ? 'bg-red-50 dark:bg-red-950/60 text-[#CC0000] dark:text-[#FF6699] border border-red-200 dark:border-red-900/60'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>{isDetailFlipped ? 'Мэдээлэл' : 'Зурлага'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDetailItem(null)}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  title="Хаах (ESC)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Either Front (Core Info) or Back (Accurate KanjiVG Stroke Order with numbers 1..N) */}
            {!isDetailFlipped ? (
              /* FRONT FACE: Two-column balanced layout on sm+ for zero-scroll fit */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-stretch animate-fade-in">
                {/* Left Column: Hero Kanji, Meaning, Onyomi & Kunyomi */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/70 dark:border-stone-800 flex flex-col justify-center text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-5xl sm:text-6xl font-black font-jp text-stone-900 dark:text-stone-100 tracking-wider">
                      {activeDetailItem.kanji}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePlayAudio(activeDetailItem)}
                      className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-[#CC0000] dark:text-[#FF3366] transition-colors cursor-pointer shrink-0"
                      title="Дуудлага сонсох"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-lg sm:text-xl font-black text-[#CC0000] dark:text-[#FF6699]">
                    {activeDetailItem.mongolian}
                  </div>

                  {/* Onyomi & Kunyomi Grid */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 text-xs text-left">
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                        Оньёми (音):
                      </span>
                      <span className="text-xs sm:text-sm font-black font-jp text-stone-900 dark:text-stone-100 mt-0.5 block truncate">
                        {activeDetailItem.onyomi || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                        Күньёми (訓):
                      </span>
                      <span className="text-xs sm:text-sm font-black font-jp text-stone-900 dark:text-stone-100 mt-0.5 block truncate">
                        {activeDetailItem.kunyomi || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Example Compound Words & Flip to Stroke Order */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/70 dark:border-stone-800 flex flex-col justify-between space-y-2 text-left">
                  {activeDetailItem.exampleWords && activeDetailItem.exampleWords.length > 0 ? (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider block">
                        Холбоо үгс:
                      </span>
                      <div className="space-y-1.5">
                        {activeDetailItem.exampleWords.slice(0, 3).map((ex, exIdx) => (
                          <div
                            key={exIdx}
                            className="p-2 rounded-xl bg-white dark:bg-stone-900/80 border border-stone-200/60 dark:border-stone-800 text-xs flex items-center justify-between gap-1.5"
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-stone-900 dark:text-stone-100 font-jp truncate">
                                {ex.word} <span className="font-normal text-stone-400 font-jp text-[11px]">【{ex.reading}】</span>
                              </div>
                              <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                                {ex.mongolian}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => speechService.play(ex.word, { reading: ex.reading })}
                              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer shrink-0"
                              title="Дуудлага сонсох"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-xs text-stone-400 py-3">
                      Холбоо үгийн жишээ одоогоор байхгүй байна.
                    </div>
                  )}

                  {/* Flip to Stroke Order Button */}
                  <button
                    type="button"
                    onClick={() => setIsDetailFlipped(true)}
                    className="w-full py-2 px-3 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-auto"
                  >
                    <PenTool className="w-3.5 h-3.5 text-[#FF3366]" />
                    <span>Зурлагын дараалал үзэх (書き順)</span>
                  </button>
                </div>
              </div>
            ) : (
              /* BACK FACE: Two-column Stroke Order Diagram with Interactive Controls and Numbers 1..N */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-center animate-fade-in">
                {/* Left Column: Clean Canvas with Visible Numbers 1..N */}
                <div
                  key={`${activeDetailItem.kanji}_${strokeReplayKey}`}
                  className="flex items-center justify-center p-2 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 max-w-full aspect-square mx-auto"
                >
                  <KanjiStrokeOrder
                    kanji={activeDetailItem.kanji}
                    size={200}
                    autoPlay={strokeIsPlaying}
                    isPlaying={strokeIsPlaying}
                    onPlayingChange={setStrokeIsPlaying}
                    currentStroke={strokeCurrent}
                    onStrokeChange={(curr, total) => {
                      setStrokeCurrent(curr);
                      setStrokeTotal(total);
                    }}
                    showNumbers={strokeShowNumbers}
                    showGrid={true}
                  />
                </div>

                {/* Right Column: Interactive Stroke Controls & Numbers Toggle */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/70 dark:border-stone-800 flex flex-col justify-between space-y-3 text-center sm:text-left">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-900 dark:text-stone-100 font-jp text-base">
                        {activeDetailItem.kanji}
                      </span>
                      <span className="text-[11px] text-stone-400">
                        Зурлага: <b className="text-stone-900 dark:text-stone-100">{strokeCurrent}</b> / {strokeTotal}
                      </span>
                    </div>
                  </div>

                  {/* Stroke Navigation Controls Bar */}
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      disabled={strokeCurrent <= 1}
                      onClick={() => {
                        setStrokeIsPlaying(false);
                        setStrokeCurrent(prev => Math.max(1, prev - 1));
                      }}
                      className="p-2 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
                      title="Өмнөх зурлага"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setStrokeIsPlaying(p => !p)}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#CC0000] to-[#FF3366] hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-red-500/20 cursor-pointer transition-all"
                    >
                      {strokeIsPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-white" />
                          <span>Зогсоох</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Тоглуулах</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={strokeCurrent >= strokeTotal}
                      onClick={() => {
                        setStrokeIsPlaying(false);
                        setStrokeCurrent(prev => Math.min(strokeTotal, prev + 1));
                      }}
                      className="p-2 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
                      title="Дараах зурлага"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStrokeCurrent(1);
                        setStrokeIsPlaying(true);
                        setStrokeReplayKey(k => k + 1);
                      }}
                      className="p-2 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
                      title="Эхнээс нь давтах"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-200/50 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={() => setStrokeShowNumbers(n => !n)}
                      className="text-[11px] font-semibold text-stone-500 hover:text-[#CC0000] dark:hover:text-[#FF6699] transition-colors cursor-pointer"
                    >
                      {strokeShowNumbers ? 'Дугаар нуух' : 'Дугаар харуулах'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsDetailFlipped(false)}
                      className="text-[11px] font-bold text-[#CC0000] dark:text-[#FF6699] hover:underline cursor-pointer"
                    >
                      ← Мэдээлэл харах
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Action Row: Previous, Mark as Learned, Next (all visible without scrolling) */}
            <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                disabled={detailIndex <= 0}
                onClick={handlePrevDetail}
                className="px-3.5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed text-stone-700 dark:text-stone-300 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Өмнөх</span>
              </button>

              {(() => {
                const isLearned = (userProgress.learnedKanjiIds || []).includes(activeDetailItem.id);
                return (
                  <button
                    type="button"
                    onClick={() => toggleKanjiLearned(activeDetailItem.id)}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98 ${
                      isLearned
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
                        : 'bg-gradient-to-r from-[#CC0000] via-[#FF0000] to-[#FF3366] hover:opacity-95 text-white shadow-red-500/25'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{isLearned ? '✓ Сурсан' : 'Сурсан гэж тэмдэглэх'}</span>
                  </button>
                );
              })()}

              <button
                type="button"
                disabled={detailIndex < 0 || detailIndex >= displayItems.length - 1}
                onClick={handleNextDetail}
                className="px-3.5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed text-stone-700 dark:text-stone-300 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors shrink-0"
              >
                <span>Дараах</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
