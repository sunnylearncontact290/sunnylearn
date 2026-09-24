import React, { useState, useMemo } from 'react';
import { Search, BookA, Star, Filter, ArrowUpDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LevelBadge } from '../common/LevelBadge';
import { AudioButton } from '../common/AudioButton';
import { JLPTLevel } from '../../types';
import { getCleanVocabExplanation } from '../../utils/vocabUtils';

export const DictionaryView: React.FC = () => {
  const { data, userProgress, toggleFavorite, isPremium, isAdmin, setActiveTab, setIsAuthModalOpen, currentUser } = useApp();
  const isUnlocked = isPremium || isAdmin;
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<JLPTLevel | 'all'>('all');
  const [posFilter, setPosFilter] = useState('all');

  const filteredVocab = useMemo(() => {
    return data.vocabulary.filter(item => {
      // Access Control: Free/guest users can only search N5 and FREE tier items
      if (!isUnlocked && item.jlptLevel !== 'N5' && item.accessTier !== 'FREE') return false;
      if (levelFilter !== 'all' && item.jlptLevel !== levelFilter) return false;
      if (posFilter !== 'all' && item.partOfSpeech !== posFilter) return false;

      if (query.trim()) {
        const q = query.toLowerCase().trim();
        const matchJp = item.japanese.toLowerCase().includes(q);
        const matchReading = item.reading.toLowerCase().includes(q);
        const matchMn = item.mongolian.toLowerCase().includes(q);
        const matchRomaji = item.romaji && item.romaji.toLowerCase().includes(q);
        const matchKanji = item.kanji && item.kanji.toLowerCase().includes(q);
        if (!matchJp && !matchReading && !matchMn && !matchRomaji && !matchKanji) return false;
      }
      return true;
    });
  }, [data.vocabulary, query, levelFilter, posFilter]);

  const partsOfSpeech = useMemo(() => {
    const set = new Set<string>();
    data.vocabulary.forEach(v => {
      if (v.partOfSpeech) set.add(v.partOfSpeech);
    });
    return Array.from(set);
  }, [data.vocabulary]);

  return (
    <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4 sm:space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookA className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              Япон-Монгол Цахим Толь Бичиг
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            N5–N1 түвшний бүх үгийн сангаас Япон (Ханз, Хирагана, Ромажи) болон Монгол утгаар хайна уу.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Япон үг, ханз, уншлага, эсвэл Монгол утгаар хайх..."
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          <select
            value={levelFilter}
            onChange={e => setLevelFilter(e.target.value as any)}
            className="px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 focus:outline-none"
          >
            <option value="all">Бүх JLPT Түвшин</option>
            <option value="N5">JLPT N5</option>
            <option value="N4">JLPT N4</option>
            <option value="N3">JLPT N3</option>
            <option value="N2">JLPT N2</option>
            <option value="N1">JLPT N1</option>
          </select>

          <select
            value={posFilter}
            onChange={e => setPosFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 focus:outline-none"
          >
            <option value="all">Бүх үгийн аймаг</option>
            {partsOfSpeech.map(pos => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>

        {!isUnlocked && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200">
            <p>
              <span className="font-bold">Free горим:</span> N5 түвшний бүх үгс болон N4–N1 нээлттэй үгсийг харуулж байна. Бүх 5,500+ үгийг толь бичгээс бүрэн хайхын тулд Premium эрхээ идэвхжүүлнэ үү.
            </p>
            <button
              onClick={() => {
                if (!currentUser) setIsAuthModalOpen(true);
                else setActiveTab('premium');
              }}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Premium авах (¥880)
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
            Хайлтын илэрц: {filteredVocab.length} үг олдлоо
          </span>
        </div>

        {filteredVocab.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 text-stone-400">
            <BookA className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 mb-2" />
            <p className="text-sm font-semibold">Таны хайлтад тохирох үг олдсонгүй.</p>
            <p className="text-xs text-stone-400 mt-1">Түлхүүр үгээ өөрчлөн дахин хайна уу.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full">
            {filteredVocab.map(item => {
              const isFav = userProgress.favorites.vocabIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-300 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <LevelBadge level={item.jlptLevel} size="sm" />
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                          {item.partOfSpeech}
                        </span>
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

                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 font-jp">
                          {item.japanese}
                        </h3>
                        <span className="text-xs sm:text-sm font-semibold text-stone-500 font-jp">
                          【{item.reading}】
                        </span>
                        <AudioButton
                          text={item.japanese}
                          reading={item.reading}
                          id={`dict_word_${item.id}`}
                          size="xs"
                          title={`"${item.japanese}" дуудлага сонсох`}
                        />
                      </div>

                      <p className="text-base font-bold text-red-600 dark:text-red-400 mt-1">
                        {item.mongolian}
                      </p>

                      {(() => {
                        const cleanExp = getCleanVocabExplanation(item.explanation, item.mongolian, item.partOfSpeech);
                        return cleanExp ? (
                          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                            {cleanExp}
                          </p>
                        ) : null;
                      })()}
                    </div>

                    {item.exampleSentence && (
                      <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/50 text-xs space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-stone-900 dark:text-stone-100 font-jp block">
                            {item.exampleSentence}
                          </span>
                          <AudioButton
                            text={item.exampleSentence}
                            id={`dict_ex_${item.id}`}
                            size="xs"
                            title="Жишээ өгүүлбэр сонсох"
                          />
                        </div>
                        {item.exampleReading && (
                          <p className="text-[11px] text-stone-500 font-jp">
                            {item.exampleReading}
                          </p>
                        )}
                        <p className="text-stone-600 dark:text-stone-400 italic">
                          {item.exampleMongolian}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
