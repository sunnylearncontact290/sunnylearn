import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  JLPTLevel,
  FreeChatMessage,
  FreeChatFeedbackReport,
  ConversationStyle,
  VoicePersona
} from '../../types';
import { apiService } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { FuriganaText } from '../roleplay/FuriganaText';
import { FreeConversationFeedbackModal } from './FreeConversationFeedbackModal';
import { speechService } from '../../services/speech';
import {
  Mic,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Settings,
  Award,
  AlertCircle,
  Keyboard,
  X,
  Send,
  Loader2,
  Check
} from 'lucide-react';

interface FreeConversationViewProps {
  onBackToRoleplay?: () => void;
}

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface StarterTopic {
  id: string;
  title: string;
  labelMn: string;
  greeting: string;
  cleanGreeting: string;
}

const STARTER_TOPICS: StarterTopic[] = [
  {
    id: 'today',
    title: '今日何をしたか',
    labelMn: 'Өнөөдрийн тухай',
    greeting: 'やっほー！今日（きょう）はどんな一日（いちにち）だった？何（なに）か楽（たの）しいことあった？',
    cleanGreeting: 'やっほー！今日はどんな一日だった？何か楽しいことあった？'
  },
  {
    id: 'hobbies',
    title: '趣味や好きなこと',
    labelMn: 'Хобби, сонирхол',
    greeting: 'やっほー！休（やす）みの日（ひ）って普段（ふだん）何（なに）して過（す）ごすのが好（す）き？',
    cleanGreeting: 'やっほー！休みの日って普段何して過ごすのが好き？'
  },
  {
    id: 'food',
    title: '好きな食べ物・料理',
    labelMn: 'Япон хоол',
    greeting: 'ねえねえ、日本料理（にほんりょうり）で何（なに）が一番（いちばん）好（す）き？ラーメンとか寿司（すし）とか好（す）きなのある？',
    cleanGreeting: 'ねえねえ、日本料理で何が一番好き？ラーメンとか寿司とか好きなのある？'
  },
  {
    id: 'anime',
    title: 'アニメや映画',
    labelMn: 'Аниме, кино',
    greeting: '最近（さいきん）見（み）たアニメとか映画（えいが）で、おすすめってある？めっちゃ気（き）になる！',
    cleanGreeting: '最近見たアニメとか映画で、おすすめってある？めっちゃ気になる！'
  },
  {
    id: 'cars',
    title: '車やドライブ',
    labelMn: 'Машин, тээвэр',
    greeting: '車（くるま）とかドライブって好（す）き？日本（にほん）の車（くるま）で好（す）きな車種（しゃしゅ）とか乗（の）ってみたいやつある？',
    cleanGreeting: '車とかドライブって好き？日本の車で好きな車種とか乗ってみたいやつある？'
  },
  {
    id: 'travel',
    title: '旅行してみたい場所',
    labelMn: 'Аялал зугаалга',
    greeting: '日本（にほん）で行（い）ってみたい場所（ばしょ）ってある？東京（とうきょう）とか京都（きょうと）とか、気（き）になるところどこ？',
    cleanGreeting: '日本で行ってみたい場所ってある？東京とか京都とか、気になるところどこ？'
  }
];

