import React, { useState, useMemo } from 'react';
import { Search, Filter, Star, CheckCircle2, BookOpen, Sparkles, Lock, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LevelBadge } from '../common/LevelBadge';
import { AudioButton } from '../common/AudioButton';
import { VocabularyItem } from '../../types';
import { getCleanVocabExplanation } from '../../utils/vocabUtils';

export const VocabList: React.FC = () => {
  const {
    data,
    selectedLevel,
    userProgress,
    toggleVocabLearned,
    toggleFavorite,
    isPremium,
    isAdmin,
    setActiveTab,
    setIsAuthModalOpen,
    currentUser
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [filterLearned, setFilterLearned] = useState<'all' | 'unlearned' | 'learned'>('all');

  const effectiveLevel = selectedLevel || 'N5';
  const isLevelPremium = effectiveLevel !== 'N5';
  const isUnlocked = !isLevelPremium || isPremium || isAdmin;
  const levelCounts = data.counts?.[effectiveLevel];
  const lockedCount = levelCounts?.lockedVocab || 0;

  const filteredVocab = useMemo(() => {
    return (data.vocabulary || []).filter(item => {
      if (item.jlptLevel !== effectiveLevel) return false;
      // Strict access control: If user is not unlocked, show ONLY FREE items
      if (!isUnlocked && item.accessTier !== 'FREE') return false;
      if (selectedCat !== 'all' && item.category !== selectedCat) return false;

      const isLearned = (userProgress.learnedVocabIds || []).includes(item.id);
      if (filterLearned === 'learned' && !isLearned) return false;
      if (filterLearned === 'unlearned' && isLearned) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchJp = item.japanese.toLowerCase().includes(q);
        const matchReading = item.reading.toLowerCase().includes(q);
        const matchMn = item.mongolian.toLowerCase().includes(q);
        const matchRomaji = item.romaji && item.romaji.toLowerCase().includes(q);
        if (!matchJp && !matchReading && !matchMn && !matchRomaji) return false;
      }
      return true;
    });
  }, [data.vocabulary, selectedLevel, selectedCat, filterLearned, search, userProgress.learnedVocabIds]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    (data.vocabulary || [])
      .filter(v => v.jlptLevel === effectiveLevel)
      .forEach(v => { if (v.category) cats.add(v.category); });
    return Array.from(cats);
  }, [data.vocabulary, effectiveLevel]);

  return (
    <div className="space-y-6">
      {/* Premium Preview Info Banner */}
      {isLevelPremium && !isUnlocked && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>JLPT {effectiveLevel} Үгийн сан — Танилцуулга хувилбар</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-[10px] font-bold">
                  {filteredVocab.length} үг нээлттэй
                </span>
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                Энэ түвшний {lockedCount > 0 ? `${lockedCount} үг` : 'бүх үгс'} болон N4-N1 бүрэн хөтөлбөрийг нээхийн тулд Premium аваарай.
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
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-sm shadow-amber-500/20 transition-all shrink-0 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Premium нээх (¥880 / 30 хоног)</span>
          </button>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`${effectiveLevel} түвшний үг, уншлага, монгол утгаар хайх...`}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <select
            value={selectedCat}
            onChange={e => setSelectedCat(e.target.value)}
            className="px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 focus:outline-none"
          >
            <option value="all">Бүх ангилал</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filterLearned}
            onChange={e => setFilterLearned(e.target.value as any)}
            className="px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 focus:outline-none"
          >
            <option value="all">Бүх үгс</option>
            <option value="unlearned">Цээжлээгүй</option>
            <option value="learned">Цээжилсэн</option>
          </select>
        </div>
      </div>

      {/* Vocab Cards List */}
      {filteredVocab.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 text-stone-400">
          <BookOpen className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-600 mb-2" />
          <p className="text-sm font-medium">Шүүлтүүрт тохирох үг олдсонгүй.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full">
          {filteredVocab.map(item => {
            const isLearned = userProgress.learnedVocabIds.includes(item.id);
            const isFav = userProgress.favorites.vocabIds.includes(item.id);

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between ${
                  isLearned
                    ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-300'
                }`}
              >
                <div>
                  {/* Top Bar of card */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <LevelBadge level={item.jlptLevel} size="sm" />
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                        {item.partOfSpeech}
                      </span>
                      {item.category && (
                        <span className="text-[11px] text-stone-400 font-medium">
                          • {item.category}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleFavorite('vocab', item.id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-amber-500 transition-colors"
                        title="Хадгалах"
                      >
                        <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Japanese Word & Reading */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 font-jp tracking-tight">
                        {item.japanese}
                      </h3>
                      <span className="text-xs sm:text-sm font-semibold text-stone-500 font-jp">
                        【{item.reading}】
                      </span>
                      <AudioButton
                        text={item.japanese}
                        reading={item.reading}
                        id={`vocab_main_${item.id}`}
                        size="xs"
                        title={`"${item.japanese}" дуудлага сонсох`}
                      />
                    </div>

                    {/* Mongolian Meaning */}
                    <p className="text-base font-bold text-red-600 dark:text-red-400 pt-1">
                      {item.mongolian}
                    </p>

                    {/* Mongolian Explanation (without redundant duplicate of primary meaning) */}
                    {(() => {
                      const cleanExp = getCleanVocabExplanation(item.explanation, item.mongolian, item.partOfSpeech);
                      return cleanExp ? (
                        <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed pt-1">
                          {cleanExp}
                        </p>
                      ) : null;
                    })()}
                  </div>

                  {/* Example Sentence Section */}
                  {item.exampleSentence && (
                    <div className="mt-4 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/50 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                          Жишээ өгүүлбэр:
                        </span>
                        <AudioButton
                          text={item.exampleSentence}
                          id={`vocab_ex_${item.id}`}
                          size="xs"
                          title="Жишээ өгүүлбэр сонсох"
                        />
                      </div>
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100 font-jp">
                        {item.exampleSentence}
                      </p>
                      {item.exampleReading && (
                        <p className="text-[11px] text-stone-500 font-jp">
                          {item.exampleReading}
                        </p>
                      )}
                      <p className="text-xs text-stone-600 dark:text-stone-400 italic">
                        {item.exampleMongolian}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Action footer */}
                <div className="pt-4 mt-4 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between">
                  <span className="text-xs text-stone-400">
                    {isLearned ? '✓ Цээжилсэн' : 'Цээжлээгүй'}
                  </span>
                  <button
                    onClick={() => toggleVocabLearned(item.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isLearned
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isLearned ? 'Цээжилсэн' : 'Цээжилсэнд тооцох'}</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Locked Card Teaser */}
          {isLevelPremium && !isUnlocked && (
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-stone-50 to-amber-50/40 dark:from-stone-900 dark:to-amber-950/20 border-2 border-dashed border-amber-300 dark:border-amber-800/60 flex flex-col items-center justify-center text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-stone-900 dark:text-stone-100 text-base">
                  JLPT {effectiveLevel} түвшний үлдсэн үгс
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-xs mx-auto">
                  {lockedCount > 0 ? `${lockedCount} үг` : 'Цаашдын үгс'} болон N4-N1 сургалтын сан Premium эрхээр бүрэн нээгдэнэ.
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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
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
