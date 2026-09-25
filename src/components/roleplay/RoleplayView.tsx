import React, { useState, useEffect, useMemo } from 'react';
import {
  RoleplayScenario,
  JLPTLevel,
  RoleplayFeedbackReport,
  RoleplaySessionRecord
} from '../../types';
import { INITIAL_ROLEPLAY_SCENARIOS } from '../../data/roleplayScenarios';
import { apiService } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { RoleplayCard } from './RoleplayCard';
import { RoleplayChat } from './RoleplayChat';
import { RoleplayFeedback } from './RoleplayFeedback';
import { RoleplayHistoryModal } from './RoleplayHistoryModal';
import { FreeConversationView } from '../freeConversation/FreeConversationView';
import {
  Sparkles,
  Search,
  History,
  Filter,
  Bot,
  ShieldCheck,
  Zap,
  ArrowRight,
  BookOpen,
  Mic,
  MessagesSquare
} from 'lucide-react';

export const RoleplayView: React.FC = () => {
  const {
    selectedLevel,
    isPremium,
    sunnyAIUsage,
    openSunnyAI
  } = useApp();

  const [speakingMode, setSpeakingMode] = useState<'roleplay' | 'freechat'>('roleplay');
  const [scenarios, setScenarios] = useState<RoleplayScenario[]>(INITIAL_ROLEPLAY_SCENARIOS);
  const [activeScenario, setActiveScenario] = useState<RoleplayScenario | null>(null);
  const [currentLevel, setCurrentLevel] = useState<JLPTLevel>(selectedLevel || 'N5');

  // Feedback report state
  const [completedReport, setCompletedReport] = useState<{
    feedback: RoleplayFeedbackReport;
    sessionId: string;
    session: RoleplaySessionRecord;
    scenario: RoleplayScenario;
    jlptLevel: JLPTLevel;
  } | null>(null);

  // History modal state
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Search and Level Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<JLPTLevel | 'ALL'>('ALL');

  // Keep currentLevel synced with global selectedLevel if changed
  useEffect(() => {
    if (selectedLevel) {
      setCurrentLevel(selectedLevel);
    }
  }, [selectedLevel]);

  // Fetch scenarios from API on mount
  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const res = await apiService.getRoleplayScenarios();
        if (res && res.scenarios && res.scenarios.length > 0) {
          setScenarios(res.scenarios);
        }
      } catch (err) {
        console.warn('Using local fallback scenarios', err);
      }
    };
    fetchScenarios();
  }, []);

  // Filtered Scenarios
  const filteredScenarios = useMemo(() => {
    return scenarios.filter(sc => {
      const matchesSearch =
        !searchQuery.trim() ||
        sc.titleJapanese.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sc.titleMongolian.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sc.descriptionMongolian.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sc.aiRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sc.userRole.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLevel =
        levelFilter === 'ALL' || sc.recommendedLevels.includes(levelFilter);

      return matchesSearch && matchesLevel;
    });
  }, [scenarios, searchQuery, levelFilter]);

  // Handle Scenario Select
  const handleSelectScenario = (sc: RoleplayScenario) => {
    setActiveScenario(sc);
    setCompletedReport(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Session Finished
  const handleSessionFinished = (reportData: {
    feedback: RoleplayFeedbackReport;
    sessionId: string;
    session: RoleplaySessionRecord;
    scenario: RoleplayScenario;
    jlptLevel: JLPTLevel;
  }) => {
    setCompletedReport(reportData);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Retry current scenario
  const handleRetryScenario = () => {
    setCompletedReport(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Select Another
  const handleSelectAnother = () => {
    setActiveScenario(null);
    setCompletedReport(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Select from History Modal
  const handleSelectHistorySession = (session: RoleplaySessionRecord) => {
    const sc = scenarios.find(s => s.id === session.scenarioId) || {
      id: session.scenarioId,
      titleJapanese: session.scenarioTitle,
      titleMongolian: 'Бодит харилцан яриа',
      descriptionMongolian: '',
      recommendedLevels: [session.jlptLevel],
      userRole: session.userRole,
      aiRole: session.aiRole,
      icon: session.scenarioIcon,
      shortObjective: 'Харилцан ярианы зорилтыг биелүүлэх',
      objectives: [],
      initialGreetings: { N5: '' },
      starterSuggestions: { N5: [] }
    };

    setCompletedReport({
      feedback: session.feedback,
      sessionId: session.id,
      session,
      scenario: sc,
      jlptLevel: session.jlptLevel
    });
    setActiveScenario(sc);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 animate-fade-in">
      {/* MODE SWITCHER (AI Roleplay vs Чөлөөт яриа) */}
      {!activeScenario && !completedReport && (
        <div className="flex items-center justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-stone-200/80 dark:bg-stone-800 border border-stone-300/80 dark:border-stone-700 shadow-2xs">
            <button
              type="button"
              onClick={() => setSpeakingMode('roleplay')}
              className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                speakingMode === 'roleplay'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <MessagesSquare className="w-4 h-4 text-orange-600" />
              <span>AI Roleplay (Дүрд хувирах)</span>
            </button>
            <button
              type="button"
              onClick={() => setSpeakingMode('freechat')}
              className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                speakingMode === 'freechat'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Mic className="w-4 h-4 text-orange-600" />
              <span>Чөлөөт дуут яриа (Voice)</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-[#EF233C] text-white uppercase tracking-wider">
                Voice
              </span>
            </button>
          </div>
        </div>
      )}

      {/* FREE CONVERSATION VIEW */}
      {speakingMode === 'freechat' && !activeScenario && !completedReport ? (
        <FreeConversationView onBackToRoleplay={() => setSpeakingMode('roleplay')} />
      ) : completedReport && activeScenario ? (
        /* VIEW 1: COMPLETED FEEDBACK REPORT */
        <RoleplayFeedback
          scenario={completedReport.scenario}
          jlptLevel={completedReport.jlptLevel}
          feedback={completedReport.feedback}
          session={completedReport.session}
          onRetry={handleRetryScenario}
          onSelectAnother={handleSelectAnother}
        />
      ) : activeScenario ? (
        /* VIEW 2: ACTIVE CHAT SCREEN */
        <RoleplayChat
          scenario={activeScenario}
          jlptLevel={currentLevel}
          onChangeLevel={setCurrentLevel}
          onFinish={handleSessionFinished}
          onBack={handleSelectAnother}
        />
      ) : (
        /* VIEW 3: SCENARIO SELECTION DASHBOARD */
        <div className="space-y-8">
          {/* Header Banner */}
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-extrabold bg-orange-500/10 dark:bg-orange-400/15 text-orange-700 dark:text-orange-300 border border-orange-500/20 shadow-2xs">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span>Интерактив Япон Хэлний Ярианы Дадлага</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-stone-900 dark:text-stone-100 font-jp">
              AI Roleplay (ロールプレイ)
            </h1>
            <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl mx-auto">
              Конбини, зоогийн газар, ярилцлага, эмнэлэг зэрэг бодит нөхцөл байдалд дүрд хувиран японоор ярилцаж, төгсгөлд нь Sunny AI-аас дэлгэрэнгүй үнэлгээний тайлан аваарай.
            </p>
          </div>

          {/* FREE CONVERSATION PROMINENT ENTRY BANNER */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-red-500/15 via-orange-500/5 to-transparent border-2 border-red-500/30 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-[#EF233C] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100 font-jp">
                    AI-тай Японоор чөлөөтэй ярилц (AIと日本語で自由に話す)
                  </h2>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed pl-11">
                Сонирхсон сэдвээрээ Sunny AI-тай япон хэлээр чөлөөтэй ярилцаж, бодит ярианы дадлага хийгээрэй. Байгалийн яриа, дуут харилцаа, шуурхай фидбек.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSpeakingMode('freechat');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#EF233C] hover:bg-[#D90429] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all transform active:scale-95 cursor-pointer shrink-0"
            >
              <Mic className="w-4 h-4" />
              <span>Чөлөөт яриа эхлэх</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Controls Bar: Search, Level Filter, History Button */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Хувилбар хайх (Конбини, ярилцлага, эмнэлэг, 病院)..."
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white placeholder-stone-400 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500/30 focus:border-[#EF233C] font-jp"
              />
            </div>

            {/* Level Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0 text-xs">
              <button
                type="button"
                onClick={() => setLevelFilter('ALL')}
                className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                  levelFilter === 'ALL'
                    ? 'bg-[#EF233C] text-white shadow-2xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                Бүх түвшин
              </button>
              {(['N5', 'N4', 'N3', 'N2', 'N1'] as JLPTLevel[]).map(lvl => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevelFilter(lvl)}
                  className={`px-3 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                    levelFilter === lvl
                      ? 'bg-[#EF233C] text-white shadow-2xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* History Trigger Button */}
            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-orange-100 dark:hover:bg-orange-950/60 border border-stone-200 dark:border-stone-700 hover:border-orange-300 text-stone-700 dark:text-stone-200 hover:text-orange-800 dark:hover:text-orange-300 font-bold text-xs transition-colors cursor-pointer shrink-0"
            >
              <History className="w-4 h-4 text-orange-600" />
              <span>Миний түүх</span>
            </button>
          </div>

          {/* Scenarios Grid */}
          {filteredScenarios.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white dark:bg-stone-900 rounded-3xl border border-dashed border-stone-300 dark:border-stone-700">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">
                Тохирох хувилбар олдсонгүй
              </h3>
              <p className="text-xs text-stone-500">
                Хайлтын утгаа өөрчлөх эсвэл түвшний шүүлтүүрийг арилгаж үзнэ үү.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredScenarios.map(sc => (
                <RoleplayCard
                  key={sc.id}
                  scenario={sc}
                  selectedLevel={currentLevel}
                  onSelect={handleSelectScenario}
                />
              ))}
            </div>
          )}

          {/* Informational Banner */}
          <div className="p-5 sm:p-6 rounded-3xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  Sunny AI болон Roleplay-ийн нэгдсэн систем
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Roleplay харилцан ярианы мессежүүд нь таны өдөр тутмын Sunny AI-ийн эрхтэй нэгдэж тооцогдоно ({isPremium ? 'Premium хэрэглэгчид хязгааргүй' : '24 цагт 20 мессеж үнэгүй'}).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openSunnyAI}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-stone-900 border border-orange-300 dark:border-orange-800 text-orange-800 dark:text-orange-300 font-bold text-xs hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors cursor-pointer shrink-0"
            >
              <span>Sunny AI Багш нээх</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Roleplay History Modal */}
      <RoleplayHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onSelectSession={handleSelectHistorySession}
        scenarios={scenarios}
      />
    </div>
  );
};
