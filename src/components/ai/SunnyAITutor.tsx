import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  RotateCcw,
  X,
  Lock,
  Copy,
  Check,
  BookOpen,
  ArrowRight,
  HelpCircle,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SunnyAIQuizContext, SunnyAIMessage, JLPTLevel, SunnyAIRoleplayFeedbackContext } from '../../types';
import { apiService } from '../../services/api';
import { LevelBadge } from '../common/LevelBadge';
import { AudioButton } from '../common/AudioButton';

interface SunnyAITutorProps {
  mode?: 'page' | 'modal';
  onClose?: () => void;
  initialQuizContext?: SunnyAIQuizContext | null;
  initialRoleplayContext?: SunnyAIRoleplayFeedbackContext | null;
}

export const SunnyAITutor: React.FC<SunnyAITutorProps> = ({
  mode = 'page',
  onClose,
  initialQuizContext,
  initialRoleplayContext
}) => {
  const {
    isPremium,
    selectedLevel,
    setActiveTab,
    setIsAuthModalOpen,
    currentUser,
    sunnyAIUsage,
    refreshSunnyAIUsage,
    showToast
  } = useApp();

  const [messages, setMessages] = useState<SunnyAIMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeQuizContext, setActiveQuizContext] = useState<SunnyAIQuizContext | null>(
    initialQuizContext || null
  );
  const [activeRoleplayContext, setActiveRoleplayContext] = useState<SunnyAIRoleplayFeedbackContext | null>(
    initialRoleplayContext || null
  );
  const [localLimitReached, setLocalLimitReached] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Sync initial quiz context when opened
  useEffect(() => {
    if (initialQuizContext) {
      setActiveQuizContext(initialQuizContext);
      handleQuizExplanationRequest(initialQuizContext);
    }
  }, [initialQuizContext]);

  // Sync initial roleplay context when opened
  useEffect(() => {
    if (initialRoleplayContext) {
      setActiveRoleplayContext(initialRoleplayContext);
      handleRoleplayExplanationRequest(initialRoleplayContext);
    }
  }, [initialRoleplayContext]);

  // Trigger automated explanation when opened with roleplay feedback context
  const handleRoleplayExplanationRequest = async (roleplay: SunnyAIRoleplayFeedbackContext) => {
    setIsLoading(true);
    const categoryName =
      roleplay.category === 'grammar'
        ? 'Дүрмийн зөвлөгөө'
        : roleplay.category === 'naturalness'
        ? 'Байгалийн яриа'
        : 'Үгийн сан';

    const userPrompt = `Roleplay: 【${roleplay.scenarioTitle}】 (${roleplay.jlptLevel}) харилцан яриан дахь дараах өгүүлбэрийг монголоор дэлгэрүүлэн тайлбарлаж өгнө үү:\n\nТөрөл: ${categoryName}\nМиний хэлсэн: "${roleplay.originalSentence}"\nЗөв/Байгалийн хэлбэр: "${roleplay.betterSentence}"\nҮндсэн тайлбар: ${roleplay.explanation}`;

    const userMsg: SunnyAIMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: userPrompt,
      createdAt: new Date().toISOString()
    };

    setMessages([userMsg]);

    try {
      const res = await apiService.sendSunnyAIMessage({
        message: userPrompt,
        conversationHistory: [],
        currentLevel: roleplay.jlptLevel || selectedLevel || 'N5',
        roleplayContext: roleplay
      });

      const assistantMsg: SunnyAIMessage = {
        id: 'ast_' + Date.now(),
        role: 'assistant',
        content: res.reply,
        createdAt: new Date().toISOString()
      };

      setMessages([userMsg, assistantMsg]);
      await refreshSunnyAIUsage();
    } catch (err: any) {
      if (err?.limitReached) {
        setLocalLimitReached(true);
      }
      const errorMsg: SunnyAIMessage = {
        id: 'err_' + Date.now(),
        role: 'assistant',
        content: err?.message || 'Sunny AI хариулахад алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу.',
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger automated explanation when opened with quiz context
  const handleQuizExplanationRequest = async (quiz: SunnyAIQuizContext) => {
    setIsLoading(true);
    const userPrompt = `Энэ асуулт дээр миний сонгосон "${quiz.userAnswer || 'сонгоогүй'}" хариулт яагаад буруу болсныг, мөн зөв хариулт болох "${quiz.correctAnswer}" нь яагаад зөв болохыг монгол хэлээр маш тодорхой тайлбарлаж өгөөч.`;

    const userMsg: SunnyAIMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: userPrompt,
      createdAt: new Date().toISOString(),
      quizContext: quiz
    };

    setMessages([userMsg]);

    try {
      const res = await apiService.sendSunnyAIMessage({
        message: userPrompt,
        conversationHistory: [],
        quizContext: quiz,
        currentLevel: quiz.jlptLevel || selectedLevel || 'N5'
      });

      const assistantMsg: SunnyAIMessage = {
        id: 'ast_' + Date.now(),
        role: 'assistant',
        content: res.reply,
        createdAt: new Date().toISOString()
      };

      setMessages([userMsg, assistantMsg]);
      await refreshSunnyAIUsage();
    } catch (err: any) {
      if (err?.limitReached) {
        setLocalLimitReached(true);
      }
      const errorMsg: SunnyAIMessage = {
        id: 'err_' + Date.now(),
        role: 'assistant',
        content: err?.message || 'Sunny AI хариулахад алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу.',
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    // Check limit
    if (!isPremium && sunnyAIUsage && sunnyAIUsage.limitReached) {
      setLocalLimitReached(true);
      return;
    }

    const newUserMsg: SunnyAIMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString()
    };

    const newHistory = [...messages, newUserMsg];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);

    try {
      const payloadHistory = newHistory.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await apiService.sendSunnyAIMessage({
        message: text,
        conversationHistory: payloadHistory.slice(0, -1),
        quizContext: activeQuizContext || undefined,
        currentLevel: selectedLevel || 'N5'
      });

      const assistantMsg: SunnyAIMessage = {
        id: 'ast_' + Date.now(),
        role: 'assistant',
        content: res.reply,
        createdAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMsg]);
      await refreshSunnyAIUsage();
    } catch (err: any) {
      if (err?.limitReached) {
        setLocalLimitReached(true);
      }
      const errorMsg: SunnyAIMessage = {
        id: 'err_' + Date.now(),
        role: 'assistant',
        content: err?.message || 'Уучлаарай, хариулт авахад алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу.',
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    setActiveQuizContext(null);
    setLocalLimitReached(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Текст хуулагдлаа', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isLimitReached = !isPremium && (sunnyAIUsage?.limitReached || localLimitReached);

  const quickPrompts = [
    { title: 'Дүрэм асуух', prompt: '「〜なければならない」 болон 「〜なくてもいい」 дүрмийн бүтцийг жишээ өгүүлбэртэй тайлбарлаж өгөөч.' },
    { title: 'Ханз (Канжи) судлах', prompt: '「働」 ханзны утга, Күн-ёми, Он-ёми уншлага, бодит нийлмэл үгсийг тайлбарлаж өгөөч.' },
    { title: 'Үгийн ялгаа', prompt: 'Япон хэлний 「教える」 (заах) болон 「習う」 (сурах) үгсийн хэрэглээний ялгааг жишээтэй тайлбарлана уу.' },
    { title: 'Бөөм (助詞) тайлбар', prompt: '「は」 ба 「が」 бөөмийн гол ялгааг анхан шатны суралцагчид ойлгомжтойгоор тайлбарлаж өгөөч.' }
  ];

  const followUpSuggestions = [
    'Өөр жишээ өгүүлбэр өгөөч',
    'Илүү энгийнээр тайлбарлаач',
    'Энэ дүрмийн сөрөг болон өнгөрсөн цагийн хувирал юу вэ?',
    'Андуурагдах магадлалтай төстэй өөр дүрэм байна уу?'
  ];

  return (
    <div
      className={`flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 ${
        mode === 'modal'
          ? 'h-[85vh] max-h-[780px] w-full rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800'
          : 'w-full max-w-4xl mx-auto min-h-[75vh] sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs sm:my-6 overflow-hidden'
      }`}
    >
      {/* 1. TUTOR HEADER */}
      <header className="p-4 sm:px-6 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 dark:bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100 truncate">
                Sunny AI
              </h2>
              {isPremium && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-2xs">
                  Premium • Хязгааргүй
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
              Япон хэлний хиймэл оюун ухаант хувийн багш
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleResetChat}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              title="Шинэ яриа эхлүүлэх"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {mode === 'modal' && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              title="Хаах"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* 2. QUIZ CONTEXT CARD (If active) */}
      {activeQuizContext && (
        <div className="bg-amber-50/80 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/40 p-3 sm:px-6 flex items-start justify-between gap-3 text-xs sm:text-sm shrink-0">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                Сонжооны алдаа шинжлэх горим:
              </span>
              {activeQuizContext.jlptLevel && (
                <LevelBadge level={activeQuizContext.jlptLevel} size="sm" />
              )}
            </div>
            <p className="font-semibold text-stone-800 dark:text-stone-200 font-jp">
              {activeQuizContext.question}{' '}
              {activeQuizContext.questionReading && `【${activeQuizContext.questionReading}】`}
            </p>
            <div className="flex flex-wrap gap-2 pt-1 text-xs">
              <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold">
                Таны буруу сонголт: {activeQuizContext.userAnswer || 'сонгоогүй'}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                Зөв хариулт: {activeQuizContext.correctAnswer}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveQuizContext(null)}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 p-1 cursor-pointer shrink-0"
            title="Энэ сонжооны хам сэдвийг хаах"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2.5 ROLEPLAY FEEDBACK CONTEXT CARD (If active) */}
      {activeRoleplayContext && (
        <div className="bg-amber-50/90 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/40 p-3 sm:px-6 flex items-start justify-between gap-3 text-xs sm:text-sm shrink-0">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Roleplay тайлангийн зөвлөгөө:
              </span>
              <span className="font-bold font-jp text-stone-900 dark:text-stone-100">
                {activeRoleplayContext.scenarioTitle}
              </span>
              {activeRoleplayContext.jlptLevel && (
                <LevelBadge level={activeRoleplayContext.jlptLevel} size="sm" />
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/40">
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block">Таны бичсэн:</span>
                <span className="font-jp font-semibold text-stone-900 dark:text-stone-100">{activeRoleplayContext.originalSentence}</span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/40">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">Зөв/байгалийн:</span>
                <span className="font-jp font-semibold text-stone-900 dark:text-stone-100">{activeRoleplayContext.betterSentence}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveRoleplayContext(null)}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 p-1 cursor-pointer shrink-0"
            title="Энэ Roleplay зөвлөгөөний хам сэдвийг хаах"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. CHAT MESSAGES BODY */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-h-[280px]">
        {/* Empty state welcome */}
        {messages.length === 0 && (
          <div className="max-w-xl mx-auto py-6 text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 dark:bg-amber-400/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20 shadow-xs">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-2.5">
              <h3 className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-100">
                Сайн байна уу! Би таны Япон хэлний багш Sunny AI.
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-md mx-auto">
                Япон хэлний үг, ханз, дүрэм, өгүүлбэрийн нарийн ялгаа болон сорил шалгалтын алдааг монгол хэлээр тайлбарлаж өгөхөд бэлэн байна.
              </p>
              <div className="pt-1">
                <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-400/10 border border-amber-300/60 dark:border-amber-800/60 rounded-xl py-1.5 px-3 max-w-md mx-auto inline-flex items-center justify-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                  <span>Premium хэрэглэгч Sunny AI-тай ямар ч мессежийн хязгааргүйгээр чөлөөтэй харилцах боломжтой.</span>
                </p>
              </div>
            </div>

            {/* Quick Prompts */}
            <div className="space-y-2 text-left pt-2">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider text-center">
                Түгээмэл асуултуудаас сонгох:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickPrompts.map((qp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(qp.prompt)}
                    className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-left transition-all group cursor-pointer shadow-2xs"
                  >
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                      {qp.title}
                    </span>
                    <span className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2">
                      {qp.prompt}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message items */}
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id || index}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[90%] sm:max-w-[85%] rounded-3xl p-4 sm:p-5 text-sm sm:text-base leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-stone-800 text-white dark:bg-stone-800 rounded-br-xs shadow-xs'
                    : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 rounded-bl-xs shadow-2xs'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-stone-100 dark:border-stone-800 text-xs text-stone-400">
                    <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Sunny AI Багш
                    </span>
                    <div className="flex items-center gap-1.5">
                      {/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(msg.content) && (
                        <AudioButton
                          text={msg.content}
                          id={`sunny_msg_${msg.id}`}
                          size="xs"
                          variant="ghost"
                          title="Япон хэсгийг сонсох"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => handleCopyText(msg.id, msg.content)}
                        className="p-1 hover:text-stone-600 dark:hover:text-stone-200 transition-colors cursor-pointer"
                        title="Хуулах"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
                {msg.content}
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex items-start gap-2 text-stone-400 text-xs sm:text-sm animate-pulse">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
              <span>Sunny AI хариултыг боловсруулж байна...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. FOLLOW-UP SUGGESTIONS (when chat has started and not loading) */}
      {messages.length > 0 && !isLoading && !isLimitReached && (
        <div className="px-4 sm:px-6 py-2 bg-stone-100/60 dark:bg-stone-900/40 border-t border-stone-200 dark:border-stone-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-2xs font-bold text-stone-400 uppercase tracking-wider shrink-0">
            Дараагийн асуулт:
          </span>
          {followUpSuggestions.map((sug, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(sug)}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-300 hover:border-amber-400 dark:hover:border-amber-500 whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      {/* 5. LIMIT REACHED WARNING BANNER */}
      {isLimitReached && (
        <div className="p-4 bg-amber-500/10 dark:bg-amber-400/10 border-t border-amber-300 dark:border-amber-800 text-center space-y-3 shrink-0">
          <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Sunny AI-ийн үнэгүй хэрэглээний хязгаарт хүрлээ.</span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-400 max-w-md mx-auto">
            {sunnyAIUsage?.resetInText
              ? `Үнэгүй эрх ${sunnyAIUsage.resetInText}-ийн дараа сэргэнэ.`
              : 'Эрх 24 цагийн дараа автоматаар сэргэнэ.'}{' '}
            Premium авснаар Sunny AI-тай мессежийн хязгааргүй харилцах боломжтой.
          </p>
          <button
            type="button"
            onClick={() => {
              if (onClose) onClose();
              setActiveTab('premium');
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>SunnyLearn Premium авах (Хязгааргүй)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 6. INPUT AREA */}
      {!isLimitReached && (
        <footer className="p-3 sm:p-4 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 shrink-0">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Япон хэл, дүрэм, ханз, эсвэл сорилтой холбоотой асуултаа бичнэ үү..."
              disabled={isLoading}
              className="flex-1 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs sm:text-sm px-4 py-3 rounded-2xl border border-transparent focus:border-amber-500 focus:bg-white dark:focus:bg-stone-900 outline-hidden transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white transition-all cursor-pointer shadow-xs shrink-0"
              title="Илгээх"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </form>
        </footer>
      )}
    </div>
  );
};
