import React, { useState, useMemo } from 'react';
import {
  Search,
  BookA,
  Star,
  X,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Filter
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LevelBadge } from '../common/LevelBadge';
import { JLPTLevel, VocabularyItem } from '../../types';
import { speechService } from '../../services/speech';
import { WordDictionaryModal } from '../learn/WordDictionaryModal';
import { DetailedWordInfo, TokenKanjiInfo } from '../../utils/japaneseTokenizer';
import { alignRubyParts, renderRubyHtml } from '../../utils/furiganaRenderer';

// 50-sound (Gojūon) main kana rows
const GOJUON_ROWS = [
  { row: 'А', kana: ['あ', 'い', 'う', 'え', 'お'] },
  { row: 'Ка', kana: ['か', 'き', 'く', 'け', 'こ', 'が', 'ぎ', 'ぐ', 'げ', 'ご'] },
  { row: 'Са', kana: ['さ', 'し', 'す', 'せ', 'そ', 'ざ', 'じ', 'ず', 'ぜ', 'ぞ'] },
  { row: 'Та', kana: ['た', 'ち', 'つ', 'て', 'と', 'だ', 'ぢ', 'づ', 'で', 'ど'] },
  { row: 'На', kana: ['な', 'に', 'ぬ', 'ね', 'の'] },
  { row: 'Ха', kana: ['は', 'ひ', 'ふ', 'へ', 'ほ', 'ば', 'び', 'ぶ', 'べ', 'ぼ', 'ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'] },
  { row: 'Ма', kana: ['ま', 'み', 'む', 'め', 'も'] },
  { row: 'Я', kana: ['や', 'ゆ', 'よ'] },
  { row: 'Ра', kana: ['ら', 'り', 'る', 'れ', 'ろ'] },
  { row: 'Ва', kana: ['わ', 'を', 'ん'] }
];

const ITEMS_PER_PAGE = 40;

