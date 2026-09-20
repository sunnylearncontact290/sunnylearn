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
  options: string[];
  correctIndex: number;
  explanation: string;
  audioText?: string;
  reading?: string;
  scrambleWords?: string[]; // For sentence reordering
  correctOrder?: string[];
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

// Generate smart distractors
function getDistractors(pool: string[], correct: string, count: number = 3): string[] {
  const filtered = pool.filter(item => item && item.trim() !== '' && item.trim() !== correct.trim());
  const unique = Array.from(new Set(filtered));
  const shuffled = shuffleArray(unique);
  return shuffled.slice(0, count);
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
    isUnlocked: boolean = false
  ): PracticeQuestion[] {
    const { vocab, kanji, grammar, sentences } = this.getLevelContent(data, level, isUnlocked);
    const questions: PracticeQuestion[] = [];
    const usedItemIds = new Set<string>();

    // 1. If specific item IDs are requested (e.g. "Алдсан асуултуудаа давтах")
    if (specificItemIds && specificItemIds.length > 0) {
      const idSet = new Set(specificItemIds);
      const specVocab = vocab.filter(v => idSet.has(v.id));
      const specKanji = kanji.filter(k => idSet.has(k.id));
      const specGrammar = grammar.filter(g => idSet.has(g.id));

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

      return shuffleArray(questions).slice(0, count);
    }

    // 2. Review mode: only items that need review
    if (category === 'review') {
      const records = progress.itemStudyRecords || {};
      const reviewIds = Object.values(records)
        .filter(r => r.jlptLevel === level && (r.masteryStatus === 'review_needed' || r.incorrectCount > 0))
        .map(r => r.itemId);

      if (reviewIds.length > 0) {
        return this.generatePracticeSession(data, level, 'mixed', progress, count, reviewIds);
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

    const prioritizedSentences = shuffleArray([...sentences]);

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
        const q = this.buildSentenceQuestion(item, sentences);
        if (q) questions.push(q);
      }
      // If sentences are few, augment with vocab example sentences
      if (questions.length < count) {
        const vocabWithSentences = prioritizedVocab.filter(v => v.exampleSentence && v.exampleMongolian);
        for (const v of vocabWithSentences) {
          if (questions.length >= count) break;
          const q = this.buildSentenceQuestionFromVocab(v);
          if (q) questions.push(q);
        }
      }
    } else {
      // Mixed: balanced mix of Vocab, Kanji, Grammar, and Sentences
      let vIdx = 0, kIdx = 0, gIdx = 0, sIdx = 0;
      let loop = 0;
      while (questions.length < count && loop < count * 3) {
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
        } else if (targetType === 3) {
          if (prioritizedSentences[sIdx]) {
            const s = prioritizedSentences[sIdx++];
            const q = this.buildSentenceQuestion(s, sentences);
            if (q) questions.push(q);
          } else if (prioritizedVocab[vIdx]) {
            const v = prioritizedVocab[vIdx++];
            if (!usedItemIds.has(v.id)) {
              const q = this.buildVocabQuestion(v, vocab);
              if (q) { questions.push(q); usedItemIds.add(v.id); }
            }
          }
        }
      }
    }

    return questions.slice(0, count);
  },

  // Question Builders
  buildVocabQuestion(item: VocabularyItem, pool: VocabularyItem[]): PracticeQuestion | null {
    if (pool.length < 2) return null;
    const subTypes = ['jp_to_mn', 'mn_to_jp', 'reading'];
    const chosenType = subTypes[Math.floor(Math.random() * subTypes.length)];

    if (chosenType === 'jp_to_mn') {
      const distractors = getDistractors(pool.map(p => p.mongolian), item.mongolian, 3);
      if (distractors.length < 1) return null;
      const options = shuffleArray([item.mongolian, ...distractors]);
      return {
        id: `q-v-jm-${item.id}-${Date.now()}`,
        category: 'vocab',
        subType: 'jp_to_mn',
        itemId: item.id,
        prompt: item.japanese,
        promptSub: item.reading ? `【${item.reading}】` : undefined,
        promptBadge: 'Япон → Монгол утга',
        options,
        correctIndex: options.indexOf(item.mongolian),
        explanation: `${item.japanese} (${item.reading}): ${item.mongolian}. ${item.explanation || ''}`,
        audioText: item.japanese,
        reading: item.reading
      };
    } else if (chosenType === 'mn_to_jp') {
      const distractors = getDistractors(pool.map(p => p.japanese), item.japanese, 3);
      if (distractors.length < 1) return null;
      const options = shuffleArray([item.japanese, ...distractors]);
      return {
        id: `q-v-mj-${item.id}-${Date.now()}`,
        category: 'vocab',
        subType: 'mn_to_jp',
        itemId: item.id,
        prompt: item.mongolian,
        promptSub: item.partOfSpeech ? `(${item.partOfSpeech})` : undefined,
        promptBadge: 'Монгол → Япон үг',
        options,
        correctIndex: options.indexOf(item.japanese),
        explanation: `Зөв хариулт: ${item.japanese}【${item.reading}】 (${item.mongolian}). ${item.explanation || ''}`,
        audioText: item.japanese,
        reading: item.reading
      };
    } else {
      // Reading test
      const distractors = getDistractors(pool.map(p => p.reading), item.reading, 3);
      if (distractors.length < 1) return null;
      const options = shuffleArray([item.reading, ...distractors]);
      return {
        id: `q-v-rd-${item.id}-${Date.now()}`,
        category: 'vocab',
        subType: 'reading',
        itemId: item.id,
        prompt: item.japanese,
        promptSub: `Монгол утга: ${item.mongolian}`,
        promptBadge: 'Уншлага сонгох (Хирагана)',
        options,
        correctIndex: options.indexOf(item.reading),
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
      const options = shuffleArray([item.mongolian, ...distractors]);
      return {
        id: `q-k-mn-${item.id}-${Date.now()}`,
        category: 'kanji',
        subType: 'kanji_meaning',
        itemId: item.id,
        prompt: item.kanji,
        promptSub: `Оньёми: ${item.onyomi} | Күньёми: ${item.kunyomi}`,
        promptBadge: 'Ханзны утга',
        options,
        correctIndex: options.indexOf(item.mongolian),
        explanation: `Ханз ${item.kanji}: ${item.mongolian}. Оньёми: ${item.onyomi}, Күньёми: ${item.kunyomi}.`,
        audioText: item.kanji
      };
    } else if (chosenType === 'kanji_reading') {
      const readPool = pool.map(p => p.onyomi || p.kunyomi).filter(Boolean);
      const targetRead = item.onyomi || item.kunyomi;
      const distractors = getDistractors(readPool, targetRead, 3);
      if (distractors.length < 1) return null;
      const options = shuffleArray([targetRead, ...distractors]);
      return {
        id: `q-k-rd-${item.id}-${Date.now()}`,
        category: 'kanji',
        subType: 'kanji_reading',
        itemId: item.id,
        prompt: item.kanji,
        promptSub: `Монгол утга: ${item.mongolian}`,
        promptBadge: 'Ханзны уншлага',
        options,
        correctIndex: options.indexOf(targetRead),
        explanation: `${item.kanji} ханзны уншлага: ${targetRead}. Монгол утга: ${item.mongolian}.`,
        audioText: item.kanji
      };
    } else {
      // Find the character for the meaning
      const distractors = getDistractors(pool.map(p => p.kanji), item.kanji, 3);
      if (distractors.length < 1) return null;
      const options = shuffleArray([item.kanji, ...distractors]);
      return {
        id: `q-k-ch-${item.id}-${Date.now()}`,
        category: 'kanji',
        subType: 'kanji_char',
        itemId: item.id,
        prompt: item.mongolian,
        promptSub: `Уншлага: ${item.onyomi} / ${item.kunyomi}`,
        promptBadge: 'Тохирох ханзыг сонго',
        options,
        correctIndex: options.indexOf(item.kanji),
        explanation: `Зөв ханз: ${item.kanji} (${item.mongolian})`,
        audioText: item.kanji
      };
    }
  },

  buildGrammarQuestion(item: GrammarItem, pool: GrammarItem[]): PracticeQuestion | null {
    if (pool.length < 2) return null;
    const hasExamples = Array.isArray(item.examples) && item.examples.length > 0;

    if (hasExamples && Math.random() > 0.4) {
      // Fill in the blank with grammar pattern
      const eg = item.examples[0];
      // Create blank in sentence
      let masked = eg.japanese;
      const cleanPat = item.pattern.replace(/〜/g, '').trim();
      if (cleanPat && masked.includes(cleanPat)) {
        masked = masked.replace(cleanPat, '【 _____ 】');
      } else {
        masked = `${masked} (Тохирох дүрэм: _____ )`;
      }
      const distractors = getDistractors(pool.map(p => p.pattern), item.pattern, 3);
      if (distractors.length < 1) return null;
      const options = shuffleArray([item.pattern, ...distractors]);
      return {
        id: `q-g-fb-${item.id}-${Date.now()}`,
        category: 'grammar',
        subType: 'fill_blank',
        itemId: item.id,
        prompt: masked,
        promptSub: `Орчуулга: ${eg.mongolian}`,
        promptBadge: 'Дүрэм нөхөж бичих',
        options,
        correctIndex: options.indexOf(item.pattern),
        explanation: `Бүтэн өгүүлбэр: 「${eg.japanese}」. Дүрэм: ${item.pattern} (${item.mongolian}). ${item.structure || ''}`,
        audioText: eg.japanese
      };
    } else {
      // Grammar pattern -> meaning
      const distractors = getDistractors(pool.map(p => p.mongolian), item.mongolian, 3);
      if (distractors.length < 1) return null;
      const options = shuffleArray([item.mongolian, ...distractors]);
      return {
        id: `q-g-mn-${item.id}-${Date.now()}`,
        category: 'grammar',
        subType: 'grammar_meaning',
        itemId: item.id,
        prompt: item.pattern,
        promptSub: item.structure ? `Бүтэц: ${item.structure}` : undefined,
        promptBadge: 'Дүрмийн утга',
        options,
        correctIndex: options.indexOf(item.mongolian),
        explanation: `Дүрэм ${item.pattern}: ${item.mongolian}. ${item.explanation || ''}`,
        audioText: item.pattern
      };
    }
  },

  buildSentenceQuestion(item: ExampleSentenceItem, pool: ExampleSentenceItem[]): PracticeQuestion | null {
    // Sentence reordering or translation
    const jp = item.japanese;
    const mn = item.mongolian;

    // Word tokens for scramble (split by spaces or punctuation)
    let words = jp.replace(/([。！？、])/g, ' $1 ').trim().split(/\s+/).filter(Boolean);
    if (words.length < 3) {
      // Split into chunks if no spaces
      words = jp.match(/.{1,4}/g) || [jp];
    }

    if (words.length >= 3 && words.length <= 7) {
      const scrambled = shuffleArray([...words]);
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
        explanation: `Зөв өгүүлбэр: 「${jp}」 (${item.reading || ''}) — ${mn}`,
        scrambleWords: scrambled,
        correctOrder: words,
        audioText: jp,
        reading: item.reading
      };
    } else {
      // Multiple choice translation
      const distractors = getDistractors(pool.map(p => p.mongolian), mn, 3);
      if (distractors.length < 1) return null;
      const options = shuffleArray([mn, ...distractors]);
      return {
        id: `q-s-tr-${item.id}-${Date.now()}`,
        category: 'sentence',
        subType: 'sentence_translation',
        itemId: item.id,
        prompt: jp,
        promptSub: item.reading ? `【${item.reading}】` : undefined,
        promptBadge: 'Өгүүлбэрийн орчуулга',
        options,
        correctIndex: options.indexOf(mn),
        explanation: `Өгүүлбэр: ${jp} — ${mn}`,
        audioText: jp,
        reading: item.reading
      };
    }
  },

  buildSentenceQuestionFromVocab(vocab: VocabularyItem): PracticeQuestion | null {
    if (!vocab.exampleSentence || !vocab.exampleMongolian) return null;
    return {
      id: `q-s-v-${vocab.id}-${Date.now()}`,
      category: 'sentence',
      subType: 'sentence_translation',
      itemId: vocab.id,
      prompt: vocab.exampleSentence,
      promptSub: vocab.exampleReading ? `【${vocab.exampleReading}】` : `Үг: ${vocab.japanese} (${vocab.mongolian})`,
      promptBadge: 'Өгүүлбэрийн орчуулга',
      options: shuffleArray([
        vocab.exampleMongolian,
        'Энэ өгүүлбэрийн утга нь буруу байна.',
        'Би маргааш номын сан руу явна.',
        'Өнөөдөр цаг агаар маш сайхан байна.'
      ]),
      correctIndex: 0, // adjusted below
      explanation: `Зөв орчуулга: ${vocab.exampleMongolian}`,
      audioText: vocab.exampleSentence,
      reading: vocab.exampleReading
    };
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
    const questions = this.generatePracticeSession(data, level, practiceCat, progress, questionCount, undefined, isUnlocked);
    // Ensure questions are strictly multiple-choice for Quiz (no open scrambles that require different UI in quiz mode)
    return questions.map(q => {
      if (q.subType === 'sentence_scramble' && q.scrambleWords) {
        // Convert to multiple choice sentence
        const otherOptions = [
          q.correctOrder?.reverse().join('') || 'Буруу дараалал',
          q.scrambleWords.join(''),
          'Тохирохгүй хувилбар'
        ];
        const correctSentence = q.correctOrder?.join('') || q.prompt;
        const options = shuffleArray([correctSentence, ...otherOptions]);
        return {
          ...q,
          subType: 'sentence_choice',
          prompt: `Дараах утгатай өгүүлбэрийг сонгоно уу: "${q.prompt}"`,
          promptSub: undefined,
          options,
          correctIndex: options.indexOf(correctSentence)
        };
      }
      return q;
    });
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
