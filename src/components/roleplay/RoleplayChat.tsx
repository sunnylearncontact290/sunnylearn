import React, { useState, useEffect, useRef } from 'react';
import {
  RoleplayScenario,
  JLPTLevel,
  RoleplaySessionRecord,
  RoleplayFeedbackReport
} from '../../types';
import { apiService } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { LevelBadge } from '../common/LevelBadge';
import { FuriganaText, stripFurigana } from './FuriganaText';
import {
  Send,
  Lightbulb,
  CheckCircle2,
  Circle,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
  X,
  Volume2,
  ShieldAlert,
  Loader2,
  Bot,
  User,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';

interface RoleplayChatProps {
  scenario: RoleplayScenario;
  jlptLevel: JLPTLevel;
  onChangeLevel: (lvl: JLPTLevel) => void;
  onFinish: (report: {
    feedback: RoleplayFeedbackReport;
    sessionId: string;
    session: RoleplaySessionRecord;
    scenario: RoleplayScenario;
    jlptLevel: JLPTLevel;
  }) => void;
  onBack: () => void;
}

interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const RoleplayChat: React.FC<RoleplayChatProps> = ({
  scenario,
  jlptLevel,
  onChangeLevel,
  onFinish,
  onBack
}) => {
  const {
    isPremium,
    sunnyAIUsage,
    refreshSunnyAIUsage,
    setIsAuthModalOpen,
    showToast
  } = useApp();

  // Initialize messages with scenario's greeting for this JLPT level
  const initialGreeting =
    scenario.initialGreetings[jlptLevel] ||
    scenario.initialGreetings.N5 ||
    'いらっしゃいませ！何（なに）かお探（さが）しですか？';

  const [messages, setMessages] = useState<ChatMessageItem[]>(() => [
    {
      id: 'msg_0',
      role: 'assistant',
      content: initialGreeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [completedObjectiveIndices, setCompletedObjectiveIndices] = useState<number[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showObjectives, setShowObjectives] = useState(false);
  const [showFurigana, setShowFurigana] = useState(true);

  // Hint State
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [hintData, setHintData] = useState<{
    hintMongolian: string;
    suggestedExpressions: string[];
  } | null>(null);
  const [isHintOpen, setIsHintOpen] = useState(false);

  // Limit reached modal state
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle Level Change
  const handleLevelSelect = (newLevel: JLPTLevel) => {
    if (newLevel === jlptLevel) return;
    if (messages.length > 1) {
      const confirmReset = window.confirm(
        `Түвшинг ${newLevel} болгон өөрчилбөл яриа шинээр эхэлнэ. Үргэлжлүүлэх үү?`
      );
      if (!confirmReset) return;
    }

    onChangeLevel(newLevel);
    const newGreeting =
      scenario.initialGreetings[newLevel] ||
      scenario.initialGreetings.N5 ||
      'いらっしゃいませ！';

    setMessages([
      {
        id: 'msg_' + Date.now(),
        role: 'assistant',
        content: newGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setCompletedObjectiveIndices([]);
    setHintData(null);
    setIsHintOpen(false);
  };

  // Reset conversation
  const handleReset = () => {
    const confirmReset = window.confirm('Харилцан яриаг дахин эхлүүлэх үү?');
    if (!confirmReset) return;

    setMessages([
      {
        id: 'msg_' + Date.now(),
        role: 'assistant',
        content: initialGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setCompletedObjectiveIndices([]);
    setHintData(null);
    setIsHintOpen(false);
    setErrorBanner(null);
    if (inputRef.current) inputRef.current.focus();
  };

  // Send turn to AI
  const handleSend = async (customText?: string) => {
    const text = (customText || inputText).trim();
    if (!text || isLoading || isFinishing) return;

    // Check usage limit
    if (!isPremium && sunnyAIUsage && sunnyAIUsage.limitReached) {
      setIsLimitModalOpen(true);
      return;
    }

    setErrorBanner(null);
    const userMsg: ChatMessageItem = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const payloadMessages = newMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await apiService.sendRoleplayTurn({
        scenarioId: scenario.id,
        jlptLevel,
        messages: payloadMessages,
        completedObjectiveIndices
      });

      const assistantMsg: ChatMessageItem = {
        id: 'ast_' + Date.now(),
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Check if new objectives completed
      if (Array.isArray(res.completedObjectiveIndices)) {
        const newlyCompleted = res.completedObjectiveIndices.filter(
          idx => !completedObjectiveIndices.includes(idx)
        );
        if (newlyCompleted.length > 0) {
          showToast(`Шинэ даалгавар биеллээ! (${res.completedObjectiveIndices.length}/${scenario.objectives.length})`, 'success');
        }
        setCompletedObjectiveIndices(res.completedObjectiveIndices);
      }

      await refreshSunnyAIUsage();

      // Close hint if it was open
      setIsHintOpen(false);
      setHintData(null);
    } catch (err: any) {
      console.error('[Roleplay Chat Error]', err);
      if (err?.limitReached) {
        setIsLimitModalOpen(true);
      } else {
        const msg =
          err?.message && err.message !== 'Failed to fetch'
            ? err.message
            : 'Сервер эсвэл сүлжээтэй холбогдоход алдаа гарлаа. Дахин оролдоно уу.';
        setErrorBanner(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Retry last turn
  const handleRetry = async () => {
    if (isLoading || isFinishing) return;
    setErrorBanner(null);
    setIsLoading(true);

    try {
      const payloadMessages = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await apiService.sendRoleplayTurn({
        scenarioId: scenario.id,
        jlptLevel,
        messages: payloadMessages,
        completedObjectiveIndices
      });

      const assistantMsg: ChatMessageItem = {
        id: 'ast_' + Date.now(),
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);

      if (Array.isArray(res.completedObjectiveIndices)) {
        const newlyCompleted = res.completedObjectiveIndices.filter(
          idx => !completedObjectiveIndices.includes(idx)
        );
        if (newlyCompleted.length > 0) {
          showToast(`Шинэ даалгавар биеллээ! (${res.completedObjectiveIndices.length}/${scenario.objectives.length})`, 'success');
        }
        setCompletedObjectiveIndices(res.completedObjectiveIndices);
      }

      await refreshSunnyAIUsage();
      setIsHintOpen(false);
      setHintData(null);
    } catch (err: any) {
      console.error('[Roleplay Chat Error]', err);
      if (err?.limitReached) {
        setIsLimitModalOpen(true);
      } else {
        const msg =
          err?.message && err.message !== 'Failed to fetch'
            ? err.message
            : 'Сервер эсвэл сүлжээтэй холбогдоход алдаа гарлаа. Дахин оролдоно уу.';
        setErrorBanner(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Request Hint
  const handleRequestHint = async () => {
    if (isHintLoading) return;
    setIsHintLoading(true);
    setIsHintOpen(true);

    try {
      const payloadMessages = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const hint = await apiService.getRoleplayHint({
        scenarioId: scenario.id,
        jlptLevel,
        messages: payloadMessages
      });

      setHintData({
        hintMongolian: hint.hintMongolian,
        suggestedExpressions: (hint.suggestedExpressions || []).map(stripFurigana)
      });
    } catch (err: any) {
      console.error('[Roleplay Hint Error]', err);
      setHintData({
        hintMongolian: 'Нөхцөл байдалд тохируулан эелдэгээр хариулна уу.',
        suggestedExpressions: (scenario.starterSuggestions[jlptLevel] || ['はい、お願いします。']).map(stripFurigana)
      });
    } finally {
      setIsHintLoading(false);
    }
  };

  // Finish session and generate feedback
  const handleFinishSession = async () => {
    if (messages.length <= 1) {
      showToast('Яриагаа эхлүүлж дор хаяж 1-2 удаа харилцан ярьсны дараа үнэлгээ авна уу.', 'info');
      return;
    }

    const confirmFinish = window.confirm(
      'Харилцан яриаг дуусгаж, Sunny AI-ийн нарийвчилсан тайлан (дүрэм, үгсийн сан, байгалийн яриа)-г үзэх үү?'
    );
    if (!confirmFinish) return;

    setIsFinishing(true);
    try {
      const payloadMessages = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await apiService.getRoleplayFeedback({
        scenarioId: scenario.id,
        jlptLevel,
        messages: payloadMessages,
        completedObjectiveIndices
      });

      onFinish({
        feedback: res.feedback,
        sessionId: res.sessionId,
        session: res.session,
        scenario,
        jlptLevel
      });
    } catch (err: any) {
      console.error('[Roleplay Feedback Error]', err);
      showToast(err?.message || 'Тайлан үүсгэхэд алдаа гарлаа.', 'error');
      setIsFinishing(false);
    }
  };

  // Speak Japanese audio via browser synthesis
  const handleSpeak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      // Remove furigana parentheses for speech synthesis
      const cleanText = text.replace(/[（\(][ぁ-んァ-ヶー]+[）\)]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'ja-JP';
      utterance.rate = jlptLevel === 'N5' || jlptLevel === 'N4' ? 0.85 : 0.95;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Speech error', e);
    }
  };

  // Current starters for suggestions
  const starters = scenario.starterSuggestions[jlptLevel] || [];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-[calc(100vh-5rem)] min-h-[580px] max-h-[920px] bg-white dark:bg-stone-900 sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden animate-fade-in relative">
      {/* 1. TOP HEADER */}
      <header className="px-4 sm:px-6 py-3.5 bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2 sm:gap-4 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 sm:p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
            title="Буцах"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-xl shrink-0">
            {scenario.icon}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100 truncate font-jp">
                {scenario.titleJapanese}
              </h2>
              <LevelBadge level={jlptLevel} size="sm" />
            </div>
            <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 truncate">
              {scenario.titleMongolian} • {scenario.aiRole}
            </p>
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Furigana Toggle */}
          <button
            type="button"
            onClick={() => setShowFurigana(!showFurigana)}
            className={`p-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
              showFurigana
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                : 'border-stone-200 dark:border-stone-700 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
            title={showFurigana ? 'Фуригана нуух' : 'Фуригана харуулах'}
          >
            {showFurigana ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden md:inline font-jp">ふりがな</span>
          </button>

          {/* Level Switcher Dropdown */}
          <div className="hidden sm:flex items-center bg-stone-100 dark:bg-stone-800 p-0.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold">
            {(['N5', 'N4', 'N3', 'N2', 'N1'] as JLPTLevel[]).map(lvl => (
              <button
                key={lvl}
                type="button"
                onClick={() => handleLevelSelect(lvl)}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  jlptLevel === lvl
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            title="Дахин эхлүүлэх"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Finish & Get Report Button */}
          <button
            type="button"
            onClick={handleFinishSession}
            disabled={isFinishing || messages.length <= 1}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0"
          >
            {isFinishing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Тайлан бэлтгэж байна...</span>
              </>
            ) : (
              <>
                <Award className="w-4 h-4 text-emerald-200" />
                <span>Дуусгах</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 2. OBJECTIVES PROGRESS BAR & COLLAPSIBLE DRAWER */}
      <div className="bg-amber-50/70 dark:bg-amber-950/20 border-b border-amber-200/80 dark:border-amber-900/40 px-4 sm:px-6 py-2.5 flex flex-col justify-between shrink-0">
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-stone-800 dark:text-stone-200">
            <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Зорилтууд:
            </span>
            <span>
              {completedObjectiveIndices.length} / {scenario.objectives.length} биелсэн
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Simple progress track */}
            <div className="w-20 sm:w-32 h-2 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{
                  width: `${(completedObjectiveIndices.length / scenario.objectives.length) * 100}%`
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowObjectives(!showObjectives)}
              className="text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{showObjectives ? 'Хураах' : 'Харах'}</span>
              {showObjectives ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Collapsible Objectives List */}
        {showObjectives && (
          <div className="mt-3 pt-3 border-t border-amber-200/60 dark:border-amber-900/40 space-y-2 animate-fade-in text-xs">
            {scenario.objectives.map((obj, idx) => {
              const isCompleted = completedObjectiveIndices.includes(idx);
              return (
                <div
                  key={obj.id || idx}
                  className={`flex items-start gap-2.5 p-2 rounded-xl transition-colors ${
                    isCompleted
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/40'
                      : 'bg-white/60 dark:bg-stone-800/40 text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700/60'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${isCompleted ? 'line-through opacity-80' : ''}`}>
                      {obj.mongolian}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 font-jp">
                      {obj.japanese}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. ERROR BANNER */}
      {errorBanner && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between gap-2 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="font-bold underline cursor-pointer shrink-0 hover:text-rose-900 dark:hover:text-rose-100"
          >
            Дахин оролдох
          </button>
        </div>
      )}

      {/* 4. CHAT MESSAGES BODY */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg, index) => {
          const isAI = msg.role === 'assistant';

          return (
            <div
              key={msg.id || index}
              className={`flex items-start gap-2.5 sm:gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}
            >
              {isAI && (
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/80 flex items-center justify-center text-sm shrink-0 mt-0.5">
                  {scenario.icon}
                </div>
              )}

              <div
                className={`group relative max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 sm:p-4 text-sm shadow-2xs ${
                  isAI
                    ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-700/80'
                    : 'bg-amber-500 text-white rounded-br-xs user-bubble'
                }`}
              >
                {/* Role label header */}
                <div className="flex items-center justify-between gap-4 mb-2 text-[11px] opacity-75">
                  <span className="font-bold">
                    {isAI ? `${scenario.aiRole}` : 'Та'}
                  </span>
                  <span className="text-[10px]">{msg.timestamp}</span>
                </div>

                {/* Message Text with optional Furigana */}
                <div className={`text-sm sm:text-base font-normal break-words ${showFurigana ? 'leading-[2.2]' : 'leading-relaxed'}`}>
                  <FuriganaText text={msg.content} showFurigana={showFurigana} />
                </div>

                {/* Audio playback button for Japanese text */}
                <div className="mt-2 pt-1 flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => handleSpeak(msg.content)}
                    className={`p-1 rounded-lg transition-colors cursor-pointer ${
                      isAI
                        ? 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-700'
                        : 'text-white/70 hover:text-white hover:bg-white/20'
                    }`}
                    title="Япон дуудлага сонсох"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {!isAI && (
                <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-600 dark:text-stone-200 text-xs font-bold shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* AI Typing indicator */}
        {isLoading && (
          <div className="flex items-start gap-2.5 sm:gap-3 justify-start animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/80 flex items-center justify-center text-sm shrink-0">
              {scenario.icon}
            </div>
            <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700/80 flex items-center gap-2">
              <span className="text-xs text-stone-500 font-medium">
                {scenario.aiRole} хариулж байна...
              </span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* 5. HINT DRAWER / POPOVER */}
      {isHintOpen && (
        <div className="p-4 bg-amber-50/95 dark:bg-amber-950/90 border-t border-amber-200 dark:border-amber-900/60 shadow-lg animate-slide-up relative">
          <button
            type="button"
            onClick={() => setIsHintOpen(false)}
            className="absolute top-3 right-3 p-1 rounded-lg text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>💡 Тусламж ба Санал болгох илэрхийлэл</span>
          </div>

          {isHintLoading ? (
            <div className="flex items-center gap-2 text-xs text-stone-500 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              <span>Тохирох тусламжийг боловсруулж байна...</span>
            </div>
          ) : hintData ? (
            <div className="space-y-2 text-xs">
              <p className="text-stone-800 dark:text-stone-200 font-medium leading-relaxed">
                {hintData.hintMongolian}
              </p>

              {hintData.suggestedExpressions && hintData.suggestedExpressions.length > 0 && (
                <div className="pt-1">
                  <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300 mb-1.5">
                    Ашиглаж болох хэллэгүүд (дарж бичвэрт оруулах):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {hintData.suggestedExpressions.map((expr, idx) => {
                      const cleanExpr = stripFurigana(expr);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setInputText(cleanExpr);
                            if (inputRef.current) inputRef.current.focus();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-amber-300 dark:border-amber-800 hover:border-amber-500 text-stone-900 dark:text-white font-jp text-xs font-medium transition-all hover:scale-102 cursor-pointer shadow-2xs text-left"
                        >
                          <FuriganaText text={cleanExpr} showFurigana={false} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* 6. STARTER SUGGESTIONS PILLS (When messages <= 2) */}
      {messages.length <= 2 && starters.length > 0 && !isHintOpen && (
        <div className="px-4 py-2 bg-stone-50 dark:bg-stone-900/80 border-t border-stone-200/60 dark:border-stone-800/60 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
          <span className="text-[11px] text-stone-400 font-bold shrink-0">Санал:</span>
          {starters.map((starter, idx) => {
            const cleanStarter = stripFurigana(starter);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputText(cleanStarter);
                  if (inputRef.current) inputRef.current.focus();
                }}
                className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 border border-stone-200 dark:border-stone-700 hover:border-amber-300 text-stone-700 dark:text-stone-300 hover:text-amber-800 dark:hover:text-amber-200 font-jp whitespace-nowrap transition-colors cursor-pointer text-xs"
              >
                <FuriganaText text={cleanStarter} showFurigana={false} />
              </button>
            );
          })}
        </div>
      )}

      {/* 7. INPUT BAR */}
      <footer className="p-3 sm:p-4 bg-stone-50 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center gap-2 shrink-0">
        {/* Hint button */}
        <button
          type="button"
          onClick={handleRequestHint}
          disabled={isLoading || isFinishing}
          className="p-2.5 sm:px-3 sm:py-2.5 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          title="Юу гэж хэлэхээ мэдэхгүй байвал тусламж авах"
        >
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="hidden sm:inline">💡 Тусламж</span>
        </button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Японоор хариултаа бичнэ үү (жишээ: すみません、水はどこですか？)..."
            disabled={isLoading || isFinishing}
            className="w-full pl-3.5 pr-4 py-2.5 sm:py-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs sm:text-sm font-jp"
          />
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={!inputText.trim() || isLoading || isFinishing}
          className="p-2.5 sm:p-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold transition-all shadow-xs cursor-pointer shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="Илгээх"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </footer>

      {/* 8. USAGE LIMIT REACHED MODAL */}
      {isLimitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-100">
              Үнэгүй хэрэглээний 20 мессеж дууслаа
            </h3>

            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Таны 24 цагийн үнэгүй Sunny AI болон Roleplay мессежийн лимит хүрсэн байна. SunnyLearn Premium эрх авснаар AI Roleplay болон хувийн багшийг ямар ч хязгааргүй ашиглах боломжтой!
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsLimitModalOpen(false);
                  setIsAuthModalOpen(true);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-sm shadow-md hover:from-amber-600 hover:to-amber-700 transition-all cursor-pointer"
              >
                Premium эрх идэвхжүүлэх
              </button>

              <button
                type="button"
                onClick={() => setIsLimitModalOpen(false)}
                className="w-full py-2.5 rounded-xl text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 text-xs font-semibold"
              >
                Хаах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
