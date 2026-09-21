import {
  DatabaseSchema,
  JLPTLevel,
  VocabularyItem,
  KanjiItem,
  GrammarItem,
  ExampleSentenceItem,
  UserProgress,
  ItemStudyRecord,
  MasteryStatus,
  ContentType,
  QuizAttemptRecord,
  PracticeAttemptRecord,
  QuizQuestionReview,
  DailyActivityRecord
} from '../types';
import { FREE_LIMITS } from '../data/accessControl';

export type PracticeCategory = 'vocab' | 'kanji' | 'grammar' | 'sentence' | 'mixed' | 'review';

export interface PracticeQuestion {
  id: string;
  category: ContentType;
  subType: string;
  itemId: string;
  prompt: string;
  promptSub?: string;
  promptBadge?: string;
  promptInstruction?: string;
  options: string[];
  correctIndex: number;
  correctAnswer?: number; // alias for backwards compatibility
  explanation: string;
  audioText?: string;
  reading?: string;
  scrambleWords?: string[]; // For sentence reordering in practice mode
  correctOrder?: string[];
}

export interface SentencePair {
  id: string;
  japanese: string;
  mongolian: string;
  reading?: string;
}

// Fisher-Yates shuffle helper
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Robust text normalizer for comparing choices, filtering duplicates, and validating answers
export function normalizeAnswerText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[.。!！?？,、・~〜～:;：；「」『』【】（）()\[\]\s+]/g, '')
    .normalize('NFKC');
}

// Generate smart, unique distractors without duplicates or accidental matches
export function getDistractors(pool: (string | undefined | null)[], correct: string, count: number = 3): string[] {
  const normCorrect = normalizeAnswerText(correct);
  const seen = new Set<string>([normCorrect]);
  const uniqueFiltered: string[] = [];

  for (const item of pool) {
    if (!item) continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    const norm = normalizeAnswerText(trimmed);
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    uniqueFiltered.push(trimmed);
  }

  const shuffled = shuffleArray(uniqueFiltered);
  return shuffled.slice(0, count);
}

// Assemble shuffled options with guaranteed correctIndex synchronization and zero duplicates
export function assembleOptions(
  correctText: string,
  distractors: (string | undefined | null)[]
): { options: string[]; correctIndex: number } {
  const cleanCorrect = correctText.trim();
  const normCorrect = normalizeAnswerText(cleanCorrect);
  const validDistractors: string[] = [];
  const seen = new Set<string>([normCorrect]);

  for (const d of distractors) {
    if (!d) continue;
    const trimmed = d.trim();
    if (!trimmed) continue;
    const norm = normalizeAnswerText(trimmed);
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    validDistractors.push(trimmed);
    if (validDistractors.length >= 3) break;
  }

  const options = shuffleArray([cleanCorrect, ...validDistractors]);
  const correctIndex = options.indexOf(cleanCorrect);

  return { options, correctIndex };
}

// Helper to find a matching pattern segment in a sentence for fill-in-the-blank
function findPatternInSentence(pattern: string, sentence: string): string | null {
  if (!pattern || !sentence) return null;
  const clean = pattern
    .replace(/[〜～~]/g, ' ')
    .replace(/\[.*?\]/g, ' ')
    .replace(/\(.*?\)/g, ' ')
    .replace(/（.*?）/g, ' ');
  const rawParts = clean.split(/[・/、\s+]/).map(p => p.trim()).filter(Boolean);

  const candidates: string[] = [];
  rawParts.forEach(p => {
    candidates.push(p);
    if (p.endsWith('る') && p.length > 1) candidates.push(p.slice(0, -1));
    if (p.endsWith('く') && p.length > 1) candidates.push(p.slice(0, -1) + 'き');
    if (p.endsWith('す') && p.length > 1) candidates.push(p.slice(0, -1) + 'し');
    if (p.endsWith('ある') && p.length > 2) candidates.push(p.slice(0, -2) + 'あり');
  });

  // Longest match first to prioritize specific compound expressions
  candidates.sort((a, b) => b.length - a.length);

  for (const cand of candidates) {
    if (cand.length >= 1 && sentence.includes(cand)) {
      return cand;
    }
  }
  return null;
}

