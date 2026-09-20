import React, { useState, useMemo } from 'react';
import {
  Target,
  Trophy,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Languages,
  PenTool,
  BookOpen,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Play,
  Lock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { JLPTLevel, ContentType, QuizAttemptRecord, QuizQuestionReview } from '../../types';
import { LevelBadge } from '../common/LevelBadge';
import { learningEngine, PracticeQuestion } from '../../services/learningEngine';

export const QuizView: React.FC = () => {
  const {
    data,
    selectedLevel,
    setSelectedLevel,
    userProgress,
    recordQuizCompleted,
    setActiveTab,
    setPracticeMissedItems,
    isPremium,
    isAdmin,
    setIsAuthModalOpen,
    currentUser,
    openSunnyAIWithQuiz
  } = useApp();

  const currentLevel: JLPTLevel = selectedLevel || 'N5';
  const isLevelPremium = currentLevel !== 'N5';
  const isUnlocked = !isLevelPremium || isPremium || isAdmin;

  // Config state
  const [category, setCategory] = useState<'mixed' | 'vocab' | 'kanji' | 'grammar'>('mixed');
  const [questionCount, setQuestionCount] = useState<number>(10);

  // Active exam state
  const [isExamActive, setIsExamActive] = useState<boolean>(false);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);

  // Completed exam review state
  const [completedAttempt, setCompletedAttempt] = useState<QuizAttemptRecord | null>(null);
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  const startQuiz = () => {
    const generated = learningEngine.generateQuizSession(
      data,
      currentLevel,
      category,
      userProgress,
      questionCount,
      isUnlocked
    );

    if (generated.length === 0) return;

    setQuestions(generated);
    setCurrentIndex(0);
    setAnswers({});
    setCompletedAttempt(null);
    setIsExamActive(true);
    setIsSubmitModalOpen(false);
  };

  const handleSelectOption = (optionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [currentIndex]: optionIndex
    }));
  };

  const handleSubmitExam = () => {
    setIsSubmitModalOpen(false);

    let score = 0;
    const catScores: Record<string, { score: number; total: number; percentage: number }> = {
      vocab: { score: 0, total: 0, percentage: 0 },
      kanji: { score: 0, total: 0, percentage: 0 },
      grammar: { score: 0, total: 0, percentage: 0 },
      sentence: { score: 0, total: 0, percentage: 0 }
    };

    const reviews: QuizQuestionReview[] = questions.map((q, idx) => {
      const userAnswer = answers[idx] !== undefined ? answers[idx] : -1;
      const isCorrect = userAnswer === q.correctIndex;
      if (isCorrect) score += 1;

      const cat = q.category;
      if (catScores[cat]) {
        catScores[cat].total += 1;
        if (isCorrect) catScores[cat].score += 1;
      }

      return {
        id: q.id,
        type: q.category,
        question: q.prompt,
        questionReading: q.reading,
        options: q.options,
        userAnswerIndex: userAnswer,
        correctAnswerIndex: q.correctIndex,
        isCorrect,
        explanation: q.explanation,
        itemId: q.itemId
      };
    });

    // Calculate category percentages
    Object.keys(catScores).forEach(key => {
      const item = catScores[key];
      if (item.total > 0) {
        item.percentage = Math.round((item.score / item.total) * 100);
      }
    });

    const total = questions.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    const attemptRecord: QuizAttemptRecord = {
      id: `quiz-${currentLevel}-${Date.now()}`,
      category,
      jlptLevel: currentLevel,
      score,
      total,
      percentage,
      categoryScores: catScores,
      questions: reviews,
      date: new Date().toISOString()
    };

    // Record completed quiz
    recordQuizCompleted(attemptRecord);
    setCompletedAttempt(attemptRecord);
    setIsExamActive(false);
  };

  const handlePracticeMissed = () => {
    if (!completedAttempt) return;
    const missedIds = completedAttempt.questions
      .filter(q => !q.isCorrect && q.itemId)
      .map(q => q.itemId!);

    if (missedIds.length > 0) {
      setPracticeMissedItems(missedIds);
      setActiveTab('practice');
    }
  };

  const levels: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

  const quizCategories = [
    { key: 'mixed' as const, label: 'Холимог Сорил', icon: Sparkles, desc: 'Үг, ханз, дүрмийн цогц шалгалт' },
    { key: 'vocab' as const, label: 'Үгсийн сан', icon: Languages, desc: 'Үгийн утга, уншлага, сонголт' },
    { key: 'kanji' as const, label: 'Ханз', icon: PenTool, desc: 'Ханзны утга, Оньёми, Күньёми' },
    { key: 'grammar' as const, label: 'Дүрэм', icon: BookOpen, desc: 'Дүрмийн бүтэц, нөхөж бичих' }
  ];

  // 1. RESULTS SCREEN
  if (completedAttempt) {
    const isPassed = completedAttempt.percentage >= 70;
    const missedCount = completedAttempt.questions.filter(q => !q.isCorrect).length;

    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-10 shadow-sm text-center space-y-6">
          {/* Badge */}
          <div
            className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center ${
              isPassed
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
            }`}
          >
            <Trophy className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
              JLPT {completedAttempt.jlptLevel} Сорил Шалгалт
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
              {isPassed ? 'Баяр хүргэе! Сорилыг амжилттай давлаа 🎉' : 'Шалгалтын дүн гарлаа'}
            </h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm">
              {isPassed
                ? 'Та энэхүү түвшний мэдлэгээ өндөр түвшинд эзэмшсэн байна.'
                : 'Алдсан асуултуудаа давтан суралцаж, мэдлэгээ бататгаарай.'}
            </p>
          </div>

          {/* Score Gauge */}
          <div className="flex justify-center items-baseline gap-2 py-2">
            <span
              className={`text-5xl sm:text-6xl font-black tracking-tight ${
                isPassed
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {completedAttempt.score}
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-stone-400">
              / {completedAttempt.total}
            </span>
            <span
              className={`ml-3 px-3.5 py-1 rounded-xl text-lg font-bold ${
                isPassed
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
              }`}
            >
              {completedAttempt.percentage}%
            </span>
          </div>

          {/* Category Breakdown */}
          {completedAttempt.categoryScores && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl mx-auto pt-2">
              {Object.entries(completedAttempt.categoryScores).map(([key, rawItem]) => {
                const item = rawItem as { score: number; total: number; percentage: number } | undefined;
                if (!item || item.total === 0) return null;
                const catLabels: Record<string, string> = {
                  vocab: 'Үгсийн сан',
                  kanji: 'Ханз',
                  grammar: 'Дүрэм',
                  sentence: 'Өгүүлбэр'
                };
                return (
                  <div
                    key={key}
                    className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 text-center space-y-1"
                  >
                    <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                      {catLabels[key] || key}
                    </span>
                    <div className="text-lg font-bold text-stone-900 dark:text-stone-100">
                      {item.score} / {item.total}
                    </div>
                    <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                      {item.percentage}%
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
            {missedCount > 0 && (
              <button
                type="button"
                onClick={handlePracticeMissed}
                className="px-5 py-3 rounded-xl font-bold text-sm sm:text-base bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Алдсан асуултуудаа давтах ({missedCount})
              </button>
            )}

            <button
              type="button"
              onClick={startQuiz}
              className="px-5 py-3 rounded-xl font-bold text-sm sm:text-base bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Дахин шалгалт өгөх
            </button>

            <button
              type="button"
              onClick={() => setCompletedAttempt(null)}
              className="px-5 py-3 rounded-xl font-bold text-sm sm:text-base bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 cursor-pointer transition-colors"
            >
              Сорилын цэс рүү буцах
            </button>
          </div>
        </div>

        {/* Detailed Question Review List */}
        <div className="space-y-4">
          <h3 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 px-1">
            Асуулт бүрийн тайлбар & зөв хариулт
          </h3>

          <div className="space-y-3">
            {completedAttempt.questions.map((q, idx) => {
              const isExpanded = expandedReviewId === q.id;
              const hasUserAnswer = q.userAnswerIndex >= 0;

              return (
                <div
                  key={q.id}
                  className={`rounded-2xl border transition-all overflow-hidden bg-white dark:bg-stone-900 ${
                    q.isCorrect
                      ? 'border-stone-200 dark:border-stone-800'
                      : 'border-rose-200 dark:border-rose-900/60'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedReviewId(isExpanded ? null : q.id)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          q.isCorrect
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {q.isCorrect ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-stone-400">
                            #{idx + 1}
                          </span>
                          <span className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                            {q.question}
                          </span>
                        </div>
                        {q.questionReading && (
                          <span className="text-xs text-stone-500 dark:text-stone-400">
                            【{q.questionReading}】
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          q.isCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {q.isCorrect ? 'Зөв' : 'Буруу'}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-stone-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-stone-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 sm:p-5 pt-0 border-t border-stone-100 dark:border-stone-800 space-y-4">
                      {/* Options breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3">
                        {q.options.map((opt, optIdx) => {
                          const isUserPicked = q.userAnswerIndex === optIdx;
                          const isRight = q.correctAnswerIndex === optIdx;

                          let style =
                            'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300';
                          if (isRight) {
                            style =
                              'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold';
                          } else if (isUserPicked && !isRight) {
                            style =
                              'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-700 text-rose-900 dark:text-rose-200 line-through';
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`p-3 rounded-xl border text-sm flex items-center justify-between ${style}`}
                            >
                              <span>{opt}</span>
                              {isRight && (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                                  Зөв хариулт
                                </span>
                              )}
                              {isUserPicked && !isRight && (
                                <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                                  Таны сонголт
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation & Sunny AI help */}
                      <div className="space-y-2 pt-1">
                        {q.explanation && (
                          <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-stone-800/80 border border-amber-200 dark:border-stone-700 text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed">
                            <span className="font-bold text-amber-800 dark:text-amber-400 block mb-1">
                              Тайлбар:
                            </span>
                            {q.explanation}
                          </div>
                        )}
                        {!q.isCorrect && (
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                const userAnsText =
                                  q.userAnswerIndex !== undefined && q.userAnswerIndex >= 0 && q.options[q.userAnswerIndex]
                                    ? q.options[q.userAnswerIndex]
                                    : 'Хариулаагүй';
                                const correctAnsText =
                                  q.correctAnswerIndex !== undefined && q.options[q.correctAnswerIndex]
                                    ? q.options[q.correctAnswerIndex]
                                    : '';
                                openSunnyAIWithQuiz({
                                  question: q.question,
                                  questionReading: q.questionReading,
                                  userAnswer: userAnsText,
                                  correctAnswer: correctAnsText,
                                  options: q.options,
                                  explanation: q.explanation,
                                  jlptLevel: currentLevel
                                });
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                            >
                              <Sparkles className="w-4 h-4" />
                              <span>Яагаад буруу вэ？ (Sunny AI-аас асуух)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 2. ACTIVE EXAM MODE
  if (isExamActive && questions.length > 0) {
    const currentQ = questions[currentIndex];
    const answeredCount = Object.keys(answers).length;
    const isLastQuestion = currentIndex === questions.length - 1;

    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-fade-in">
        {/* Exam HUD */}
        <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <LevelBadge level={currentLevel} size="sm" />
            <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100">
              JLPT {currentLevel} Сорил
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Хариулсан: {answeredCount} / {questions.length}
            </span>

            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all cursor-pointer"
            >
              Шалгалт дуусгах
            </button>
          </div>
        </div>

        {/* Question Palette / Jump Navigator */}
        <div className="bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {questions.map((_, idx) => {
              const isCurrent = idx === currentIndex;
              const hasAnswer = answers[idx] !== undefined;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center justify-center ${
                    isCurrent
                      ? 'bg-amber-500 text-white shadow-sm scale-105'
                      : hasAnswer
                      ? 'bg-stone-800 text-stone-100 dark:bg-stone-200 dark:text-stone-900'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-500 hover:bg-stone-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Асуулт {currentIndex + 1}
            </span>
            {currentQ.promptBadge && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                {currentQ.promptBadge}
              </span>
            )}
          </div>

          {/* Prompt */}
          <div className="text-center space-y-2 py-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              {currentQ.prompt}
            </h2>
            {currentQ.promptSub && (
              <p className="text-sm sm:text-base font-medium text-stone-500 dark:text-stone-400">
                {currentQ.promptSub}
              </p>
            )}
          </div>

          {/* Options (Radio style) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {currentQ.options.map((option, idx) => {
              const isSelected = answers[currentIndex] === idx;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(idx)}
                  className={`min-h-[56px] p-4 rounded-2xl border-2 font-semibold text-base sm:text-lg transition-all text-left flex items-center justify-between cursor-pointer active:scale-[0.98] ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200'
                      : 'border-stone-200 dark:border-stone-700/80 bg-white dark:bg-stone-800/80 text-stone-800 dark:text-stone-100 hover:border-amber-300'
                  }`}
                >
                  <span>{option}</span>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500'
                        : 'border-stone-300 dark:border-stone-600'
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(prev => prev - 1)}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 transition-all ${
                currentIndex === 0
                  ? 'opacity-30 cursor-not-allowed text-stone-400'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Өмнөх
            </button>

            {isLastQuestion ? (
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(true)}
                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-600 text-white shadow-sm cursor-pointer transition-all active:scale-95"
              >
                Шалгалт дуусгах
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentIndex(prev => prev + 1)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:opacity-90 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                Дараах
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Submit Confirmation Dialog */}
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 max-w-md w-full shadow-xl space-y-5 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                  Шалгалтаа дуусгах уу?
                </h3>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  {answeredCount < questions.length
                    ? `Та ${questions.length - answeredCount} асуултад хариулаагүй байна. Дуусгахад итгэлтэй байна уу?`
                    : 'Та бүх асуултад хариулсан байна. Шалгалтын дүнгээ үзэх үү?'}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 cursor-pointer transition-all"
                >
                  Үргэлжлүүлэх
                </button>
                <button
                  type="button"
                  onClick={handleSubmitExam}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-600 text-white shadow-sm cursor-pointer transition-all active:scale-95"
                >
                  Тийм, дуусгах
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. MAIN QUIZ MENU
  return (
    <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in">
      {/* Banner */}
      <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                JLPT Сорил Шалгалт
              </span>
              <LevelBadge level={currentLevel} size="sm" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              {currentLevel} Түвшний Сорил
            </h1>
            <p className="text-stone-500 dark:text-stone-400 text-sm">
              Бодит шалгалтын хэлбэрээр мэдлэгээ сорьж, үр дүнгээ хянаарай.
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

        {/* Question Length Selector */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-stone-100 dark:border-stone-800/80">
          <span className="text-xs sm:text-sm font-semibold text-stone-600 dark:text-stone-400">
            Шалгалтын хэмжээ:
          </span>
          <div className="flex items-center gap-2">
            {[
              { count: 10, label: '10 асуулт (Mini)' },
              { count: 20, label: '20 асуулт (Стандарт)' },
              { count: 30, label: '30 асуулт (Бүрэн)' }
            ].map(item => (
              <button
                key={item.count}
                type="button"
                onClick={() => setQuestionCount(item.count)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  questionCount === item.count
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {quizCategories.map(cat => {
          const Icon = cat.icon;
          const isSelected = category === cat.key;

          return (
            <div
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-5 cursor-pointer ${
                isSelected
                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-400 dark:border-amber-600 shadow-md ring-2 ring-amber-500/20'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm hover:border-amber-300'
              }`}
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                    {cat.label}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <div
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                  }`}
                >
                  {isSelected ? 'Сонгогдсон' : 'Сонгох'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Start Button */}
      <div className="flex justify-center pt-2">
        {!isUnlocked ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  setIsAuthModalOpen(true);
                } else {
                  setActiveTab('premium');
                }
              }}
              className="px-8 py-4 rounded-2xl font-bold text-base sm:text-lg bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <Lock className="w-5 h-5" />
              <span>Premium идэвхжүүлж {currentLevel} сорилыг нээх (¥980 / 30 хоног)</span>
            </button>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              N5 түвшний бүх сорил шалгалтууд үнэгүй нээлттэй байдаг.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={startQuiz}
            className="px-8 py-4 rounded-2xl font-bold text-base sm:text-lg bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{currentLevel} Сорил эхлүүлэх ({questionCount} асуулт)</span>
          </button>
        )}
      </div>
    </div>
  );
};
