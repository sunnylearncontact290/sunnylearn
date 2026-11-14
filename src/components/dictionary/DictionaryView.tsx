import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  BookA,
  Star,
  X,
  Volume2,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LevelBadge } from '../common/LevelBadge';
import { AudioButton } from '../common/AudioButton';
import { JapaneseText } from '../common/JapaneseText';
import { JLPTLevel, KanjiItem, VocabularyItem } from '../../types';
import { WordDictionaryModal } from '../learn/WordDictionaryModal';
import { DetailedWordInfo, TokenKanjiInfo } from '../../utils/japaneseTokenizer';
import { alignRubyParts, renderRubyHtml } from '../../utils/furiganaRenderer';
import {
  MONGOLIAN_ALPHABET,
  getPrimaryMongolianMeaning,
  getPrimaryMongolianInitialLetter,
  compareMongolianStrings
} from '../../utils/mongolianUtils';
import { getCleanVocabExplanation } from '../../utils/vocabUtils';

type DictionaryBrowseMode = 'ja' | 'mn';

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

const jaCollator =
  typeof Intl !== 'undefined' && typeof Intl.Collator === 'function'
    ? new Intl.Collator('ja', { sensitivity: 'base', numeric: true })
    : null;

function kataToHira(str: string): string {
  return str.replace(/[\u30A1-\u30F6]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

interface IndexedVocabEntry {
  item: VocabularyItem;
  hiraReading: string;
  primaryMnNormalized: string;
  primaryMnLetter: string | null;
  searchableText: string;
}

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

  // Browsing mode & search/filter state
  const [browseMode, setBrowseMode] = useState<DictionaryBrowseMode>('ja');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedKana, setSelectedKana] = useState<string | null>(null);
  const [selectedMnLetter, setSelectedMnLetter] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<JLPTLevel | 'all'>('all');
  const [posFilter, setPosFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Selected word for Detailed Modal
  const [selectedWordInfo, setSelectedWordInfo] = useState<DetailedWordInfo | null>(null);

  // Debounce search query for smooth responsiveness across 5,550+ entries
  useEffect(() => {
    if (!query.trim()) {
      setDebouncedQuery('');
      return;
    }
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [query]);

  // Fast O(1) Kanji lookup map
  const kanjiLookupMap = useMemo(() => {
    const map = new Map<string, KanjiItem>();
    for (const k of data.kanji || []) {
      if (k.kanji) map.set(k.kanji, k);
    }
    return map;
  }, [data.kanji]);

  // Pre-index all vocabulary items once when dataset updates
  const indexedVocab = useMemo<IndexedVocabEntry[]>(() => {
    return (data.vocabulary || []).map(item => {
      const hiraReading = kataToHira((item.reading || item.japanese || '').trim());
      const primaryMnNormalized = getPrimaryMongolianMeaning(item.mongolian);
      const primaryMnLetter = getPrimaryMongolianInitialLetter(item.mongolian);
      const cleanExp = getCleanVocabExplanation(item.explanation, item.mongolian, item.partOfSpeech);

      const searchableText = [
        item.japanese,
        item.reading,
        hiraReading,
        item.mongolian ? item.mongolian.normalize('NFC') : '',
        item.kanji,
        item.romaji,
        item.partOfSpeech,
        item.category,
        cleanExp
      ]
        .filter(Boolean)
        .join('\n')
        .toLowerCase();

      return {
        item,
        hiraReading,
        primaryMnNormalized,
        primaryMnLetter,
        searchableText
      };
    });
  }, [data.vocabulary]);

  // Parts of speech list
  const partsOfSpeech = useMemo(() => {
    const set = new Set<string>();
    (data.vocabulary || []).forEach(v => {
      if (v.partOfSpeech) set.add(v.partOfSpeech);
    });
    return Array.from(set);
  }, [data.vocabulary]);

  // Step 1: Apply access control, JLPT level, POS, and debounced search query
  const baseFilteredEntries = useMemo(() => {
    const normalizedQuery = debouncedQuery.normalize('NFC').trim().toLowerCase();
    const hiraQuery = normalizedQuery ? kataToHira(normalizedQuery) : '';

    return indexedVocab.filter(entry => {
      const { item } = entry;
      if (!isUnlocked && item.jlptLevel !== 'N5' && item.accessTier !== 'FREE') return false;
      if (levelFilter !== 'all' && item.jlptLevel !== levelFilter) return false;
      if (posFilter !== 'all' && item.partOfSpeech !== posFilter) return false;

      if (normalizedQuery) {
        if (
          !entry.searchableText.includes(normalizedQuery) &&
          (!hiraQuery || hiraQuery === normalizedQuery || !entry.searchableText.includes(hiraQuery))
        ) {
          return false;
        }
      }

      return true;
    });
  }, [indexedVocab, isUnlocked, levelFilter, posFilter, debouncedQuery]);

  // Letter counts for Mongolian Cyrillic grid (over currently active non-letter filters)
  const mnLetterCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of baseFilteredEntries) {
      if (entry.primaryMnLetter) {
        counts.set(entry.primaryMnLetter, (counts.get(entry.primaryMnLetter) || 0) + 1);
      }
    }
    return counts;
  }, [baseFilteredEntries]);

  // Step 2: Apply active script letter index & locale-aware sorting
  const filteredVocab = useMemo(() => {
    let list = baseFilteredEntries;

    if (browseMode === 'ja') {
      if (selectedKana) {
        list = list.filter(entry => entry.hiraReading.startsWith(selectedKana));
      }
      return [...list]
        .sort((a, b) => {
          const readA = a.item.reading || a.item.japanese || '';
          const readB = b.item.reading || b.item.japanese || '';
          return jaCollator ? jaCollator.compare(readA, readB) : readA.localeCompare(readB, 'ja');
        })
        .map(entry => entry.item);
    }

    // Mongolian alphabetical browsing mode
    if (selectedMnLetter) {
      list = list.filter(entry => entry.primaryMnLetter === selectedMnLetter);
    }

    return [...list]
      .sort((a, b) => {
        const cmp = compareMongolianStrings(a.primaryMnNormalized, b.primaryMnNormalized);
        if (cmp !== 0) return cmp;
        const readA = a.item.reading || a.item.japanese || '';
        const readB = b.item.reading || b.item.japanese || '';
        return jaCollator ? jaCollator.compare(readA, readB) : readA.localeCompare(readB, 'ja');
      })
      .map(entry => entry.item);
  }, [baseFilteredEntries, browseMode, selectedKana, selectedMnLetter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [browseMode, debouncedQuery, selectedKana, selectedMnLetter, levelFilter, posFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredVocab.length / ITEMS_PER_PAGE));
  const paginatedVocab = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredVocab.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredVocab, currentPage]);

  const handleOpenWordDetail = (item: VocabularyItem) => {
    const kanjiChars = item.japanese.match(/[\u4E00-\u9FFF々仝〆〇ヶ\u3400-\u4DBF]/g) || [];
    const uniqueKanjiChars = Array.from(new Set(kanjiChars));
    const kanjiList: TokenKanjiInfo[] = uniqueKanjiChars.map(char => {
      const found = kanjiLookupMap.get(char);
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
      dictionaryReading: item.reading,
      mongolian: item.mongolian,
      partOfSpeech: item.partOfSpeech || 'Үг',
      jlptLevel: item.jlptLevel,
      explanation: item.explanation,
      exampleSentence: item.exampleSentence,
      exampleReading: item.exampleReading,
      exampleMongolian: item.exampleMongolian,
      containsKanji: uniqueKanjiChars.length > 0,
      kanjiList,
      rawItem: item,
      rubyParts: alignRubyParts(item.japanese, item.reading),
      rubyHtml: renderRubyHtml(item.japanese, item.reading)
    };
    setSelectedWordInfo(info);
  };

  const showFurigana = userProgress.settings?.showFurigana ?? true;

  const activeLetter = browseMode === 'ja' ? selectedKana : selectedMnLetter;
  const hasAnyActiveFilter =
    Boolean(query.trim()) ||
    Boolean(activeLetter) ||
    levelFilter !== 'all' ||
    posFilter !== 'all';

  const handleResetFilters = () => {
    setQuery('');
    setDebouncedQuery('');
    setSelectedKana(null);
    setSelectedMnLetter(null);
    setLevelFilter('all');
    setPosFilter('all');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in pb-safe">
      {/* 1. HEADER & SEARCH BAR */}
      <div className="bg-white dark:bg-[#150F12] p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookA className="w-6 h-6 text-[#CC0000] dark:text-[#FF4D4D] shrink-0" />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                Япон-Монгол Цахим Толь Бичиг
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              N5–N1 түвшний үгийн сангаас Япон цагаан толгой эсвэл Монгол цагаан толгойн дарааллаар хайна уу.
            </p>
          </div>

          {/* Segmented Mode Switch: 日本語 | Монгол */}
          <div
            role="tablist"
            aria-label="Толь бичгийн индекс горим"
            className="inline-flex items-center p-1 rounded-xl bg-stone-100 dark:bg-stone-800/90 border border-stone-200/80 dark:border-stone-700/80 self-start sm:self-auto shrink-0"
          >
            <button
              type="button"
              role="tab"
              aria-selected={browseMode === 'ja'}
              onClick={() => setBrowseMode('ja')}
              className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                browseMode === 'ja'
                  ? 'bg-gradient-to-r from-[#CC0000] to-[#FF3366] text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <span className="font-jp">日本語</span>
              <span className={`text-[10px] font-jp hidden sm:inline ${browseMode === 'ja' ? 'text-white/85' : 'text-stone-400'}`}>
                (五十音)
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={browseMode === 'mn'}
              onClick={() => setBrowseMode('mn')}
              className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                browseMode === 'mn'
                  ? 'bg-gradient-to-r from-[#CC0000] to-[#FF3366] text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <span>Монгол</span>
              <span className={`text-[10px] hidden sm:inline ${browseMode === 'mn' ? 'text-white/85' : 'text-stone-400'}`}>
                (А–Я)
              </span>
            </button>
          </div>
        </div>

        {/* Search Input & Dropdown Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={
                browseMode === 'mn'
                  ? 'Монгол утга, ялгаатай утга эсвэл Япон үгээр хайх...'
                  : 'Ханз, хирагана, уншлага, эсвэл монгол утгаар хайх...'
              }
              className="w-full pl-10 pr-9 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setDebouncedQuery('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                aria-label="Хайлт цэвэрлэх"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            value={levelFilter}
            onChange={e => setLevelFilter(e.target.value as JLPTLevel | 'all')}
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

        {/* 2. ALPHABETICAL / KANA INDEX (Responsive wrapping, zero horizontal overflow) */}
        <div className="pt-2.5 border-t border-stone-100 dark:border-stone-800/80 space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-extrabold text-stone-700 dark:text-stone-300">
              {browseMode === 'ja'
                ? 'Япон цагаан толгойн индекс (五十音順):'
                : 'Монгол цагаан толгойн индекс (А–Я):'}
            </span>
            {activeLetter && (
              <button
                type="button"
                onClick={() =>
                  browseMode === 'ja' ? setSelectedKana(null) : setSelectedMnLetter(null)
                }
                className="text-[#CC0000] dark:text-[#FF6699] font-bold flex items-center gap-1 text-[11px] cursor-pointer hover:underline shrink-0"
              >
                <span>Шүүлтийг арилгах ({activeLetter})</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {browseMode === 'ja' ? (
            /* Japanese Gojūon Kana Grid (responsive wrapping) */
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedKana(null)}
                className={`px-3 h-8 rounded-lg text-xs font-black transition-all shrink-0 cursor-pointer ${
                  selectedKana === null
                    ? 'bg-gradient-to-r from-[#CC0000] to-[#FF3366] text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                Бүгд
              </button>

              {GOJUON_ROWS.map(group => (
                <div
                  key={group.row}
                  className="flex flex-wrap items-center gap-1 pr-1.5 border-r border-stone-200/70 dark:border-stone-800/80 last:border-0"
                >
                  {group.kana.map(k => {
                    const isChosen = selectedKana === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setSelectedKana(isChosen ? null : k)}
                        className={`w-7 h-8 rounded-lg text-xs font-black font-jp transition-all flex items-center justify-center cursor-pointer ${
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
          ) : (
            /* Mongolian Cyrillic 35-Letter Responsive Alphabet Grid */
            <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-12 gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedMnLetter(null)}
                className={`col-span-2 sm:col-span-2 md:col-span-2 min-h-[36px] px-2.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                  selectedMnLetter === null
                    ? 'bg-gradient-to-r from-[#CC0000] to-[#FF3366] text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                Бүгд
              </button>

              {MONGOLIAN_ALPHABET.map(letter => {
                const isChosen = selectedMnLetter === letter;
                const count = mnLetterCounts.get(letter) || 0;
                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => setSelectedMnLetter(isChosen ? null : letter)}
                    className={`min-h-[36px] rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      isChosen
                        ? 'bg-gradient-to-r from-[#CC0000] to-[#FF3366] text-white shadow-xs scale-[1.03]'
                        : count === 0
                        ? 'bg-stone-50 dark:bg-stone-900/60 text-stone-400 dark:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                    title={`${letter} үсгээр эхэлсэн (${count})`}
                  >
                    <span>{letter}</span>
                  </button>
                );
              })}
            </div>
          )}
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
        <div className="flex items-center justify-between px-1 gap-2 flex-wrap">
          <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Хайлтын илэрц: нийт {filteredVocab.length} үг олдлоо
            {activeLetter ? ` (${activeLetter} үсгээр)` : ''}
            {browseMode === 'mn' ? ' • А–Я эрэмбэ' : ''}
          </span>

          {totalPages > 1 && (
            <span className="text-xs font-mono font-bold text-stone-400">
              Хуудас {currentPage} / {totalPages}
            </span>
          )}
        </div>

        {filteredVocab.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white dark:bg-[#150F12] rounded-3xl border border-stone-200 dark:border-stone-800 text-stone-400 space-y-3">
            <BookA className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600" />
            <div>
              <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">
                Таны хайлтад тохирох үг олдсонгүй.
              </p>
              <p className="text-xs text-stone-400 mt-1">
                Түлхүүр үг, JLPT түвшин эсвэл үсгийн шүүлтүүрээ өөрчлөн дахин хайна уу.
              </p>
            </div>
            {hasAnyActiveFilter && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Бүх шүүлтийг цэвэрлэх</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full">
            {paginatedVocab.map(item => {
              const isFav = (userProgress.favorites?.vocabIds || []).includes(item.id);
              const showReadingBadge = item.reading && item.reading !== item.japanese;

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
                          onClick={e => {
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
                        {showReadingBadge && (
                          <span className="text-xs sm:text-sm font-semibold text-stone-400 font-jp">
                            【{item.reading}】
                          </span>
                        )}
                        <AudioButton
                          text={item.japanese}
                          reading={item.reading}
                          id={`dict_card_${item.id}`}
                          size="xs"
                          title={`"${item.japanese}" дуудлага сонсох`}
                        />
                      </div>

                      {/* Mongolian Meaning */}
                      <p className="text-sm sm:text-base font-bold text-[#CC0000] dark:text-[#FF6699] mt-1 line-clamp-2">
                        {item.mongolian}
                      </p>
                    </div>

                    {/* Example Sentence preview if available */}
                    {item.exampleSentence && (
                      <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800 text-xs space-y-1">
                        <div className="font-bold text-stone-800 dark:text-stone-200 font-jp">
                          <JapaneseText
                            text={item.exampleSentence}
                            reading={item.exampleReading}
                            showFurigana={showFurigana}
                            vocabulary={data.vocabulary}
                            kanji={data.kanji}
                          />
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