export const learningEngine = {
  // Get all content matching the level (fails closed: free users only receive free tier items)
  getLevelContent(data: DatabaseSchema, level: JLPTLevel, isUnlocked: boolean = false) {
    let vocab = (data.vocabulary || []).filter(v => v.jlptLevel === level);
    let kanji = (data.kanji || []).filter(k => k.jlptLevel === level);
    let grammar = (data.grammar || []).filter(g => g.jlptLevel === level);
    let sentences = (data.exampleSentences || []).filter(s => s.jlptLevel === level);

    if (level !== 'N5' && !isUnlocked) {
      vocab = vocab.filter(v => v.accessTier === 'FREE').slice(0, FREE_LIMITS.VOCABULARY);
      kanji = kanji.filter(k => k.accessTier === 'FREE').slice(0, FREE_LIMITS.KANJI);
      grammar = grammar.filter(g => g.accessTier === 'FREE').slice(0, FREE_LIMITS.GRAMMAR);
      sentences = sentences.filter(s => s.accessTier === 'FREE');
    }

    return { vocab, kanji, grammar, sentences };
  },

  // Aggregate comprehensive, authentic sentence pairs across all N5-N1 content
  getSentencePool(data: DatabaseSchema, level: JLPTLevel, isUnlocked: boolean = false): SentencePair[] {
    const pairs: SentencePair[] = [];
    const seenJp = new Set<string>();

    // 1. Example sentences collection
    let sentences = (data.exampleSentences || []).filter(s => s.jlptLevel === level && s.japanese && s.mongolian);
    if (level !== 'N5' && !isUnlocked) {
      sentences = sentences.filter(s => s.accessTier === 'FREE');
    }
    sentences.forEach(s => {
      const jp = s.japanese.trim();
      const norm = normalizeAnswerText(jp);
      if (!seenJp.has(norm)) {
        seenJp.add(norm);
        pairs.push({
          id: s.id,
          japanese: jp,
          mongolian: s.mongolian.trim(),
          reading: s.reading?.trim()
        });
      }
    });

    // 2. Vocabulary example sentences
    let vocabs = (data.vocabulary || []).filter(v => v.jlptLevel === level && v.exampleSentence && v.exampleMongolian);
    if (level !== 'N5' && !isUnlocked) {
      vocabs = vocabs.filter(v => v.accessTier === 'FREE').slice(0, FREE_LIMITS.VOCABULARY);
    }
    vocabs.forEach(v => {
      const jp = v.exampleSentence!.trim();
      const norm = normalizeAnswerText(jp);
      if (!seenJp.has(norm)) {
        seenJp.add(norm);
        pairs.push({
          id: `v-s-${v.id}`,
          japanese: jp,
          mongolian: v.exampleMongolian!.trim(),
          reading: v.exampleReading?.trim()
        });
      }
    });

    // 3. Grammar example sentences
    let grammars = (data.grammar || []).filter(g => g.jlptLevel === level && Array.isArray(g.examples));
    if (level !== 'N5' && !isUnlocked) {
      grammars = grammars.filter(g => g.accessTier === 'FREE').slice(0, FREE_LIMITS.GRAMMAR);
    }
    grammars.forEach(g => {
      g.examples?.forEach((ex, idx) => {
        if (ex.japanese && ex.mongolian) {
          const jp = ex.japanese.trim();
          const norm = normalizeAnswerText(jp);
          if (!seenJp.has(norm)) {
            seenJp.add(norm);
            pairs.push({
              id: `g-s-${g.id}-${idx}`,
              japanese: jp,
              mongolian: ex.mongolian.trim(),
              reading: ex.reading?.trim()
            });
          }
        }
      });
    });

    return pairs;
  },

  // Calculate item priority for spaced repetition
  getItemPriority(itemId: string, itemType: ContentType, level: JLPTLevel, progress: UserProgress): number {
    const records = progress.itemStudyRecords || {};
    const record = records[itemId];

    if (!record) {
      // Unseen item: high priority so user is exposed to all items over time
      return 85 + Math.random() * 10;
    }

    if (record.masteryStatus === 'review_needed' || record.incorrectCount > record.correctCount) {
      // Mistakes need review immediately!
      return 100 + Math.min(50, record.incorrectCount * 12);
    }

    if (record.masteryStatus === 'learning') {
      const daysSince = this.getDaysSince(record.lastPracticedDate);
      return 60 + Math.min(30, daysSince * 5);
    }

    if (record.masteryStatus === 'mastered') {
      const daysSince = this.getDaysSince(record.lastPracticedDate);
      // Mastered items return much less frequently
      return 15 + Math.min(25, daysSince * 2);
    }

    return 50;
  },

  getDaysSince(isoDate?: string): number {
    if (!isoDate) return 10;
    try {
      const past = new Date(isoDate).getTime();
      const diff = Date.now() - past;
      return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    } catch {
      return 10;
    }
  },

  // Generate Practice Questions
  generatePracticeSession(
    data: DatabaseSchema,
    level: JLPTLevel,
    category: PracticeCategory,
    progress: UserProgress,
    count: number = 10,
    specificItemIds?: string[],
    isUnlocked: boolean = false,
    isQuiz: boolean = false
  ): PracticeQuestion[] {
    const { vocab, kanji, grammar } = this.getLevelContent(data, level, isUnlocked);
    const sentencePool = this.getSentencePool(data, level, isUnlocked);
    const questions: PracticeQuestion[] = [];
    const usedItemIds = new Set<string>();

    // 1. If specific item IDs are requested (e.g. "Алдсан асуултуудаа давтах")
    if (specificItemIds && specificItemIds.length > 0) {
      const idSet = new Set(specificItemIds);
      const specVocab = vocab.filter(v => idSet.has(v.id));
      const specKanji = kanji.filter(k => idSet.has(k.id));
      const specGrammar = grammar.filter(g => idSet.has(g.id));
      const specSentences = sentencePool.filter(s => idSet.has(s.id));

      specVocab.forEach(v => {
        const q = this.buildVocabQuestion(v, vocab);
        if (q) questions.push(q);
      });
      specKanji.forEach(k => {
        const q = this.buildKanjiQuestion(k, kanji);
        if (q) questions.push(q);
      });
      specGrammar.forEach(g => {
        const q = this.buildGrammarQuestion(g, grammar);
        if (q) questions.push(q);
      });
      specSentences.forEach(s => {
        const q = this.buildSentenceQuestion(s, sentencePool, !isQuiz);
        if (q) questions.push(q);
      });

      return shuffleArray(questions).slice(0, count);
    }

    // 2. Review mode: only items that need review
    if (category === 'review') {
      const records = progress.itemStudyRecords || {};
      const reviewIds = Object.values(records)
        .filter(r => r.jlptLevel === level && (r.masteryStatus === 'review_needed' || r.incorrectCount > 0))
        .map(r => r.itemId);

      if (reviewIds.length > 0) {
        return this.generatePracticeSession(data, level, 'mixed', progress, count, reviewIds, isUnlocked, isQuiz);
      }
      // If no weak items, fallback to mixed
      category = 'mixed';
    }

    // Sort items by spaced-repetition priority
    const prioritizedVocab = [...vocab].sort((a, b) => {
      return this.getItemPriority(b.id, 'vocab', level, progress) - this.getItemPriority(a.id, 'vocab', level, progress);
    });

    const prioritizedKanji = [...kanji].sort((a, b) => {
      return this.getItemPriority(b.id, 'kanji', level, progress) - this.getItemPriority(a.id, 'kanji', level, progress);
    });

    const prioritizedGrammar = [...grammar].sort((a, b) => {
      return this.getItemPriority(b.id, 'grammar', level, progress) - this.getItemPriority(a.id, 'grammar', level, progress);
    });

    const prioritizedSentences = shuffleArray([...sentencePool]);

    // Build question generator based on category
    if (category === 'vocab') {
      for (const item of prioritizedVocab) {
        if (questions.length >= count) break;
        if (usedItemIds.has(item.id)) continue;
        const q = this.buildVocabQuestion(item, vocab);
        if (q) {
          questions.push(q);
          usedItemIds.add(item.id);
        }
      }
    } else if (category === 'kanji') {
      for (const item of prioritizedKanji) {
        if (questions.length >= count) break;
        if (usedItemIds.has(item.id)) continue;
        const q = this.buildKanjiQuestion(item, kanji);
        if (q) {
          questions.push(q);
          usedItemIds.add(item.id);
        }
      }
    } else if (category === 'grammar') {
      for (const item of prioritizedGrammar) {
        if (questions.length >= count) break;
        if (usedItemIds.has(item.id)) continue;
        const q = this.buildGrammarQuestion(item, grammar);
        if (q) {
          questions.push(q);
          usedItemIds.add(item.id);
        }
      }
    } else if (category === 'sentence') {
      for (const item of prioritizedSentences) {
        if (questions.length >= count) break;
        if (usedItemIds.has(item.id)) continue;
        const q = this.buildSentenceQuestion(item, sentencePool, !isQuiz);
        if (q) {
          questions.push(q);
          usedItemIds.add(item.id);
        }
      }
    } else {
      // Mixed: balanced mix of Vocab, Kanji, Grammar, and Sentences
      let vIdx = 0, kIdx = 0, gIdx = 0, sIdx = 0;
      let loop = 0;
      while (questions.length < count && loop < count * 4) {
        loop++;
        const targetType = loop % 4;
        if (targetType === 0 && prioritizedVocab[vIdx]) {
          const v = prioritizedVocab[vIdx++];
          if (!usedItemIds.has(v.id)) {
            const q = this.buildVocabQuestion(v, vocab);
            if (q) { questions.push(q); usedItemIds.add(v.id); }
          }
        } else if (targetType === 1 && prioritizedKanji[kIdx]) {
          const k = prioritizedKanji[kIdx++];
          if (!usedItemIds.has(k.id)) {
            const q = this.buildKanjiQuestion(k, kanji);
            if (q) { questions.push(q); usedItemIds.add(k.id); }
          }
        } else if (targetType === 2 && prioritizedGrammar[gIdx]) {
          const g = prioritizedGrammar[gIdx++];
          if (!usedItemIds.has(g.id)) {
            const q = this.buildGrammarQuestion(g, grammar);
            if (q) { questions.push(q); usedItemIds.add(g.id); }
          }
        } else if (targetType === 3 && prioritizedSentences[sIdx]) {
          const s = prioritizedSentences[sIdx++];
          if (!usedItemIds.has(s.id)) {
            const q = this.buildSentenceQuestion(s, sentencePool, !isQuiz);
            if (q) { questions.push(q); usedItemIds.add(s.id); }
          }
        }
      }
    }

    return questions.slice(0, count);
  },

  // Question Builders
  buildVocabQuestion(item: VocabularyItem, pool: VocabularyItem[]): PracticeQuestion | null {
    if (pool.length < 2) return null;

    // Check if item has a distinct reading (not pure hiragana/katakana identical to japanese)
    const hasDistinctReading = Boolean(item.reading && item.reading.trim() !== item.japanese.trim());
    const subTypes = hasDistinctReading ? ['jp_to_mn', 'mn_to_jp', 'reading'] : ['jp_to_mn', 'mn_to_jp'];
    const chosenType = subTypes[Math.floor(Math.random() * subTypes.length)];

    if (chosenType === 'jp_to_mn') {
      const distractors = getDistractors(pool.map(p => p.mongolian), item.mongolian, 3);
      if (distractors.length < 1) return null;
      const { options, correctIndex } = assembleOptions(item.mongolian, distractors);
      return {
        id: `q-v-jm-${item.id}-${Date.now()}`,
        category: 'vocab',
        subType: 'jp_to_mn',
        itemId: item.id,
        prompt: item.japanese,
        promptSub: item.reading ? `【${item.reading}】` : undefined,
        promptBadge: 'Япон → Монгол утга',
        options,
        correctIndex,
        correctAnswer: correctIndex,
        explanation: `${item.japanese} (${item.reading || ''}): ${item.mongolian}. ${item.explanation || ''}`,
        audioText: item.japanese,
        reading: item.reading
      };
    } else if (chosenType === 'mn_to_jp') {
      const distractors = getDistractors(pool.map(p => p.japanese), item.japanese, 3);
      if (distractors.length < 1) return null;
      const { options, correctIndex } = assembleOptions(item.japanese, distractors);
      return {
        id: `q-v-mj-${item.id}-${Date.now()}`,
        category: 'vocab',
        subType: 'mn_to_jp',
        itemId: item.id,
        prompt: item.mongolian,
        promptSub: item.partOfSpeech ? `(${item.partOfSpeech})` : undefined,
        promptBadge: 'Монгол → Япон үг',
        options,
        correctIndex,
        correctAnswer: correctIndex,
        explanation: `Зөв хариулт: ${item.japanese}${item.reading ? `【${item.reading}】` : ''} (${item.mongolian}). ${item.explanation || ''}`,
        audioText: item.japanese,
        reading: item.reading
      };
    } else {
      // Reading test
      const validReadings = pool.map(p => p.reading).filter(Boolean);
      const distractors = getDistractors(validReadings, item.reading, 3);
      if (distractors.length < 1) return null;
      const { options, correctIndex } = assembleOptions(item.reading, distractors);
      return {
        id: `q-v-rd-${item.id}-${Date.now()}`,
        category: 'vocab',
        subType: 'reading',
        itemId: item.id,
        prompt: item.japanese,
        promptSub: `Монгол утга: ${item.mongolian}`,
        promptBadge: 'Уншлага сонгох (Хирагана)',
        options,
        correctIndex,
        correctAnswer: correctIndex,
        explanation: `Зөв уншлага: 「${item.reading}」. Утга: ${item.mongolian}.`,
        audioText: item.japanese,
        reading: item.reading
      };
    }
  },

  buildKanjiQuestion(item: KanjiItem, pool: KanjiItem[]): PracticeQuestion | null {
    if (pool.length < 2) return null;
    const subTypes = ['kanji_meaning', 'kanji_reading', 'kanji_char'];
    const chosenType = subTypes[Math.floor(Math.random() * subTypes.length)];

    if (chosenType === 'kanji_meaning') {
      const distractors = getDistractors(pool.map(p => p.mongolian), item.mongolian, 3);
      if (distractors.length < 1) return null;
      const { options, correctIndex } = assembleOptions(item.mongolian, distractors);
      return {
        id: `q-k-mn-${item.id}-${Date.now()}`,
        category: 'kanji',
        subType: 'kanji_meaning',
        itemId: item.id,
        prompt: item.kanji,
        promptSub: `Оньёми: ${item.onyomi || '—'} | Күньёми: ${item.kunyomi || '—'}`,
        promptBadge: 'Ханзны утга',
        options,
        correctIndex,
        correctAnswer: correctIndex,
        explanation: `Ханз ${item.kanji}: ${item.mongolian}. Оньёми: ${item.onyomi || '—'}, Күньёми: ${item.kunyomi || '—'}.`,
        audioText: item.kanji
      };
    } else if (chosenType === 'kanji_reading') {
      const isOnyomi = Boolean(item.onyomi && (!item.kunyomi || Math.random() > 0.5));
      const targetRead = isOnyomi ? item.onyomi.trim() : item.kunyomi.trim();
      const readPool = pool.map(p => (isOnyomi ? p.onyomi : p.kunyomi)).filter(Boolean);
      const distractors = getDistractors(readPool, targetRead, 3);
      if (distractors.length < 1) return null;
      const { options, correctIndex } = assembleOptions(targetRead, distractors);
      return {
        id: `q-k-rd-${item.id}-${Date.now()}`,
        category: 'kanji',
        subType: 'kanji_reading',
        itemId: item.id,
        prompt: item.kanji,
        promptSub: isOnyomi ? 'Оньёми (Катакана) уншлагыг сонгоно уу' : 'Күньёми (Хирагана) уншлагыг сонгоно уу',
        promptBadge: 'Ханзны уншлага',
        options,
        correctIndex,
        correctAnswer: correctIndex,
        explanation: `${item.kanji} ханзны ${isOnyomi ? 'оньёми' : 'күньёми'} уншлага: ${targetRead}. Монгол утга: ${item.mongolian}.`,
        audioText: item.kanji
      };
    } else {
      // Find the character for the meaning
      const distractors = getDistractors(pool.map(p => p.kanji), item.kanji, 3);
      if (distractors.length < 1) return null;
      const { options, correctIndex } = assembleOptions(item.kanji, distractors);
      return {
        id: `q-k-ch-${item.id}-${Date.now()}`,
        category: 'kanji',
        subType: 'kanji_char',
        itemId: item.id,
        prompt: item.mongolian,
        promptSub: `Уншлага: ${item.onyomi || ''} / ${item.kunyomi || ''}`,
        promptBadge: 'Тохирох ханзыг сонго',
        options,
        correctIndex,
        correctAnswer: correctIndex,
        explanation: `Зөв ханз: ${item.kanji} (${item.mongolian})`,
        audioText: item.kanji
      };
    }
  },

  buildGrammarQuestion(item: GrammarItem, pool: GrammarItem[]): PracticeQuestion | null {
    if (pool.length < 2) return null;

    // 1. Handcrafted practice questions if present on the grammar item
    if (Array.isArray(item.practiceQuestions) && item.practiceQuestions.length > 0) {
      const pq = item.practiceQuestions[Math.floor(Math.random() * item.practiceQuestions.length)];
      if (pq && pq.options && pq.answer !== undefined && pq.options[pq.answer]) {
        const correctText = pq.options[pq.answer];
        const dists = pq.options.filter((_, idx) => idx !== pq.answer);
        const { options, correctIndex } = assembleOptions(correctText, dists);
        return {
          id: `q-g-pq-${item.id}-${Date.now()}`,
          category: 'grammar',
          subType: 'fill_blank',
          itemId: item.id,
          prompt: pq.question,
          promptSub: 'Хоосон зайд хамгийн тохирох дүрэм / хэлбэрийг сонгоно уу.',
          promptBadge: 'Дүрэм нөхөж бичих',
          promptInstruction: 'Хоосон зайд хамгийн тохирох дүрэм / хэлбэрийг сонгоно уу.',
          options,
          correctIndex,
          correctAnswer: correctIndex,
          explanation: pq.explanation || `Зөв хариулт: ${correctText}. Дүрэм: ${item.pattern} (${item.mongolian}).`,
          audioText: pq.question.replace(/_{2,}|（.*?）|【.*?】/g, correctText),
          reading: undefined
        };
      }
    }

    // 2. Smart fill-in-the-blank from examples
    const hasExamples = Array.isArray(item.examples) && item.examples.length > 0;
    if (hasExamples && Math.random() > 0.35) {
      for (const eg of item.examples) {
        const matched = findPatternInSentence(item.pattern, eg.japanese);
        if (matched && eg.japanese.includes(matched)) {
          const blank = '（ _____ ）';
          const masked = eg.japanese.replace(matched, blank);
          const otherPatterns = pool.map(p => {
            const clean = p.pattern.replace(/[〜～~]/g, '').trim().split(/[・/、]/)[0].trim();
            return clean || p.pattern;
          });
          const distractors = getDistractors(otherPatterns, matched, 3);
          if (distractors.length >= 2) {
            const { options, correctIndex } = assembleOptions(matched, distractors);
            return {
              id: `q-g-fb-${item.id}-${Date.now()}`,
              category: 'grammar',
              subType: 'fill_blank',
              itemId: item.id,
              prompt: masked,
              promptSub: `Орчуулга: ${eg.mongolian}`,
              promptBadge: 'Дүрэм нөхөж бичих',
              promptInstruction: 'Хоосон зайд хамгийн тохирох дүрэм / хэлбэрийг сонгоно уу.',
              options,
              correctIndex,
              correctAnswer: correctIndex,
              explanation: `Бүтэн өгүүлбэр: 「${eg.japanese}」. Зөв дүрэм: ${item.pattern} (${item.mongolian}). ${item.structure ? `Бүтэц: ${item.structure}. ` : ''}${item.explanation || ''}`,
              audioText: eg.japanese,
              reading: eg.reading
            };
          }
        }
      }
    }

    // 3. Grammar pattern -> Mongolian explanation/meaning
    const distractors = getDistractors(pool.map(p => p.mongolian), item.mongolian, 3);
    if (distractors.length < 1) return null;
    const { options, correctIndex } = assembleOptions(item.mongolian, distractors);
    return {
      id: `q-g-mn-${item.id}-${Date.now()}`,
      category: 'grammar',
      subType: 'grammar_meaning',
      itemId: item.id,
      prompt: item.pattern,
      promptSub: item.structure ? `Бүтэц: ${item.structure}` : 'Энэхүү дүрмийн монгол утга, тайлбарыг сонгоно уу.',
      promptBadge: 'Дүрмийн утга',
      promptInstruction: 'Дүрмийн зөв монгол утга, тайлбарыг сонгоно уу.',
      options,
      correctIndex,
      correctAnswer: correctIndex,
      explanation: `Дүрэм ${item.pattern}: ${item.mongolian}. ${item.structure ? `Бүтэц: ${item.structure}. ` : ''}${item.explanation || ''}`,
      audioText: item.pattern
    };
  },

  buildSentenceQuestion(item: SentencePair, pool: SentencePair[], allowScramble: boolean = false): PracticeQuestion | null {
    const jp = item.japanese.trim();
    const mn = item.mongolian.trim();

    // Word tokens for scramble (only for practice mode if allowed and word count is suitable)
    if (allowScramble) {
      let words = jp.replace(/([。！？、])/g, ' $1 ').trim().split(/\s+/).filter(Boolean);
      if (words.length >= 3 && words.length <= 6) {
        let scrambled = shuffleArray([...words]);
        if (scrambled.join('') === words.join('') && words.length >= 2) {
          [scrambled[0], scrambled[1]] = [scrambled[1], scrambled[0]];
        }
        return {
          id: `q-s-sc-${item.id}-${Date.now()}`,
          category: 'sentence',
          subType: 'sentence_scramble',
          itemId: item.id,
          prompt: mn,
          promptSub: 'Үгсийг зөв дараалалд оруулан өгүүлбэр бүтээгээрэй',
          promptBadge: 'Өгүүлбэр эвлүүлэх',
          options: words,
          correctIndex: 0,
          correctAnswer: 0,
          explanation: `Зөв өгүүлбэр: 「${jp}」 ${item.reading ? `(${item.reading})` : ''} — ${mn}`,
          scrambleWords: scrambled,
          correctOrder: words,
          audioText: jp,
          reading: item.reading
        };
      }
    }

    // Authentic sentence multiple-choice question:
    // 60% chance: Japanese sentence -> select correct Mongolian translation
    // 40% chance: Mongolian meaning -> select correct Japanese sentence
    const isJpToMn = Math.random() > 0.4;

    if (isJpToMn) {
      const distractors = getDistractors(pool.map(p => p.mongolian), mn, 3);
      if (distractors.length < 1) return null;
      const { options, correctIndex } = assembleOptions(mn, distractors);
      return {
        id: `q-s-tr-${item.id}-${Date.now()}`,
        category: 'sentence',
        subType: 'sentence_translation',
        itemId: item.id,
        prompt: jp,
        promptSub: item.reading ? `【${item.reading}】` : 'Дараах өгүүлбэрийн зөв монгол орчуулгыг сонгоно уу.',
        promptBadge: 'Өгүүлбэрийн орчуулга (Япон → Монгол)',
        options,
        correctIndex,
        correctAnswer: correctIndex,
        explanation: `Зөв орчуулга: 「${jp}」 — ${mn}`,
        audioText: jp,
        reading: item.reading
      };
    } else {
      const distractors = getDistractors(pool.map(p => p.japanese), jp, 3);
      if (distractors.length < 1) return null;
      const { options, correctIndex } = assembleOptions(jp, distractors);
      return {
        id: `q-s-rev-${item.id}-${Date.now()}`,
        category: 'sentence',
        subType: 'sentence_translation',
        itemId: item.id,
        prompt: mn,
        promptSub: 'Дараах монгол утгатай тохирох зөв япон өгүүлбэрийг сонгоно уу.',
        promptBadge: 'Өгүүлбэр сонгох (Монгол → Япон)',
        options,
        correctIndex,
        correctAnswer: correctIndex,
        explanation: `Зөв өгүүлбэр: 「${jp}」 ${item.reading ? `【${item.reading}】` : ''} — ${mn}`,
        audioText: jp,
        reading: item.reading
      };
    }
  },

  // QUIZ ENGINE: Generate mini, standard, or full quiz
  generateQuizSession(
    data: DatabaseSchema,
    level: JLPTLevel,
    category: 'vocab' | 'kanji' | 'grammar' | 'mixed',
    progress: UserProgress,
    questionCount: number = 10,
    isUnlocked: boolean = false
  ): PracticeQuestion[] {
    const practiceCat: PracticeCategory = category;
    // Pass isQuiz = true so all questions are standard multiple choice without scramble UI or dummy choices
    const questions = this.generatePracticeSession(
      data,
      level,
      practiceCat,
      progress,
      questionCount,
      undefined,
      isUnlocked,
      true
    );
    return questions;
  },

  // Record an answer and update ItemStudyRecord in UserProgress
  recordAnswer(
    progress: UserProgress,
    itemId: string,
    itemType: ContentType,
    level: JLPTLevel,
    isCorrect: boolean
  ): UserProgress {
    const records = { ...(progress.itemStudyRecords || {}) };
    const existing = records[itemId] || {
      itemId,
      itemType,
      jlptLevel: level,
      timesEncountered: 0,
      correctCount: 0,
      incorrectCount: 0,
      consecutiveCorrect: 0,
      lastPracticedDate: new Date().toISOString(),
      masteryStatus: 'unseen' as MasteryStatus
    };

    const timesEncountered = existing.timesEncountered + 1;
    const correctCount = existing.correctCount + (isCorrect ? 1 : 0);
    const incorrectCount = existing.incorrectCount + (isCorrect ? 0 : 1);
    const consecutiveCorrect = isCorrect ? existing.consecutiveCorrect + 1 : 0;

    let masteryStatus: MasteryStatus = existing.masteryStatus;
    if (consecutiveCorrect >= 3 || (correctCount >= 4 && (correctCount / timesEncountered) >= 0.8)) {
      masteryStatus = 'mastered';
    } else if (!isCorrect && (incorrectCount >= 2 || (correctCount / timesEncountered) < 0.6)) {
      masteryStatus = 'review_needed';
    } else {
      masteryStatus = 'learning';
    }

    records[itemId] = {
      itemId,
      itemType,
      jlptLevel: level,
      timesEncountered,
      correctCount,
      incorrectCount,
      consecutiveCorrect,
      lastPracticedDate: new Date().toISOString(),
      masteryStatus
    };

    // Also update learned IDs array if mastered or correct count >= 2
    let learnedVocab = [...progress.learnedVocabIds];
    let learnedKanji = [...progress.learnedKanjiIds];
    let learnedGrammar = [...progress.learnedGrammarIds];

    if (isCorrect) {
      if (itemType === 'vocab' && !learnedVocab.includes(itemId)) {
        learnedVocab.push(itemId);
      } else if (itemType === 'kanji' && !learnedKanji.includes(itemId)) {
        learnedKanji.push(itemId);
      } else if (itemType === 'grammar' && !learnedGrammar.includes(itemId)) {
        learnedGrammar.push(itemId);
      }
    }

    // Record daily activity count
    const today = new Date().toISOString().split('T')[0];
    const daily = { ...(progress.dailyActivity || {}) };
    const todayRec = daily[today] || { date: today, itemCount: 0, quizCount: 0, practiceCount: 0 };
    todayRec.itemCount += 1;
    todayRec.practiceCount += 1;
    daily[today] = todayRec;

    return {
      ...progress,
      itemStudyRecords: records,
      learnedVocabIds: learnedVocab,
      learnedKanjiIds: learnedKanji,
      learnedGrammarIds: learnedGrammar,
      dailyActivity: daily,
      updatedAt: new Date().toISOString()
    };
  },

  // Record a completed Quiz in UserProgress
  recordQuizCompleted(
    progress: UserProgress,
    attempt: QuizAttemptRecord
  ): UserProgress {
    const history = [attempt, ...(progress.quizHistory || [])].slice(0, 50);

    // Update legacy quizResults format for backwards-compatibility
    const legacy = [
      {
        quizId: attempt.id,
        score: attempt.score,
        total: attempt.total,
        date: attempt.date,
        jlptLevel: attempt.jlptLevel
      },
      ...(progress.quizResults || [])
    ].slice(0, 50);

    const today = new Date().toISOString().split('T')[0];
    const daily = { ...(progress.dailyActivity || {}) };
    const todayRec = daily[today] || { date: today, itemCount: 0, quizCount: 0, practiceCount: 0 };
    todayRec.quizCount += 1;
    todayRec.itemCount += attempt.total;
    daily[today] = todayRec;

    return {
      ...progress,
      quizHistory: history,
      quizResults: legacy,
      dailyActivity: daily,
      lastStudied: {
        type: 'lesson',
        id: attempt.id,
        title: `JLPT ${attempt.jlptLevel} Quiz (${attempt.score}/${attempt.total})`,
        level: attempt.jlptLevel,
        date: attempt.date
      },
      updatedAt: new Date().toISOString()
    };
  },

  // Record a completed Practice session in UserProgress
  recordPracticeCompleted(
    progress: UserProgress,
    attempt: PracticeAttemptRecord
  ): UserProgress {
    const history = [attempt, ...(progress.practiceHistory || [])].slice(0, 50);
    return {
      ...progress,
      practiceHistory: history,
      updatedAt: new Date().toISOString()
    };
  },

  // Level Statistics Calculation
  getLevelStats(data: DatabaseSchema, level: JLPTLevel, progress: UserProgress) {
    const { vocab, kanji, grammar } = this.getLevelContent(data, level);
    const records = progress.itemStudyRecords || {};

    const totalVocab = vocab.length;
    const totalKanji = kanji.length;
    const totalGrammar = grammar.length;
    const totalItems = totalVocab + totalKanji + totalGrammar;

    const learnedVocabIds = new Set(progress.learnedVocabIds || []);
    const learnedKanjiIds = new Set(progress.learnedKanjiIds || []);
    const learnedGrammarIds = new Set(progress.learnedGrammarIds || []);

    const learnedVocab = vocab.filter(v => learnedVocabIds.has(v.id)).length;
    const learnedKanji = kanji.filter(k => learnedKanjiIds.has(k.id)).length;
    const learnedGrammar = grammar.filter(g => learnedGrammarIds.has(g.id)).length;
    const learnedItems = learnedVocab + learnedKanji + learnedGrammar;

    const overallPct = totalItems > 0 ? Math.round((learnedItems / totalItems) * 100) : 0;
    const vocabPct = totalVocab > 0 ? Math.round((learnedVocab / totalVocab) * 100) : 0;
    const kanjiPct = totalKanji > 0 ? Math.round((learnedKanji / totalKanji) * 100) : 0;
    const grammarPct = totalGrammar > 0 ? Math.round((learnedGrammar / totalGrammar) * 100) : 0;

    // Mastery breakdown
    const levelRecords = Object.values(records).filter(r => r.jlptLevel === level);
    const masteredCount = levelRecords.filter(r => r.masteryStatus === 'mastered').length;
    const reviewNeededCount = levelRecords.filter(r => r.masteryStatus === 'review_needed' || r.incorrectCount > r.correctCount).length;
    const learningCount = levelRecords.filter(r => r.masteryStatus === 'learning').length;
    const unseenCount = Math.max(0, totalItems - levelRecords.length);

    // Specific weak items lists
    const weakVocab = vocab.filter(v => {
      const r = records[v.id];
      return r && (r.masteryStatus === 'review_needed' || r.incorrectCount > 0);
    });
    const weakKanji = kanji.filter(k => {
      const r = records[k.id];
      return r && (r.masteryStatus === 'review_needed' || r.incorrectCount > 0);
    });
    const weakGrammar = grammar.filter(g => {
      const r = records[g.id];
      return r && (r.masteryStatus === 'review_needed' || r.incorrectCount > 0);
    });

    // Quiz statistics for this level
    const levelQuizzes = (progress.quizHistory || []).filter(q => q.jlptLevel === level);
    const quizCount = levelQuizzes.length;
    const quizAverage = quizCount > 0
      ? Math.round(levelQuizzes.reduce((acc, q) => acc + q.percentage, 0) / quizCount)
      : 0;
    const quizBest = quizCount > 0
      ? Math.max(...levelQuizzes.map(q => q.percentage))
      : 0;

    // Practice statistics for this level
    const levelPractice = (progress.practiceHistory || []).filter(p => p.jlptLevel === level);
    const practiceCount = levelPractice.length;
    const practiceAccuracy = practiceCount > 0
      ? Math.round(levelPractice.reduce((acc, p) => acc + p.percentage, 0) / practiceCount)
      : 0;

    // Last 7 days activity (Mon - Sun / Past 7 days)
    const last7Days = this.generateLast7DaysActivity(progress.dailyActivity || {});

    return {
      level,
      totalItems,
      learnedItems,
      overallPct,
      totalVocab,
      learnedVocab,
      vocabPct,
      totalKanji,
      learnedKanji,
      kanjiPct,
      totalGrammar,
      learnedGrammar,
      grammarPct,
      masteredCount,
      reviewNeededCount,
      learningCount,
      unseenCount,
      weakVocab,
      weakKanji,
      weakGrammar,
      quizCount,
      quizAverage,
      quizBest,
      levelQuizzes: levelQuizzes.slice(0, 10),
      practiceCount,
      practiceAccuracy,
      last7Days
    };
  },

  // Generate 7-day activity sequence with real calendar labels
  generateLast7DaysActivity(daily: Record<string, DailyActivityRecord>) {
    const days = ['Ням', 'Дав', 'Мяг', 'Лха', 'Пүр', 'Баа', 'Бям'];
    const result: { date: string; dayLabel: string; count: number; quizCount: number; isToday: boolean }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const isoKey = d.toISOString().split('T')[0];
      const dayName = days[d.getDay()];
      const rec = daily[isoKey];
      result.push({
        date: isoKey,
        dayLabel: dayName,
        count: rec ? rec.itemCount : 0,
        quizCount: rec ? rec.quizCount : 0,
        isToday: i === 0
      });
    }
    return result;
  }
};