export const FreeConversationView: React.FC<FreeConversationViewProps> = ({
  onBackToRoleplay
}) => {
  const {
    selectedLevel,
    isPremium,
    sunnyAIUsage,
    refreshSunnyAIUsage,
    openPremiumModal
  } = useApp();

  // Settings State
  const [currentLevel, setCurrentLevel] = useState<JLPTLevel>(selectedLevel || 'N5');
  const [conversationStyle, setConversationStyle] = useState<ConversationStyle>('natural');
  const [voicePersona, setVoicePersona] = useState<VoicePersona>('Kore');
  const [showFurigana, setShowFurigana] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('today');

  // Voice Interaction Core State
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);

  // Live Speech Recognition State
  const [speechInterimText, setSpeechInterimText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [micPermissionDenied, setMicPermissionDenied] = useState<boolean>(false);

  // Conversation turns (preserved in memory for full session context)
  const [messages, setMessages] = useState<FreeChatMessage[]>([]);
  const messagesRef = useRef<FreeChatMessage[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Audio Playback references
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const currentTranscriptRef = useRef<string>('');
  const isSessionActiveRef = useRef<boolean>(false);
  const voiceStateRef = useRef<VoiceState>('idle');
  const resumeListeningTimeoutRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Sync refs with state to prevent race conditions in speech callbacks
  useEffect(() => {
    isSessionActiveRef.current = isSessionActive;
  }, [isSessionActive]);

  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  // Feedback Modal State
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackReport, setFeedbackReport] = useState<FreeChatFeedbackReport | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

  // Discreet keyboard input drawer (for quiet environments)
  const [isTextDrawerOpen, setIsTextDrawerOpen] = useState(false);
  const [keyboardInput, setKeyboardInput] = useState('');

  // Sync global selectedLevel
  useEffect(() => {
    if (selectedLevel) {
      setCurrentLevel(selectedLevel);
    }
  }, [selectedLevel]);

  // Auto-scroll chat to latest message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, speechInterimText, voiceState]);

  // Cleanly stop any ongoing audio playback
  const stopAudio = useCallback(() => {
    speechService.stop();
    if (audioPlayerRef.current) {
      try {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
      } catch {}
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }, []);

  // Safely stop recognition
  const stopRecognition = useCallback(() => {
    if (resumeListeningTimeoutRef.current) {
      clearTimeout(resumeListeningTimeoutRef.current);
      resumeListeningTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      stopRecognition();
    };
  }, [stopAudio, stopRecognition]);

  // ----------------------------------------------------
  // SPEECH RECOGNITION (LISTENING)
  // ----------------------------------------------------
  const startListening = useCallback(async () => {
    // Prevent starting if session is ended
    if (!isSessionActiveRef.current) {
      return;
    }

    // Stop audio so AI never listens to itself
    stopAudio();
    stopRecognition();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage(
        'Таны хөтөч дуу хоолой таних Web Speech системийг дэмжихгүй байна. Chrome эсвэл Safari ашиглана уу.'
      );
      setVoiceState('idle');
      return;
    }

    // Check mic permission via getUserMedia if available
    if (navigator?.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setMicPermissionDenied(false);
      } catch (err: any) {
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          setMicPermissionDenied(true);
          setErrorMessage('Микрофоны зөвшөөрөл хаалттай байна. Хөтчийнхөө тохиргооноос зөвшөөрнө үү.');
          setVoiceState('idle');
          return;
        }
      }
    }

    try {
      currentTranscriptRef.current = '';
      setSpeechInterimText('');
      setErrorMessage(null);

      const recognition = new SpeechRecognition();
      recognition.lang = 'ja-JP';
      recognition.interimResults = true;
      recognition.continuous = false; // Fires onend automatically when speaker pauses
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setVoiceState('listening');
        setSpeechInterimText('');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }
        const recognized = (final || interim).trim();
        if (recognized) {
          currentTranscriptRef.current = recognized;
          setSpeechInterimText(recognized);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[Voice Recognition]', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMicPermissionDenied(true);
          setErrorMessage('Микрофоны зөвшөөрөл хаалттай байна.');
          setVoiceState('idle');
        } else if (event.error === 'audio-capture') {
          setErrorMessage('Микрофон олдсонгүй эсвэл өөр програм ашиглаж байна.');
          setVoiceState('idle');
        } else if (event.error === 'no-speech') {
          // User didn't say anything; if session still active, seamlessly re-arm
          if (isSessionActiveRef.current && voiceStateRef.current === 'listening') {
            resumeListeningTimeoutRef.current = setTimeout(() => {
              if (isSessionActiveRef.current) {
                startListening();
              }
            }, 500);
          }
        } else if (event.error !== 'aborted') {
          setErrorMessage(`Яриа танихад алдаа: ${event.error}`);
        }
      };

      recognition.onend = () => {
        const textSpoken = currentTranscriptRef.current.trim();
        if (textSpoken) {
          // User finished speaking a turn!
          currentTranscriptRef.current = '';
          setSpeechInterimText('');
          handleProcessUserSpeech(textSpoken);
        } else if (isSessionActiveRef.current && voiceStateRef.current === 'listening') {
          // If ended without speech (timeout), restart listening after a brief moment
          resumeListeningTimeoutRef.current = setTimeout(() => {
            if (isSessionActiveRef.current && voiceStateRef.current === 'listening') {
              startListening();
            }
          }, 400);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Cannot start recognition:', err);
      setVoiceState('idle');
    }
  }, [stopAudio, stopRecognition]);

  // ----------------------------------------------------
  // PLAY AI AUDIO (NEURAL TTS WITH FALLBACK)
  // ----------------------------------------------------
  const playAiVoice = useCallback(
    async (text: string, audioDataUri?: string | null) => {
      // Strictly stop recognition before audio to avoid feedback loop
      stopRecognition();
      stopAudio();

      const clean = speechService.cleanJapanese(text);

      if (!clean) {
        if (isSessionActiveRef.current) {
          startListening();
        } else {
          setVoiceState('idle');
        }
        return;
      }

      setVoiceState('speaking');

      const onSpeechComplete = () => {
        // Anti-echo protection buffer: 350ms pause before microphone reopens
        resumeListeningTimeoutRef.current = setTimeout(() => {
          if (isSessionActiveRef.current) {
            startListening();
          } else {
            setVoiceState('idle');
          }
        }, 350);
      };

      await speechService.play(clean, {
        audioUri: audioDataUri,
        voice: voicePersona === 'Puck' ? 'Puck' : 'Kore',
        isConversation: true,
        cacheable: false,
        onEnd: onSpeechComplete,
        onError: (err) => {
          console.warn('[FreeConversation] Speech error:', err);
          onSpeechComplete();
        }
      });
    },
    [stopRecognition, stopAudio, voicePersona, startListening]
  );

  // ----------------------------------------------------
  // PROCESS USER SPEECH & AI TURN
  // ----------------------------------------------------
  const handleProcessUserSpeech = async (spokenText: string) => {
    const trimmed = spokenText.trim();
    if (!trimmed) return;

    // Check usage limits if non-premium
    if (!isPremium && sunnyAIUsage && sunnyAIUsage.limitReached) {
      openPremiumModal();
      setVoiceState('idle');
      setIsSessionActive(false);
      return;
    }

    setVoiceState('thinking');
    setErrorMessage(null);
    setSpeechInterimText('');

    const userMsg: FreeChatMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: trimmed,
      cleanContent: trimmed,
      createdAt: Date.now()
    };

    const updatedMessages = [...messagesRef.current, userMsg];
    setMessages(updatedMessages);

    try {
      const payloadMessages = updatedMessages.map(m => ({
        role: m.role,
        content: m.cleanContent || m.content
      }));

      const res = await apiService.sendFreeChatMessage({
        messages: payloadMessages,
        jlptLevel: currentLevel,
        style: conversationStyle,
        voiceName: voicePersona,
        generateAudio: true
      });

      refreshSunnyAIUsage();

      const aiMsg: FreeChatMessage = {
        id: 'ai_' + Date.now(),
        role: 'assistant',
        content: res.reply,
        cleanContent: res.cleanReply,
        audioUrl: res.audio,
        correction: res.correction,
        createdAt: Date.now()
      };

      setMessages(prev => [...prev, aiMsg]);

      // Automatically play AI Japanese response
      await playAiVoice(res.reply, res.audio);
    } catch (err: any) {
      console.error('[Free Chat Voice Error]', err);
      if (err?.limitReached) {
        openPremiumModal();
        setIsSessionActive(false);
        setVoiceState('idle');
      } else {
        setErrorMessage(err?.message || 'Хариулт авахад алдаа гарлаа. Дахин ярина уу.');
        if (isSessionActiveRef.current) {
          startListening();
        } else {
          setVoiceState('idle');
        }
      }
    }
  };

  // ----------------------------------------------------
  // CONVERSATION CONTROLS (START / INTERRUPT / END)
  // ----------------------------------------------------
  const startConversation = (topicId?: string) => {
    const topicToUse = topicId || selectedTopicId;
    setSelectedTopicId(topicToUse);
    setIsSessionActive(true);
    setErrorMessage(null);

    const topic = STARTER_TOPICS.find(t => t.id === topicToUse) || STARTER_TOPICS[0];

    const welcomeMsg: FreeChatMessage = {
      id: 'ai_welcome_' + Date.now(),
      role: 'assistant',
      content: topic.greeting,
      cleanContent: topic.cleanGreeting,
      createdAt: Date.now()
    };

    setMessages([welcomeMsg]);

    // AI speaks opening greeting, and automatically transitions to listening
    playAiVoice(topic.cleanGreeting);
  };

  const handleMicClick = () => {
    // 1. If AI is speaking -> USER INTERRUPTION! Cut off audio and start listening
    if (voiceState === 'speaking') {
      stopAudio();
      if (isSessionActive) {
        startListening();
      }
      return;
    }

    // 2. If idle or session not active -> Start Conversation
    if (!isSessionActive || voiceState === 'idle') {
      if (messages.length === 0) {
        startConversation();
      } else {
        setIsSessionActive(true);
        startListening();
      }
      return;
    }

    // 3. If currently listening -> Finish speaking immediately & process
    if (voiceState === 'listening') {
      const textToProcess = currentTranscriptRef.current.trim() || speechInterimText.trim();
      stopRecognition();
      if (textToProcess) {
        currentTranscriptRef.current = '';
        setSpeechInterimText('');
        handleProcessUserSpeech(textToProcess);
      } else {
        // Pause listening
        setVoiceState('idle');
      }
      return;
    }
  };

  // End conversation session & show feedback
  const handleEndConversation = async () => {
    setShowSettings(false);
    stopAudio();
    stopRecognition();
    setIsSessionActive(false);
    setVoiceState('idle');
    setSpeechInterimText('');

    if (messages.length >= 2) {
      setIsFeedbackModalOpen(true);
      setIsLoadingFeedback(true);
      try {
        const payloadMessages = messages.map(m => ({
          role: m.role,
          content: m.cleanContent || m.content
        }));
        const res = await apiService.getFreeChatFeedback({
          messages: payloadMessages,
          jlptLevel: currentLevel
        });
        if (res && res.feedback) {
          setFeedbackReport(res.feedback);
        }
      } catch (err) {
        console.error('[Feedback error]', err);
      } finally {
        setIsLoadingFeedback(false);
      }
    }
  };

  // Reset conversation to fresh state
  const handleReset = () => {
    setShowSettings(false);
    stopAudio();
    stopRecognition();
    setIsSessionActive(false);
    setVoiceState('idle');
    setMessages([]);
    setSpeechInterimText('');
    setErrorMessage(null);
  };

  // Keyboard text submit (for quiet spaces)
  const handleKeyboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = keyboardInput.trim();
    if (!text) return;
    setKeyboardInput('');

    if (!isSessionActive) {
      setIsSessionActive(true);
    }
    handleProcessUserSpeech(text);
  };

  // Latest AI message for the replay button
  const latestAiMsg = [...messages].reverse().find(m => m.role === 'assistant');

  return (
    <div className="w-full min-w-0 max-w-3xl mx-auto flex flex-col h-[calc(100dvh-5rem)] px-3 sm:px-4 py-2 select-none overflow-hidden animate-fade-in">
      
      {/* 1. COMPACT HEADER */}
      <header className="shrink-0 flex items-center justify-between gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border border-stone-200/80 dark:border-stone-800/80 shadow-2xs">
        
        {/* Left: Back button & Title with Live Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          {onBackToRoleplay && (
            <button
              type="button"
              onClick={() => {
                stopAudio();
                stopRecognition();
                onBackToRoleplay();
              }}
              className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer shrink-0"
              title="Буцах"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                voiceState === 'listening'
                  ? 'bg-red-500 animate-ping'
                  : voiceState === 'speaking'
                  ? 'bg-pink-500 animate-pulse'
                  : voiceState === 'thinking'
                  ? 'bg-orange-500 animate-spin'
                  : isSessionActive
                  ? 'bg-emerald-500'
                  : 'bg-stone-400'
              }`}
            />
            <h1 className="text-sm sm:text-base font-black text-stone-900 dark:text-stone-100 font-jp tracking-tight truncate">
              Sunny AI · フリートーク
            </h1>
            <span className="hidden sm:inline-block text-[11px] font-semibold text-stone-400 dark:text-stone-500">
              {voiceState === 'listening'
                ? '• Сонсож байна'
                : voiceState === 'speaking'
                ? '• Хариулж байна'
                : voiceState === 'thinking'
                ? '• Бодож байна'
                : isSessionActive
                ? `• ${currentLevel}`
                : '• Чөлөөт яриа'}
            </span>
          </div>
        </div>

        {/* Right: Settings Icon Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="p-2 sm:p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
            title="Тохиргоо"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ERROR & PERMISSION ALERTS */}
      {micPermissionDenied && (
        <div className="shrink-0 mt-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-200 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="flex-1">Хөтчийн хаягийн мөр дээрх цоож (🔒) дээр дарж микрофоныг зөвшөөрнө үү.</span>
        </div>
      )}

      {errorMessage && (
        <div className="shrink-0 mt-2 p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-2 text-xs text-rose-700 dark:text-rose-300 animate-fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs font-bold underline cursor-pointer shrink-0 ml-2"
          >
            Хаах
          </button>
        </div>
      )}

      {/* 2. MAIN CONVERSATION / TRANSCRIPT AREA */}
      <main className="flex-1 min-h-0 overflow-y-auto px-1 sm:px-2 py-4 space-y-3.5 overscroll-contain">
        
        {/* Initial Empty State: Clean, Inviting Voice-First Greeting */}
        {messages.length === 0 ? (
          <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center px-4 max-w-md mx-auto my-auto animate-fade-in space-y-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-[#FF0000] via-[#FF1A4B] to-[#FF3366] flex items-center justify-center shadow-lg shadow-red-500/20 text-white transform hover:scale-105 transition-transform">
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-red-50 dark:bg-red-950/40 text-[#CC0000] dark:text-[#FF6699] border border-red-200/60 dark:border-red-900/40">
                タメ口 • Найзын яриа
              </span>
              <h2 className="text-xl sm:text-2xl font-black font-jp text-stone-900 dark:text-stone-100 tracking-tight">
                やっほー！今日は何話す？
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                Япон хэлээр найзтайгаа ярьж байгаа мэт чөлөөтэй ярьж, өөртөө итгэлтэй болоорой.
              </p>
            </div>

            <p className="text-[11px] text-stone-400 dark:text-stone-500 flex items-center gap-1.5 pt-2">
              <span>Доорх улаан микрофон дээр дарж яриагаа эхлүүлээрэй</span>
            </p>
          </div>
        ) : (
          <div className="space-y-3.5 pb-2">
            {/* Message Stream */}
            {messages.map((m) => {
              if (m.role === 'user') {
                return (
                  <div key={m.id} className="flex flex-col items-end space-y-1.5 animate-fade-in">
                    <div className="user-bubble max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-xs bg-gradient-to-r from-[#990000] via-[#CC0000] to-[#E60033] dark:from-[#800000] dark:via-[#A30018] dark:to-[#B80024] text-white shadow-md shadow-red-950/20 border border-red-500/25 break-words [overflow-wrap:anywhere] [word-break:break-word]">
                      <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-white/20 text-[10px] text-white/90">
                        <span className="font-bold tracking-wide text-white">Та</span>
                        {m.createdAt && (
                          <span className="text-white/80 font-medium">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <div className="font-jp text-white font-medium text-xs sm:text-sm leading-relaxed">
                        <FuriganaText
                          text={m.cleanContent || m.content}
                          showFurigana={showFurigana}
                          isUser={true}
                          className="text-white text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    {/* Correction Tip attached if present */}
                    {m.correction && (
                      <div className="max-w-[85%] sm:max-w-[75%] p-2.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 text-[11px] text-stone-700 dark:text-stone-300 space-y-0.5 break-words [overflow-wrap:anywhere]">
                        <span className="font-bold text-amber-700 dark:text-amber-400 block text-[10px] uppercase">
                          💡 Илүү байгалийн хэллэг:
                        </span>
                        <p className="font-jp font-bold text-stone-900 dark:text-stone-100">
                          {m.correction.corrected}
                        </p>
                        {m.correction.explanation && (
                          <p className="text-[10px] text-stone-500 dark:text-stone-400">
                            {m.correction.explanation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              // Assistant message
              return (
                <div key={m.id} className="flex flex-col items-start space-y-1 animate-fade-in">
                  <div className="max-w-[92%] sm:max-w-[82%] px-4 py-3 rounded-2xl rounded-tl-xs bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-1">
                      <span className="text-[10px] font-bold text-[#FF0000] dark:text-[#FF6699] tracking-wider uppercase">
                        Sunny AI
                      </span>
                      <button
                        type="button"
                        onClick={() => playAiVoice(m.content, m.audioUrl)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-400 hover:text-[#FF0000] dark:hover:text-[#FF6699] transition-colors cursor-pointer"
                        title="Дахин сонсох"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Сонсох</span>
                      </button>
                    </div>

                    <div className="font-jp text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium leading-relaxed break-words [overflow-wrap:anywhere] [word-break:break-word]">
                      <FuriganaText
                        text={m.content}
                        showFurigana={showFurigana}
                        className="text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Live User Interim Transcript */}
            {voiceState === 'listening' && speechInterimText && (
              <div className="flex justify-end animate-fade-in">
                <div className="user-bubble max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl rounded-tr-xs bg-gradient-to-r from-[#990000]/95 via-[#CC0000]/95 to-[#E60033]/95 border border-red-400/50 text-xs sm:text-sm font-jp text-white shadow-md break-words [overflow-wrap:anywhere]">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-white mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    <span>Та ярьж байна:</span>
                  </div>
                  <div className="text-white font-medium">「{speechInterimText}」</div>
                </div>
              </div>
            )}

            {/* AI Thinking State */}
            {voiceState === 'thinking' && (
              <div className="flex justify-start animate-fade-in">
                <div className="px-4 py-2.5 rounded-2xl rounded-tl-xs bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-2xs flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF0000] dark:text-[#FF6699]" />
                  <span>Sunny хариулт бэлтгэж байна...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} className="h-1" />
          </div>
        )}
      </main>

      {/* 3. SIMPLIFIED BOTTOM CONTROL BAR */}
      <footer className="shrink-0 p-3 sm:p-3.5 rounded-3xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200/80 dark:border-stone-800/80 shadow-lg space-y-2.5">
        
        {/* Discreet Inline Text Form (only visible when keyboard is opened) */}
        {isTextDrawerOpen && (
          <form onSubmit={handleKeyboardSubmit} className="flex items-center gap-2 animate-fade-in">
            <input
              type="text"
              value={keyboardInput}
              onChange={e => setKeyboardInput(e.target.value)}
              disabled={voiceState === 'thinking'}
              placeholder="Японоор бичнэ үү (жишээ: 今日は何食べた？)..."
              className="flex-1 px-4 py-2 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-jp text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#FF3366]/30 focus:border-[#FF3366]"
            />
            <button
              type="submit"
              disabled={!keyboardInput.trim() || voiceState === 'thinking'}
              className="p-2.5 rounded-2xl bg-gradient-to-r from-[#FF0000] to-[#FF3366] text-white disabled:opacity-40 cursor-pointer shrink-0 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsTextDrawerOpen(false)}
              className="p-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* The 3-Control Primary Bar: [ Keyboard ]  [ Large Mic Button ]  [ Audio Replay ] */}
        <div className="flex items-center justify-between px-2 sm:px-6">
          
          {/* Left: Keyboard toggle for quiet typing */}
          <button
            type="button"
            onClick={() => setIsTextDrawerOpen(!isTextDrawerOpen)}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              isTextDrawerOpen
                ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 border-transparent shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
            }`}
            title="Гараар бичих"
          >
            <Keyboard className="w-5 h-5" />
          </button>

          {/* Center: Large Glowing Primary Microphone */}
          <button
            id="voice-orb-main"
            type="button"
            onClick={handleMicClick}
            disabled={voiceState === 'thinking'}
            className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 transform active:scale-95 cursor-pointer ${
              voiceState === 'listening'
                ? 'bg-gradient-to-tr from-[#FF0000] via-[#FF1A4B] to-[#FF3366] ring-6 ring-[#FF3366]/40 shadow-[0_0_30px_rgba(255,51,102,0.5)] animate-pulse'
                : voiceState === 'speaking'
                ? 'bg-gradient-to-tr from-[#FF3366] via-[#FF6699] to-[#CC0066] ring-6 ring-[#FF6699]/40 shadow-[0_0_25px_rgba(255,102,153,0.5)]'
                : voiceState === 'thinking'
                ? 'bg-gradient-to-tr from-[#CC0066] via-[#FF3366] to-[#990033] ring-4 ring-[#FF3366]/30 opacity-80 cursor-wait'
                : 'bg-gradient-to-tr from-[#FF0000] via-[#FF1A4B] to-[#FF3366] ring-4 ring-[#FF3366]/20 hover:ring-[#FF3366]/40 shadow-[0_0_20px_rgba(255,0,0,0.3)] hover:scale-105'
            }`}
            title={
              voiceState === 'speaking'
                ? 'AI яриаг таслах'
                : voiceState === 'listening'
                ? 'Сонсож дуусгах'
                : 'Ярьж эхлэх'
            }
          >
            {voiceState === 'listening' && (
              <div className="flex items-center gap-1 h-6">
                <div className="w-1 bg-white rounded-full animate-voice-wave-1" />
                <div className="w-1 bg-white rounded-full animate-voice-wave-2" />
                <div className="w-1 bg-white rounded-full animate-voice-wave-3" />
                <div className="w-1 bg-white rounded-full animate-voice-wave-2" />
                <div className="w-1 bg-white rounded-full animate-voice-wave-1" />
              </div>
            )}
            {voiceState === 'speaking' && (
              <div className="flex items-center gap-1 h-6">
                <div className="w-1 bg-white rounded-full animate-voice-wave-3" />
                <div className="w-1 bg-white rounded-full animate-voice-wave-1" />
                <div className="w-1 bg-white rounded-full animate-voice-wave-2" />
                <div className="w-1 bg-white rounded-full animate-voice-wave-1" />
                <div className="w-1 bg-white rounded-full animate-voice-wave-3" />
              </div>
            )}
            {voiceState === 'thinking' && (
              <Loader2 className="w-7 h-7 text-white animate-spin" />
            )}
            {voiceState === 'idle' && (
              <Mic className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-sm" />
            )}
          </button>

          {/* Right: Audio / Speaker Replay Button */}
          <button
            type="button"
            onClick={() => {
              if (voiceState === 'speaking') {
                stopAudio();
              } else if (latestAiMsg) {
                playAiVoice(latestAiMsg.content, latestAiMsg.audioUrl);
              }
            }}
            disabled={!latestAiMsg && voiceState !== 'speaking'}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              voiceState === 'speaking'
                ? 'bg-rose-100 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                : latestAiMsg
                ? 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                : 'bg-stone-50 dark:bg-stone-850 border-stone-200/50 dark:border-stone-800/50 text-stone-300 dark:text-stone-600 cursor-not-allowed'
            }`}
            title={voiceState === 'speaking' ? 'Дууг зогсоох' : 'Сүүлийн хариултыг дахин сонсох'}
          >
            {voiceState === 'speaking' ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </footer>

      {/* 4. SETTINGS MODAL (Houses all secondary options without wiping history) */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 text-xs">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#FF0000] dark:text-[#FF6699]" />
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  Тохиргоо (設定)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* JLPT Level Selector */}
            <div className="space-y-1.5">
              <span className="block font-bold text-stone-600 dark:text-stone-400">
                JLPT түвшин:
              </span>
              <div className="grid grid-cols-5 gap-1.5 p-1 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                {(['N5', 'N4', 'N3', 'N2', 'N1'] as JLPTLevel[]).map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setCurrentLevel(lvl)}
                    className={`py-1.5 rounded-xl font-bold text-center transition-all cursor-pointer ${
                      currentLevel === lvl
                        ? 'bg-gradient-to-r from-[#FF0000] to-[#FF3366] text-white shadow-xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Furigana Display Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60">
              <div>
                <span className="font-bold text-stone-800 dark:text-stone-200 block">
                  Фүригана дуудлага харуулах
                </span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">
                  Канжи үсэг дээр дуудлагыг жижиг хэлбэрээр харуулна
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowFurigana(!showFurigana)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  showFurigana
                    ? 'bg-gradient-to-r from-[#FF0000] to-[#FF3366] text-white shadow-xs'
                    : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                }`}
              >
                {showFurigana ? 'Асаалттай' : 'Унтраалттай'}
              </button>
            </div>

            {/* Conversation Style (Easy vs Natural) */}
            <div className="space-y-1.5">
              <span className="block font-bold text-stone-600 dark:text-stone-400">
                Ярианы хэв маяг (タメ口):
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConversationStyle('easy')}
                  className={`py-2 px-3 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                    conversationStyle === 'easy'
                      ? 'bg-gradient-to-r from-[#FF0000] to-[#FF3366] text-white border-transparent shadow-xs'
                      : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Хялбар (やさしい)
                </button>
                <button
                  type="button"
                  onClick={() => setConversationStyle('natural')}
                  className={`py-2 px-3 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                    conversationStyle === 'natural'
                      ? 'bg-gradient-to-r from-[#FF0000] to-[#FF3366] text-white border-transparent shadow-xs'
                      : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Байгалийн (自然)
                </button>
              </div>
            </div>

            {/* Voice Persona */}
            <div className="space-y-1.5">
              <span className="block font-bold text-stone-600 dark:text-stone-400">
                AI дуу хоолой (Persona):
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'Kore', name: 'Сакура', sub: 'Эмэгтэй' },
                    { id: 'Puck', name: 'Кэн', sub: 'Эрэгтэй' }
                  ] as { id: VoicePersona; name: string; sub: string }[]
                ).map(vp => (
                  <button
                    key={vp.id}
                    type="button"
                    onClick={() => setVoicePersona(vp.id)}
                    className={`py-2 px-2 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                      voicePersona === vp.id
                        ? 'bg-gradient-to-r from-[#FF0000] to-[#FF3366] text-white border-transparent shadow-xs'
                        : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <span className="block">{vp.name}</span>
                    <span className="text-[10px] font-normal opacity-75">{vp.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Topic Ideas (Inspiration) */}
            <div className="space-y-1.5 pt-1">
              <span className="block font-bold text-stone-600 dark:text-stone-400">
                Сэдвийн санаанууд (хүсвэл сонгох):
              </span>
              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {STARTER_TOPICS.map(topic => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => {
                      if (voiceState === 'speaking') stopAudio();
                      setShowSettings(false);
                      startConversation(topic.id);
                    }}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedTopicId === topic.id && isSessionActive
                        ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300'
                        : 'bg-stone-50 dark:bg-stone-800/70 border-stone-200 dark:border-stone-700/70 text-stone-700 dark:text-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    <span className="font-jp block text-xs font-bold truncate">
                      {topic.title}
                    </span>
                    <span className="text-[10px] text-stone-400 block truncate">
                      {topic.labelMn}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Session Actions (Restart & End Session) */}
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-2.5 px-3 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Яриаг шинээр эхлэх</span>
                </button>
              )}

              {isSessionActive && (
                <button
                  type="button"
                  onClick={handleEndConversation}
                  className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-[#FF0000] to-[#FF3366] hover:from-[#CC0000] hover:to-[#FF0000] text-white font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
                >
                  <Award className="w-4 h-4" />
                  <span>Яриаг дуусгаж дүгнэлт авах</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 5. FEEDBACK MODAL (Upon Ending Session) */}
      <FreeConversationFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        feedback={feedbackReport}
        isLoading={isLoadingFeedback}
        jlptLevel={currentLevel}
        messageCount={messages.length}
        onNewConversation={() => {
          setIsFeedbackModalOpen(false);
          startConversation();
        }}
      />

    </div>
  );
};
