import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lightbulb,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';
import { LevelBadge } from '../common/LevelBadge';

export const QuizExplanationModal: React.FC = () => {
  const {
    sunnyAIQuizContext,
    setSunnyAIQuizContext,
    sunnyAIRoleplayFeedbackContext,
    setSunnyAIRoleplayFeedbackContext,
    selectedLevel,
    refreshSunnyAIUsage
  } = useApp();

  const [explanationText, setExplanationText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isOpen = Boolean(sunnyAIQuizContext || sunnyAIRoleplayFeedbackContext);

  const handleClose = () => {
    setSunnyAIQuizContext(null);
    setSunnyAIRoleplayFeedbackContext(null);
    setExplanationText('');
    setErrorMessage(null);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Fetch explanation when context opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setExplanationText('');
    setErrorMessage(null);
    setIsLoading(true);

    const fetchExplanation = async () => {
      try {
        if (sunnyAIQuizContext) {
          const quiz = sunnyAIQuizContext;
          const userPrompt = `Энэ асуулт дээр миний сонгосон "${quiz.userAnswer || 'сонгоогүй'}" хариулт яагаад буруу болсныг, мөн зөв хариулт болох "${quiz.correctAnswer}" нь яагаад зөв болохыг монгол хэлээр маш тодорхой, ойлгомжтой тайлбарлаж өгөөч.`;

          const res = await apiService.sendSunnyAIMessage({
            message: userPrompt,
            conversationHistory: [],
            quizContext: quiz,
            currentLevel: quiz.jlptLevel || selectedLevel || 'N5'
          });

          if (isMounted) {
            setExplanationText(res.reply);
            await refreshSunnyAIUsage();
          }
        } else if (sunnyAIRoleplayFeedbackContext) {
          const roleplay = sunnyAIRoleplayFeedbackContext;
          const categoryName =
            roleplay.category === 'grammar'
              ? 'Дүрмийн зөвлөгөө'
              : roleplay.category === 'naturalness'
              ? 'Байгалийн яриа'
              : 'Үгийн сан';

          const userPrompt = `Roleplay: 【${roleplay.scenarioTitle}】 (${roleplay.jlptLevel}) харилцан яриан дахь дараах өгүүлбэрийг монголоор дэлгэрүүлэн тайлбарлаж өгнө үү:\n\nТөрөл: ${categoryName}\nМиний хэлсэн: "${roleplay.originalSentence}"\nЗөв/Байгалийн хэлбэр: "${roleplay.betterSentence}"\nҮндсэн тайлбар: ${roleplay.explanation}`;

          const res = await apiService.sendSunnyAIMessage({
            message: userPrompt,
            conversationHistory: [],
            roleplayContext: roleplay,
            currentLevel: roleplay.jlptLevel || selectedLevel || 'N5'
          });

          if (isMounted) {
            setExplanationText(res.reply);
            await refreshSunnyAIUsage();
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(
            err?.message ||
              'Sunny AI тайлбар бэлтгэхэд алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchExplanation();

    return () => {
      isMounted = false;
    };
  }, [sunnyAIQuizContext, sunnyAIRoleplayFeedbackContext]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      {/* Backdrop click to close */}
      <div
        className="fixed inset-0 cursor-pointer"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3 bg-stone-50/80 dark:bg-stone-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-white">
                  Яагаад буруу вэ? — AI Тайлбар
                </h3>
                {sunnyAIQuizContext?.jlptLevel && (
                  <LevelBadge level={sunnyAIQuizContext.jlptLevel} size="sm" />
                )}
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Sunny AI-ийн дүрмийн болон үгийн хэрэглээний шинжилгээ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            title="Хаах"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Quiz Context Summary */}
          {sunnyAIQuizContext && (
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-3">
              <div>
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  Асуулт
                </span>
                <p className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 mt-0.5 font-jp">
                  {sunnyAIQuizContext.question}
                </p>
                {sunnyAIQuizContext.questionReading && (
                  <p className="text-xs text-stone-500 font-jp mt-0.5">
                    【{sunnyAIQuizContext.questionReading}】
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-stone-200 dark:border-stone-700">
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-200">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 block">
                      Таны сонгосон (Буруу)
                    </span>
                    <span className="font-bold text-xs sm:text-sm font-jp">
                      {sunnyAIQuizContext.userAnswer || 'Сонгоогүй'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 block">
                      Зөв хариулт
                    </span>
                    <span className="font-bold text-xs sm:text-sm font-jp">
                      {sunnyAIQuizContext.correctAnswer}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Roleplay Context Summary */}
          {sunnyAIRoleplayFeedbackContext && (
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-2">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                Харилцан яриа: {sunnyAIRoleplayFeedbackContext.scenarioTitle}
              </span>
              <div className="space-y-1.5 pt-1">
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  <span className="font-bold">Таны хэлсэн:</span> &ldquo;
                  {sunnyAIRoleplayFeedbackContext.originalSentence}&rdquo;
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  <span className="font-bold">Илүү зөв хэлбэр:</span> &ldquo;
                  {sunnyAIRoleplayFeedbackContext.betterSentence}&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* AI Explanation Area */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300 font-bold text-xs">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Дэлгэрэнгүй тайлбар:</span>
            </div>

            {isLoading ? (
              <div className="p-6 rounded-2xl bg-amber-500/5 dark:bg-amber-400/5 border border-amber-500/20 text-center space-y-3">
                <Loader2 className="w-6 h-6 text-amber-500 animate-spin mx-auto" />
                <p className="text-xs font-bold text-stone-600 dark:text-stone-400">
                  Sunny AI тайлбарыг бэлтгэж байна…
                </p>
                <div className="space-y-2 max-w-md mx-auto pt-2">
                  <div className="h-2.5 bg-stone-200 dark:bg-stone-700 rounded-full animate-pulse w-3/4 mx-auto" />
                  <div className="h-2.5 bg-stone-200 dark:bg-stone-700 rounded-full animate-pulse w-full mx-auto" />
                  <div className="h-2.5 bg-stone-200 dark:bg-stone-700 rounded-full animate-pulse w-5/6 mx-auto" />
                </div>
              </div>
            ) : errorMessage ? (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    // re-trigger
                    setErrorMessage(null);
                    setIsLoading(true);
                  }}
                  className="inline-flex items-center gap-1 font-bold underline cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Дахин оролдох</span>
                </button>
              </div>
            ) : (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-stone-800 dark:text-stone-200 leading-relaxed font-jp text-xs sm:text-sm whitespace-pre-wrap">
                {explanationText}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            Ойлголоо
          </button>
        </div>
      </div>
    </div>
  );
};
