import { DatabaseSchema, JLPTLevel, LevelCountDetails } from '../types';
import { initialSeedData } from './seedData';

export const FREE_LIMITS = {
  VOCABULARY: 50,
  KANJI: 35,
  GRAMMAR: 20
} as const;

/**
 * Ensures that every item in the database has an explicit accessTier ('FREE' | 'PREMIUM').
 * - N5: ALL items are marked FREE (100% Free)
 * - N4, N3, N2, N1: The first 50 Vocabulary, first 35 Kanji, and first 20 Grammar are marked FREE.
 *   All remaining items are strictly marked PREMIUM.
 */
export function ensureAccessTiers(database: DatabaseSchema): void {
  const levels: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

  // 1. Vocabulary
  if (Array.isArray(database.vocabulary)) {
    levels.forEach(lvl => {
      const items = database.vocabulary.filter(v => v.jlptLevel === lvl);
      if (lvl === 'N5') {
        items.forEach(v => { v.accessTier = 'FREE'; });
      } else {
        items.forEach((v, idx) => {
          v.accessTier = idx < FREE_LIMITS.VOCABULARY ? 'FREE' : 'PREMIUM';
        });
      }
    });
  }

  // 2. Kanji
  if (Array.isArray(database.kanji)) {
    levels.forEach(lvl => {
      const items = database.kanji.filter(k => k.jlptLevel === lvl);
      if (lvl === 'N5') {
        items.forEach(k => { k.accessTier = 'FREE'; });
      } else {
        items.forEach((k, idx) => {
          k.accessTier = idx < FREE_LIMITS.KANJI ? 'FREE' : 'PREMIUM';
        });
      }
    });
  }

  // 3. Grammar
  if (Array.isArray(database.grammar)) {
    levels.forEach(lvl => {
      const items = database.grammar.filter(g => g.jlptLevel === lvl);
      if (lvl === 'N5') {
        items.forEach(g => { g.accessTier = 'FREE'; });
      } else {
        items.forEach((g, idx) => {
          g.accessTier = idx < FREE_LIMITS.GRAMMAR ? 'FREE' : 'PREMIUM';
        });
      }
    });
  }
}

/**
 * Computes exact item counts for each JLPT level, specifying total, accessible (Free), and locked counts.
 */
export function computeLevelCounts(database: DatabaseSchema): Record<JLPTLevel, LevelCountDetails> {
  const levels: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
  const result: any = {};

  levels.forEach(lvl => {
    const vocabs = (database.vocabulary || []).filter(v => v.jlptLevel === lvl);
    const kanjis = (database.kanji || []).filter(k => k.jlptLevel === lvl);
    const grammars = (database.grammar || []).filter(g => g.jlptLevel === lvl);

    const totalVocab = vocabs.length;
    const accessibleVocab = lvl === 'N5' ? totalVocab : vocabs.filter(v => v.accessTier === 'FREE').length;
    const lockedVocab = Math.max(0, totalVocab - accessibleVocab);

    const totalKanji = kanjis.length;
    const accessibleKanji = lvl === 'N5' ? totalKanji : kanjis.filter(k => k.accessTier === 'FREE').length;
    const lockedKanji = Math.max(0, totalKanji - accessibleKanji);

    const totalGrammar = grammars.length;
    const accessibleGrammar = lvl === 'N5' ? totalGrammar : grammars.filter(g => g.accessTier === 'FREE').length;
    const lockedGrammar = Math.max(0, totalGrammar - accessibleGrammar);

    result[lvl] = {
      totalVocab,
      accessibleVocab,
      lockedVocab,
      totalKanji,
      accessibleKanji,
      lockedKanji,
      totalGrammar,
      accessibleGrammar,
      lockedGrammar
    };
  });

  return result;
}

/**
 * Constructs a fail-closed, strictly sanitized Free-tier dataset.
 * Contains ONLY:
 * - N5: All items
 * - N4–N1: ONLY accessTier === 'FREE' items (50 vocab, 35 kanji, 20 grammar per level)
 * - Safe aggregate metadata (counts)
 * The other 562+ records are excluded entirely.
 */
export function buildFreeTierData(database: DatabaseSchema): DatabaseSchema {
  ensureAccessTiers(database);
  const counts = computeLevelCounts(database);

  const allowedVocab = (database.vocabulary || []).filter(
    v => v.jlptLevel === 'N5' || v.accessTier === 'FREE'
  );
  const allowedKanji = (database.kanji || []).filter(
    k => k.jlptLevel === 'N5' || k.accessTier === 'FREE'
  );
  const allowedGrammar = (database.grammar || []).filter(
    g => g.jlptLevel === 'N5' || g.accessTier === 'FREE'
  );
  const allowedSentences = (database.exampleSentences || []).filter(
    s => s.jlptLevel === 'N5' || s.accessTier === 'FREE'
  );
  const allowedLessons = (database.lessons || []).filter(l => l.jlptLevel === 'N5');
  const allowedReading = (database.reading || []).filter(r => r.jlptLevel === 'N5');
  const allowedListening = (database.listening || []).filter(l => l.jlptLevel === 'N5');
  const allowedQuizzes = (database.quizzes || []).filter(q => q.jlptLevel === 'N5');

  return {
    categories: database.categories || [],
    vocabulary: allowedVocab,
    kanji: allowedKanji,
    grammar: allowedGrammar,
    exampleSentences: allowedSentences,
    lessons: allowedLessons,
    reading: allowedReading,
    listening: allowedListening,
    quizzes: allowedQuizzes,
    feedback: [],
    users: [],
    payments: [],
    counts
  };
}

// Pre-initialize access tiers on initial seed data
ensureAccessTiers(initialSeedData);

/**
 * Default fail-closed client-side dataset.
 * Used on app initial load, during network transit, and on offline fallback.
 * Guaranteed to NEVER leak locked Premium content.
 */
export const freeTierSeedData: DatabaseSchema = buildFreeTierData(initialSeedData);
