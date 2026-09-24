import React from 'react';
import {
  RoleplayFeedbackReport,
  RoleplayScenario,
  JLPTLevel,
  RoleplaySessionRecord
} from '../../types';
import { useApp } from '../../context/AppContext';
import { LevelBadge } from '../common/LevelBadge';
import { AudioButton } from '../common/AudioButton';
import { speechService } from '../../services/speech';
import { FuriganaText } from './FuriganaText';
import {
  Award,
  CheckCircle2,
  Sparkles,
  BookOpen,
  HelpCircle,
  RotateCcw,
  ArrowLeft,
  Volume2,
  ThumbsUp,
  AlertTriangle,
  Bot,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

interface RoleplayFeedbackProps {
  scenario: RoleplayScenario;
  jlptLevel: JLPTLevel;
  feedback: RoleplayFeedbackReport;
  session?: RoleplaySessionRecord;
  onRetry: () => void;
  onSelectAnother: () => void;
}

export const RoleplayFeedback: React.FC<RoleplayFeedbackProps> = ({
  scenario,
  jlptLevel,
  feedback,
  onRetry,
  onSelectAnother
}) => {
  const { openSunnyAIWithRoleplayFeedback, openSunnyAI } = useApp();

  const handleSpeak = (text: string) => {
    speechService.play(text, { rate: 0.95 });
  };

  const handleAskSunnyAI = (
    category: 'grammar' | 'naturalness' | 'vocabulary',
    original: string,
    better: string,
    explanation: string
  ) => {
    openSunnyAIWithRoleplayFeedback({
      scenarioTitle: scenario.titleJapanese,
      jlptLevel,
      category,
      originalSentence: original,
      betterSentence: better,
      explanation
    });
  };

  const score = feedback?.communication?.score ?? 80;
  const scoreColor =
    score >= 85
      ? 'text-emerald-600 dark:text-emerald-400'
      : score >= 70
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-rose-600 dark:text-rose-400';

  const objectivesCount =
    feedback?.communication?.objectivesCompletedCount ??
    feedback?.communication?.objectivesCompleted ??
    scenario.objectives.length;

  const politenessText =
    feedback?.communication?.politenessLevel ??
    feedback?.communication?.politenessEvaluation ??
    'Тохиромжтой (Appropriate)';

  const whatWentWellList = Array.isArray(feedback?.whatWentWell)
    ? feedback.whatWentWell
    : feedback?.whatWentWell
    ? [feedback.whatWentWell]
    : [];

  const grammarCorrections =
    feedback?.grammar?.corrections ||
    feedback?.grammarCorrections ||
    [];

  const naturalnessList =
    feedback?.naturalness?.items ||
    feedback?.naturalnessItems ||
    [];

  const vocabularyList =
    feedback?.vocabulary?.recommendedToLearn ||
    feedback?.vocabularyItems ||
    [];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* 1. TOP HERO CARD */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent border border-amber-200/80 dark:border-amber-900/50 shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{scenario.icon}</span>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 font-jp">
                {scenario.titleJapanese}
              </h1>
              <LevelBadge level={jlptLevel} size="md" />
            </div>
            <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">
              {scenario.titleMongolian} • Харилцан ярианы дүгнэлтийн тайлан
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Таны бичсэн бодит хариултуудад шинжилгээ хийж, Sunny AI нарийвчилсан зөвлөгөөг бэлтгэлээ.
            </p>
          </div>

          {/* Score Badge */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm shrink-0 min-w-[130px]">
            <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Үнэлгээний оноо
            </span>
            <div className={`text-4xl sm:text-5xl font-black ${scoreColor} mt-1`}>
              {score}
              <span className="text-base text-stone-400 font-normal">/100</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {objectivesCount} / {scenario.objectives.length} даалгавар
            </span>
          </div>
        </div>
      </div>

      {/* 2. WHAT WENT WELL */}
      {whatWentWellList.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-extrabold text-sm sm:text-base">
            <ThumbsUp className="w-5 h-5 text-emerald-500" />
            <span>Сайн болсон зүйлс</span>
          </div>
          <div className="space-y-1">
            {whatWentWellList.map((item, idx) => (
              <p key={idx} className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
                • {item}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* 3. COMMUNICATION FEEDBACK */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-stone-100 text-sm sm:text-base">
            <Award className="w-5 h-5 text-amber-500" />
            <span>Харилцааны ерөнхий үнэлгээ</span>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
            {politenessText}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
          {feedback?.communication?.feedbackMongolian}
        </p>
      </div>

      {/* 4. GRAMMAR ANALYSIS */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-stone-100 text-sm sm:text-base">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <span>Дүрмийн шинжилгээ ба засвар</span>
          </div>
          <span className="text-xs text-stone-400">
            {grammarCorrections.length} зөвлөгөө
          </span>
        </div>

        {grammarCorrections.length === 0 ? (
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 text-center text-xs text-stone-500">
            Дүрмийн ноцтой алдаа гарсангүй. Маш сайн байна!
          </div>
        ) : (
          <div className="space-y-3">
            {grammarCorrections.map((corr, idx) => {
              const betterText = corr.betterSentence || corr.correctedSentence || '';
              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-2.5"
                >
                  {/* Original vs Corrected */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200">
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block mb-0.5">
                        Таны бичсэн өгүүлбэр:
                      </span>
                      <span className="font-jp text-sm font-semibold">{corr.originalSentence}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                          Зөв болгосон хэлбэр:
                        </span>
                        <div className="text-sm font-semibold">
                          <FuriganaText text={betterText} />
                        </div>
                      </div>
                      <AudioButton
                        text={betterText}
                        id={`rpfb_gram_${idx}`}
                        size="xs"
                        variant="ghost"
                        title="Зөв өгүүлбэрийг сонсох"
                      />
                    </div>
                  </div>

                  {/* Mongolian Explanation */}
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed pl-1">
                    💡 <span className="font-medium">{corr.explanationMongolian}</span>
                  </p>

                  {/* Ask Sunny AI Tutor Button */}
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        handleAskSunnyAI(
                          'grammar',
                          corr.originalSentence,
                          betterText,
                          corr.explanationMongolian
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Bot className="w-3.5 h-3.5 text-amber-500" />
                      <span>Sunny AI-д дэлгэрүүлж асуух</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. NATURALNESS ANALYSIS (❌ Incorrect vs △ Unnatural vs ✓ Natural) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-stone-100 text-sm sm:text-base">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>Байгалийн сонсогдох байдал (Naturalness)</span>
          </div>
          <span className="text-xs text-stone-400">
            {naturalnessList.length} зөвлөгөө
          </span>
        </div>

        {naturalnessList.length === 0 ? (
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 text-center text-xs text-stone-500">
            Таны яриа маш байгалийн, ойлгомжтой байлаа!
          </div>
        ) : (
          <div className="space-y-3">
            {naturalnessList.map((item, idx) => {
              const userSentence = item.userSaid || item.originalSentence || '';
              const naturalSentence = item.naturalAlternative || item.moreNaturalSentence || '';

              const statusBadge =
                item.status === 'natural' ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                    ✓ Байгалийн (Natural)
                  </span>
                ) : item.status === 'unnatural' ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                    △ Ойлгогдох ч эвгүй (Unnatural)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-[11px]">
                    ❌ Буруу хэлбэр (Incorrect)
                  </span>
                );

              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    {statusBadge}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                      <span className="text-[10px] font-bold text-stone-400 block mb-0.5">
                        Хэлсэн байдал:
                      </span>
                      <span className="font-jp text-sm font-semibold text-stone-800 dark:text-stone-200">
                        {userSentence}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                          Байгалийн, эелдэг хувилбар:
                        </span>
                        <div className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                          <FuriganaText text={naturalSentence} />
                        </div>
                      </div>
                      <AudioButton
                        text={naturalSentence}
                        id={`rpfb_nat_${idx}`}
                        size="xs"
                        variant="ghost"
                        title="Байгалийн хувилбарыг сонсох"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed pl-1">
                    💬 <span className="font-medium">{item.explanationMongolian}</span>
                  </p>

                  <div className="pt-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        handleAskSunnyAI(
                          'naturalness',
                          userSentence,
                          naturalSentence,
                          item.explanationMongolian
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Bot className="w-3.5 h-3.5 text-amber-500" />
                      <span>Sunny AI-д дэлгэрүүлж асуух</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. VOCABULARY TO REMEMBER */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-stone-100 text-sm sm:text-base">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <span>Энэ нөхцөл байдалд тогтоох үгс (Vocabulary)</span>
          </div>
          <span className="text-xs text-stone-400">
            {vocabularyList.length} үг
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {vocabularyList.map((vocab, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="font-jp font-bold text-stone-900 dark:text-stone-100 text-sm">
                  <FuriganaText
                    text={
                      vocab.word.includes('（') || vocab.word.includes('(')
                        ? vocab.word
                        : vocab.furigana
                        ? `${vocab.word}（${vocab.furigana}）`
                        : vocab.word
                    }
                  />
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                  {vocab.mongolian}
                </p>
              </div>

              <AudioButton
                text={vocab.word}
                reading={vocab.furigana}
                id={`rpfb_voc_${idx}`}
                size="xs"
                variant="subtle"
                title="Үгийг сонсох"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 7. BOTTOM ACTION BUTTONS */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={onSelectAnother}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 font-bold text-sm transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Өөр хувилбар сонгох</span>
        </button>

        <div className="w-full sm:w-auto flex items-center gap-3">
          <button
            type="button"
            onClick={openSunnyAI}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-sm transition-colors cursor-pointer"
          >
            <Bot className="w-4 h-4 text-amber-500" />
            <span>Sunny AI багшаас асуух</span>
          </button>

          <button
            type="button"
            onClick={onRetry}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md hover:scale-102 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Дахин оролдох</span>
          </button>
        </div>
      </div>
    </div>
  );
};
