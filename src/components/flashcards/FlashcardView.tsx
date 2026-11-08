import React, { useState, useEffect, useMemo } from 'react';
import {
  RotateCcw,
  Volume2,
  Check,
  X,
  Sparkles,
  Layers,
  BookA,
  ArrowRight,
  Flame,
  HelpCircle,
  Play,
  Shuffle,
  Loader2,
  MessageSquareQuote,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { JLPTLevel, VocabularyItem, KanjiItem, ItemStudyRecord } from '../../types';
import { KanjiStrokeOrder } from '../kanji/KanjiStrokeOrder';
import { speechService } from '../../services/speech';
import { triggerHapticFeedback } from '../../services/nativePlatform';
import { apiService } from '../../services/api';
import { SunnyLogo } from '../common/SunnyLogo';

type FlashcardType = 'vocab' | 'kanji';

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

  const [cardType, setCardType] = useState<FlashcardType>('vocab');
  const [filterMode, setFilterMode] = useState<'all' | 'weak'>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [replayStrokeKey, setReplayStrokeKey] = useState<number>(0);

  // Sunny AI Explanation State
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Deck completion tracking
  const [reviewedCards, setReviewedCards] = useState<Record<string, 'know' | 'again'>>({});
  const [isDeckFinished, setIsDeckFinished] = useState<boolean>(false);

  // Filter raw pool
  const deck = useMemo(() => {
    const studyRecords = (userProgress.itemStudyRecords || {}) as Record<string, ItemStudyRecord>;

    if (cardType === 'vocab') {
      const all = (data.vocabulary || []).filter(v => v.jlptLevel === currentLevel);
      if (filterMode === 'weak') {
        const weak = all.filter(v => {
          const r = studyRecords[v.id];
          return r && (r.masteryStatus === 'review_needed' || r.incorrectCount > 0);
        });
        return weak.length > 0 ? weak : all;
      }
      return all;
    } else {
      const all = (data.kanji || []).filter(k => k.jlptLevel === currentLevel);
      if (filterMode === 'weak') {
        const weak = all.filter(k => {
          const r = studyRecords[k.id];
          return r && (r.masteryStatus === 'review_needed' || r.incorrectCount > 0);
        });
        return weak.length > 0 ? weak : all;
      }
      return all;
    }
  }, [cardType, filterMode, currentLevel, data.vocabulary, data.kanji, userProgress.itemStudyRecords]);

  // Current Card Item
  const currentItem = deck[currentIndex];

  // Reset flip and AI explanation when moving between cards or changing mode
  useEffect(() => {
    setIsFlipped(false);
    setAiExplanation(null);
    setIsAiLoading(false);
    setReplayStrokeKey(prev => prev + 1);
  }, [currentIndex, cardType, currentLevel, filterMode]);

  // Handle deck reset
  const handleRestart = () => {
    triggerHapticFeedback('light');
    setCurrentIndex(0);
    setIsFlipped(false);
    setReviewedCards({});
    setIsDeckFinished(false);
    setAiExplanation(null);
  };

  const handleFlip = () => {
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

  // SRS "Again" action
  const handleAgain = () => {
    if (!currentItem) return;
    triggerHapticFeedback('error');
    const id = currentItem.id;
    recordAnswer(id, cardType === 'vocab' ? 'vocab' : 'kanji', currentLevel, false);
    setReviewedCards(prev => ({ ...prev, [id]: 'again' }));

    if (currentIndex + 1 < deck.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsDeckFinished(true);
    }
  };

  // SRS "Know" action
  const handleKnow = () => {
    if (!currentItem) return;
    triggerHapticFeedback('success');
    const id = currentItem.id;
    recordAnswer(id, cardType === 'vocab' ? 'vocab' : 'kanji', currentLevel, true);
    setReviewedCards(prev => ({ ...prev, [id]: 'know' }));

    if (currentIndex + 1 < deck.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsDeckFinished(true);
    }
  };

  // 1-Click Sunny AI Explanation
  const handleAskSunnyAI = async () => {
    if (!currentItem || isAiLoading) return;
    triggerHapticFeedback('light');
    setIsAiLoading(true);

    try {
      const isVocab = cardType === 'vocab';
      const vocabItem = currentItem as VocabularyItem;
      const kanjiItem = currentItem as KanjiItem;

      const targetText = isVocab ? vocabItem.japanese : kanjiItem.kanji;
      const targetMeaning = isVocab ? vocabItem.mongolian : kanjiItem.mongolian;
      const reading = isVocab ? vocabItem.reading : (kanjiItem.onyomi || kanjiItem.kunyomi || '');

      const prompt = `Та SunnyLearn аппликейшны найрсаг багш Sunny байна.
Суралцагчийн түвшин: JLPT ${currentLevel}
Үзэж буй карт: ${isVocab ? 'Үг' : 'Ханз'} 「${targetText}」 (Уншлага: ${reading}, Утга: ${targetMeaning}).

Монгол хэлээр маш товч, цэгцтэйгээр (3-4 өгүүлбэрт багтаан):
1. Энэ үгийн гол утга, өдөр тутмын амьдралд хэрхэн хэрэглэгддэг онцлог.
2. Цээжлэхэд туслах хялбар сэдэл (mnemonic) эсвэл анхаарах зүйл.
3. Байгалийн 1 богино хэрэглээний жишээ өгүүлбэр монгол орчуулгын хамт.`;

      const res = await apiService.sendSunnyAIMessage({
        message: prompt,
        currentLevel
      });

      if (res && res.reply) {
        setAiExplanation(res.reply);
      }
    } catch (err: any) {
      console.error('Sunny AI flashcard error:', err);
      showToast('Sunny AI-аас хариу авахад алдаа гарлаа.', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const knownCount = Object.values(reviewedCards).filter(v => v === 'know').length;
  const againCount = Object.values(reviewedCards).filter(v => v === 'again').length;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in select-none">
      
      {/* ========================================================= */}
      {/* 1. TOP CONTROLS: Mode, Level, Filter                      */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 shadow-sm">
        
        {/* Vocab vs Kanji Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback('light');
              setCardType('vocab');
              setCurrentIndex(0);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              cardType === 'vocab'
                ? 'bg-gradient-to-r from-[#CC0000] to-[#FF3366] text-white shadow-md shadow-red-500/25'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <BookA className="w-4 h-4" />
            <span>Үгийн сан</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback('light');
              setCardType('kanji');
              setCurrentIndex(0);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              cardType === 'kanji'
                ? 'bg-gradient-to-r from-[#CC0000] to-[#FF3366] text-white shadow-md shadow-red-500/25'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Ханз</span>
          </button>
        </div>

        {/* Filter Toggle: All vs Weak Items */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback('light');
              setFilterMode(prev => (prev === 'all' ? 'weak' : 'all'));
              setCurrentIndex(0);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'weak'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                : 'bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${filterMode === 'weak' ? 'fill-amber-500' : ''}`} />
            <span>{filterMode === 'weak' ? 'Сул тал давтах' : 'Бүх карт'}</span>
          </button>

          {/* Level Switcher */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-xl">
            {levels.map(lvl => (
              <button
                key={lvl}
                type="button"
                onClick={() => {
                  triggerHapticFeedback('light');
                  setSelectedLevel(lvl);
                  setCurrentIndex(0);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
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
      </div>

      {/* ========================================================= */}
      {/* 2. PROGRESS BAR & STATS                                   */}
      {/* ========================================================= */}
      {deck.length > 0 && !isDeckFinished && (
        <div className="flex items-center justify-between gap-4 px-2 text-xs font-bold text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-2">
            <span>Карт {currentIndex + 1} / {deck.length}</span>
            <span className="text-stone-300 dark:text-stone-700">|</span>
            <span className="text-emerald-600 dark:text-emerald-400">Мэдсэн: {knownCount}</span>
            <span className="text-rose-600 dark:text-rose-400">Давтах: {againCount}</span>
          </div>

          <div className="flex-1 max-w-xs h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#CC0000] to-[#FF3366] transition-all duration-300"
              style={{ width: `${Math.round(((currentIndex + 1) / deck.length) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MAIN CARD CANVAS (Deck Finished OR Active Card)        */}
      {/* ========================================================= */}
      {deck.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-stone-900 dark:text-stone-100">
            Энэ түвшинд карт олдсонгүй
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Өөр JLPT түвшин сонгох эсвэл "Бүх карт" горим руу шилжинэ үү.
          </p>
        </div>
      ) : isDeckFinished ? (
        /* DECK SUMMARY CARD */
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#150F12] border border-stone-200 dark:border-stone-800 shadow-xl text-center space-y-6 animate-scale-up">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-red-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-red-500/20">
            <Sparkles className="w-10 h-10" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-2xl font-black text-stone-900 dark:text-stone-100">
              Багц амжилттай дууслаа!
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Та нийт {deck.length} карт үзэж ой тогтоолтоо бататгалаа.
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

          <button
            type="button"
            onClick={handleRestart}
            className="w-full max-w-sm py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#CC0000] via-[#FF0000] to-[#FF3366] text-white font-black text-sm sm:text-base shadow-lg shadow-red-500/25 hover:opacity-95 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 mx-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Багцыг дахин эхлүүлэх</span>
          </button>
        </div>
      ) : (
        /* FLIPPABLE 3D FLASHCARD CONTAINER */
        <div className="space-y-5">
          <div className="w-full perspective-1000 min-h-[380px] sm:min-h-[420px]">
            <div
              onClick={handleFlip}
              className={`relative w-full h-full min-h-[380px] sm:min-h-[420px] rounded-3xl transition-transform duration-500 transform-style-3d cursor-pointer shadow-xl border border-stone-200/80 dark:border-stone-800/80 ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* =================================================== */}
              {/* CARD FRONT FACE                                     */}
              {/* =================================================== */}
              <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-br from-white via-stone-50 to-[#FFF7F8] dark:from-[#181114] dark:via-[#150F12] dark:to-[#1C1417]">
                
                {/* Top Badge bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-[#CC0000]/10 text-[#CC0000] dark:text-[#FF6699] border border-red-200 dark:border-red-900/60">
                      JLPT {currentLevel}
                    </span>
                    {cardType === 'vocab' && (currentItem as VocabularyItem).partOfSpeech && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-500">
                        {(currentItem as VocabularyItem).partOfSpeech}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (cardType === 'vocab') {
                        handlePlayAudio((currentItem as VocabularyItem).japanese, (currentItem as VocabularyItem).reading);
                      } else {
                        handlePlayAudio((currentItem as KanjiItem).kanji);
                      }
                    }}
                    className="p-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-[#CC0000] dark:text-[#FF3366] transition-colors cursor-pointer"
                    title="Дуудлага сонсох"
                  >
                    <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                {/* Center Word / Kanji */}
                <div className="text-center my-auto py-6 space-y-4">
                  {cardType === 'vocab' ? (
                    <div className="space-y-2">
                      <div className="text-4xl sm:text-5xl lg:text-6xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
                        {(currentItem as VocabularyItem).japanese}
                      </div>
                      {(currentItem as VocabularyItem).reading && (
                        <div className="text-lg sm:text-xl font-mono text-stone-400 dark:text-stone-500">
                          【 {(currentItem as VocabularyItem).reading} 】
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-6xl sm:text-7xl lg:text-8xl font-black text-stone-900 dark:text-stone-100 tracking-wider">
                        {(currentItem as KanjiItem).kanji}
                      </div>
                      <div className="text-xs font-bold text-stone-400">
                        JLPT {currentLevel} • Ханз
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom flip hint */}
                <div className="text-center pt-3 border-t border-stone-100 dark:border-stone-800/80">
                  <span className="text-xs font-bold text-stone-400 dark:text-stone-500 flex items-center justify-center gap-1.5 hover:text-stone-700 dark:hover:text-stone-300 transition-colors">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Картыг товшиж тайлбарыг харах</span>
                  </span>
                </div>
              </div>

              {/* =================================================== */}
              {/* CARD BACK FACE                                      */}
              {/* =================================================== */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl p-6 sm:p-7 flex flex-col justify-between bg-white dark:bg-[#181114] overflow-y-auto">
                
                {/* Header with audio and quick flip back */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100">
                      {cardType === 'vocab'
                        ? (currentItem as VocabularyItem).japanese
                        : (currentItem as KanjiItem).kanji}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (cardType === 'vocab') {
                          handlePlayAudio((currentItem as VocabularyItem).japanese, (currentItem as VocabularyItem).reading);
                        } else {
                          handlePlayAudio((currentItem as KanjiItem).kanji);
                        }
                      }}
                      className="p-1.5 rounded-xl bg-red-500/10 text-[#CC0000] dark:text-[#FF3366] cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="text-[11px] font-bold text-stone-400">
                    Тайлбар & Ханзны бүтэц
                  </span>
                </div>

                {/* Main Back Content */}
                <div className="py-3 space-y-4">
                  {/* Mongolian Meaning */}
                  <div>
                    <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider block">
                      Монгол утга:
                    </span>
                    <div className="text-xl sm:text-2xl font-black text-[#CC0000] dark:text-[#FF6699] mt-0.5">
                      {cardType === 'vocab'
                        ? (currentItem as VocabularyItem).mongolian
                        : (currentItem as KanjiItem).mongolian}
                    </div>
                  </div>

                  {/* KANJI STROKE ORDER ANIMATION (Auto-played cleanly on back) */}
                  {cardType === 'kanji' && (
                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="text-xs font-bold text-stone-700 dark:text-stone-300">
                          Зурах дараалал:
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400">
                          Оньёми: <strong>{(currentItem as KanjiItem).onyomi || '—'}</strong>
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400">
                          Күньёми: <strong>{(currentItem as KanjiItem).kunyomi || '—'}</strong>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReplayStrokeKey(k => k + 1);
                          }}
                          className="mt-1 px-2.5 py-1 rounded-lg bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-700 dark:text-stone-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
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
                          size={88}
                          autoPlay={true}
                          showNumbers={false}
                          showGrid={false}
                        />
                      </div>
                    </div>
                  )}

                  {/* VOCAB EXAMPLE SENTENCE */}
                  {cardType === 'vocab' && (currentItem as VocabularyItem).exampleSentence && (
                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 space-y-1 text-left">
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
                      <div className="text-sm font-bold text-stone-900 dark:text-stone-100">
                        {(currentItem as VocabularyItem).exampleSentence}
                      </div>
                      {(currentItem as VocabularyItem).exampleMongolian && (
                        <div className="text-xs text-stone-500 dark:text-stone-400">
                          {(currentItem as VocabularyItem).exampleMongolian}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUNNY AI 1-CLICK EXPLANATION DISPLAY / BUTTON */}
                  <div className="pt-1">
                    {aiExplanation ? (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900/40 text-left space-y-2 animate-fade-in">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full overflow-hidden border border-amber-300 shrink-0">
                            <SunnyLogo className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[11px] font-black text-amber-700 dark:text-amber-300">
                            Sunny багшийн зөвлөгөө:
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
                        className="w-full py-2.5 px-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        {isAiLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                            <span>Sunny AI тайлбар бэлдэж байна...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>Sunny AI-аас дэлгэрэнгүй тайлбар асуух</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom flip hint */}
                <div className="text-center pt-2 border-t border-stone-100 dark:border-stone-800/80">
                  <span className="text-[11px] text-stone-400">
                    Доорх товчлууруудаар цээжилсэн эсэхээ сонгоно уу
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 4. REVIEW ACTIONS: "Again" vs "Know"                      */}
          {/* ========================================================= */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-lg mx-auto pt-2">
            <button
              type="button"
              onClick={handleAgain}
              className="py-3.5 px-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border-2 border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 font-black text-sm sm:text-base shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Дахин үзэх</span>
            </button>

            <button
              type="button"
              onClick={handleKnow}
              className="py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-black text-sm sm:text-base shadow-md shadow-emerald-600/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Мэдэж байна</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
