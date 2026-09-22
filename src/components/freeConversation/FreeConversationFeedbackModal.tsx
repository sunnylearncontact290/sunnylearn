import React from 'react';
import { FreeChatFeedbackReport, JLPTLevel } from '../../types';
import { LevelBadge } from '../common/LevelBadge';
import { useApp } from '../../context/AppContext';
import {
  X,
  Sparkles,
  Award,
  CheckCircle2,
  BookOpen,
  MessageSquare,
  Volume2,
  Bot,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

interface FreeConversationFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedback: FreeChatFeedbackReport | null;
  isLoading: boolean;
  jlptLevel: JLPTLevel;
  messageCount: number;
  onNewConversation: () => void;
}

export const FreeConversationFeedbackModal: React.FC<FreeConversationFeedbackModalProps> = ({
  isOpen,
  onClose,
  feedback,
  isLoading,
  jlptLevel,
  messageCount,
  onNewConversation
}) => {
  const { openSunnyAI } = useApp();

  if (!isOpen) return null;

  const handleSpeak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[（\(][ぁ-んァ-ヶー]+[）\)]/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  const score = feedback?.fluencyScore ?? 85;
  const scoreColor =
    score >= 88
      ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40'
      : score >= 75
      ? 'text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-50 dark:bg-amber-950/40'
      : 'text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-50 dark:bg-rose-950/40';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                  Ярианы дүгнэлт & Фидбек
                </h3>
                <LevelBadge level={jlptLevel} size="xs" />
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Нийт {messageCount} мессеж солилцлоо
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Хаах"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 animate-pulse flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200">
                  Sunny AI ярианы үнэлгээ бэлтгэж байна...
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Хэлсэн үг, өгүүлбэрийн хэрэглээ болон илүү байгалийн хэллэгүүдийг шинжилж байна.
                </p>
              </div>
            </div>
          ) : feedback ? (
            <>
              {/* Score & Impression Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex flex-col sm:flex-row items-center gap-4">
                <div className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 ${scoreColor}`}>
                  <span className="text-2xl font-black">{score}%</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Ойлгомжтой</span>
                </div>
                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <p className="font-jp text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                    「{feedback.overallImpression}」
                  </p>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                    {feedback.overallImpressionMongolian}
                  </p>
                </div>
              </div>

              {/* Practiced Vocabulary Chips */}
              {feedback.keyVocabularyUsed && feedback.keyVocabularyUsed.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-700 dark:text-stone-300">
                    <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                    <span>Ярианд ашиглагдсан чухал үг хэллэгүүд:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {feedback.keyVocabularyUsed.map((item, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs"
                      >
                        <span className="font-jp font-bold text-stone-900 dark:text-stone-100">
                          {item.japanese}
                        </span>
                        {item.reading && item.reading !== item.japanese && (
                          <span className="font-jp text-[11px] text-stone-500">
                            ({item.reading})
                          </span>
                        )}
                        <span className="text-stone-400 text-[10px]">•</span>
                        <span className="text-stone-600 dark:text-stone-300 text-[11px]">
                          {item.mongolian}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Corrections & Natural Expressions */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-700 dark:text-stone-300">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>Илүү байгалийн болгох зөвлөгөө:</span>
                </div>

                {feedback.corrections && feedback.corrections.length > 0 ? (
                  <div className="space-y-2.5">
                    {feedback.corrections.map((corr, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                                Таны хэлсэн
                              </span>
                              <span className="font-jp text-xs sm:text-sm text-stone-800 dark:text-stone-200 line-through decoration-rose-400">
                                {corr.original}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                Илүү байгалийн
                              </span>
                              <span className="font-jp text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                {corr.better}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSpeak(corr.better)}
                                className="p-1 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                                title="Сонсох"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {corr.explanationMongolian && (
                          <div className="p-2.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/15 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                            💡 {corr.explanationMongolian}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-center space-y-1">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      Онцгой алдаа илэрсэнгүй!
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      Таны хэлсэн өгүүлбэрүүд ойлгомжтой, байгалийн урсгал сайтай байлаа.
                    </p>
                  </div>
                )}
              </div>

              {/* Next Practice Tip */}
              {feedback.nextPracticeTipMongolian && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs">
                    <span className="font-bold text-amber-900 dark:text-amber-200">
                      Дараагийн ярианы зөвлөгөө:
                    </span>
                    <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                      {feedback.nextPracticeTipMongolian}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center text-xs text-stone-500">
              Үнэлгээний мэдээлэл олдсонгүй.
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              openSunnyAI();
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs transition-colors cursor-pointer"
          >
            <Bot className="w-4 h-4 text-amber-500" />
            <span>Sunny AI багшаас илүү тайлбар асуух</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Яриагаа үргэлжлүүлэх
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onNewConversation();
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <span>Шинэ яриа эхлэх</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
