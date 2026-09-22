import React, { useState, useEffect, useRef } from 'react';
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
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Settings,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  Award,
  Radio,
  Check,
  AlertCircle,
  ChevronDown,
  Bot,
  User,
  Zap,
  Loader2
} from 'lucide-react';

interface FreeConversationViewProps {
  onBackToRoleplay?: () => void;
}

const STARTER_TOPICS = [
  { id: 'today', title: '今日何をしたか', labelMn: 'Өнөөдрийн тухай', prompt: 'こんにちは！今日はどんな一日でしたか？' },
  { id: 'hobbies', title: '趣味や好きなこと', labelMn: 'Хобби, сонирхол', prompt: '私の趣味について話したいです。' },
  { id: 'food', title: '好きな食べ物・料理', labelMn: 'Япон хоол', prompt: '日本料理で何が一番好きですか？' },
  { id: 'cars', title: '車やドライブ', labelMn: 'Машин, тээвэр', prompt: '車が好きです。最近気になる車はありますか？' },
  { id: 'travel', title: '旅行してみたい場所', labelMn: 'Аялал зугаалга', prompt: '日本で旅行するならどこがおすすめですか？' },
  { id: 'anime', title: 'アニメや映画', labelMn: 'Аниме, кино', prompt: '最近おすすめのアニメや映画はありますか？' },
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
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Conversation Messages State
  const [messages, setMessages] = useState<FreeChatMessage[]>(() => [
    {
      id: 'welcome_1',
      role: 'assistant',
      content: 'こんにちは！今日（きょう）は何（なに）について話（はな）しましょうか？何（なん）でも好（す）きなことを気軽（きがる）に話（はな）してくださいね。',
      cleanContent: 'こんにちは！今日は何について話しましょうか？何でも好きなことを気軽に話してくださいね。',
      createdAt: Date.now()
    }
  ]);

  // Input State
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio Playback State
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [currentlyPlayingMsgId, setCurrentlyPlayingMsgId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Speech Recognition (Mic) State
  const [isListening, setIsListening] = useState(false);
  const [speechInterimText, setSpeechInterimText] = useState('');
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const recognitionRef = useRef<any>(null);
  const currentTranscriptRef = useRef<string>('');
  const messagesRef = useRef<FreeChatMessage[]>(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Feedback Modal State
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackReport, setFeedbackReport] = useState<FreeChatFeedbackReport | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

  // Transcript scroll ref
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll transcript when messages change or speech arrives
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, speechInterimText, isSending]);

  // Sync global selectedLevel if it changes
  useEffect(() => {
    if (selectedLevel) {
      setCurrentLevel(selectedLevel);
    }
  }, [selectedLevel]);

  // Stop any ongoing audio playback cleanly
  const stopAudio = () => {
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
    setIsAiSpeaking(false);
    setCurrentlyPlayingMsgId(null);
  };

  // Play audio for a specific message (or fallback)
  const playAudioForMessage = async (msgId: string, text: string, audioDataUri?: string | null) => {
    stopAudio();

    const clean = text.replace(/([\u4E00-\u9FFF々仝〆〇ヶ\u3400-\u4DBF]+)\s*[（\(\[【]\s*([ぁ-んァ-ヶー・]+)\s*[）\)\]】]/g, '$1').trim();
    if (!clean) return;

    setCurrentlyPlayingMsgId(msgId);
    setIsAiSpeaking(true);

    // 1. If we have the neural audio data URI from Gemini TTS
    if (audioDataUri) {
      try {
        if (!audioPlayerRef.current) {
          audioPlayerRef.current = new Audio();
        }
        const audio = audioPlayerRef.current;
        audio.src = audioDataUri;
        audio.onended = () => {
          setIsAiSpeaking(false);
          setCurrentlyPlayingMsgId(null);
        };
        audio.onerror = () => {
          fallbackSpeechSynthesis(clean);
        };
        await audio.play();
        return;
      } catch (err) {
        console.warn('Audio play failed, falling back to browser speech', err);
        fallbackSpeechSynthesis(clean);
        return;
      }
    }

    // 2. Fetch neural voice from server on demand if not cached
    try {
      const res = await apiService.getFreeChatVoice({ text: clean, voiceName: voicePersona });
      if (res && res.audio) {
        if (!audioPlayerRef.current) {
          audioPlayerRef.current = new Audio();
        }
        const audio = audioPlayerRef.current;
        audio.src = res.audio;
        audio.onended = () => {
          setIsAiSpeaking(false);
          setCurrentlyPlayingMsgId(null);
        };
        audio.onerror = () => {
          fallbackSpeechSynthesis(clean);
        };
        await audio.play();
        return;
      }
    } catch {
      // ignore, use fallback
    }

    // 3. Fallback to browser SpeechSynthesis
    fallbackSpeechSynthesis(clean);
  };

  const fallbackSpeechSynthesis = (cleanText: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsAiSpeaking(false);
      setCurrentlyPlayingMsgId(null);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'ja-JP';
      utterance.rate = currentLevel === 'N5' ? 0.85 : 0.95;

      const voices = window.speechSynthesis.getVoices();
      const jaVoice = voices.find(v => v.lang.startsWith('ja') && (v.name.includes('Google') || v.name.includes('Kyoko') || v.name.includes('Otoya') || v.name.includes('Natural')));
      if (jaVoice) utterance.voice = jaVoice;

      utterance.onend = () => {
        setIsAiSpeaking(false);
        setCurrentlyPlayingMsgId(null);
      };
      utterance.onerror = () => {
        setIsAiSpeaking(false);
        setCurrentlyPlayingMsgId(null);
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsAiSpeaking(false);
      setCurrentlyPlayingMsgId(null);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
      stopAudio();
    };
  }, []);

  // Toggle Microphone (Start / Stop listening)
  const toggleListening = async () => {
    // 1. If AI is currently speaking, tapping the mic stops the audio immediately
    if (isAiSpeaking) {
      stopAudio();
    }

    // 2. If already listening, stop recording and send whatever was recognized
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      const textToSend = currentTranscriptRef.current.trim() || speechInterimText.trim();
      if (textToSend) {
        currentTranscriptRef.current = '';
        setSpeechInterimText('');
        handleSendMessage(textToSend);
      }
      return;
    }

    // 3. Prevent starting while sending a message
    if (isSending) return;

    // 4. Check for Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage(
        'Таны хөтөч дуу хоолой таних Web Speech системийг дэмжихгүй байна. Chrome эсвэл Safari хөтөч ашиглана уу, эсвэл доорх талбарт бичиж харилцаж болно.'
      );
      return;
    }

    // 5. Explicitly request microphone permission via getUserMedia
    // This triggers the browser permission dialog on Vercel/HTTPS and Safari if not yet granted
    if (navigator?.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Immediately stop all tracks to release audio device for SpeechRecognition
        stream.getTracks().forEach((track) => track.stop());
        setMicPermissionDenied(false);
      } catch (micErr: any) {
        console.warn('Microphone permission request error:', micErr);
        if (
          micErr?.name === 'NotAllowedError' ||
          micErr?.name === 'PermissionDeniedError'
        ) {
          setMicPermissionDenied(true);
          setErrorMessage(
            'Микрофоны зөвшөөрөл хаалттай байна. Хөтчийнхөө хаягийн мөрний зүүн талын түгжээ (🔒) дээр дарж микрофоноо зөвшөөрөөд дахин оролдоно уу.'
          );
          return;
        } else if (
          micErr?.name === 'NotFoundError' ||
          micErr?.name === 'DevicesNotFoundError'
        ) {
          setErrorMessage('Микрофон олдсонгүй. Төхөөрөмжийнхөө микрофоныг шалгана уу.');
          return;
        }
      }
    }

    // 6. Abort previous recognition instance if still active
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    // 7. Instantiate a fresh SpeechRecognition instance
    try {
      currentTranscriptRef.current = '';
      setSpeechInterimText('');
      setErrorMessage(null);

      const recognition = new SpeechRecognition();
      recognition.lang = 'ja-JP';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechInterimText('');
        setMicPermissionDenied(false);
        setErrorMessage(null);
        stopAudio();
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
        console.warn('[Speech Recognition Event]', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMicPermissionDenied(true);
          setErrorMessage(
            'Микрофоны зөвшөөрөл хаалттай байна. Хөтчийнхөө хаягийн мөрний түгжээний (🔒) тэмдэг дээр дарж микрофоноо зөвшөөрнө үү.'
          );
        } else if (event.error === 'audio-capture') {
          setErrorMessage('Микрофон олдсонгүй эсвэл өөр програм ашиглаж байна.');
        } else if (event.error === 'network') {
          setErrorMessage('Сүлжээний холболтоо шалгана уу (Web Speech интернет холболт шаарддаг).');
        } else if (event.error === 'language-not-supported') {
          setErrorMessage('Таны хөтөч япон хэл танихыг дэмжихгүй байна. Доорх талбарт бичиж харилцаж болно.');
        } else if (event.error === 'no-speech') {
          // User didn't speak within timeout
          setSpeechInterimText('');
        } else if (event.error !== 'aborted') {
          setErrorMessage(`Яриа танихад алдаа гарлаа: ${event.error}. Гар дээрээс бичиж болно.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Automatically send the recognized Japanese text
        const textToSend = currentTranscriptRef.current.trim();
        if (textToSend) {
          currentTranscriptRef.current = '';
          setSpeechInterimText('');
          handleSendMessage(textToSend);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Cannot start speech recognition:', err);
      setIsListening(false);
      setErrorMessage(
        'Яриа таних горим эхлүүлэхэд алдаа гарлаа. Дахин оролдоно уу эсвэл доорх талбарт бичиж илгээнэ үү.'
      );
    }
  };

  // Send Message (Text or Spoken)
  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isSending) return;

    // Check usage limits if non-premium
    if (!isPremium && sunnyAIUsage && sunnyAIUsage.limitReached) {
      openPremiumModal();
      return;
    }

    stopAudio();
    setErrorMessage(null);
    setInputText('');
    setSpeechInterimText('');
    currentTranscriptRef.current = '';

    const userMsg: FreeChatMessage = {
      id: 'msg_' + Date.now() + '_user',
      role: 'user',
      content: trimmed,
      cleanContent: trimmed,
      createdAt: Date.now()
    };

    const currentMsgs = messagesRef.current;
    const newMessages = [...currentMsgs, userMsg];
    setMessages(newMessages);
    setIsSending(true);

    try {
      // Build clean payload for API (omit local id/audio)
      const payloadMessages = newMessages.map(m => ({
        role: m.role,
        content: m.cleanContent || m.content
      }));

      const res = await apiService.sendFreeChatMessage({
        messages: payloadMessages,
        jlptLevel: currentLevel,
        style: conversationStyle,
        voiceName: voicePersona,
        generateAudio: autoPlayAudio
      });

      refreshSunnyAIUsage();

      const aiMsg: FreeChatMessage = {
        id: 'msg_' + Date.now() + '_ai',
        role: 'assistant',
        content: res.reply,
        cleanContent: res.cleanReply,
        audioUrl: res.audio,
        correction: res.correction,
        createdAt: Date.now()
      };

      setMessages(prev => [...prev, aiMsg]);

      // Play audio automatically if enabled
      if (autoPlayAudio) {
        playAudioForMessage(aiMsg.id, res.reply, res.audio);
      }
    } catch (err: any) {
      console.error('[Free Chat Error]', err);
      if (err?.limitReached) {
        openPremiumModal();
      } else {
        setErrorMessage(err?.message || 'Хариулт авахад алдаа гарлаа. Та дахин оролдоно уу.');
      }
    } finally {
      setIsSending(false);
    }
  };

  // Submit via text form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    handleSendMessage(inputText);
  };

  // Finish / Review Conversation Feedback
  const handleOpenFeedback = async () => {
    stopAudio();
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
      console.error('[Feedback report error]', err);
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  // Start a fresh conversation
  const handleStartNewConversation = () => {
    stopAudio();
    setFeedbackReport(null);
    setMessages([
      {
        id: 'welcome_' + Date.now(),
        role: 'assistant',
        content: 'こんにちは！今日（きょう）は何（なに）について話（はな）しましょうか？何（なん）でも好（す）きなことを気軽（きがる）に話（はな）してくださいね。',
        cleanContent: 'こんにちは！今日は何について話しましょうか？何でも好きなことを気軽に話してくださいね。',
        createdAt: Date.now()
      }
    ]);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col min-h-[calc(100vh-5rem)] space-y-4 animate-fade-in">
      
      {/* TOP BAR: Navigation, Title, Quick Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
        
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3">
          {onBackToRoleplay && (
            <button
              type="button"
              onClick={() => {
                stopAudio();
                onBackToRoleplay();
              }}
              className="p-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-950/50 text-stone-600 dark:text-stone-300 hover:text-amber-800 dark:hover:text-amber-300 transition-colors cursor-pointer shrink-0"
              title="Roleplay руу буцах"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100 font-jp tracking-tight">
                AI チャット / Чөлөөт яриа
              </h1>
            </div>
            <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400">
              AI-тай Японоор чөлөөтэй ярилцах танхим
            </p>
          </div>
        </div>

        {/* Right: Level Chips, Furigana & Audio Toggles, Feedback Trigger */}
        <div className="flex items-center flex-wrap gap-2 justify-end">
          
          {/* JLPT Level Selector */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs">
            {(['N5', 'N4', 'N3', 'N2', 'N1'] as JLPTLevel[]).map(lvl => (
              <button
                key={lvl}
                type="button"
                onClick={() => setCurrentLevel(lvl)}
                className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  currentLevel === lvl
                    ? 'bg-amber-500 text-white shadow-2xs'
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
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500'
            }`}
            title="Фүригана дээр/доор харуулах"
          >
            <span className="font-jp text-[11px]">あ</span>
            <span>{showFurigana ? 'ふりがな ON' : 'OFF'}</span>
          </button>

          {/* Voice Auto-Play Toggle */}
          <button
            type="button"
            onClick={() => {
              if (autoPlayAudio) stopAudio();
              setAutoPlayAudio(!autoPlayAudio);
            }}
            className={`p-2 rounded-2xl border transition-all cursor-pointer ${
              autoPlayAudio
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-400'
            }`}
            title={autoPlayAudio ? 'Дуут хариулт идэвхтэй' : 'Дуут хариулт унтраасан'}
          >
            {autoPlayAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Settings Dropdown Button */}
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
            title="Тохиргоо (Ярианы хэв маяг, дууны сонголт)"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Review Conversation / Feedback Button */}
          <button
            type="button"
            onClick={handleOpenFeedback}
            disabled={messages.length < 2}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-stone-900 dark:bg-stone-100 hover:bg-amber-600 dark:hover:bg-amber-500 text-white dark:text-stone-900 font-bold text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Award className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
            <span>Дүгнэлт үзэх</span>
          </button>

        </div>
      </div>

      {/* EXPANDABLE SETTINGS PANEL */}
      {showSettings && (
        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Ярианы тохиргоо (設定)
            </h3>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="text-xs text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              Хаах
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Style: Easy vs Natural */}
            <div className="space-y-1.5">
              <label className="font-bold text-stone-700 dark:text-stone-300">
                Ярианы хэв маяг (話し方):
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConversationStyle('easy')}
                  className={`flex-1 py-2 px-3 rounded-2xl border font-bold text-center transition-all cursor-pointer ${
                    conversationStyle === 'easy'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                      : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  <span className="block font-jp">やさしい</span>
                  <span className="text-[10px] opacity-80">Хялбар япон хэл</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConversationStyle('natural')}
                  className={`flex-1 py-2 px-3 rounded-2xl border font-bold text-center transition-all cursor-pointer ${
                    conversationStyle === 'natural'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                      : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  <span className="block font-jp">自然</span>
                  <span className="text-[10px] opacity-80">Байгалийн яриа</span>
                </button>
              </div>
            </div>

            {/* Voice Persona: Aoede (Female), Puck (Male), Kore */}
            <div className="space-y-1.5">
              <label className="font-bold text-stone-700 dark:text-stone-300">
                AI дууны төрөл (音声):
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVoicePersona('Aoede')}
                  className={`flex-1 py-2 px-2.5 rounded-2xl border font-bold text-center transition-all cursor-pointer ${
                    voicePersona === 'Aoede'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                      : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Сакура (Эмэгтэй)
                </button>
                <button
                  type="button"
                  onClick={() => setVoicePersona('Puck')}
                  className={`flex-1 py-2 px-2.5 rounded-2xl border font-bold text-center transition-all cursor-pointer ${
                    voicePersona === 'Puck'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                      : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Кэн (Эрэгтэй)
                </button>
                <button
                  type="button"
                  onClick={() => setVoicePersona('Kore')}
                  className={`flex-1 py-2 px-2.5 rounded-2xl border font-bold text-center transition-all cursor-pointer ${
                    voicePersona === 'Kore'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                      : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Аой (Тайван)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MIC PERMISSION WARNING (If denied) */}
      {micPermissionDenied && (
        <div className="p-3 sm:p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex items-start gap-3 text-xs animate-shake">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-amber-900 dark:text-amber-200">
              Микрофон ашиглах зөвшөөрөл хаалттай байна
            </span>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              Дуугаар ярилцахын тулд хөтчийнхөө хаягийн мөр дээрх цоожны дүрс дээр дарж микрофоныг зөвшөөрнө үү. Та гар дээрээс текст бичин үргэлжлүүлэн ярилцах боломжтой.
            </p>
          </div>
        </div>
      )}

      {/* MAIN TRANSCRIPT CONTAINER */}
      <div className="flex-1 flex flex-col rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden min-h-[380px] sm:min-h-[460px]">
        
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {messages.map(msg => {
            const isUser = msg.role === 'user';
            const isPlayingThis = currentlyPlayingMsgId === msg.id && isAiSpeaking;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                    isUser
                      ? 'bg-stone-800 text-white dark:bg-stone-700'
                      : 'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble & Content */}
                <div className={`space-y-1.5 max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end text-right' : 'items-start text-left'}`}>
                  
                  <div
                    className={`p-3.5 sm:p-4 rounded-3xl text-xs sm:text-sm shadow-2xs leading-relaxed transition-all ${
                      isUser
                        ? 'bg-amber-500 text-white rounded-tr-xs'
                        : 'bg-stone-50 dark:bg-stone-800/90 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-700/80 rounded-tl-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="font-jp whitespace-pre-wrap font-medium">{msg.content}</p>
                    ) : (
                      <div className="space-y-2">
                        <FuriganaText
                          text={msg.content}
                          showFurigana={showFurigana}
                          className="font-medium"
                        />

                        {/* Replay Audio Button on AI Bubble */}
                        <div className="pt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => playAudioForMessage(msg.id, msg.content, msg.audioUrl)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                              isPlayingThis
                                ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                                : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-amber-300'
                            }`}
                            title="Дахин сонсох"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>{isPlayingThis ? 'Ярьж байна...' : 'Сонсох'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Subtle in-line correction hint under user message if detected */}
                  {isUser && msg.correction && (
                    <div className="text-left p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] space-y-1">
                      <div className="flex items-center gap-1 text-amber-800 dark:text-amber-300 font-bold">
                        <Lightbulb className="w-3 h-3" />
                        <span>💡 Илүү байгалийн хэллэг:</span>
                      </div>
                      <p className="font-jp font-bold text-emerald-700 dark:text-emerald-400">
                        {msg.correction.corrected}
                      </p>
                      {msg.correction.explanation && (
                        <p className="text-stone-600 dark:text-stone-400 text-[10px]">
                          {msg.correction.explanation}
                        </p>
                      )}
                    </div>
                  )}

                </div>
              </div>
            );
          })}

          {/* Live speech interim result while user is speaking */}
          {isListening && speechInterimText && (
            <div className="flex items-start gap-2.5 flex-row-reverse animate-fade-in">
              <div className="w-8 h-8 rounded-2xl bg-red-500 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Mic className="w-4 h-4" />
              </div>
              <div className="p-3 sm:p-3.5 rounded-3xl bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800 text-xs sm:text-sm text-red-900 dark:text-red-200 rounded-tr-xs font-jp max-w-[80%] italic shadow-2xs">
                {speechInterimText}
              </div>
            </div>
          )}

          {/* AI Thinking / Processing State */}
          {isSending && (
            <div className="flex items-start gap-2.5 animate-fade-in">
              <div className="w-8 h-8 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 animate-bounce">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 sm:p-3.5 rounded-3xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-tl-xs flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                <span>✨ Sunny AI бодож байна…</span>
              </div>
            </div>
          )}

          <div ref={transcriptEndRef} />
        </div>

        {/* STARTER TOPIC CHIPS (When conversation has only welcome message) */}
        {messages.length <= 1 && (
          <div className="p-3 sm:p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-850/50 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-600 dark:text-stone-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Юуны тухай ярихаа мэдэхгүй байна уу? Сэдвээс сонгоорой:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {STARTER_TOPICS.map(topic => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => handleSendMessage(topic.prompt)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-stone-700 dark:text-stone-300 font-bold text-xs transition-all cursor-pointer shadow-2xs"
                >
                  <span className="font-jp mr-1">{topic.title}</span>
                  <span className="text-[10px] text-stone-400">({topic.labelMn})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* REAL-TIME STATUS BAR */}
        <div className="px-4 py-2 border-t border-stone-100 dark:border-stone-800/80 bg-stone-50/90 dark:bg-stone-850/80 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-2">
            {isListening ? (
              <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>🔴 Сонсож байна… (Японоор ярина уу)</span>
              </span>
            ) : isSending ? (
              <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                <Sparkles className="w-3 h-3 animate-spin" />
                <span>✨ Бодож байна…</span>
              </span>
            ) : isAiSpeaking ? (
              <div className="inline-flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                  <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                  <span>🔊 AI ярьж байна…</span>
                </span>
                <button
                  type="button"
                  onClick={stopAudio}
                  className="text-[10px] underline hover:text-stone-800 cursor-pointer"
                >
                  Зогсоох
                </button>
              </div>
            ) : (
              <span>🎙 Микрофон дээр дараад шууд японоор ярина уу</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span>
              {isPremium ? (
                <span className="text-amber-600 dark:text-amber-400 font-bold">💎 Premium хязгааргүй</span>
              ) : sunnyAIUsage ? (
                <span>Үлдсэн: <b>{sunnyAIUsage.remaining}</b>/20</span>
              ) : null}
            </span>
            <button
              type="button"
              onClick={handleStartNewConversation}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
              title="Шинээр эхлэх"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* BOTTOM CONTROLS: LARGE VOICE MIC & DUAL TEXT INPUT */}
      <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
        
        {/* VOICE-FIRST CENTERPIECE */}
        <div className="flex flex-col items-center justify-center pt-1 pb-2">
          <div className="relative">
            {/* Animated Pulse Rings when listening */}
            {isListening && (
              <>
                <div className="absolute -inset-3 rounded-full bg-red-500/20 animate-ping pointer-events-none" />
                <div className="absolute -inset-1.5 rounded-full bg-red-500/40 animate-pulse pointer-events-none" />
              </>
            )}

            {/* Speaking Pulse */}
            {isAiSpeaking && (
              <div className="absolute -inset-2 rounded-full bg-emerald-500/20 animate-pulse pointer-events-none" />
            )}

            <button
              id="free-chat-mic-button"
              type="button"
              onClick={toggleListening}
              disabled={isSending}
              className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-full flex flex-col items-center justify-center transition-all transform active:scale-95 shadow-md cursor-pointer ${
                isSending
                  ? 'opacity-70 cursor-not-allowed bg-amber-400 text-white'
                  : isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white ring-4 ring-red-300 dark:ring-red-900/60'
                  : isAiSpeaking
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-white ring-4 ring-amber-500/20'
              }`}
              title={
                isSending
                  ? 'AI хариулт бэлтгэж байна...'
                  : isListening
                  ? 'Яриаг дуусгах'
                  : isAiSpeaking
                  ? 'AI яриаг зогсоох'
                  : 'Япон хэлээр ярих'
              }
            >
              {isSending ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-6 h-6 animate-spin mb-0.5" />
                  <span className="text-[9px] font-bold">Хүлээх</span>
                </div>
              ) : isListening ? (
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded-xs bg-white mb-0.5" />
                  <span className="text-[9px] font-black uppercase tracking-wider">Илгээх</span>
                </div>
              ) : isAiSpeaking ? (
                <div className="flex flex-col items-center">
                  <VolumeX className="w-6 h-6" />
                  <span className="text-[9px] font-bold">Зогсоох</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Mic className="w-7 h-7" />
                  <span className="text-[9px] font-black tracking-wide">Ярих</span>
                </div>
              )}
            </button>
          </div>

          <p className="mt-2 text-xs font-bold text-stone-600 dark:text-stone-300 text-center">
            {isListening ? (
              <span className="text-red-600 dark:text-red-400 font-bold">
                Сонсож байна… Ярьж дуусаад товшино уу
              </span>
            ) : isAiSpeaking ? (
              <span className="text-emerald-600 dark:text-emerald-400">
                AI ярьж байна (Товшиж таслах боломжтой)
              </span>
            ) : (
              <span>Товчоод японоор чөлөөтэй ярина уу</span>
            )}
          </p>
        </div>

        {/* ALTERNATIVE TEXT INPUT (For typing) */}
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            disabled={isSending || isListening}
            placeholder="Эсвэл энд япон хэлээр бичиж илгээнэ үү (今日何をしましたか？)..."
            className="flex-1 px-4 py-3 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white placeholder-stone-400 text-xs sm:text-sm font-jp focus:outline-hidden focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending || isListening}
            className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
            title="Илгээх"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>

      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-3 animate-fade-in">
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

      {/* FEEDBACK MODAL */}
      <FreeConversationFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        feedback={feedbackReport}
        isLoading={isLoadingFeedback}
        jlptLevel={currentLevel}
        messageCount={messages.length}
        onNewConversation={handleStartNewConversation}
      />

    </div>
  );
};
