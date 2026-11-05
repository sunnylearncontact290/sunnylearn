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
  MicOff,
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
  HelpCircle
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
  const [voicePersona, setVoicePersona] = useState<VoicePersona>('Aoede');
  const [showFurigana, setShowFurigana] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('today');

  // Voice Interaction Core State
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

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
  const isMutedRef = useRef<boolean>(false);
  const voiceStateRef = useRef<VoiceState>('idle');
  const resumeListeningTimeoutRef = useRef<any>(null);

  // Sync refs with state to prevent race conditions in speech callbacks
  useEffect(() => {
    isSessionActiveRef.current = isSessionActive;
  }, [isSessionActive]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

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
  const [isTranscriptHistoryOpen, setIsTranscriptHistoryOpen] = useState(false);

  // Sync global selectedLevel
  useEffect(() => {
    if (selectedLevel) {
      setCurrentLevel(selectedLevel);
    }
  }, [selectedLevel]);

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
    // Prevent starting if muted or session is ended
    if (isMutedRef.current || !isSessionActiveRef.current) {
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
          if (isSessionActiveRef.current && !isMutedRef.current && voiceStateRef.current === 'listening') {
            resumeListeningTimeoutRef.current = setTimeout(() => {
              if (isSessionActiveRef.current && !isMutedRef.current) {
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
        } else if (isSessionActiveRef.current && !isMutedRef.current && voiceStateRef.current === 'listening') {
          // If ended without speech (timeout), restart listening after a brief moment
          resumeListeningTimeoutRef.current = setTimeout(() => {
            if (isSessionActiveRef.current && !isMutedRef.current && voiceStateRef.current === 'listening') {
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
      // PREVENT AI FROM LISTENING TO ITSELF: strictly stop recognition before audio
      stopRecognition();
      stopAudio();

      const clean = speechService.cleanJapanese(text);

      if (!clean) {
        // Return to listening
        if (isSessionActiveRef.current && !isMutedRef.current) {
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
          if (isSessionActiveRef.current && !isMutedRef.current) {
            startListening();
          } else {
            setVoiceState('idle');
          }
        }, 350);
      };

      // Play via centralized neural speechService (using pre-generated audio if provided)
      await speechService.play(clean, {
        audioUri: audioDataUri,
        voice: voicePersona === 'Puck' ? 'Puck' : 'Aoede',
        rate: currentLevel === 'N5' || currentLevel === 'N4' ? 0.92 : 1.0,
        onEnd: onSpeechComplete,
        onError: (err) => {
          console.warn('[FreeConversation] Speech error:', err);
          onSpeechComplete();
        }
      });
    },
    [stopRecognition, stopAudio, voicePersona, currentLevel, startListening]
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
        // Return to listening so conversation doesn't die
        if (isSessionActiveRef.current && !isMutedRef.current) {
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
    setIsMuted(false);
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

    // AI immediately speaks the opening greeting, and automatically transitions to listening!
    playAiVoice(topic.cleanGreeting);
  };

  const handleOrbClick = () => {
    // 1. If AI is speaking -> USER INTERRUPTION!
    // Immediately cut off AI audio and start listening for user input
    if (voiceState === 'speaking') {
      stopAudio();
      if (isSessionActive) {
        startListening();
      }
      return;
    }

    // 2. If idle or session not active -> Start Conversation
    if (!isSessionActive || voiceState === 'idle') {
      startConversation();
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
        // Mute / pause listening
        setIsMuted(true);
        setVoiceState('idle');
      }
      return;
    }

    // 4. If thinking -> do nothing, wait for response
  };

  // Toggle Mute / Pause during session
  const toggleMute = () => {
    if (!isSessionActive) return;

    if (isMuted) {
      setIsMuted(false);
      startListening();
    } else {
      setIsMuted(true);
      stopAudio();
      stopRecognition();
      setVoiceState('idle');
    }
  };

  // End conversation session & show feedback
  const handleEndConversation = async () => {
    stopAudio();
    stopRecognition();
    setIsSessionActive(false);
    setIsMuted(false);
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
    stopAudio();
    stopRecognition();
    setIsSessionActive(false);
    setIsMuted(false);
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
    setIsTextDrawerOpen(false);

    if (!isSessionActive) {
      setIsSessionActive(true);
    }
    handleProcessUserSpeech(text);
  };

  // Extract latest user and latest AI messages for the minimal live transcript
  const latestAiMsg = [...messages].reverse().find(m => m.role === 'assistant');
  const latestUserMsg = [...messages].reverse().find(m => m.role === 'user');

  return (
    <div className="ai-conversation-container w-full min-w-0 max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col min-h-[calc(100vh-5.5rem)] justify-between space-y-4 animate-fade-in select-none overflow-x-hidden">
      
      {/* 1. TOP BAR: Title, Controls, Level Selector & End Session */}
      <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-3xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border border-stone-200/80 dark:border-stone-800/80 shadow-2xs">
        
        {/* Left: Back button & Title */}
        <div className="flex items-center gap-3">
          {onBackToRoleplay && (
            <button
              type="button"
              onClick={() => {
                stopAudio();
                stopRecognition();
                onBackToRoleplay();
              }}
              className="p-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-orange-100 dark:hover:bg-orange-950/50 text-stone-600 dark:text-stone-300 hover:text-orange-800 dark:hover:text-orange-300 transition-colors cursor-pointer shrink-0"
              title="Roleplay руу буцах"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  voiceState === 'listening'
                    ? 'bg-red-500 animate-ping'
                    : voiceState === 'speaking'
                    ? 'bg-emerald-500 animate-pulse'
                    : voiceState === 'thinking'
                    ? 'bg-orange-500 animate-spin'
                    : 'bg-stone-400'
                }`}
              />
              <h1 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100 font-jp tracking-tight">
                日本語フリートーク / Чөлөөт яриа
              </h1>
            </div>
            <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400">
              Япон хэлний дуут ярианы дадлага (Voice-First)
            </p>
          </div>
        </div>

        {/* Right: JLPT Level chips, Settings, End / Feedback button */}
        <div className="flex items-center flex-wrap gap-2 justify-end">
          {/* Level Chips */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs">
            {(['N5', 'N4', 'N3', 'N2', 'N1'] as JLPTLevel[]).map(lvl => (
              <button
                key={lvl}
                type="button"
                onClick={() => setCurrentLevel(lvl)}
                className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  currentLevel === lvl
                    ? 'bg-gradient-to-r from-[#FF0000] to-[#FF3366] text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Furigana Toggle */}
          <button
            type="button"
            onClick={() => setShowFurigana(!showFurigana)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
              showFurigana
                ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-300'
                : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500'
            }`}
            title="Фүригана дээр харуулах"
          >
            <span className="font-jp text-[11px]">あ</span>
            <span>{showFurigana ? 'ON' : 'OFF'}</span>
          </button>

          {/* Settings button */}
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-2xl border transition-colors cursor-pointer ${
              showSettings
                ? 'bg-orange-600 text-white border-orange-700'
                : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
            title="Тохиргоо"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* End Conversation / Feedback review */}
          {isSessionActive && (
            <button
              type="button"
              onClick={handleEndConversation}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-stone-900 dark:bg-stone-100 hover:bg-orange-600 dark:hover:bg-orange-600 text-white dark:text-stone-900 font-bold text-xs shadow-2xs transition-all cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-orange-500" />
              <span>Яриаг дуусгах</span>
            </button>
          )}
        </div>
      </header>

      {/* EXPANDABLE SETTINGS */}
      {showSettings && (
        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3 animate-fade-in text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
              Ярианы тохиргоо (音声・会話設定)
            </span>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="text-stone-400 hover:text-stone-600 cursor-pointer text-xs"
            >
              Хаах
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="block font-bold text-stone-600 dark:text-stone-400 mb-1.5">
                Найзын ярианы хэв маяг (タメ口):
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConversationStyle('easy')}
                  className={`flex-1 py-1.5 px-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                    conversationStyle === 'easy'
                      ? 'bg-gradient-to-r from-[#FF0000] to-[#FF3366] text-white border-transparent shadow-xs'
                      : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Хялбар тамегүчи (やさしい)
                </button>
                <button
                  type="button"
                  onClick={() => setConversationStyle('natural')}
                  className={`flex-1 py-1.5 px-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                    conversationStyle === 'natural'
                      ? 'bg-gradient-to-r from-[#FF0000] to-[#FF3366] text-white border-transparent shadow-xs'
                      : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Байгалийн тамегүчи (自然)
                </button>
              </div>
            </div>

            <div>
              <span className="block font-bold text-stone-600 dark:text-stone-400 mb-1.5">
                AI найзын дуу хоолой (Persona):
              </span>
              <div className="flex gap-2">
                {(
                  [
                    { id: 'Aoede', name: 'Сакура (Эмэгтэй)' },
                    { id: 'Puck', name: 'Кэн (Эрэгтэй)' },
                    { id: 'Kore', name: 'Аой (Тайван)' }
                  ] as { id: VoicePersona; name: string }[]
                ).map(vp => (
                  <button
                    key={vp.id}
                    type="button"
                    onClick={() => setVoicePersona(vp.id)}
                    className={`flex-1 py-1.5 px-2 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                      voicePersona === vp.id
                        ? 'bg-gradient-to-r from-[#FF0000] to-[#FF3366] text-white border-transparent shadow-xs'
                        : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    {vp.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MIC PERMISSION WARNING */}
      {micPermissionDenied && (
        <div className="p-3.5 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-start gap-3 text-xs animate-shake">
          <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-orange-900 dark:text-orange-200">
              Микрофон ашиглах зөвшөөрөл шаардлагатай
            </span>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              Дуугаар ярилцахын тулд хөтчийн хаягийн мөр дээрх цоожны (🔒) дүрс дээр дарж микрофоныг зөвшөөрнө үү.
            </p>
          </div>
        </div>
      )}

      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
            Хаах
          </button>
        </div>
      )}

      {/* 2. CENTER STAGE: LARGE ANIMATED VOICE ORB & INTERACTION STATE */}
      <main className="flex-1 flex flex-col items-center justify-center my-auto py-6 sm:py-10 relative">
        
        {/* Ambient Halo Glow */}
        <div
          className={`absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
            voiceState === 'listening'
              ? 'bg-[#FF3366]/16 dark:bg-[#FF3366]/20 scale-120'
              : voiceState === 'speaking'
              ? 'bg-[#FF6699]/16 dark:bg-[#FF6699]/20 scale-110'
              : voiceState === 'thinking'
              ? 'bg-[#CC0066]/16 dark:bg-[#CC0066]/20 scale-105'
              : 'bg-[#990033]/12 dark:bg-[#990033]/16 scale-95'
          }`}
        />

        {/* Concentric Animated Soundwave Rings (when listening or speaking) */}
        <div className="relative flex items-center justify-center">
          {voiceState === 'listening' && (
            <>
              <div className="absolute w-52 h-52 sm:w-64 sm:h-64 rounded-full border border-[#FF3366]/30 animate-voice-pulse-ring pointer-events-none" />
              <div className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-[#FF3366]/8 animate-pulse pointer-events-none" />
            </>
          )}

          {voiceState === 'speaking' && (
            <>
              <div className="absolute w-52 h-52 sm:w-64 sm:h-64 rounded-full border border-[#FF6699]/30 animate-voice-pulse-ring pointer-events-none" />
              <div className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-[#FF6699]/8 animate-pulse pointer-events-none" />
            </>
          )}

          {voiceState === 'thinking' && (
            <div className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full border-2 border-dashed border-[#FF3366]/50 animate-spin pointer-events-none" />
          )}

          {/* MAIN VOICE ORB - Dimensional Red-Coral-Pink Atmosphere */}
          <button
            id="voice-orb-main"
            type="button"
            onClick={handleOrbClick}
            disabled={voiceState === 'thinking'}
            className={`relative z-10 w-36 h-36 sm:w-48 sm:h-48 rounded-full flex flex-col items-center justify-center transition-all duration-500 transform active:scale-95 shadow-2xl cursor-pointer ${
              voiceState === 'listening'
                ? 'bg-[radial-gradient(circle_at_35%_30%,#FFA3B8_0%,#FF3366_38%,#CC0000_70%,#66001A_100%)] text-white ring-4 ring-[#FF3366]/35 animate-voice-orb-listen'
                : voiceState === 'speaking'
                ? 'bg-[radial-gradient(circle_at_35%_30%,#FFB3C6_0%,#FF6699_35%,#CC0066_68%,#4D0026_100%)] text-white ring-4 ring-[#FF6699]/35 animate-voice-orb-breathe'
                : voiceState === 'thinking'
                ? 'bg-[radial-gradient(circle_at_35%_30%,#FFCCE0_0%,#FF3366_35%,#990066_70%,#330022_100%)] text-white ring-4 ring-[#FF3366]/35 animate-pulse'
                : 'bg-[radial-gradient(circle_at_35%_30%,#FFCCD8_0%,#FF3366_35%,#990033_70%,#330011_100%)] text-white ring-4 ring-[#FF3366]/20 hover:ring-[#FF3366]/35 animate-voice-orb-breathe'
            }`}
            title={
              voiceState === 'speaking'
                ? 'AI яриаг таслах (Товших)'
                : voiceState === 'listening'
                ? 'Сонсож дуусах'
                : 'Яриагаа эхлүүлэх'
            }
          >
            {/* Orb Inner Elements based on Voice State */}
            {voiceState === 'idle' && (
              <div className="flex flex-col items-center space-y-1.5">
                <div className="p-3 rounded-full bg-white/20 backdrop-blur-xs">
                  <Mic className="w-8 h-8 sm:w-11 sm:h-11 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-bold tracking-wide drop-shadow-xs">
                  Яриагаа эхлүүлэх
                </span>
              </div>
            )}

            {voiceState === 'listening' && (
              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center gap-1.5 h-8">
                  <div className="w-1.5 bg-white rounded-full animate-voice-wave-1" />
                  <div className="w-1.5 bg-white rounded-full animate-voice-wave-2" />
                  <div className="w-1.5 bg-white rounded-full animate-voice-wave-3" />
                  <div className="w-1.5 bg-white rounded-full animate-voice-wave-2" />
                  <div className="w-1.5 bg-white rounded-full animate-voice-wave-1" />
                </div>
                <span className="text-xs sm:text-sm font-bold tracking-wide drop-shadow-xs">
                  Сонсож байна...
                </span>
              </div>
            )}

            {voiceState === 'thinking' && (
              <div className="flex flex-col items-center space-y-2">
                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-spin" />
                <span className="text-xs sm:text-sm font-bold tracking-wide drop-shadow-xs">
                  Бодож байна...
                </span>
              </div>
            )}

            {voiceState === 'speaking' && (
              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center gap-1.5 h-8">
                  <div className="w-1.5 bg-white rounded-full animate-voice-wave-3" />
                  <div className="w-1.5 bg-white rounded-full animate-voice-wave-1" />
                  <div className="w-1.5 bg-white rounded-full animate-voice-wave-2" />
                  <div className="w-1.5 bg-white rounded-full animate-voice-wave-1" />
                  <div className="w-1.5 bg-white rounded-full animate-voice-wave-3" />
                </div>
                <span className="text-xs sm:text-sm font-bold tracking-wide drop-shadow-xs">
                  Хариулж байна...
                </span>
                <span className="text-[10px] opacity-85 font-medium">
                  Товшиж таслах
                </span>
              </div>
            )}
          </button>
        </div>

        {/* State Label & Subtext */}
        <div className="mt-5 text-center max-w-md px-4">
          {voiceState === 'idle' && (
            <p className="text-xs sm:text-sm font-medium text-stone-600 dark:text-stone-300">
              Бөмбөлөг дээр товшиж япон хэлээр чөлөөтэй ярьж эхлээрэй
            </p>
          )}

          {voiceState === 'listening' && (
            <p className="text-xs sm:text-sm font-semibold text-[#FF0000] dark:text-[#FF6699] animate-pulse">
              Японоор ярина уу... Ярьж дуусахад AI автоматаар хариулна
            </p>
          )}

          {voiceState === 'thinking' && (
            <p className="text-xs sm:text-sm font-semibold text-[#FF3366] dark:text-[#FF6699]">
              Sunny AI таны яриаг ойлгож хариулт бэлтгэж байна...
            </p>
          )}

          {voiceState === 'speaking' && (
            <p className="text-xs sm:text-sm font-semibold text-[#CC0000] dark:text-[#FF3366]">
              AI хариулж байна (дуусмагц таны яриаг автоматаар үргэлжлүүлэн сонсоно)
            </p>
          )}
        </div>

        {/* 3. LIVE TRANSCRIPT — RESPONSIVE & STRICT OVERFLOW PREVENTION */}
        <div className="w-full min-w-0 max-w-xl mt-4 sm:mt-6 px-1 sm:px-3">
          
          {/* Live speech interim while user speaks */}
          {voiceState === 'listening' && speechInterimText && (
            <div className="w-full min-w-0 max-w-full p-3.5 sm:p-4 rounded-3xl bg-white/90 dark:bg-[#16131C]/90 backdrop-blur-md border border-[#D48B97]/30 dark:border-[#6B2D5C]/40 shadow-sm text-center animate-fade-in overflow-hidden">
              <span className="text-[10px] font-bold text-[#C85A54] dark:text-[#D48B97] uppercase tracking-wider block mb-1">
                Таны яриа:
              </span>
              <p className="font-jp text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 break-words [overflow-wrap:anywhere] [word-break:break-word]">
                「{speechInterimText}」
              </p>
            </div>
          )}

          {/* Latest Exchange Card (Minimal, responsive, zero-overflow) */}
          {voiceState !== 'listening' && (latestAiMsg || latestUserMsg) && (
            <div className="w-full min-w-0 max-w-full p-4 sm:p-5 rounded-3xl bg-white/85 dark:bg-stone-900/85 backdrop-blur-md border border-stone-200 dark:border-stone-800 shadow-sm space-y-3 transition-all overflow-hidden">
              
              {/* Header with turn count and full history toggle */}
              <div className="flex items-center justify-between pb-1 border-b border-stone-100 dark:border-stone-800/60 text-[11px] text-stone-400">
                <span className="font-semibold">
                  Ээлж #{messages.length}
                </span>
                {messages.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setIsTranscriptHistoryOpen(!isTranscriptHistoryOpen)}
                    className="font-bold text-[#CC0000] dark:text-[#FF6699] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>{isTranscriptHistoryOpen ? 'Түүх хураах' : 'Өмнөх яриаг харах'}</span>
                  </button>
                )}
              </div>

              {/* Collapsible History Drawer */}
              {isTranscriptHistoryOpen && messages.length > 2 && (
                <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1 py-1 border-b border-stone-100 dark:border-stone-800/80 w-full min-w-0 max-w-full">
                  {messages.slice(0, -2).map((m, mIdx) => (
                    <div
                      key={m.id || mIdx}
                      className={`p-2.5 rounded-2xl text-xs w-full min-w-0 max-w-full break-words [overflow-wrap:anywhere] [word-break:break-word] ${
                        m.role === 'user'
                          ? 'bg-stone-100/80 dark:bg-stone-800/50 text-stone-700 dark:text-stone-300 ml-auto max-w-[90%]'
                          : 'bg-red-50/50 dark:bg-red-950/20 text-stone-900 dark:text-stone-100 mr-auto max-w-[95%]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 font-bold text-[10px] text-stone-400">
                        <span>{m.role === 'user' ? 'Та' : 'Sunny'}</span>
                      </div>
                      <FuriganaText
                        text={m.content}
                        showFurigana={showFurigana}
                        className="text-xs sm:text-sm font-jp"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* What user said */}
              {latestUserMsg && (
                <div className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-600 dark:text-stone-300 w-full min-w-0">
                  <span className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-[11px] font-bold shrink-0 mt-0.5">
                    Та
                  </span>
                  <p className="font-jp font-medium leading-relaxed flex-1 min-w-0 max-w-full break-words [overflow-wrap:anywhere] [word-break:break-word]">
                    {latestUserMsg.cleanContent || latestUserMsg.content}
                  </p>
                </div>
              )}

              {/* What AI said */}
              {latestAiMsg && (
                <div className="flex items-start gap-2.5 text-xs sm:text-sm pt-2 border-t border-stone-100 dark:border-stone-800/80 w-full min-w-0">
                  <span className="px-2 py-0.5 rounded-lg bg-[#6B2D5C]/15 text-[#6B2D5C] dark:text-[#DEC9EF] text-[11px] font-bold shrink-0 mt-0.5">
                    Sunny
                  </span>
                  <div className="flex-1 min-w-0 max-w-full space-y-1">
                    <div className="ai-conversation-message font-jp text-stone-900 dark:text-stone-100 font-medium leading-relaxed w-full min-w-0 max-w-full break-words [overflow-wrap:anywhere] [word-break:break-word]">
                      <FuriganaText
                        text={latestAiMsg.content}
                        showFurigana={showFurigana}
                        className="text-sm sm:text-base"
                      />
                    </div>

                    {/* Replay audio button */}
                    <button
                      type="button"
                      onClick={() => playAiVoice(latestAiMsg.content, latestAiMsg.audioUrl)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C85A54] dark:text-[#D48B97] hover:underline pt-1 cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Дахин сонсох</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Gentle phrasing tip if user had an unnatural phrase */}
              {latestUserMsg?.correction && (
                <div className="p-2.5 rounded-2xl bg-stone-50/90 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 text-[11px] space-y-1 w-full min-w-0 max-w-full break-words [overflow-wrap:anywhere] [word-break:break-word]">
                  <span className="font-bold text-[#C85A54] dark:text-[#D48B97]">
                    💡 Илүү байгалийн хэллэг:
                  </span>
                  <p className="font-jp font-bold text-emerald-700 dark:text-emerald-400 break-words [overflow-wrap:anywhere]">
                    {latestUserMsg.correction.corrected}
                  </p>
                  {latestUserMsg.correction.explanation && (
                    <p className="text-stone-500 dark:text-stone-400 text-[10px] break-words [overflow-wrap:anywhere]">
                      {latestUserMsg.correction.explanation}
                    </p>
                  )}
                </div>
              )}

            </div>
          )}

        </div>

      </main>

      {/* 4. STARTER TOPIC CARDS (Quick topic switcher) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-stone-600 dark:text-stone-400">
            <Sparkles className="w-3.5 h-3.5 text-[#C85A54] dark:text-[#D48B97]" />
            <span>Сэдэв сонгож яриагаа чиглүүлэх:</span>
          </div>
          {messages.length > 1 && (
            <span className="text-[11px] text-stone-400">
              Яриа үргэлжилж байна ({messages.length} ээлж)
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {STARTER_TOPICS.map(topic => {
            const isSelected = selectedTopicId === topic.id;
            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => {
                  if (voiceState === 'speaking') stopAudio();
                  startConversation(topic.id);
                }}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected && isSessionActive
                    ? 'bg-[#6B2D5C]/15 dark:bg-[#6B2D5C]/25 border-[#6B2D5C]/40 dark:border-[#9D8EC2]/40 text-[#6B2D5C] dark:text-[#DEC9EF] shadow-2xs'
                    : 'bg-white/80 dark:bg-stone-900/80 border-stone-200 dark:border-stone-800 hover:border-[#D48B97]/40 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-850'
                }`}
              >
                <span className="font-jp block text-xs font-bold truncate">
                  {topic.title}
                </span>
                <span className="text-[10px] text-stone-400 dark:text-stone-500 block truncate">
                  {topic.labelMn}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. BOTTOM CONTROL BAR: Mute, Restart, Text Input Fallback */}
      <footer className="flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-3xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border border-stone-200/80 dark:border-stone-800/80 shadow-2xs">
        
        {/* Left: Session / Usage Status */}
        <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
          {isPremium ? (
            <span className="text-orange-600 dark:text-orange-400 font-bold">
              💎 Premium хязгааргүй
            </span>
          ) : sunnyAIUsage ? (
            <span>
              Үлдсэн: <b>{sunnyAIUsage.remaining}</b>/20
            </span>
          ) : (
            <span>Дуут яриа бэлэн</span>
          )}
        </div>

        {/* Center: Audio Mute / Resume toggle */}
        <div className="flex items-center gap-2">
          {isSessionActive && (
            <button
              type="button"
              onClick={toggleMute}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                isMuted
                  ? 'bg-red-500 text-white border-red-600 shadow-2xs'
                  : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
              }`}
              title={isMuted ? 'Сонсохыг сэргээх' : 'Түр зогсоох (Mute)'}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isMuted ? 'Чимээгүй' : 'Идэвхтэй'}</span>
            </button>
          )}

          {/* Restart Button */}
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-400 transition-colors cursor-pointer"
              title="Яриаг шинээр эхлэх"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right: Discreet Text Keyboard Toggle (For noisy/quiet environments) */}
        <div>
          <button
            type="button"
            onClick={() => setIsTextDrawerOpen(!isTextDrawerOpen)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
              isTextDrawerOpen
                ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 border-transparent'
                : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
            }`}
            title="Гар дээрээс бичиж хариулах"
          >
            <Keyboard className="w-4 h-4" />
            <span className="hidden sm:inline">Бичих</span>
          </button>
        </div>
      </footer>

      {/* DISCREET TEXT DRAWER (Only when user explicitly taps keyboard icon) */}
      {isTextDrawerOpen && (
        <div className="p-3.5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-lg animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-500">
              Чимээгүй орчинд зориулсан текст оруулалт (AI дуугаар хариулна):
            </span>
            <button
              type="button"
              onClick={() => setIsTextDrawerOpen(false)}
              className="text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <form onSubmit={handleKeyboardSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={keyboardInput}
              onChange={e => setKeyboardInput(e.target.value)}
              disabled={voiceState === 'thinking'}
              placeholder="Японоор бичнэ үү (жишээ: 今日は学校に行きました)..."
              className="flex-1 px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white font-jp text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#FF3366]/30 focus:border-[#FF3366]"
            />
            <button
              type="submit"
              disabled={!keyboardInput.trim() || voiceState === 'thinking'}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#FF0000] to-[#FF3366] hover:from-[#CC0000] hover:to-[#FF0000] text-white font-bold text-xs shadow-xs disabled:opacity-40 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* 6. CONVERSATION FEEDBACK MODAL (Upon Ending Session) */}
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
