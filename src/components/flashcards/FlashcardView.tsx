import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  RotateCcw,
  Volume2,
  Check,
  X,
  Sparkles,
  Layers,
  BookA,
  ArrowRight,
  ArrowLeft,
  Flame,
  ChevronLeft,
  ChevronRight,
  Play,
  Loader2,
  HelpCircle,
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
  GraduationCap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { JLPTLevel, VocabularyItem, KanjiItem, ItemStudyRecord } from '../../types';
import { KanjiStrokeOrder } from '../kanji/KanjiStrokeOrder';
import { speechService } from '../../services/speech';
import { triggerHapticFeedback } from '../../services/nativePlatform';
import { apiService } from '../../services/api';
import { SunnyLogo } from '../common/SunnyLogo';
import {
  CurriculumTopic,
  getTopicsForLevel,
  getOrderedItemsForTopic
} from '../../data/curriculumTopics';

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

export const FlashcardView: React.FC = () => {
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
  const [contentKind, setContentKind] = useState<ContentKind>('kanji');
  const [studyMode, setStudyMode] = useState<StudyMode>('topics');
  const [selectedTopic, setSelectedTopic] = useState<CurriculumTopic | null>(null);

  // Card Player States
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [replayStrokeKey, setReplayStrokeKey] = useState<number>(0);

  // Sunny AI Explanation State
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Session Results
  const [sessionResults, setSessionResults] = useState<Record<string, 'know' | 'again'>>({});
  const [isDeckFinished, setIsDeckFinished] = useState<boolean>(false);

  // Available topics for current level and content type
  const availableTopics = useMemo(() => {
    const pool = contentKind === 'kanji' ? data.kanji || [] : data.vocabulary || [];
    return getTopicsForLevel(currentLevel, contentKind, pool);
  }, [currentLevel, contentKind, data.kanji, data.vocabulary]);

  // Active Deck Queue
  const activeDeck = useMemo(() => {
    if (studyMode === 'topics' && selectedTopic) {
      // STRICT DETERMINISTIC CURRICULUM ORDER
      if (selectedTopic.type === 'kanji') {
        return getOrderedItemsForTopic(selectedTopic, data.kanji || []);
      } else {
        return getOrderedItemsForTopic(selectedTopic, data.vocabulary || []);
      }
    } else if (studyMode === 'review') {
      // SMART REVIEW (SRS) QUEUE
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
    setSelectedTopic(null);
    setIsDeckFinished(false);
  };

  const handleFlipCard = () => {
    triggerHapticFeedback('light');
    setIsFlipped(prev => !prev);
  };

  const handlePlayAudio = (text: string, reading?: string) => {
    triggerHapticFeedback('light');
    speechService.play(text, {
      reading,
      rate: userProgress.settings?.speechRate || 0.9
    });
  };

  // Navigation: Previous Card (Backward without altering SRS score)
  const handlePrevCard = () => {
    if (currentIndex > 0) {
      triggerHapticFeedback('light');
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Navigation: Next Card (Forward)
  const handleNextCard = () => {
    if (currentIndex + 1 < activeDeck.length) {
      triggerHapticFeedback('light');
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsDeckFinished(true);
    }
  };

  // SRS Actions
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
    } catch (err) {
      showToast('Sunny AI-аас хариу авахад алдаа гарлаа.', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Helper to fetch/derive example words for a kanji
  const getKanjiExamples = (kanjiItem: KanjiItem) => {
    if (kanjiItem.exampleWords && kanjiItem.exampleWords.length > 0) {
      return kanjiItem.exampleWords.slice(0, 2);
    }
    // Dynamically match from vocabulary dataset
    const char = kanjiItem.kanji;
    const matches = (data.vocabulary || [])
      .filter(v => v.japanese.includes(char))
      .slice(0, 2)
      .map(v => ({
        word: v.japanese,
        reading: v.reading,
        mongolian: v.mongolian
      }));
    return matches;
  };

  const isPlayerOpen = selectedTopic !== null || (studyMode === 'review' && activeDeck.length > 0 && !isDeckFinished);

  const knownCount = Object.values(sessionResults).filter(v => v === 'know').length;
  const againCount = Object.values(sessionResults).filter(v => v === 'again').length;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in select-none">
      
      {/* ========================================================= */}
      {/* 1. TOP HEADER: Level, Content Type, Study Mode             */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 shadow-sm">
        
        {/* Content Type: Kanji vs Vocabulary */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-2xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback('light');
              setContentKind('kanji');
              setSelectedTopic(null);
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              contentKind === 'kanji'
                ? 'bg-gradient-to-r from-[#CC0000] to-[#FF3366] text-white shadow-md shadow-red-500/25'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Ханз (Kanji)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback('light');
              setContentKind('vocab');
              setSelectedTopic(null);
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              contentKind === 'vocab'
                ? 'bg-gradient-to-r from-[#CC0000] to-[#FF3366] text-white shadow-md shadow-red-500/25'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <BookA className="w-4 h-4" />
            <span>Үгийн сан (Vocab)</span>
          </button>
        </div>

        {/* Level Selector Pills */}
        <div className="flex items-center justify-between sm:justify-start gap-1 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-2xl w-full sm:w-auto">
          {levels.map(lvl => (
            <button
              key={lvl}
              type="button"
              onClick={() => {
                triggerHapticFeedback('light');
                setSelectedLevel(lvl);
                setSelectedTopic(null);
              }}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                currentLevel === lvl
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-2xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              {lvl}
            </button>
          ))}
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
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              studyMode === 'topics'
                ? 'bg-[#CC0000] text-white shadow-md shadow-red-500/20'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Сэдэвчилсэн сургалт (Шинэ карт)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback('light');
              handleStartReview();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
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
              <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableTopics.map((topic, idx) => {
              const IconComponent = TOPIC_ICONS[topic.iconName] || Layers;
              const studyRecords = (userProgress.itemStudyRecords || {}) as Record<string, ItemStudyRecord>;
              
              // Calculate progress for this topic
              const totalInTopic = topic.orderedKeys.length;
              const masteredInTopic = topic.orderedKeys.filter(key => {
                const item = (contentKind === 'kanji' ? data.kanji : data.vocabulary)?.find(i => 
                  contentKind === 'kanji' ? (i as KanjiItem).kanji === key : (i as VocabularyItem).japanese === key
                );
                if (!item) return false;
                const rec = studyRecords[item.id];
                return rec && (rec.masteryStatus === 'mastered' || rec.consecutiveCorrect >= 2);
              }).length;

              const progressPercent = Math.min(100, Math.round((masteredInTopic / (totalInTopic || 1)) * 100));

              return (
                <div
                  key={topic.id}
                  onClick={() => handleStartTopic(topic)}
                  className="p-5 rounded-3xl bg-white dark:bg-[#181114] border border-stone-200 dark:border-stone-800 hover:border-[#CC0000] dark:hover:border-[#FF3366] transition-all shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm"
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
                      className="w-full mt-2 py-2.5 px-3 rounded-xl bg-stone-50 dark:bg-stone-800/80 group-hover:bg-[#CC0000] text-stone-700 dark:text-stone-300 group-hover:text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
        <div className="space-y-5">
          {/* Top Player Navigation Bar */}
          <div className="flex items-center justify-between gap-4 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={handleBackToTopics}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-black transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Сэдвүүд</span>
            </button>

            <div className="text-center">
              <span className="text-xs font-black text-stone-900 dark:text-stone-100 block">
                {selectedTopic ? `${selectedTopic.titleMongolian} • ${selectedTopic.titleJapanese}` : 'Ухаалаг давтлага (SRS)'}
              </span>
              <span className="text-[11px] font-bold text-stone-400">
                Карт {currentIndex + 1} / {activeDeck.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono text-stone-500">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ {knownCount}</span>
              <span>/</span>
              <span className="text-rose-600 dark:text-rose-400 font-bold">✕ {againCount}</span>
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
          {/* 3D FLIPPABLE CARD CANVAS (Hero Focus)                   */}
          {/* ======================================================= */}
          <div className="w-full max-w-xl mx-auto perspective-1000 min-h-[420px] sm:min-h-[470px]">
            <div
              onClick={handleFlipCard}
              className={`relative w-full h-full min-h-[420px] sm:min-h-[470px] rounded-3xl transition-transform duration-500 transform-style-3d cursor-pointer shadow-xl border border-stone-200/90 dark:border-stone-800/90 select-none ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* --------------------------------------------------- */}
              {/* CARD FRONT FACE (Minimalist Focus)                  */}
              {/* --------------------------------------------------- */}
              <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-br from-white via-[#FFFDFD] to-[#FFF6F7] dark:from-[#181114] dark:via-[#150F12] dark:to-[#1C1417]">
                
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
                <div className="text-center my-auto py-8">
                  {contentKind === 'kanji' ? (
                    <div className="text-8xl sm:text-9xl font-black text-stone-900 dark:text-stone-100 font-jp tracking-wider drop-shadow-xs">
                      {(currentItem as KanjiItem).kanji}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-4xl sm:text-5xl lg:text-6xl font-black text-stone-900 dark:text-stone-100 font-jp tracking-tight">
                        {(currentItem as VocabularyItem).japanese}
                      </div>
                      {(currentItem as VocabularyItem).reading && (
                        <div className="text-base sm:text-lg font-mono text-stone-400 dark:text-stone-500">
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

              {/* --------------------------------------------------- */}
              {/* CARD BACK FACE (Detailed, Clean, Minimalist)        */}
              {/* --------------------------------------------------- */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl p-6 sm:p-7 flex flex-col justify-between bg-white dark:bg-[#181114] overflow-y-auto">
                
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
                <div className="py-2.5 space-y-3.5">
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

                  {/* KANJI: Minimalist Stroke-Order Animation (Auto-plays once, no clutter) */}
                  {contentKind === 'kanji' && (
                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-[11px] font-extrabold text-stone-700 dark:text-stone-300">
                          Зурах дараалал:
                        </div>
                        <div className="text-xs text-stone-500 dark:text-stone-400">
                          Оньёми: <strong className="text-stone-900 dark:text-stone-100">{(currentItem as KanjiItem).onyomi || '—'}</strong>
                        </div>
                        <div className="text-xs text-stone-500 dark:text-stone-400">
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
                          showNumbers={false}
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

                  {/* VOCAB: Natural Example Sentence */}
                  {contentKind === 'vocab' && (currentItem as VocabularyItem).exampleSentence && (
                    <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 space-y-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-stone-400">Жишээ өгүүлбэр:</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayAudio((currentItem as VocabularyItem).exampleSentence!);
                          }}
                          className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-sm font-bold text-stone-900 dark:text-stone-100 font-jp">
                        {(currentItem as VocabularyItem).exampleSentence}
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
                    Доорх товчлуураар цээжилсэн эсэхээ сонгоно уу
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================= */}
          {/* BOTTOM CONTROLS: Prev Card | SRS Actions | Next Card    */}
          {/* ======================================================= */}
          <div className="flex items-center justify-between gap-3 max-w-xl mx-auto pt-2">
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
            <div className="flex items-center gap-2.5 sm:gap-3 flex-1 justify-center">
              <button
                type="button"
                onClick={handleAgain}
                className="flex-1 py-3 px-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border-2 border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 font-black text-xs sm:text-sm shadow-xs active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Дахин үзэх</span>
              </button>

              <button
                type="button"
                onClick={handleKnow}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/25 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Мэдэж байна</span>
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
              <span>Бусад сэдвүүд рүү буцах</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
