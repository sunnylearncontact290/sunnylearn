import React, { useState, useEffect } from 'react';
import { JLPTLevel, RoleplaySessionRecord, RoleplayScenario } from '../../types';
import { apiService } from '../../services/api';
import { LevelBadge } from '../common/LevelBadge';
import {
  X,
  History,
  Clock,
  Target,
  Award,
  ChevronRight,
  Loader2,
  Calendar,
  Sparkles
} from 'lucide-react';

interface RoleplayHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (session: RoleplaySessionRecord) => void;
  scenarios: RoleplayScenario[];
}

interface HistoryItem {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  scenarioIcon: string;
  jlptLevel: JLPTLevel;
  createdAt: string;
  messageCount: number;
  objectivesCompleted: number;
  score: number;
}

export const RoleplayHistoryModal: React.FC<RoleplayHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectSession
}) => {
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const res = await apiService.getRoleplayHistory();
      if (res && res.history) {
        setHistoryList(res.history);
      }
    } catch (err) {
      console.error('Failed to load roleplay history', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSession = async (id: string) => {
    setLoadingSessionId(id);
    try {
      const res = await apiService.getRoleplaySession(id);
      if (res && res.session) {
        onSelectSession(res.session);
        onClose();
      }
    } catch (err) {
      console.error('Failed to load session details', err);
    } finally {
      setLoadingSessionId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                Миний Roleplay Түүх
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Таны гүйцэтгэсэн өмнөх харилцан ярианууд болон тайлан
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-stone-400">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              <span className="text-xs">Түүхийг татаж байна...</span>
            </div>
          ) : historyList.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-stone-800 dark:text-stone-200 text-sm">
                Одоогоор хадгалагдсан түүх байхгүй байна
              </h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Аль нэг хувилбарыг сонгон харилцан яриагаа амжилттай дуусгаснаар таны үнэлгээний тайлан энд хадгалагдана.
              </p>
            </div>
          ) : (
            historyList.map(item => {
              const isOpening = loadingSessionId === item.id;
              const dateStr = new Date(item.createdAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenSession(item.id)}
                  className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 hover:border-red-400 dark:hover:border-red-500/60 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-xl shrink-0">
                      {item.scenarioIcon || '🎭'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate group-hover:text-[#EF233C] dark:group-hover:text-red-400 transition-colors font-jp">
                          {item.scenarioTitle}
                        </h4>
                        <LevelBadge level={item.jlptLevel} size="sm" />
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {dateStr}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3 text-orange-500" />
                          {item.objectivesCompleted} даалгавар
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.messageCount} мессеж
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-black text-orange-600 dark:text-orange-400">
                        {item.score}%
                      </div>
                      <span className="text-[10px] text-stone-400">Үнэлгээ</span>
                    </div>

                    {isOpening ? (
                      <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#EF233C] group-hover:translate-x-0.5 transition-all" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
