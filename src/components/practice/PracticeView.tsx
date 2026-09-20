import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Volume2,
  ArrowRight,
  Sparkles,
  BookOpen,
  Languages,
  PenTool,
  MessageSquare,
  AlertTriangle,
  Play,
  Trophy,
  ArrowLeft,
  Flame,
  Check,
  X,
  Target
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { JLPTLevel, ContentType, ItemStudyRecord } from '../../types';
import { LevelBadge } from '../common/LevelBadge';
import { learningEngine, PracticeCategory, PracticeQuestion } from '../../services/learningEngine';
import { SentenceScrambleCard } from './SentenceScrambleCard';

export const PracticeView: React.FC = () => {
  const {
    data,
    selectedLevel,
    setSelectedLevel,
    userProgress,
    recordAnswer,
    recordPracticeCompleted,
    setActiveTab,
    practiceMissedItems,
    setPracticeMissedItems,
    isPremium,
    isAdmin,
    openSunnyAIWithQuiz
  } = useApp();

  const isUnlocked = isPremium || isAdmin;
  const currentLevel: JLPTLevel = selectedLevel || 'N5';

  // Category state
  const [activeCategory, setActiveCategory] = useState<PracticeCategory>('mixed');
  const [questionCount, setQuestionCount] = useState<number>(10);

  // Session state
  const [sessionActive, setSessionActive] = useState<boolean>(false);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [sessionResults, setSessionResults] = useState<{
    correctCount: number;
    wrongCount: number;
    missedQuestions: PracticeQuestion[];
    isFinished: boolean;
    breakdown: {
      vocab: { score: number; total: number };
      kanji: { score: number; total: number };
      grammar: { score: number; total: number };
      sentence: { score: number; total: number };
    };
  }>({
    correctCount: 0,
    wrongCount: 0,
    missedQuestions: [],
    isFinished: false,
    breakdown: {
      vocab: { score: 0, total: 0 },
      kanji: { score: 0, total: 0 },
      grammar: { score: 0, total: 0 },
      sentence: { score: 0, total: 0 }
    }
  });

  // Calculate review-needed count for current level
  const weakCount = useMemo(() => {
    const records = (userProgress.itemStudyRecords || {}) as Record<string, ItemStudyRecord>;
    return Object.values(records).filter(
      r => r.jlptLevel === currentLevel && (r.masteryStatus === 'review_needed' || r.incorrectCount > 0)
    ).length;
  }, [userProgress.itemStudyRecords, currentLevel]);

  // Check if there are practiceMissedItems from Quiz or previous session
  useEffect(() => {
    if (practiceMissedItems && practiceMissedItems.length > 0) {
      startSession('review', practiceMissedItems);
      // Clear global missed items after consumption
      setPracticeMissedItems([]);
    }
  }, [practiceMissedItems]);

  const startSession = useCallback((category: PracticeCategory, specificIds?: string[]) => {
    setActiveCategory(category);
    const generated = learningEngine.generatePracticeSession(
      data,
      currentLevel,
      category,
      userProgress,
      questionCount,
      specificIds,
      isUnlocked
    );

    if (generated.length === 0) {
      return;
    }

    setQuestions(generated);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(false);
    setSessionResults({
      correctCount: 0,
      wrongCount: 0,
      missedQuestions: [],
      isFinished: false,
      breakdown: {
        vocab: { score: 0, total: 0 },
        kanji: { score: 0, total: 0 },
        grammar: { score: 0, total: 0 },
        sentence: { score: 0, total: 0 }
      }
    });
    setSessionActive(true);
  }, [data, currentLevel, userProgress, questionCount]);

  const currentQ = questions[currentIndex] || null;

  const handleSelectOption = (index: number) => {
    if (isAnswered || !currentQ) return;
    setSelectedOption(index);
    setIsAnswered(true);

    const correct = index === currentQ.correctIndex;
    setIsCorrect(correct);

    // Record answer in UserProgress & spaced repetition engine
    recordAnswer(currentQ.itemId, currentQ.category, currentLevel, correct);

    // Update session tally
    setSessionResults(prev => {
      const b = { ...prev.breakdown };
      const cat = currentQ.category;
      if (b[cat]) {
        b[cat] = {
          score: b[cat].score + (correct ? 1 : 0),
          total: b[cat].total + 1
        };
      }
      return {
        ...prev,
        correctCount: prev.correctCount + (correct ? 1 : 0),
        wrongCount: prev.wrongCount + (correct ? 0 : 1),
        missedQuestions: correct ? prev.missedQuestions : [...prev.missedQuestions, currentQ],
        breakdown: b
      };
    });
  };

  const handleScrambleAnswer = (correct: boolean) => {
    if (isAnswered || !currentQ) return;
    setIsAnswered(true);
    setIsCorrect(correct);

    recordAnswer(currentQ.itemId, currentQ.category, currentLevel, correct);

    setSessionResults(prev => {
      const b = { ...prev.breakdown };
      const cat = currentQ.category;
      if (b[cat]) {
        b[cat] = {
          score: b[cat].score + (correct ? 1 : 0),
          total: b[cat].total + 1
        };
      }
      return {
        ...prev,
        correctCount: prev.correctCount + (correct ? 1 : 0),
        wrongCount: prev.wrongCount + (correct ? 0 : 1),
        missedQuestions: correct ? prev.missedQuestions : [...prev.missedQuestions, currentQ],
        breakdown: b
      };
    });
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsCorrect(false);
    } else {
      // Session finished
      const finalScore = sessionResults.correctCount;
      const total = questions.length;
      const pct = total > 0 ? Math.round((finalScore / total) * 100) : 0;

      recordPracticeCompleted({
        id: `practice-${currentLevel}-${Date.now()}`,
        type: activeCategory,
        jlptLevel: currentLevel,
        score: finalScore,
        total,
        percentage: pct,
        breakdown: sessionResults.breakdown,
        missedItemIds: sessionResults.missedQuestions.map(q => q.itemId),
        date: new Date().toISOString()
      });

      setSessionResults(prev => ({
        ...prev,
        isFinished: true
      }));
    }
  };

  const handleExitSession = () => {
    setSessionActive(false);
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setSessionResults(prev => ({ ...prev, isFinished: false }));
  };

  const levels: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

  const categories: { key: PracticeCategory; label: string; icon: any; desc: string }[] = [
    { key: 'mixed', label: 'Холимог', icon: Sparkles, desc: 'Үг, ханз, дүрэм, өгүүлбэр хосолсон' },
    { key: 'vocab', label: 'Үгсийн сан', icon: Languages, desc: 'Утга, уншлага, сонголт' },
    { key: 'kanji', label: 'Ханз', icon: PenTool, desc: 'Утга, Оньёми, Күньёми' },
    { key: 'grammar', label: 'Дүрэм', icon: BookOpen, desc: 'Нөхөж бичих, бүтэц, утга' },
    { key: 'sentence', label: 'Өгүүлбэр', icon: MessageSquare, desc: 'Үг эвлүүлэх, орчуулга' },
    { key: 'review', label: 'Давтах хэрэгтэй', icon: AlertTriangle, desc: 'Алдсан, сул эзэмшсэн зүйлс' }
  ];

  // 1. RESULTS SCREEN
  if (sessionActive && sessionResults.isFinished) {
    const total = questions.length;
    const score = sessionResults.correctCount;
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    const hasMissed = sessionResults.missedQuestions.length > 0;

    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-10 shadow-sm text-center space-y-6">
          {/* Badge & Icon */}
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center text-amber-500">
            <Trophy className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
              JLPT {currentLevel} Дасгал
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
              Дасгал амжилттай дууслаа!
            </h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm max-w-md mx-auto">
              Таны сургалтын үр дүнг бүртгэж, давталтын хуваарьт шинэчлэн оруулав.
            </p>
          </div>

          {/* Score Display */}
          <div className="flex justify-center items-baseline gap-2 py-4">
            <span className="text-5xl sm:text-6xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {score}
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-stone-400">
              / {total}
            </span>
            <span className="ml-3 px-3 py-1 rounded-xl text-lg font-bold bg-amber-50 dark:bg-stone-800 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
              {pct}%
            </span>
          </div>

          {/* Breakdown by category */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
            {Object.entries(sessionResults.breakdown).map(([key, rawItem]) => {
              const item = rawItem as { score: number; total: number };
              if (item.total === 0) return null;
              const catNames: Record<string, string> = {
                vocab: 'Үгсийн сан',
                kanji: 'Ханз',
                grammar: 'Дүрэм',
                sentence: 'Өгүүлбэр'
              };
              const catPct = Math.round((item.score / item.total) * 100);
              return (
                <div
                  key={key}
                  className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 text-center space-y-1"
                >
                  <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                    {catNames[key] || key}
                  </span>
                  <div className="text-lg font-bold text-stone-900 dark:text-stone-100">
                    {item.score} / {item.total}
                  </div>
                  <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {catPct}%
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
            {hasMissed && (
              <button
                type="button"
                onClick={() => {
                  const missedIds = sessionResults.missedQuestions.map(q => q.itemId);
                  startSession('review', missedIds);
                }}
                className="px-5 py-3 rounded-xl font-bold text-sm sm:text-base bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Алдсан асуултуудаа давтах ({sessionResults.missedQuestions.length})
              </button>
            )}

            <button
              type="button"
              onClick={() => startSession(activeCategory)}
              className="px-5 py-3 rounded-xl font-bold text-sm sm:text-base bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Дахин хийх
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('quiz')}
              className="px-5 py-3 rounded-xl font-bold text-sm sm:text-base bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <Target className="w-4 h-4" />
              Сорил (Quiz) өгөх
            </button>

            <button
              type="button"
              onClick={handleExitSession}
              className="px-5 py-3 rounded-xl font-bold text-sm sm:text-base text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer transition-colors"
            >
              Бусад төрөл сонгох
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. ACTIVE PRACTICE SESSION
  if (sessionActive && currentQ) {
    const isScramble = currentQ.subType === 'sentence_scramble' && currentQ.scrambleWords && currentQ.correctOrder;
    const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

    return (
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-fade-in">
        {/* HUD Top Bar */}
        <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExitSession}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer transition-all"
              title="Дасгал түр завсарлах"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <LevelBadge level={currentLevel} size="sm" />
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Асуулт {currentIndex + 1} / {questions.length}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-stone-600 dark:text-stone-300">
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <Check className="w-3.5 h-3.5" /> {sessionResults.correctCount}
              </span>
              <span className="text-stone-300 dark:text-stone-700">|</span>
              <span className="text-rose-500 flex items-center gap-0.5">
                <X className="w-3.5 h-3.5" /> {sessionResults.wrongCount}
              </span>
            </div>

            <div className="w-24 sm:w-32 bg-stone-100 dark:bg-stone-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-sm space-y-6">
          {isScramble ? (
            <SentenceScrambleCard
              prompt={currentQ.prompt}
              promptSub={currentQ.promptSub}
              scrambleWords={currentQ.scrambleWords!}
              correctOrder={currentQ.correctOrder!}
              explanation={currentQ.explanation}
              audioText={currentQ.audioText}
              reading={currentQ.reading}
              isAnswered={isAnswered}
              onAnswer={handleScrambleAnswer}
            />
          ) : (
            <div className="space-y-6">
              {/* Question Header & Prompt */}
              <div className="space-y-3 text-center">
                {currentQ.promptBadge && (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    {currentQ.promptBadge}
                  </span>
                )}

                <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                  {currentQ.prompt}
                </h2>

                {currentQ.promptSub && (
                  <p className="text-sm sm:text-base font-medium text-stone-500 dark:text-stone-400">
                    {currentQ.promptSub}
                  </p>
                )}
              </div>

              {/* Multiple Choice Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {currentQ.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrectAnswer = idx === currentQ.correctIndex;

                  let btnStyle =
                    'bg-white dark:bg-stone-800/80 border-stone-200 dark:border-stone-700/80 text-stone-800 dark:text-stone-100 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-stone-700/80';

                  if (isAnswered) {
                    if (isCorrectAnswer) {
                      btnStyle =
                        'bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20';
                    } else if (isSelected) {
                      btnStyle =
                        'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/20';
                    } else {
                      btnStyle =
                        'opacity-40 bg-stone-100 dark:bg-stone-800/40 text-stone-400 border-transparent';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(idx)}
                      className={`min-h-[56px] p-4 rounded-2xl border-2 font-semibold text-base sm:text-lg transition-all text-left flex items-center justify-between cursor-pointer active:scale-[0.98] ${btnStyle}`}
                    >
                      <span>{option}</span>
                      {isAnswered && isCorrectAnswer && (
                        <Check className="w-5 h-5 text-white shrink-0 ml-2" />
                      )}
                      {isAnswered && isSelected && !isCorrectAnswer && (
                        <X className="w-5 h-5 text-white shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Immediate Feedback Card */}
              {isAnswered && (
                <div
                  className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-2 animate-fade-in ${
                    isCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-base sm:text-lg">
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <span>Зөв хариуллаа! 🎉</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                        <span>Буруу хариуллаа</span>
                      </>
                    )}
                  </div>
                  {currentQ.explanation && (
                    <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                      {currentQ.explanation}
                    </p>
                  )}
                  {!isCorrect && (
                    <div className="pt-2 flex justify-start">
                      <button
                        type="button"
                        onClick={() => {
                          const userAnsText =
                            selectedOption !== null && currentQ.options && currentQ.options[selectedOption]
                              ? currentQ.options[selectedOption]
                              : 'Хариулаагүй';
                          const correctAnsText =
                            currentQ.options && currentQ.correctAnswer !== undefined
                              ? currentQ.options[currentQ.correctAnswer]
                              : '';
                          openSunnyAIWithQuiz({
                            question: currentQ.question,
                            questionReading: currentQ.reading,
                            userAnswer: userAnsText,
                            correctAnswer: correctAnsText,
                            options: currentQ.options || [],
                            explanation: currentQ.explanation,
                            jlptLevel: currentLevel
                          });
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Яагаад буруу вэ？ (Sunny AI)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Next Button */}
          {isAnswered && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleNextQuestion}
                className="px-6 py-3 rounded-2xl font-bold text-base bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <span>
                  {currentIndex + 1 < questions.length ? 'Дараагийн асуулт' : 'Үр дүн харах'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. MAIN PRACTICE MENU / SELECTION DASHBOARD
  return (
    <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                Интерактив Дасгал
              </span>
              <LevelBadge level={currentLevel} size="sm" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              {currentLevel} Түвшний Дасгал
            </h1>
            <p className="text-stone-500 dark:text-stone-400 text-sm">
              Мэдлэгээ бататгаж, ой тогтоолтоо ухаалаг давталтын алгоритмоор бэхжүүлээрэй.
            </p>
          </div>

          {/* Level Switcher */}
          <div className="flex items-center gap-1.5 p-1.5 bg-stone-100 dark:bg-stone-800/70 rounded-2xl border border-stone-200 dark:border-stone-700/60 self-start md:self-auto">
            {levels.map(lvl => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  currentLevel === lvl
                    ? 'bg-white dark:bg-stone-700 text-amber-600 dark:text-amber-300 shadow-sm'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Question Count Selector */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-stone-100 dark:border-stone-800/80">
          <span className="text-xs sm:text-sm font-semibold text-stone-600 dark:text-stone-400">
            Дасгалын асуултын тоо:
          </span>
          <div className="flex items-center gap-2">
            {[10, 15, 20].map(cnt => (
              <button
                key={cnt}
                type="button"
                onClick={() => setQuestionCount(cnt)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  questionCount === cnt
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                {cnt} асуулт
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {categories.map(cat => {
          const Icon = cat.icon;
          const isReview = cat.key === 'review';
          const isReviewEmpty = isReview && weakCount === 0;

          return (
            <div
              key={cat.key}
              className={`p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
                isReview && weakCount > 0
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm hover:border-amber-400 dark:hover:border-amber-500/60 hover:shadow-md'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      isReview
                        ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  {isReview && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        weakCount > 0
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-400'
                      }`}
                    >
                      {weakCount} сул зүйл
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                    {cat.label}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isReviewEmpty}
                onClick={() => startSession(cat.key)}
                className={`w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isReviewEmpty
                    ? 'bg-stone-100 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
                    : isReview
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm active:scale-95'
                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm active:scale-95'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isReviewEmpty ? 'Давтах зүйл алга' : 'Дасгал эхлүүлэх'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
