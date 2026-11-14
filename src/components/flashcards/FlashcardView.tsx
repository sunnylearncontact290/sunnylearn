import React, { useState, useEffect, useMemo } from 'react';
import {
  RotateCcw,
  Volume2,
  Check,
  BookA,
  ArrowRight,
  Flame,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Loader2,
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
  Eye,
  EyeOff
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { JLPTLevel, VocabularyItem, KanjiItem, ItemStudyRecord } from '../../types';
import { KanjiStrokeOrder } from '../kanji/KanjiStrokeOrder';
import { speechService } from '../../services/speech';
import { triggerHapticFeedback } from '../../services/nativePlatform';
import { apiService } from '../../services/api';
import { SunnyLogo } from '../common/SunnyLogo';
import { JapaneseText } from '../common/JapaneseText';
import {
  CurriculumTopic,
  getTopicsForLevel,
  getOrderedItemsForTopic,
  getTopicStats,
  TopicStats
} from '../../data/curriculumTopics';

export interface FlashcardViewProps {
  initialContentKind?: 'kanji' | 'vocab';
  initialTopicId?: string;
  onBack?: () => void;
  lockContentKind?: boolean;
}

type ContentKind = 'kanji' | 'vocab';
type StudyMode = 'topics' | 'review';

// Helper icon resolver for topics
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

export const FlashcardView: React.FC<FlashcardViewProps> = ({
  initialContentKind = 'kanji',
  initialTopicId,
  onBack,
  lockContentKind = false
}) => {
  const {
    data,
    selectedLevel,
    setSelectedLevel,
    userProgress,
    recordAnswer,
    showToast
  } = useApp();

  const currentLevel: JLPTLevel = selectedLevel || 'N5';
  const levels: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

  // Main UI States
  const [contentKind, setContentKind] = useState<ContentKind>(initialContentKind);
  const [studyMode, setStudyMode] = useState<StudyMode>('topics');
  const [selectedTopic, setSelectedTopic] = useState<CurriculumTopic | null>(null);

  // Card Player States
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [replayStrokeKey, setReplayStrokeKey] = useState<number>(0);
  const [showFurigana, setShowFurigana] = useState<boolean>(true);

  // Sunny AI Explanation State
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Session Results
  const [sessionResults, setSessionResults] = useState<Record<string, 'know' | 'again'>>({});
  const [isDeckFinished, setIsDeckFinished] = useState<boolean>(false);

  // Update contentKind if prop changes
  useEffect(() => {
    if (initialContentKind) {
      setContentKind(initialContentKind);
    }
  }, [initialContentKind]);

  // Available topics for current level and content type
  const availableTopics = useMemo(() => {
    const pool = contentKind === 'kanji' ? data.kanji || [] : data.vocabulary || [];
    return getTopicsForLevel(currentLevel, contentKind, pool);
  }, [currentLevel, contentKind, data.kanji, data.vocabulary]);

  // Precomputed stats for each topic (total, mastered, progressPercent)
  const topicStatsMap = useMemo(() => {
    const map = new Map<string, TopicStats>();
    const studyRecords = (userProgress.itemStudyRecords || {}) as Record<string, ItemStudyRecord>;
    const pool = contentKind === 'kanji' ? data.kanji || [] : data.vocabulary || [];
    for (const topic of availableTopics) {
      map.set(topic.id, getTopicStats(topic, pool, studyRecords));
    }
    return map;
  }, [availableTopics, contentKind, data.kanji, data.vocabulary, userProgress.itemStudyRecords]);

  // If initialTopicId provided, auto-select that topic on mount / change
  useEffect(() => {
    if (initialTopicId && availableTopics.length > 0) {
      const found = availableTopics.find(t => t.id === initialTopicId);
      if (found) {
        setSelectedTopic(found);
        setCurrentIndex(0);
        setIsFlipped(false);
        setIsDeckFinished(false);
        setSessionResults({});
      }
    }
  }, [initialTopicId, availableTopics]);

  // Active Deck Queue
  const activeDeck = useMemo(() => {
    if (studyMode === 'topics' && selectedTopic) {
      if (selectedTopic.type === 'kanji') {
        return getOrderedItemsForTopic(selectedTopic, data.kanji || []);
      } else {
        return getOrderedItemsForTopic(selectedTopic, data.vocabulary || []);
      }
    } else if (studyMode === 'review') {
      const studyRecords = (userProgress.itemStudyRecords || {}) as Record<string, ItemStudyRecord>;
      if (contentKind === 'kanji') {
        const kanjiPool = (data.kanji || []).filter(k => k.jlptLevel === currentLevel);
        const weak = kanjiPool.filter(k => {
          const r = studyRecords[k.id];
          return r && (r.masteryStatus === 'review_needed' || r.incorrectCount > 0);
        });
        return weak.length > 0 ? weak : kanjiPool.slice(0, 20);
      } else {
        const vocabPool = (data.vocabulary || []).filter(v => v.jlptLevel === currentLevel);
        const weak = vocabPool.filter(v => {
          const r = studyRecords[v.id];
          return r && (r.masteryStatus === 'review_needed' || r.incorrectCount > 0);
        });
        return weak.length > 0 ? weak : vocabPool.slice(0, 20);
      }
    }
    return [];
  }, [studyMode, selectedTopic, contentKind, currentLevel, data.kanji, data.vocabulary, userProgress.itemStudyRecords]);

  // Current Card
  const currentItem = activeDeck[currentIndex];

  // Reset card state when moving or switching topic
  useEffect(() => {
    setIsFlipped(false);
    setAiExplanation(null);
    setIsAiLoading(false);
    setReplayStrokeKey(prev => prev + 1);
  }, [currentIndex, selectedTopic, studyMode, contentKind]);

  // Reset when level changes
  useEffect(() => {
    setSelectedTopic(null);
    setCurrentIndex(0);
    setIsDeckFinished(false);
    setSessionResults({});
  }, [currentLevel, contentKind]);

  // Launch a topic deck
  const handleStartTopic = (topic: CurriculumTopic) => {
    triggerHapticFeedback('light');
    setSelectedTopic(topic);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsDeckFinished(false);
    setSessionResults({});
  };

  // Launch Smart Review
  const handleStartReview = () => {
    triggerHapticFeedback('light');
    setSelectedTopic(null);
    setStudyMode('review');
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsDeckFinished(false);
    setSessionResults({});
  };

  const handleBackToTopics = () => {
    triggerHapticFeedback('light');
    if (selectedTopic || studyMode === 'review') {
      setSelectedTopic(null);
      setIsDeckFinished(false);
      setStudyMode('topics');
    } else if (onBack) {
      onBack();
    }
  };

  const handleFlipCard = () => {
    triggerHapticFeedback('light');
    setIsFlipped(prev => !prev);
  };

  const handlePlayAudio = (text: string, reading?: string) => {
    triggerHapticFeedback('light');
    speechService.play(text, {
      reading
    });
  };

  const handlePrevCard = () => {
    if (currentIndex > 0) {
      triggerHapticFeedback('light');
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNextCard = () => {
    if (currentIndex + 1 < activeDeck.length) {
      triggerHapticFeedback('light');
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsDeckFinished(true);
    }
  };

  const handleAgain = () => {
    if (!currentItem) return;
    triggerHapticFeedback('error');
    const id = currentItem.id;
    recordAnswer(id, contentKind === 'kanji' ? 'kanji' : 'vocab', currentLevel, false);
    setSessionResults(prev => ({ ...prev, [id]: 'again' }));
    handleNextCard();
  };

  const handleKnow = () => {
    if (!currentItem) return;
    triggerHapticFeedback('success');
    const id = currentItem.id;
    recordAnswer(id, contentKind === 'kanji' ? 'kanji' : 'vocab', currentLevel, true);
    setSessionResults(prev => ({ ...prev, [id]: 'know' }));
    handleNextCard();
  };

  // 1-Click Sunny AI Explanation
  const handleAskSunnyAI = async () => {
    if (!currentItem || isAiLoading) return;
    triggerHapticFeedback('light');
    setIsAiLoading(true);

    try {
      const isKanji = contentKind === 'kanji';
      const kanjiItem = currentItem as KanjiItem;
      const vocabItem = currentItem as VocabularyItem;

      const targetText = isKanji ? kanjiItem.kanji : vocabItem.japanese;
      const targetMeaning = isKanji ? kanjiItem.mongolian : vocabItem.mongolian;
      const reading = isKanji ? `${kanjiItem.onyomi || ''} ${kanjiItem.kunyomi || ''}` : vocabItem.reading;

      const prompt = `Та SunnyLearn аппликейшны найрсаг япон хэлний багш Sunny байна.
Суралцагчийн түвшин: JLPT ${currentLevel}
Үзэж буй карт: ${isKanji ? 'Ханз' : 'Үг'} 「${targetText}」 (Уншлага: ${reading}, Утга: ${targetMeaning}).

Монгол хэлээр маш товч, цэгцтэй (2-3 өгүүлбэрт багтаан):
1. Гол утга ба цээжлэх хялбар арга (хөгжилтэй төсөөлөл/mnemonic).
2. Бодит богино хэрэглээний жишээ өгүүлбэр монгол орчуулгын хамт.`;

      const res = await apiService.sendSunnyAIMessage({
        message: prompt,
        currentLevel
      });

      if (res && res.reply) {
        setAiExplanation(res.reply);
      }
    } catch {
      showToast('Sunny AI-аас хариу авахад алдаа гарлаа.', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const getKanjiExamples = (kanjiItem: KanjiItem) => {
    if (kanjiItem.exampleWords && kanjiItem.exampleWords.length > 0) {
      return kanjiItem.exampleWords.slice(0, 2);
    }
    const char = kanjiItem.kanji;
    return (data.vocabulary || [])
      .filter(v => v.japanese.includes(char))
      .slice(0, 2)
      .map(v => ({
        word: v.japanese,
        reading: v.reading,
        mongolian: v.mongolian
      }));
  };

  const isPlayerOpen = selectedTopic !== null || (studyMode === 'review' && activeDeck.length > 0 && !isDeckFinished);
  const knownCount = Object.values(sessionResults).filter(v => v === 'know').length;
  const againCount = Object.values(sessionResults).filter(v => v === 'again').length;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in select-none">
      
      {/* ========================================================= */}
      {/* 1. TOP HEADER: Content Kind, Level, and Mode             */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 shadow-sm">
        
        {/* Left side: Back to Hub if onBack provided, or Content Kind Switcher */}
        <div className="flex items-center gap-2">
          {onBack && !isPlayerOpen && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-bold transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Буцах</span>
            </button>
          )}

          {!lockContentKind && (
            <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback('light');
                  setContentKind('kanji');
                  setSelectedTopic(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  contentKind === 'kanji'
                    ? 'bg-gradient-to-r from-[#CC0000] to-[#FF3366] text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ханз</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback('light');
                  setContentKind('vocab');
                  setSelectedTopic(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  contentKind === 'vocab'
                    ? 'bg-gradient-to-r from-[#CC0000] to-[#FF3366] text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <BookA className="w-3.5 h-3.5" />
                <span>Үгийн сан</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. MODE SWITCH: Topics Curriculum vs Smart Review (SRS)   */}
      {/* ========================================================= */}
      {!isPlayerOpen && !isDeckFinished && (
        <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback('light');
              setStudyMode('topics');
            }}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              studyMode === 'topics'
                ? 'bg-[#CC0000] text-white shadow-md shadow-red-500/20'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Сэдэвчилсэн сургалт</span>
          </button>

          <button
            type="button"
            onClick={handleStartReview}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              studyMode === 'review'
                ? 'bg-[#CC0000] text-white shadow-md shadow-red-500/20'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Ухаалаг давтлага (SRS)</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. TOPIC SELECTION GRID (When NOT in active player)       */}
      {/* ========================================================= */}
      {!isPlayerOpen && !isDeckFinished && studyMode === 'topics' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100">
                {currentLevel} Түвшний {contentKind === 'kanji' ? 'Ханзны Сэдвүүд' : 'Үгийн Сангийн Сэдвүүд'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Суралцах сэдвээ сонгон дарааллын дагуу системтэй цээжлээрэй.
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
              Нийт {availableTopics.length} сэдэв
            </span>
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
                  onClick={() => handleStartTopic(topic)}
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

                  {/* Progress & Start Button */}
                  <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                    <div className="flex items-center justify-between text-[11px] font-bold text-stone-500">
                      <span>{totalInTopic} {contentKind === 'kanji' ? 'ханз' : 'үг'}</span>
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
                      <span>Флаш карт эхлүүлэх</span>
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
      {/* 4. ACTIVE FLASHCARD PLAYER (Minimalist Hero Focus)        */}
      {/* ========================================================= */}
      {isPlayerOpen && (
        <div className="space-y-4 sm:space-y-5">
          {/* Top Player Navigation Bar */}
          <div className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 shadow-xs">
            <button
              type="button"
              onClick={handleBackToTopics}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-black transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{onBack && !selectedTopic ? 'Буцах' : 'Сэдвүүд'}</span>
            </button>

            <div className="text-center min-w-0 px-2">
              <span className="text-xs sm:text-sm font-black text-stone-900 dark:text-stone-100 block truncate">
                {selectedTopic ? `${selectedTopic.titleMongolian} • ${selectedTopic.titleJapanese}` : 'Ухаалаг давтлага (SRS)'}
              </span>
              <span className="text-[11px] font-bold text-stone-400">
                Карт {currentIndex + 1} / {activeDeck.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFurigana(prev => !prev)}
                className={`p-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  showFurigana
                    ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900/60 text-[#CC0000] dark:text-[#FF6699]'
                    : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500'
                }`}
                title={showFurigana ? 'Фуригана нуух' : 'Фуригана харуулах'}
              >
                {showFurigana ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>

              <div className="flex items-center gap-1 text-xs font-mono text-stone-500 shrink-0">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ {knownCount}</span>
                <span>/</span>
                <span className="text-rose-600 dark:text-rose-400 font-bold">✕ {againCount}</span>
              </div>
            </div>
          </div>

          {/* Slim Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#CC0000] to-[#FF3366] transition-all duration-300"
              style={{ width: `${Math.round(((currentIndex + 1) / (activeDeck.length || 1)) * 100)}%` }}
            />
          </div>

          {/* ======================================================= */}
          {/* CARD CANVAS (Natural height, NO internal scrollbars)    */}
          {/* ======================================================= */}
          <div className="w-full max-w-xl mx-auto">
            <div
              onClick={handleFlipCard}
              className="w-full rounded-3xl cursor-pointer shadow-xl border border-stone-200/90 dark:border-stone-800/90 select-none bg-white dark:bg-[#181114] transition-all hover:shadow-2xl overflow-hidden"
            >
              {/* --------------------------------------------------- */}
              {/* CARD FRONT FACE (Minimalist Clean Focus)            */}
              {/* --------------------------------------------------- */}
              {!isFlipped ? (
                <div className="w-full p-6 sm:p-8 flex flex-col justify-between min-h-[340px] sm:min-h-[380px] bg-gradient-to-br from-white via-[#FFFDFD] to-[#FFF6F7] dark:from-[#181114] dark:via-[#150F12] dark:to-[#1C1417] animate-fade-in">
                  {/* Top minimalist header */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-[#CC0000]/10 text-[#CC0000] dark:text-[#FF6699] border border-red-200 dark:border-red-900/60">
                      JLPT {currentLevel} • #{currentIndex + 1}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (contentKind === 'kanji') {
                          handlePlayAudio((currentItem as KanjiItem).kanji);
                        } else {
                          handlePlayAudio((currentItem as VocabularyItem).japanese, (currentItem as VocabularyItem).reading);
                        }
                      }}
                      className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-[#CC0000] dark:text-[#FF3366] transition-colors cursor-pointer"
                      title="Дуудлага сонсох"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Center Hero Kanji or Word */}
                  <div className="text-center my-auto py-6">
                    {contentKind === 'kanji' ? (
                      <div className="text-8xl sm:text-9xl font-black text-stone-900 dark:text-stone-100 font-jp tracking-wider drop-shadow-xs">
                        {(currentItem as KanjiItem).kanji}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-4xl sm:text-5xl lg:text-6xl font-black text-stone-900 dark:text-stone-100 font-jp tracking-tight">
                          <JapaneseText
                            text={(currentItem as VocabularyItem).japanese}
                            reading={(currentItem as VocabularyItem).reading}
                            showFurigana={showFurigana}
                          />
                        </div>
                        {(currentItem as VocabularyItem).reading && (
                          <div className="text-sm sm:text-base font-mono text-stone-400 dark:text-stone-500 font-jp">
                            【 {(currentItem as VocabularyItem).reading} 】
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom flip hint */}
                  <div className="text-center pt-3 border-t border-stone-100 dark:border-stone-800/80">
                    <span className="text-xs font-bold text-stone-400 dark:text-stone-500 flex items-center justify-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Картыг товшиж эргүүлэх</span>
                    </span>
                  </div>
                </div>
              ) : (
                /* --------------------------------------------------- */
                /* CARD BACK FACE (Detailed, Clean, Minimalist)        */
                /* --------------------------------------------------- */
                <div className="w-full p-5 sm:p-7 flex flex-col justify-between bg-white dark:bg-[#181114] space-y-4 animate-fade-in">
                  {/* Top header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-stone-900 dark:text-stone-100 font-jp">
                        {contentKind === 'kanji'
                          ? (currentItem as KanjiItem).kanji
                          : (currentItem as VocabularyItem).japanese}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (contentKind === 'kanji') {
                            handlePlayAudio((currentItem as KanjiItem).kanji);
                          } else {
                            handlePlayAudio((currentItem as VocabularyItem).japanese, (currentItem as VocabularyItem).reading);
                          }
                        }}
                        className="p-1 rounded-lg bg-red-500/10 text-[#CC0000] dark:text-[#FF3366] cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    <span className="text-[11px] font-bold text-stone-400">
                      {contentKind === 'kanji' ? 'Ханзны тайлбар' : (currentItem as VocabularyItem).partOfSpeech || 'Үг'}
                    </span>
                  </div>

                  {/* Center Content */}
                  <div className="py-1 space-y-3.5">
                    {/* Mongolian Meaning */}
                    <div>
                      <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider block">
                        Монгол утга:
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-[#CC0000] dark:text-[#FF6699] mt-0.5">
                        {contentKind === 'kanji'
                          ? (currentItem as KanjiItem).mongolian
                          : (currentItem as VocabularyItem).mongolian}
                      </div>
                    </div>

                    {/* KANJI: Minimalist Stroke-Order Animation with visible numbers 1..N */}
                    {contentKind === 'kanji' && (
                      <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="text-[11px] font-extrabold text-stone-700 dark:text-stone-300">
                            Зурах дараалал:
                          </div>
                          <div className="text-xs text-stone-500 dark:text-stone-400 font-jp">
                            Оньёми: <strong className="text-stone-900 dark:text-stone-100">{(currentItem as KanjiItem).onyomi || '—'}</strong>
                          </div>
                          <div className="text-xs text-stone-500 dark:text-stone-400 font-jp">
                            Күньёми: <strong className="text-stone-900 dark:text-stone-100">{(currentItem as KanjiItem).kunyomi || '—'}</strong>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplayStrokeKey(k => k + 1);
                            }}
                            className="mt-1 px-2.5 py-1 rounded-lg bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 text-stone-700 dark:text-stone-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Дахин тоглуулах</span>
                          </button>
                        </div>

                        <div
                          key={replayStrokeKey}
                          className="w-24 h-24 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center p-1 shrink-0 overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <KanjiStrokeOrder
                            kanji={(currentItem as KanjiItem).kanji}
                            size={84}
                            autoPlay={true}
                            showNumbers={true}
                            showGrid={false}
                          />
                        </div>
                      </div>
                    )}

                    {/* KANJI: 1-2 Useful Example Words */}
                    {contentKind === 'kanji' && (
                      <div className="space-y-1.5 text-left">
                        <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider block">
                          Жишээ үгс:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {getKanjiExamples(currentItem as KanjiItem).map((ex, exIdx) => (
                            <div
                              key={exIdx}
                              className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800 text-xs"
                            >
                              <div className="font-bold text-stone-900 dark:text-stone-100 font-jp">
                                {ex.word} <span className="font-normal text-stone-400">【{ex.reading}】</span>
                              </div>
                              <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                                {ex.mongolian}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* VOCAB: Natural Example Sentence with clean ruby furigana */}
                    {contentKind === 'vocab' && (currentItem as VocabularyItem).exampleSentence && (
                      <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 space-y-1.5 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-stone-400">Жишээ өгүүлбэр:</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayAudio((currentItem as VocabularyItem).exampleSentence!);
                            }}
                            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-sm font-bold text-stone-900 dark:text-stone-100 font-jp leading-relaxed">
                          <JapaneseText
                            text={(currentItem as VocabularyItem).exampleSentence!}
                            reading={(currentItem as VocabularyItem).exampleReading}
                            showFurigana={showFurigana}
                          />
                        </div>
                        {(currentItem as VocabularyItem).exampleMongolian && (
                          <div className="text-xs text-stone-500 dark:text-stone-400">
                            {(currentItem as VocabularyItem).exampleMongolian}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUNNY AI 1-CLICK EXPLANATION BUTTON */}
                    <div className="pt-1">
                      {aiExplanation ? (
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900/40 text-left space-y-1.5 animate-fade-in">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full overflow-hidden border border-amber-300 shrink-0">
                              <SunnyLogo className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[11px] font-black text-amber-700 dark:text-amber-300">
                              Sunny багшийн цээжлэх зөвлөгөө:
                            </span>
                          </div>
                          <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line">
                            {aiExplanation}
                          </p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isAiLoading}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAskSunnyAI();
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 hover:bg-amber-100 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                          {isAiLoading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                              <span>Sunny AI тайлбар бэлдэж байна...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span>Sunny AI цээжлэх зөвлөгөө авах</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bottom flip hint */}
                  <div className="text-center pt-2 border-t border-stone-100 dark:border-stone-800/80">
                    <span className="text-[11px] text-stone-400">
                      Картыг товшиж урд тал руу эргүүлэх боломжтой
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ======================================================= */}
          {/* BOTTOM CONTROLS: Prev Card | SRS Actions | Next Card    */}
          {/* ======================================================= */}
          <div className="flex items-center justify-between gap-2.5 sm:gap-3 max-w-xl mx-auto pt-1">
            {/* Backward Navigation */}
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={handlePrevCard}
              className="p-3 sm:px-4 sm:py-3 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed text-stone-700 dark:text-stone-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
              title="Өмнөх карт"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Өмнөх</span>
            </button>

            {/* SRS Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-center">
              <button
                type="button"
                onClick={handleAgain}
                className="flex-1 py-3 px-3 sm:px-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border-2 border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 font-black text-xs sm:text-sm shadow-xs active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Дахин үзэх</span>
              </button>

              <button
                type="button"
                onClick={handleKnow}
                className="flex-1 py-3 px-3 sm:px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/25 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Сурсан гэж тэмдэглэх</span>
              </button>
            </div>

            {/* Forward Navigation */}
            <button
              type="button"
              onClick={handleNextCard}
              className="p-3 sm:px-4 sm:py-3 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
              title="Дараагийн карт"
            >
              <span className="hidden sm:inline">Дараах</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. DECK COMPLETION VICTORY SCREEN                         */}
      {/* ========================================================= */}
      {isDeckFinished && (
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 shadow-xl text-center space-y-6 max-w-xl mx-auto animate-scale-up">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-red-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-red-500/20">
            <Sparkles className="w-10 h-10" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-2xl font-black text-stone-900 dark:text-stone-100">
              Баяр хүргэе! Сэдэв дууслаа!
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {selectedTopic?.titleMongolian || 'Давтлагын багц'} нийт {activeDeck.length} картыг судалж бататгалаа.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 py-2">
            <div className="px-5 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center min-w-[120px]">
              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Мэдсэн</div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-300">{knownCount}</div>
            </div>
            <div className="px-5 py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center min-w-[120px]">
              <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase">Давтах</div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-300">{againCount}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback('light');
                setCurrentIndex(0);
                setIsFlipped(false);
                setIsDeckFinished(false);
                setSessionResults({});
              }}
              className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Энэ сэдвийг дахин үзэх</span>
            </button>

            <button
              type="button"
              onClick={handleBackToTopics}
              className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-gradient-to-r from-[#CC0000] via-[#FF0000] to-[#FF3366] text-white font-black text-xs sm:text-sm shadow-md shadow-red-500/25 hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{onBack && !selectedTopic ? 'Буцах' : 'Бусад сэдвүүд рүү буцах'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
