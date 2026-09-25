import React, { useState, useMemo } from 'react';
import { Search, Star, CheckCircle2, ChevronDown, ChevronUp, AlertCircle, Sparkles, BookOpen, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LevelBadge } from '../common/LevelBadge';
import { AudioButton } from '../common/AudioButton';
import { GrammarItem } from '../../types';

export const GrammarList: React.FC = () => {
  const {
    data,
    selectedLevel,
    userProgress,
    toggleGrammarLearned,
    toggleFavorite,
    isPremium,
    isAdmin,
    setActiveTab,
    setIsAuthModalOpen,
    currentUser
  } = useApp();

  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const effectiveLevel = selectedLevel || 'N5';
  const isLevelPremium = effectiveLevel !== 'N5';
  const isUnlocked = !isLevelPremium || isPremium || isAdmin;
  const levelCounts = data.counts?.[effectiveLevel];
  const lockedCount = levelCounts?.lockedGrammar || 0;

  const filteredGrammar = useMemo(() => {
    return (data.grammar || []).filter(item => {
      if (item.jlptLevel !== effectiveLevel) return false;
      // Strict access control: If user is not unlocked, show ONLY FREE items
      if (!isUnlocked && item.accessTier !== 'FREE') return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchPattern = item.pattern.toLowerCase().includes(q);
        const matchMn = item.mongolian.toLowerCase().includes(q);
        const matchExp = item.explanation.toLowerCase().includes(q);
        if (!matchPattern && !matchMn && !matchExp) return false;
      }
      return true;
    });
  }, [data.grammar, effectiveLevel, search]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Premium Preview Info Banner */}
      {isLevelPremium && !isUnlocked && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-500/10 via-orange-500/5 to-transparent border border-red-200/80 dark:border-red-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EF233C] to-orange-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>JLPT {effectiveLevel} Дүрэм — Танилцуулга хувилбар</span>
                <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 text-[10px] font-bold">
                  {filteredGrammar.length} дүрэм нээлттэй
                </span>
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                Энэ түвшний {lockedCount > 0 ? `${lockedCount} дүрэм` : 'бүх дүрмүүд'} болон жишээ өгүүлбэр, ялгаануудыг Premium эрхээр бүрэн нээнэ үү.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (!currentUser) {
                setIsAuthModalOpen(true);
              } else {
                setActiveTab('premium');
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#EF233C] via-[#B91C1C] to-orange-600 hover:opacity-95 text-white font-extrabold text-xs shadow-md shadow-red-500/20 transition-all shrink-0 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Premium нээх (¥880 / 30 хоног)</span>
          </button>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-4 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`${effectiveLevel} дүрэм, залгавар, монгол тайлбараар хайх...`}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>
      </div>

      {/* Grammar Cards List */}
      {filteredGrammar.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 text-stone-400">
          <BookOpen className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-600 mb-2" />
          <p className="text-sm font-medium">Шүүлтүүрт тохирох дүрэм олдсонгүй.</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4 w-full">
          {filteredGrammar.map(item => {
            const isLearned = (userProgress.learnedGrammarIds || []).includes(item.id);
            const isFav = (userProgress.favorites?.grammarIds || []).includes(item.id);
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border transition-all shadow-sm w-full max-w-full ${
                  isLearned
                    ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/10'
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-300'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <LevelBadge level={item.jlptLevel} size="md" />
                    <h3 className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-stone-100 font-jp">
                      {item.pattern}
                    </h3>
                    <AudioButton
                      text={item.pattern}
                      id={`grammar_pat_${item.id}`}
                      size="xs"
                      title={`"${item.pattern}" дуудлага сонсох`}
                    />
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap self-start sm:self-auto">
                    <button
                      onClick={() => toggleFavorite('grammar', item.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-orange-500 transition-colors"
                      title="Хадгалах"
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-orange-400 text-orange-400' : ''}`} />
                    </button>
                    <button
                      onClick={() => toggleGrammarLearned(item.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        isLearned
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isLearned ? 'Эзэмшсэн' : 'Эзэмшсэнд тооцох'}</span>
                    </button>
                  </div>
                </div>

                {/* Mongolian Meaning & Explanation */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/30 border border-red-200/60 dark:border-red-900/40">
                    <span className="text-xs font-bold text-red-700 dark:text-red-300 block mb-0.5">
                      Монгол утга:
                    </span>
                    <p className="text-base font-bold text-stone-900 dark:text-stone-100">
                      {item.mongolian}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                      Тайлбар:
                    </span>
                    <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed mt-0.5">
                      {item.explanation}
                    </p>
                  </div>

                  {/* Usage & Structure */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {item.usage && (
                      <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/50 text-xs">
                        <span className="font-bold text-stone-500 block mb-1">Хэрэглэх дүрэм:</span>
                        <code className="text-stone-900 dark:text-stone-200 font-mono font-semibold">
                          {item.usage}
                        </code>
                      </div>
                    )}
                    {item.structure && (
                      <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/50 text-xs">
                        <span className="font-bold text-stone-500 block mb-1">Өгүүлбэрийн бүтэц:</span>
                        <span className="text-stone-900 dark:text-stone-200 font-semibold">
                          {item.structure}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Examples */}
                  {item.examples && item.examples.length > 0 && (
                    <div className="pt-3 space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                        Жишээ өгүүлбэрүүд:
                      </span>
                      <div className="space-y-2">
                        {item.examples.map((ex, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/50 dark:border-stone-700/50 space-y-1 text-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-stone-900 dark:text-stone-100 font-jp text-sm block">
                                {ex.japanese}
                              </span>
                              <AudioButton
                                text={ex.japanese}
                                id={`grammar_ex_${item.id}_${idx}`}
                                size="xs"
                                title="Жишээ өгүүлбэр сонсох"
                              />
                            </div>
                            {ex.reading && (
                              <p className="text-[11px] text-stone-500 font-jp">
                                {ex.reading}
                              </p>
                            )}
                            <p className="text-stone-600 dark:text-stone-400 font-medium italic">
                              {ex.mongolian}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expandable Advanced Info (Similar grammar, Common mistakes, Practice) */}
                  {(item.similarGrammar || item.differences || item.commonMistakes || item.practiceQuestions) && (
                    <div className="pt-2">
                      <button
                        onClick={() => toggleExpand(item.id)}
                        className="text-xs font-bold text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center gap-1 py-1"
                      >
                        <span>{isExpanded ? 'Дэлгэрэнгүйг нуух' : 'Анхаарах зүйлс & Сорил асуулт'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 p-4 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 space-y-3 text-xs animate-fade-in">
                          {item.similarGrammar && (
                            <div>
                              <span className="font-bold text-stone-700 dark:text-stone-300">Ойролцоо дүрэм:</span>
                              <p className="text-stone-600 dark:text-stone-400 mt-0.5">{item.similarGrammar}</p>
                            </div>
                          )}
                          {item.differences && (
                            <div>
                              <span className="font-bold text-stone-700 dark:text-stone-300">Утгын ялгаа:</span>
                              <p className="text-stone-600 dark:text-stone-400 mt-0.5">{item.differences}</p>
                            </div>
                          )}
                          {item.commonMistakes && (
                            <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-orange-900 dark:text-orange-200">Нийтлэг гаргадаг алдаа:</span>
                                <p className="text-orange-800 dark:text-orange-300 mt-0.5">{item.commonMistakes}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Locked Card Teaser */}
          {isLevelPremium && !isUnlocked && (
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-stone-50 to-orange-50/30 dark:from-stone-900 dark:to-orange-950/20 border-2 border-dashed border-orange-300 dark:border-orange-800/60 flex flex-col items-center justify-center text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-base">
                  JLPT {effectiveLevel} түвшний үлдсэн дүрмүүд
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-xs mx-auto">
                  {lockedCount > 0 ? `${lockedCount} дүрэм` : 'Цаашдын дүрмүүд'} болон дэлгэрэнгүй жишээнүүд Premium эрхээр бүрэн нээгдэнэ.
                </p>
              </div>
              <button
                onClick={() => {
                  if (!currentUser) {
                    setIsAuthModalOpen(true);
                  } else {
                    setActiveTab('premium');
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#EF233C] via-[#B91C1C] to-orange-600 hover:opacity-95 text-white font-extrabold text-xs shadow-md shadow-red-500/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Premium идэвхжүүлэх (¥880 / 30 хоног)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
