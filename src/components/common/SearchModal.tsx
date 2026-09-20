import React, { useState, useMemo } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LevelBadge } from './LevelBadge';

export const SearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    data,
    setActiveTab,
    setSelectedLevel,
    setLearnSubTab,
    isPremium,
    isAdmin
  } = useApp();

  const isUnlocked = isPremium || isAdmin;
  const [query, setQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!query.trim()) return { vocab: [], kanji: [], grammar: [] };
    const q = query.toLowerCase().trim();

    const canAccess = (item: { jlptLevel: any; accessTier?: any }) => {
      if (isUnlocked) return true;
      if (item.jlptLevel === 'N5') return true;
      return item.accessTier === 'FREE';
    };

    const vocab = (data.vocabulary || [])
      .filter(canAccess)
      .filter(
        v =>
          v.japanese.toLowerCase().includes(q) ||
          v.reading.toLowerCase().includes(q) ||
          v.mongolian.toLowerCase().includes(q) ||
          (v.romaji && v.romaji.toLowerCase().includes(q))
      ).slice(0, 6);

    const kanji = (data.kanji || [])
      .filter(canAccess)
      .filter(
        k =>
          k.kanji.includes(q) ||
          k.onyomi.toLowerCase().includes(q) ||
          k.kunyomi.toLowerCase().includes(q) ||
          k.mongolian.toLowerCase().includes(q)
      ).slice(0, 4);

    const grammar = (data.grammar || [])
      .filter(canAccess)
      .filter(
        g =>
          g.pattern.toLowerCase().includes(q) ||
          g.mongolian.toLowerCase().includes(q) ||
          g.explanation.toLowerCase().includes(q)
      ).slice(0, 4);

    return { vocab, kanji, grammar };
  }, [query, data, isUnlocked]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 md:p-20 bg-stone-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] my-auto sm:my-0">
        {/* Search Header */}
        <div className="flex items-center px-3 sm:px-4 py-3 border-b border-stone-200 dark:border-stone-800 gap-2 sm:gap-3">
          <Search className="w-5 h-5 text-stone-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Япон үг, ханз, дүрэм, эсвэл Монгол утгаар хайх..."
            autoFocus
            className="flex-1 min-w-0 bg-transparent text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none text-sm sm:text-base"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 transition-colors shrink-0"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {!query.trim() ? (
            <div className="text-center py-10 text-stone-400 text-sm">
              <p>Хайх үгээ Япон (Канжи, Хирагана) эсвэл Монгол хэлээр бичнэ үү.</p>
              <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                <span className="text-xs px-2 py-1 bg-stone-100 dark:bg-stone-800 rounded-md">食べる</span>
                <span className="text-xs px-2 py-1 bg-stone-100 dark:bg-stone-800 rounded-md">Нар</span>
                <span className="text-xs px-2 py-1 bg-stone-100 dark:bg-stone-800 rounded-md">〜てはいけません</span>
                <span className="text-xs px-2 py-1 bg-stone-100 dark:bg-stone-800 rounded-md">Идэх</span>
              </div>
            </div>
          ) : (
            <>
              {/* Vocabulary Section */}
              {searchResults.vocab.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center justify-between">
                    <span>Үгийн сан ({searchResults.vocab.length})</span>
                  </h4>
                  <div className="space-y-1.5">
                    {searchResults.vocab.map(item => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedLevel(item.jlptLevel);
                          setLearnSubTab('vocab');
                          setActiveTab('learn');
                          setIsSearchOpen(false);
                        }}
                        className="p-3 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800/80 cursor-pointer flex items-center justify-between transition-colors border border-transparent hover:border-stone-200 dark:hover:border-stone-700"
                      >
                        <div className="flex items-center gap-3">
                          <LevelBadge level={item.jlptLevel} size="sm" />
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="font-bold text-stone-900 dark:text-stone-100 text-base">
                                {item.japanese}
                              </span>
                              <span className="text-xs text-stone-500 font-jp">
                                {item.reading}
                              </span>
                            </div>
                            <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                              {item.mongolian}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ArrowRight className="w-4 h-4 text-stone-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Kanji Section */}
              {searchResults.kanji.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                    Канжи ({searchResults.kanji.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {searchResults.kanji.map(item => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedLevel(item.jlptLevel);
                          setLearnSubTab('kanji');
                          setActiveTab('learn');
                          setIsSearchOpen(false);
                        }}
                        className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer flex items-center gap-3 border border-stone-200 dark:border-stone-700/60"
                      >
                        <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 flex items-center justify-center text-xl font-bold font-jp">
                          {item.kanji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <LevelBadge level={item.jlptLevel} size="sm" />
                            <span className="text-xs text-stone-500 truncate">{item.onyomi}</span>
                          </div>
                          <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate mt-0.5">
                            {item.mongolian}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grammar Section */}
              {searchResults.grammar.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                    Дүрэм ({searchResults.grammar.length})
                  </h4>
                  <div className="space-y-1.5">
                    {searchResults.grammar.map(item => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedLevel(item.jlptLevel);
                          setLearnSubTab('grammar');
                          setActiveTab('learn');
                          setIsSearchOpen(false);
                        }}
                        className="p-3 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer border border-stone-200 dark:border-stone-800"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <LevelBadge level={item.jlptLevel} size="sm" />
                            <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                              {item.pattern}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                            {item.mongolian}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 line-clamp-1 mt-1">
                          {item.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {searchResults.vocab.length === 0 &&
                searchResults.kanji.length === 0 &&
                searchResults.grammar.length === 0 && (
                  <div className="text-center py-8 text-stone-400 text-sm">
                    "{query}" түлхүүр үгээр илэрц олдсонгүй.
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
