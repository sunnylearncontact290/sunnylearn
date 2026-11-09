import React, { useState, useMemo } from 'react';
import {
  Search,
  Star,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Lock,
  PenTool,
  Layers,
  ArrowRight,
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
import { AudioButton } from '../common/AudioButton';
import { extractKanjiPronunciation } from '../../services/speech';
import { KanjiItem, ItemStudyRecord } from '../../types';
import { KanjiStrokeModal } from '../kanji/KanjiStrokeModal';
import { InteractiveJapaneseSentence } from './InteractiveJapaneseSentence';
import { FlashcardView } from '../flashcards/FlashcardView';
import { getTopicsForLevel, getTopicStats, TopicStats } from '../../data/curriculumTopics';

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

  // Top Mode: 'topics' (Curriculum & Flashcards) vs 'library' (Searchable List)
  const [viewMode, setViewMode] = useState<'topics' | 'library'>('topics');
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);

  // Search & Filter state for Library mode
  const [search, setSearch] = useState('');
  const [filterLearned, setFilterLearned] = useState<'all' | 'unlearned' | 'learned'>('all');
  const [selectedStrokeKanji, setSelectedStrokeKanji] = useState<KanjiItem | null>(null);

  // Topics for the current level
  const availableTopics = useMemo(() => {
    return getTopicsForLevel(effectiveLevel, 'kanji', data.kanji || []);
  }, [effectiveLevel, data.kanji]);

  // Precomputed stats for each topic (total, mastered, progressPercent)
  const topicStatsMap = useMemo(() => {
    const map = new Map<string, TopicStats>();
    const studyRecords = (userProgress.itemStudyRecords || {}) as Record<string, ItemStudyRecord>;
    const pool = (data.kanji || []).filter(k => k.jlptLevel === effectiveLevel);
    for (const topic of availableTopics) {
      map.set(topic.id, getTopicStats(topic, pool, studyRecords));
    }
    return map;
  }, [availableTopics, data.kanji, effectiveLevel, userProgress.itemStudyRecords]);

  const filteredKanji = useMemo(() => {
    return (data.kanji || []).filter(item => {
      if (item.jlptLevel !== effectiveLevel) return false;
      if (!isUnlocked && item.accessTier !== 'FREE') return false;

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
  }, [data.kanji, effectiveLevel, isUnlocked, filterLearned, search, userProgress.learnedKanjiIds]);

  // If a topic is active, render the embedded FlashcardView for that topic
  if (activeTopicId) {
    return (
      <FlashcardView
        initialContentKind="kanji"
        initialTopicId={activeTopicId}
        onBack={() => setActiveTopicId(null)}
        lockContentKind={true}
      />
    );
  }

  return (
    <div className="space-y-6">
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
                  {filteredKanji.length} ханз нээлттэй
                </span>
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                Энэ түвшний {lockedCount > 0 ? `${lockedCount} ханз` : 'бүх ханз'} болон N4-N1 сургалтын санг бүрэн нээхийн тулд Premium аваарай.
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
      {/* 1. VIEW MODE SWITCHER: Topics vs Library List             */}
      {/* ========================================================= */}
      <div className="flex items-center justify-between gap-3 p-1.5 rounded-2xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-1 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setViewMode('topics')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              viewMode === 'topics'
                ? 'bg-gradient-to-r from-[#CC0000] to-[#FF3366] text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Сэдвээр сурах (Карт)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('library')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              viewMode === 'library'
                ? 'bg-gradient-to-r from-[#CC0000] to-[#FF3366] text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Бүх ханзны сан (Хайх)</span>
          </button>
        </div>

        <span className="hidden sm:inline-block text-xs font-bold text-stone-400 px-3">
          JLPT {effectiveLevel} • {viewMode === 'topics' ? `${availableTopics.length} сэдэв` : `${filteredKanji.length} ханз`}
        </span>
      </div>

      {/* ========================================================= */}
      {/* 2. TOPIC BASED CURRICULUM GRID VIEW                       */}
      {/* ========================================================= */}
      {viewMode === 'topics' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100">
                JLPT {effectiveLevel} Ханзны сэдвүүд
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Сэдэв бүрийг дарааллын дагуу флаш картаар системтэй суралцаарай.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {availableTopics.map((topic, idx) => {
              const IconComponent = TOPIC_ICONS[topic.iconName] || Layers;
              const stats = topicStatsMap.get(topic.id) || { total: 0, mastered: 0, progressPercent: 0 };
              const totalInTopic = stats.total;
              const progressPercent = stats.progressPercent;

              return (
                <div
                  key={topic.id}
                  onClick={() => setActiveTopicId(topic.id)}
                  className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#181114] border border-stone-200 dark:border-stone-800 hover:border-[#CC0000] dark:hover:border-[#FF3366] transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between space-y-3.5 group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: topic.themeColor }}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500">
                        {idx + 1}-р сэдэв
                      </span>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100 group-hover:text-[#CC0000] dark:group-hover:text-[#FF6699] transition-colors">
                          {topic.titleMongolian}
                        </h3>
                        <span className="text-xs font-bold text-stone-400 font-jp">
                          {topic.titleJapanese}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                        {topic.descriptionMongolian}
                      </p>
                    </div>
                  </div>

                  {/* Progress & Card Action */}
                  <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                    <div className="flex items-center justify-between text-[11px] font-bold text-stone-500">
                      <span>{totalInTopic} ханз</span>
                      <span>{progressPercent}% эзэмшсэн</span>
                    </div>
                    
                    <div className="w-full h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${progressPercent}%`,
                          backgroundColor: topic.themeColor
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      className="w-full mt-1.5 py-2 px-3 rounded-xl bg-stone-50 dark:bg-stone-800/80 group-hover:bg-[#CC0000] text-stone-700 dark:text-stone-300 group-hover:text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Картаар сурах</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. SEARCHABLE LIBRARY / LIST VIEW                         */}
      {/* ========================================================= */}
      {viewMode === 'library' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-3.5 sm:p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`${effectiveLevel} ханз, оныонми, күнъёми, монгол утгаар хайх...`}
                className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <select
              value={filterLearned}
              onChange={e => setFilterLearned(e.target.value as any)}
              className="px-3.5 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 focus:outline-none"
            >
              <option value="all">Бүх ханз</option>
              <option value="unlearned">Сураагүй</option>
              <option value="learned">Сурсан</option>
            </select>
          </div>

          {/* Kanji Cards */}
          {filteredKanji.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 text-stone-400">
              <BookOpen className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-600 mb-2" />
              <p className="text-sm font-medium">Шүүлтүүрт тохирох ханз олдсонгүй.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full">
              {filteredKanji.map(item => {
                const isLearned = userProgress.learnedKanjiIds.includes(item.id);
                const isFav = userProgress.favorites.kanjiIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between ${
                      isLearned
                        ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10'
                        : 'border-stone-200 dark:border-stone-800 hover:border-stone-300'
                    }`}
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <LevelBadge level={item.jlptLevel} size="xs" />
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setSelectedStrokeKanji(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-stone-700 dark:text-stone-300 hover:text-[#CC0000] dark:hover:text-[#FF6699] border border-stone-200/80 dark:border-stone-700/80 hover:border-red-200 dark:hover:border-red-800/60 text-xs font-bold transition-all cursor-pointer"
                            title={`"${item.kanji}" зурлагын дараалал (書き順) харах`}
                          >
                            <PenTool className="w-3.5 h-3.5 text-[#FF3366]" />
                            <span>書き順</span>
                          </button>
                          <button
                            onClick={() => toggleFavorite('kanji', item.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-orange-500 transition-colors cursor-pointer"
                            title="Хадгалах"
                          >
                            <Star className={`w-4 h-4 ${isFav ? 'fill-orange-400 text-orange-400' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Large Kanji Character & Core Info */}
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="relative group">
                          <button
                            type="button"
                            onClick={() => setSelectedStrokeKanji(item)}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-stone-900 dark:text-stone-100 hover:text-[#CC0000] dark:hover:text-[#FF6699] flex items-center justify-center text-3xl sm:text-4xl font-extrabold font-jp border border-stone-200 dark:border-stone-700 hover:border-red-300 dark:hover:border-red-800/80 shadow-xs shrink-0 transition-all cursor-pointer text-center"
                            title={`"${item.kanji}" зурлагын дараалал харах`}
                          >
                            <span>{item.kanji}</span>
                          </button>
                          <div className="absolute -bottom-2 -right-2">
                            {(() => {
                              const kp = extractKanjiPronunciation(item);
                              return (
                                <AudioButton
                                  text={kp.text}
                                  reading={kp.reading}
                                  id={`kanji_char_${item.id}`}
                                  size="xs"
                                  title={`"${item.kanji}" дуудлага сонсох`}
                                />
                              );
                            })()}
                          </div>
                        </div>
                        <div className="space-y-1 flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400">
                            {item.mongolian}
                          </h3>
                          <div className="text-xs space-y-0.5 text-stone-600 dark:text-stone-400">
                            <div className="flex flex-wrap items-baseline gap-1">
                              <span className="font-semibold text-stone-500">Онь:</span>
                              <span className="font-bold text-stone-900 dark:text-stone-200 font-jp">
                                {item.onyomi}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-baseline gap-1">
                              <span className="font-semibold text-stone-500">Күн:</span>
                              <span className="font-bold text-stone-900 dark:text-stone-200 font-jp">
                                {item.kunyomi}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Example Compound Words */}
                      {item.exampleWords && item.exampleWords.length > 0 && (
                        <div className="mt-3.5 pt-3 border-t border-stone-100 dark:border-stone-800 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                            Холбоо үгс:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {item.exampleWords.map((ew, idx) => (
                              <div
                                key={idx}
                                className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/50 dark:border-stone-700/40 flex items-center justify-between gap-1"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-baseline gap-1">
                                    <span className="font-bold text-stone-900 dark:text-stone-100 font-jp">
                                      {ew.word}
                                    </span>
                                    <span className="text-[11px] text-stone-400 font-jp">
                                      [{ew.reading}]
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-red-600 dark:text-red-400 font-medium truncate">
                                    {ew.mongolian}
                                  </p>
                                </div>
                                <AudioButton
                                  text={ew.word}
                                  reading={ew.reading}
                                  id={`kanji_ew_${item.id}_${idx}`}
                                  size="xs"
                                  variant="ghost"
                                  title={`"${ew.word}" дуудлага сонсох`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Example Sentence */}
                      {item.exampleSentence && (
                        <div className="mt-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/50 space-y-1 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold text-stone-400 block">Жишээ:</span>
                            <AudioButton
                              text={item.exampleSentence}
                              id={`kanji_ex_${item.id}`}
                              size="xs"
                              title="Жишээ өгүүлбэр сонсох"
                            />
                          </div>
                          <InteractiveJapaneseSentence
                            sentence={item.exampleSentence}
                            reading={item.exampleReading}
                            mongolian={item.exampleMongolian}
                            className="font-bold text-stone-900 dark:text-stone-100"
                          />
                          {item.exampleMongolian && (
                            <p className="text-stone-600 dark:text-stone-400 italic">
                              {item.exampleMongolian}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Action footer */}
                    <div className="pt-3 mt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedStrokeKanji(item)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 dark:text-stone-400 hover:text-[#CC0000] dark:hover:text-[#FF6699] transition-colors cursor-pointer"
                        title={`"${item.kanji}" зурлагын дараалал харах`}
                      >
                        <PenTool className="w-3.5 h-3.5 text-[#FF3366]" />
                        <span>書き順</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-400 hidden sm:inline">
                          {isLearned ? '✓ Сурсан' : 'Сураагүй'}
                        </span>
                        <button
                          onClick={() => toggleKanjiLearned(item.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isLearned
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isLearned ? 'Сурсан' : 'Сурсанд тооцох'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Kanji Stroke Order Modal */}
      <KanjiStrokeModal
        isOpen={!!selectedStrokeKanji}
        onClose={() => setSelectedStrokeKanji(null)}
        kanjiItem={selectedStrokeKanji}
      />
    </div>
  );
};