export const DictionaryView: React.FC = () => {
  const {
    data,
    userProgress,
    toggleFavorite,
    isPremium,
    isAdmin,
    isContentUnlocked,
    setActiveTab,
    setIsAuthModalOpen,
    currentUser
  } = useApp();

  const isUnlocked = isContentUnlocked || isPremium || isAdmin;

  // Search & Filter State
  const [query, setQuery] = useState('');
  const [selectedKana, setSelectedKana] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<JLPTLevel | 'all'>('all');
  const [posFilter, setPosFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Selected word for Detailed Modal
  const [selectedWordInfo, setSelectedWordInfo] = useState<DetailedWordInfo | null>(null);

  // Helper to convert Katakana to Hiragana for comparison
  const kataToHira = (str: string): string => {
    return str.replace(/[\u30A1-\u30F6]/g, ch =>
      String.fromCharCode(ch.charCodeAt(0) - 0x60)
    );
  };

  // Parts of speech list
  const partsOfSpeech = useMemo(() => {
    const set = new Set<string>();
    (data.vocabulary || []).forEach(v => {
      if (v.partOfSpeech) set.add(v.partOfSpeech);
    });
    return Array.from(set);
  }, [data.vocabulary]);

  // Filtered & Sorted Dictionary Items
  const filteredVocab = useMemo(() => {
    const list = (data.vocabulary || []).filter(item => {
      // Access Control: Free/guest users can only search N5 and FREE tier items
      if (!isUnlocked && item.jlptLevel !== 'N5' && item.accessTier !== 'FREE') return false;
      if (levelFilter !== 'all' && item.jlptLevel !== levelFilter) return false;
      if (posFilter !== 'all' && item.partOfSpeech !== posFilter) return false;

      // Gojūon Kana filter (checks initial kana of reading or japanese)
      if (selectedKana) {
        const hiraReading = kataToHira((item.reading || item.japanese || '').trim());
        if (!hiraReading.startsWith(selectedKana)) return false;
      }

      // Query filter
      if (query.trim()) {
        const q = query.toLowerCase().trim();
        const matchJp = item.japanese.toLowerCase().includes(q);
        const matchReading = item.reading ? item.reading.toLowerCase().includes(q) : false;
        const matchMn = item.mongolian ? item.mongolian.toLowerCase().includes(q) : false;
        const matchRomaji = item.romaji ? item.romaji.toLowerCase().includes(q) : false;
        const matchKanji = item.kanji ? item.kanji.toLowerCase().includes(q) : false;
        if (!matchJp && !matchReading && !matchMn && !matchRomaji && !matchKanji) return false;
      }

      return true;
    });

    // Japanese reading-based alphabetical sorting (stable dictionary order)
    return list.sort((a, b) => {
      const readA = a.reading || a.japanese || '';
      const readB = b.reading || b.japanese || '';
      return readA.localeCompare(readB, 'ja');
    });
  }, [data.vocabulary, isUnlocked, levelFilter, posFilter, selectedKana, query]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedKana, levelFilter, posFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredVocab.length / ITEMS_PER_PAGE));
  const paginatedVocab = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredVocab.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredVocab, currentPage]);

  const handleOpenWordDetail = (item: VocabularyItem) => {
    const kanjiChars = item.japanese.match(/[\u4E00-\u9FFF々仝〆〇ヶ\u3400-\u4DBF]/g) || [];
    const kanjiList: TokenKanjiInfo[] = kanjiChars.map(char => {
      const found = (data.kanji || []).find(k => k.kanji === char);
      if (found) {
        return {
          kanji: found.kanji,
          onyomi: found.onyomi,
          kunyomi: found.kunyomi,
          mongolian: found.mongolian,
          jlptLevel: found.jlptLevel,
          exampleWords: found.exampleWords
        };
      }
      return {
        kanji: char,
        onyomi: '—',
        kunyomi: '—',
        mongolian: item.mongolian,
        jlptLevel: item.jlptLevel
      };
    });

    const info: DetailedWordInfo = {
      surface: item.japanese,
      word: item.japanese,
      reading: item.reading,
      mongolian: item.mongolian,
      partOfSpeech: item.partOfSpeech || 'Үг',
      jlptLevel: item.jlptLevel,
      explanation: item.explanation,
      exampleSentence: item.exampleSentence,
      exampleReading: item.exampleReading,
      exampleMongolian: item.exampleMongolian,
      containsKanji: kanjiChars.length > 0,
      kanjiList,
      rawItem: item,
      rubyParts: alignRubyParts(item.japanese, item.reading),
      rubyHtml: renderRubyHtml(item.japanese, item.reading)
    };
    setSelectedWordInfo(info);
  };

  const handlePlayAudio = (text: string, reading?: string) => {
    speechService.play(text, {
      reading,
      rate: userProgress.settings?.speechRate || 0.9
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in pb-safe">
      {/* 1. HEADER & SEARCH BAR */}
      <div className="bg-white dark:bg-[#150F12] p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4 sm:space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookA className="w-6 h-6 text-[#CC0000] dark:text-[#FF4D4D] shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              Япон-Монгол Цахим Толь Бичиг
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            N5–N1 түвшний үгийн сангаас Япон ханз, хирагана, катакана, уншлага болон Монгол утгаар хайна уу.
          </p>
        </div>

        {/* Search Input & Dropdown Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ханз, хирагана, уншлага, эсвэл монгол утгаар хайх..."
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            value={levelFilter}
            onChange={e => setLevelFilter(e.target.value as any)}
            className="px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 focus:outline-none cursor-pointer"
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
            className="px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 focus:outline-none cursor-pointer"
          >
            <option value="all">Бүх үгийн аймаг</option>
            {partsOfSpeech.map(pos => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>

        {/* 2. JAPANESE GOJŪON (五十音) KANA INDEX */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <span>Япон цагаан толгойн индекс (五十音順):</span>
            </span>
            {selectedKana && (
              <button
                type="button"
                onClick={() => setSelectedKana(null)}
                className="text-[#CC0000] dark:text-[#FF6699] font-bold flex items-center gap-1 text-[11px] cursor-pointer hover:underline"
              >
                <span>Шүүлтийг арилгах ({selectedKana})</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Gojūon Kana Button Grid */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1.5 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedKana(null)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-all shrink-0 cursor-pointer ${
                selectedKana === null
                  ? 'bg-gradient-to-r from-[#CC0000] to-[#FF3366] text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              Бүгд
            </button>

            {GOJUON_ROWS.map(group => (
              <div key={group.row} className="flex items-center gap-1 shrink-0 px-1 border-r border-stone-200/60 dark:border-stone-800/80 last:border-0">
                {group.kana.map(k => {
                  const isChosen = selectedKana === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setSelectedKana(isChosen ? null : k)}
                      className={`w-7 h-7 rounded-lg text-xs font-black font-jp transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                        isChosen
                          ? 'bg-gradient-to-r from-[#CC0000] to-[#FF3366] text-white shadow-xs scale-105'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }`}
                      title={`${k} үсгээр эхэлсэн үгс`}
                    >
                      {k}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Free Preview Banner */}
        {!isUnlocked && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-red-500/10 via-pink-500/5 to-transparent border border-red-500/20 text-xs text-stone-800 dark:text-stone-200">
            <p>
              <span className="font-bold text-[#CC0000] dark:text-[#FF6699]">Үнэгүй горим:</span> N5 түвшний бүх үгс нээлттэй. Бүх 5,500+ үгийг толь бичгээс бүрэн хайхын тулд Premium эрхээ идэвхжүүлнэ үү.
            </p>
            <button
              onClick={() => {
                if (!currentUser) setIsAuthModalOpen(true);
                else setActiveTab('premium');
              }}
              className="shrink-0 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#CC0000] to-[#FF3366] hover:opacity-95 text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs"
            >
              Premium нээх (¥480 / сар)
            </button>
          </div>
        )}
      </div>

      {/* 3. DICTIONARY RESULTS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
            Хайлтын илэрц: нийт {filteredVocab.length} үг олдлоо
            {selectedKana ? ` (${selectedKana} үсгээр)` : ''}
          </span>

          {totalPages > 1 && (
            <span className="text-xs font-mono font-bold text-stone-400">
              Хуудас {currentPage} / {totalPages}
            </span>
          )}
        </div>

        {filteredVocab.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#150F12] rounded-3xl border border-stone-200 dark:border-stone-800 text-stone-400">
            <BookA className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 mb-2" />
            <p className="text-sm font-semibold">Таны хайлтад тохирох үг олдсонгүй.</p>
            <p className="text-xs text-stone-400 mt-1">Түлхүүр үг эсвэл үсгийн шүүлтүүрээ өөрчлөн дахин хайна уу.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full">
            {paginatedVocab.map(item => {
              const isFav = (userProgress.favorites?.vocabIds || []).includes(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenWordDetail(item)}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#160E12] border border-stone-200 dark:border-stone-800 hover:border-red-400 dark:hover:border-red-600 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div className="space-y-2.5">
                    {/* Top bar of card */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <LevelBadge level={item.jlptLevel} size="xs" />
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                          {item.partOfSpeech || 'Үг'}
                        </span>
                        {item.category && (
                          <span className="text-[10px] text-stone-400 font-medium">
                            • {item.category}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite('vocab', item.id);
                          }}
                          className="p-1 rounded-lg text-stone-400 hover:text-amber-500 transition-colors cursor-pointer"
                          title="Хадгалах"
                        >
                          <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Japanese Word & Reading */}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl sm:text-2xl font-black font-jp text-stone-900 dark:text-stone-100 group-hover:text-[#CC0000] dark:group-hover:text-[#FF6699] transition-colors">
                          {item.japanese}
                        </h3>
                        {item.reading && (
                          <span className="text-xs sm:text-sm font-semibold text-stone-400 font-jp">
                            【{item.reading}】
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayAudio(item.japanese, item.reading);
                          }}
                          className="p-1 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-[#CC0000] dark:text-[#FF6699] cursor-pointer"
                          title={`"${item.japanese}" дуудлага сонсох`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Mongolian Meaning */}
                      <p className="text-sm sm:text-base font-bold text-[#CC0000] dark:text-[#FF6699] mt-1 line-clamp-2">
                        {item.mongolian}
                      </p>
                    </div>

                    {/* Example Sentence preview if available */}
                    {item.exampleSentence && (
                      <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800 text-xs space-y-0.5">
                        <div className="font-bold text-stone-800 dark:text-stone-200 font-jp">
                          {item.exampleSentence}
                        </div>
                        {item.exampleMongolian && (
                          <div className="text-[11px] text-stone-500 dark:text-stone-400 italic">
                            {item.exampleMongolian}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 mt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
                    <span>Дэлгэрэнгүй харах</span>
                    <span className="text-[#CC0000] dark:text-[#FF6699] font-bold group-hover:translate-x-0.5 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => {
                setCurrentPage(p => Math.max(1, p - 1));
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 disabled:opacity-30 disabled:cursor-not-allowed text-stone-700 dark:text-stone-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Өмнөх</span>
            </button>

            <span className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-mono font-bold">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => {
                setCurrentPage(p => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 disabled:opacity-30 disabled:cursor-not-allowed text-stone-700 dark:text-stone-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              <span>Дараах</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Word Detailed Modal */}
      <WordDictionaryModal
        isOpen={!!selectedWordInfo}
        onClose={() => setSelectedWordInfo(null)}
        wordInfo={selectedWordInfo}
      />
    </div>
  );
};
