import {
  JLPTLevel,
  VocabularyItem,
  KanjiItem,
  GrammarItem,
  CurriculumUnit,
  CurriculumLesson,
  CurriculumExercise,
  PathNodeStatus,
  UserProgress,
  ItemStudyRecord
} from '../types';
import {
  CurriculumTopic,
  getTopicsForLevel,
  getOrderedItemsForTopic,
  classifyVocabItem
} from './curriculumTopics';
import {
  getDistractors,
  assembleOptions,
  shuffleArray,
  learningEngine
} from '../services/learningEngine';

// ============================================================================
// PEDAGOGICAL STREAM BUILDERS (100% COVERAGE, ZERO DROPS, ZERO DUPLICATES)
// ============================================================================

interface OrderedVocabEntry {
  item: VocabularyItem;
  topic: CurriculumTopic | null;
}

interface OrderedKanjiEntry {
  item: KanjiItem;
  topic: CurriculumTopic | null;
}

function buildOrderedVocabStream(
  level: JLPTLevel,
  levelVocab: VocabularyItem[]
): OrderedVocabEntry[] {
  const topics = getTopicsForLevel(level, 'vocab', levelVocab);
  const seen = new Set<string>();
  const stream: OrderedVocabEntry[] = [];

  for (const topic of topics) {
    const items = getOrderedItemsForTopic(topic, levelVocab);
    for (const item of items) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        stream.push({ item, topic });
      }
    }
  }

  // Safety sweep for any custom/admin/unmapped items
  for (const item of levelVocab) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      const fallbackTopicId = classifyVocabItem(item);
      const matchedTopic = topics.find(t => t.id === fallbackTopicId) || null;
      stream.push({ item, topic: matchedTopic });
    }
  }

  return stream;
}

function buildOrderedKanjiStream(
  level: JLPTLevel,
  levelKanji: KanjiItem[]
): OrderedKanjiEntry[] {
  const topics = getTopicsForLevel(level, 'kanji', levelKanji);
  const seen = new Set<string>();
  const stream: OrderedKanjiEntry[] = [];

  for (const topic of topics) {
    const items = getOrderedItemsForTopic(topic, levelKanji);
    for (const item of items) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        stream.push({ item, topic });
      }
    }
  }

  // Safety sweep for any remaining kanji
  for (const item of levelKanji) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      stream.push({ item, topic: null });
    }
  }

  return stream;
}

function toRomanSuffix(num: number): string {
  const numerals = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI'];
  return numerals[num] || String(num);
}

// ============================================================================
// SCALED CURRICULUM GENERATOR ACROSS JLPT N5 – N1
// ============================================================================

const TARGET_VOCAB_PER_LESSON: Record<JLPTLevel, number> = {
  N5: 7,
  N4: 7,
  N3: 8,
  N2: 8,
  N1: 8
};

const TEACHING_LESSONS_PER_UNIT: Record<JLPTLevel, number> = {
  N5: 7,
  N4: 7,
  N3: 8,
  N2: 8,
  N1: 8
};

const LEVEL_DEFAULT_THEME: Record<JLPTLevel, string> = {
  N5: '#CC0000',
  N4: '#E11D48',
  N3: '#B91C1C',
  N2: '#990000',
  N1: '#7F1D1D'
};

export function generateCurriculumForLevel(
  level: JLPTLevel,
  allVocab: VocabularyItem[],
  allKanji: KanjiItem[],
  allGrammar: GrammarItem[]
): CurriculumUnit[] {
  // Deduplicate level items preserving original seed/admin order
  const levelVocab: VocabularyItem[] = [];
  const vSeen = new Set<string>();
  for (const v of allVocab) {
    if (v.jlptLevel === level && !vSeen.has(v.id)) {
      vSeen.add(v.id);
      levelVocab.push(v);
    }
  }

  const levelKanji: KanjiItem[] = [];
  const kSeen = new Set<string>();
  for (const k of allKanji) {
    if (k.jlptLevel === level && !kSeen.has(k.id)) {
      kSeen.add(k.id);
      levelKanji.push(k);
    }
  }

  const levelGrammar: GrammarItem[] = [];
  const gSeen = new Set<string>();
  for (const g of allGrammar) {
    if (g.jlptLevel === level && !gSeen.has(g.id)) {
      gSeen.add(g.id);
      levelGrammar.push(g);
    }
  }

  if (levelVocab.length === 0 && levelKanji.length === 0 && levelGrammar.length === 0) {
    return [];
  }

  const orderedVocab = buildOrderedVocabStream(level, levelVocab);
  const orderedKanji = buildOrderedKanjiStream(level, levelKanji);
  const orderedGrammar = levelGrammar;

  const targetVocabPerLesson = TARGET_VOCAB_PER_LESSON[level] || 7;
  const lessonsPerUnitTarget = TEACHING_LESSONS_PER_UNIT[level] || 7;

  // Total achievable teaching lessons scales directly with dataset size
  const totalTeachingLessons = Math.max(
    1,
    Math.ceil(orderedVocab.length / targetVocabPerLesson),
    Math.ceil(orderedKanji.length / 8),
    Math.ceil(orderedGrammar.length / 4)
  );

  // Build exact contiguous partitions covering 100% of Vocab, Kanji, Grammar
  interface TeachingBucket {
    vocabEntries: OrderedVocabEntry[];
    kanjiEntries: OrderedKanjiEntry[];
    grammarItems: GrammarItem[];
  }

  const buckets: TeachingBucket[] = [];
  for (let i = 0; i < totalTeachingLessons; i++) {
    const vStart = Math.floor((i * orderedVocab.length) / totalTeachingLessons);
    const vEnd = Math.floor(((i + 1) * orderedVocab.length) / totalTeachingLessons);

    const kStart = Math.floor((i * orderedKanji.length) / totalTeachingLessons);
    const kEnd = Math.floor(((i + 1) * orderedKanji.length) / totalTeachingLessons);

    const gStart = Math.floor((i * orderedGrammar.length) / totalTeachingLessons);
    const gEnd = Math.floor(((i + 1) * orderedGrammar.length) / totalTeachingLessons);

    buckets.push({
      vocabEntries: orderedVocab.slice(vStart, vEnd),
      kanjiEntries: orderedKanji.slice(kStart, kEnd),
      grammarItems: orderedGrammar.slice(gStart, gEnd)
    });
  }

  // Group teaching buckets into digestible Units (7-8 teaching lessons + 1 review + 1 checkpoint)
  const totalUnits = Math.max(1, Math.ceil(totalTeachingLessons / lessonsPerUnitTarget));
  const units: CurriculumUnit[] = [];
  const topicUsageCounter = new Map<string, number>();

  for (let uIdx = 0; uIdx < totalUnits; uIdx++) {
    const unitNumber = uIdx + 1;
    const unitId = `unit-${level.toLowerCase()}-${unitNumber}`;
    const bStart = Math.floor((uIdx * buckets.length) / totalUnits);
    const bEnd = Math.floor(((uIdx + 1) * buckets.length) / totalUnits);
    const unitBuckets = buckets.slice(bStart, bEnd);

    if (unitBuckets.length === 0) continue;

    // Determine dominant semantic topic for the unit header
    const topicCounts = new Map<string, { topic: CurriculumTopic; count: number }>();
    for (const b of unitBuckets) {
      for (const ve of b.vocabEntries) {
        if (ve.topic) {
          const existing = topicCounts.get(ve.topic.id);
          if (existing) {
            existing.count++;
          } else {
            topicCounts.set(ve.topic.id, { topic: ve.topic, count: 1 });
          }
        }
      }
    }

    let dominantTopic: CurriculumTopic | null = null;
    let bestScore = -1;
    for (const entry of topicCounts.values()) {
      // Prefer specific semantic topics over generic review catch-all when others are sizeable
      const score = entry.topic.isFlaggedForReview ? entry.count * 0.65 : entry.count;
      if (score > bestScore) {
        bestScore = score;
        dominantTopic = entry.topic;
      }
    }

    // Track repeated topic headings across multiple consecutive units so titles feel distinct
    const rawBaseTitle = dominantTopic?.titleMongolian || `JLPT ${level} Цогц хөтөлбөр`;
    const prevCount = topicUsageCounter.get(rawBaseTitle) || 0;
    const occurrence = prevCount + 1;
    topicUsageCounter.set(rawBaseTitle, occurrence);

    // Collect kanji topics if fallback vocab topic was used for clearer labeling
    let unitTitle = rawBaseTitle;
    if (occurrence > 1) {
      unitTitle = `${rawBaseTitle} (${toRomanSuffix(occurrence)})`;
    }

    const unitVocabIds: string[] = [];
    const unitKanjiIds: string[] = [];
    const unitGrammarIds: string[] = [];

    for (const b of unitBuckets) {
      b.vocabEntries.forEach(e => unitVocabIds.push(e.item.id));
      b.kanjiEntries.forEach(e => unitKanjiIds.push(e.item.id));
      b.grammarItems.forEach(g => unitGrammarIds.push(g.id));
    }

    // Build lessons inside this Unit:
    // Lessons 1..mid -> Mid-Unit Review -> Lessons mid+1..end -> Unit Checkpoint
    const lessons: CurriculumLesson[] = [];
    const midIndex = unitBuckets.length >= 4 ? Math.ceil(unitBuckets.length / 2) : -1;
    const firstHalfVocabIds: string[] = [];
    const firstHalfKanjiIds: string[] = [];
    const firstHalfGrammarIds: string[] = [];

    let nodeNumber = 1;

    unitBuckets.forEach((b, bIdx) => {
      const vIds = b.vocabEntries.map(e => e.item.id);
      const kIds = b.kanjiEntries.map(e => e.item.id);
      const gIds = b.grammarItems.map(g => g.id);

      if (midIndex === -1 || bIdx < midIndex) {
        firstHalfVocabIds.push(...vIds);
        firstHalfKanjiIds.push(...kIds);
        firstHalfGrammarIds.push(...gIds);
      }

      // Compute lesson focus and concise description
      const focusParts: string[] = [];
      if (vIds.length > 0) focusParts.push(`${vIds.length} үг`);
      if (kIds.length > 0) focusParts.push(`${kIds.length} ханз`);
      if (gIds.length > 0) focusParts.push(`${gIds.length} дүрэм`);

      let lessonFocus: CurriculumLesson['lessonFocus'] = 'vocab';
      if (kIds.length > 0 && gIds.length > 0) lessonFocus = 'mixed';
      else if (kIds.length > 0) lessonFocus = 'vocab_kanji';
      else if (gIds.length > 0) lessonFocus = 'vocab_grammar';

      const sampleWords = b.vocabEntries
        .slice(0, 3)
        .map(e => e.item.japanese)
        .join(' · ');

      const lessonNumInUnit = bIdx + 1;
      const estimatedExercises = Math.min(10, Math.max(6, Math.min(4, vIds.length) + kIds.length + gIds.length + 3));

      lessons.push({
        id: `${unitId}-l${lessonNumInUnit}`,
        unitId,
        unitNumber,
        lessonNumber: nodeNumber++,
        title: `Хичээл ${lessonNumInUnit}: ${rawBaseTitle}`,
        description: sampleWords
          ? `${sampleWords} — ${focusParts.join(', ')} ба идэвхтэй дасгал`
          : `${focusParts.join(', ')} ба идэвхтэй дасгал`,
        type: 'lesson',
        lessonFocus,
        jlptLevel: level,
        vocabIds: vIds,
        kanjiIds: kIds,
        grammarIds: gIds,
        xpReward: 15,
        totalExercises: estimatedExercises,
        estimatedMinutes: Math.max(4, Math.min(8, Math.round(estimatedExercises * 0.7)))
      });

      // Insert Mid-Unit Review after first half
      if (midIndex !== -1 && bIdx === midIndex - 1) {
        lessons.push({
          id: `${unitId}-review`,
          unitId,
          unitNumber,
          lessonNumber: nodeNumber++,
          title: `${unitTitle} — Дунд давтлага`,
          description: `Эхний хэсэгт үзсэн ${firstHalfVocabIds.length} үг, ханз, дүрмийг бататгах давтлага`,
          type: 'review',
          lessonFocus: 'review',
          jlptLevel: level,
          vocabIds: [...firstHalfVocabIds],
          kanjiIds: [...firstHalfKanjiIds],
          grammarIds: [...firstHalfGrammarIds],
          xpReward: 20,
          totalExercises: 8,
          estimatedMinutes: 5
        });
      }
    });

    // End-of-Unit Checkpoint (Boss Challenge)
    lessons.push({
      id: `${unitId}-challenge`,
      unitId,
      unitNumber,
      lessonNumber: nodeNumber++,
      title: `${unitTitle} — Бүлгийн Сорил`,
      description: `Бүлгийн ${unitVocabIds.length} үг, ${unitKanjiIds.length} ханз, ${unitGrammarIds.length} дүрмийг шалгах нэгдсэн сорил`,
      type: 'boss_challenge',
      lessonFocus: 'checkpoint',
      jlptLevel: level,
      vocabIds: unitVocabIds,
      kanjiIds: unitKanjiIds,
      grammarIds: unitGrammarIds,
      xpReward: 30,
      totalExercises: 10,
      estimatedMinutes: 7
    });

    const summaryStats = [
      unitVocabIds.length > 0 ? `${unitVocabIds.length} үг` : null,
      unitKanjiIds.length > 0 ? `${unitKanjiIds.length} ханз` : null,
      unitGrammarIds.length > 0 ? `${unitGrammarIds.length} дүрэм` : null
    ]
      .filter(Boolean)
      .join(' · ');

    units.push({
      id: unitId,
      unitNumber,
      title: unitTitle,
      japaneseTitle: dominantTopic?.titleJapanese,
      mongolianDescription: dominantTopic?.descriptionMongolian
        ? `${dominantTopic.descriptionMongolian} (${summaryStats})`
        : summaryStats,
      jlptLevel: level,
      themeColor: dominantTopic?.themeColor || LEVEL_DEFAULT_THEME[level] || '#CC0000',
      iconName: dominantTopic?.iconName || 'BookOpen',
      vocabCount: unitVocabIds.length,
      kanjiCount: unitKanjiIds.length,
      grammarCount: unitGrammarIds.length,
      lessons
    });
  }

  return units;
}

// ============================================================================
// COVERAGE AUDITOR FOR AUTOMATED & RUNTIME VERIFICATION
// ============================================================================

export interface CurriculumCoverageAudit {
  level: JLPTLevel;
  expectedVocabCount: number;
  usedVocabCount: number;
  duplicateVocabCount: number;
  expectedKanjiCount: number;
  usedKanjiCount: number;
  duplicateKanjiCount: number;
  expectedGrammarCount: number;
  usedGrammarCount: number;
  duplicateGrammarCount: number;
  unitCount: number;
  teachingLessonCount: number;
  totalNodeCount: number;
  isComplete: boolean;
}

export function auditCurriculumCoverage(
  level: JLPTLevel,
  allVocab: VocabularyItem[],
  allKanji: KanjiItem[],
  allGrammar: GrammarItem[],
  units?: CurriculumUnit[]
): CurriculumCoverageAudit {
  const builtUnits = units || generateCurriculumForLevel(level, allVocab, allKanji, allGrammar);
  const expectedVocabIds = new Set(allVocab.filter(v => v.jlptLevel === level).map(v => v.id));
  const expectedKanjiIds = new Set(allKanji.filter(k => k.jlptLevel === level).map(k => k.id));
  const expectedGrammarIds = new Set(allGrammar.filter(g => g.jlptLevel === level).map(g => g.id));

  const usedVocab = new Set<string>();
  const usedKanji = new Set<string>();
  const usedGrammar = new Set<string>();
  let dupV = 0;
  let dupK = 0;
  let dupG = 0;
  let teachingLessonCount = 0;
  let totalNodeCount = 0;

  for (const u of builtUnits) {
    for (const l of u.lessons) {
      totalNodeCount++;
      if (l.type === 'lesson') {
        teachingLessonCount++;
        for (const id of l.vocabIds) {
          if (usedVocab.has(id)) dupV++;
          usedVocab.add(id);
        }
        for (const id of l.kanjiIds) {
          if (usedKanji.has(id)) dupK++;
          usedKanji.add(id);
        }
        for (const id of l.grammarIds) {
          if (usedGrammar.has(id)) dupG++;
          usedGrammar.add(id);
        }
      }
    }
  }

  const isComplete =
    usedVocab.size === expectedVocabIds.size &&
    usedKanji.size === expectedKanjiIds.size &&
    usedGrammar.size === expectedGrammarIds.size &&
    dupV === 0 &&
    dupK === 0 &&
    dupG === 0;

  return {
    level,
    expectedVocabCount: expectedVocabIds.size,
    usedVocabCount: usedVocab.size,
    duplicateVocabCount: dupV,
    expectedKanjiCount: expectedKanjiIds.size,
    usedKanjiCount: usedKanji.size,
    duplicateKanjiCount: dupK,
    expectedGrammarCount: expectedGrammarIds.size,
    usedGrammarCount: usedGrammar.size,
    duplicateGrammarCount: dupG,
    unitCount: builtUnits.length,
    teachingLessonCount,
    totalNodeCount,
    isComplete
  };
}

// ============================================================================
// FAST O(N) LESSON & UNIT PATH STATE ENGINE
// ============================================================================

export interface UnitPathStats {
  completedCount: number;
  totalCount: number;
  isCompleted: boolean;
  hasActive: boolean;
  progressPercent: number;
}

export interface LevelPathState {
  lessonStatusMap: Record<string, PathNodeStatus>;
  unitStatsMap: Record<string, UnitPathStats>;
  nextActiveLesson: CurriculumLesson | null;
  nextActiveUnit: CurriculumUnit | null;
  completedCount: number;
  totalCount: number;
  progressPercent: number;
}

function isLessonCompletedByItems(
  lesson: CurriculumLesson,
  completedSet: Set<string>,
  learnedVocabSet: Set<string>,
  learnedKanjiSet: Set<string>,
  learnedGrammarSet: Set<string>
): boolean {
  if (completedSet.has(lesson.id)) {
    return true;
  }

  // Only teaching lessons auto-complete from independent dictionary/flashcard study (>= 75% of lesson items learned)
  if (lesson.type === 'lesson') {
    const totalItems = lesson.vocabIds.length + lesson.kanjiIds.length + lesson.grammarIds.length;
    if (totalItems > 0) {
      let learnedCount = 0;
      for (const id of lesson.vocabIds) if (learnedVocabSet.has(id)) learnedCount++;
      for (const id of lesson.kanjiIds) if (learnedKanjiSet.has(id)) learnedCount++;
      for (const id of lesson.grammarIds) if (learnedGrammarSet.has(id)) learnedCount++;

      if (learnedCount >= Math.ceil(totalItems * 0.75)) {
        return true;
      }
    }
  }

  return false;
}

export function computeLevelPathState(
  units: CurriculumUnit[],
  userProgress: Pick<
    UserProgress,
    'completedLessonIds' | 'learnedVocabIds' | 'learnedKanjiIds' | 'learnedGrammarIds'
  >
): LevelPathState {
  const completedSet = new Set(userProgress.completedLessonIds || []);
  const learnedVocabSet = new Set(userProgress.learnedVocabIds || []);
  const learnedKanjiSet = new Set(userProgress.learnedKanjiIds || []);
  const learnedGrammarSet = new Set(userProgress.learnedGrammarIds || []);

  const lessonStatusMap: Record<string, PathNodeStatus> = {};
  const unitStatsMap: Record<string, UnitPathStats> = {};

  let nextActiveLesson: CurriculumLesson | null = null;
  let nextActiveUnit: CurriculumUnit | null = null;
  let totalCount = 0;
  let completedCount = 0;

  // Determine linear completion & guarantee the very first uncompleted node is always 'active'
  let foundCurrentActive = false;

  for (const unit of units) {
    let unitCompleted = 0;
    let unitHasActive = false;

    for (const lesson of unit.lessons) {
      totalCount++;
      const done = isLessonCompletedByItems(
        lesson,
        completedSet,
        learnedVocabSet,
        learnedKanjiSet,
        learnedGrammarSet
      );

      let status: PathNodeStatus;
      if (done) {
        status = 'completed';
        completedCount++;
        unitCompleted++;
      } else if (!foundCurrentActive) {
        status = 'active';
        foundCurrentActive = true;
        unitHasActive = true;
        nextActiveLesson = lesson;
        nextActiveUnit = unit;
      } else {
        status = 'locked';
      }

      lessonStatusMap[lesson.id] = status;
    }

    const unitTotal = unit.lessons.length;
    unitStatsMap[unit.id] = {
      completedCount: unitCompleted,
      totalCount: unitTotal,
      isCompleted: unitTotal > 0 && unitCompleted >= unitTotal,
      hasActive: unitHasActive,
      progressPercent: unitTotal > 0 ? Math.min(100, Math.round((unitCompleted / unitTotal) * 100)) : 0
    };
  }

  // If 100% completed in this level, fallback nextActiveLesson to the final checkpoint for replay
  if (!nextActiveLesson && units.length > 0) {
    const lastUnit = units[units.length - 1];
    nextActiveUnit = lastUnit;
    nextActiveLesson = lastUnit.lessons[lastUnit.lessons.length - 1] || null;
  }

  const progressPercent = totalCount > 0 ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0;

  return {
    lessonStatusMap,
    unitStatsMap,
    nextActiveLesson,
    nextActiveUnit,
    completedCount,
    totalCount,
    progressPercent
  };
}

/**
 * Backwards-compatible single-node status helper.
 */
export function calculateLessonStatus(
  lesson: CurriculumLesson,
  learnedVocabIds: string[] = [],
  learnedKanjiIds: string[] = [],
  completedLessonIds: string[] = [],
  isFirstLesson: boolean = false,
  previousLessonStatus?: PathNodeStatus,
  learnedGrammarIds: string[] = []
): PathNodeStatus {
  const done = isLessonCompletedByItems(
    lesson,
    new Set(completedLessonIds),
    new Set(learnedVocabIds),
    new Set(learnedKanjiIds),
    new Set(learnedGrammarIds)
  );
  if (done) return 'completed';
  if (isFirstLesson || previousLessonStatus === 'completed') return 'active';
  return 'locked';
}

// ============================================================================
// SENTENCE SEGMENTATION & REAL EXERCISE GENERATION (VOCAB + KANJI + GRAMMAR)
// ============================================================================

function tokenizeSentenceForScramble(sentence: string): string[] {
  const trimmed = sentence.trim().replace(/[。．\.!！?？]+$/, '');
  if (!trimmed) return [];

  // Split by whitespace first if pre-spaced, otherwise split around common particles & auxiliaries
  let parts: string[];
  if (/\s+/.test(trimmed)) {
    parts = trimmed.split(/\s+/).filter(Boolean);
  } else {
    parts = trimmed
      .split(/(は|が|を|に|で|へ|と|も|から|まで|より|ので|のに|けど|て|です|ます|でした|ました|ません|ください)/)
      .filter(p => p.trim().length > 0);
  }

  // Merge tiny trailing 1-char particles onto the preceding chunk if too many pieces (> 6)
  while (parts.length > 6) {
    let shortestIdx = 1;
    for (let i = 1; i < parts.length; i++) {
      if (parts[i].length < parts[shortestIdx].length) {
        shortestIdx = i;
      }
    }
    parts[shortestIdx - 1] = `${parts[shortestIdx - 1]}${parts[shortestIdx]}`;
    parts.splice(shortestIdx, 1);
  }

  return parts;
}

function buildSentenceScrambleExercise(
  id: string,
  japanese: string,
  mongolian: string,
  reading: string | undefined,
  itemId: string,
  itemType: 'vocab' | 'grammar'
): CurriculumExercise | null {
  if (!japanese || !mongolian) return null;

  let cleanJp = japanese.trim();
  let cleanMn = mongolian.trim();

  // Support legacy "日本語 (Монгол)" combined field if mongolian not passed cleanly
  const inlineMatch = cleanJp.match(/^([^\(（]+)[\(（]([^\)）]+)[\)）]/);
  if (inlineMatch) {
    cleanJp = inlineMatch[1].trim();
    cleanMn = inlineMatch[2].trim();
  }

  const chunks = tokenizeSentenceForScramble(cleanJp);
  if (chunks.length < 3 || chunks.length > 6) return null;

  const tiles = chunks.map((text, i) => ({ id: `tile-${id}-${i}`, text }));
  let scrambled = shuffleArray(tiles);
  if (scrambled.map(t => t.text).join('') === tiles.map(t => t.text).join('') && tiles.length >= 2) {
    [scrambled[0], scrambled[1]] = [scrambled[1], scrambled[0]];
  }

  return {
    id,
    type: 'sentence_scramble',
    prompt: 'Өгүүлбэрийг зөв дарааллаар эвлүүлнэ үү',
    targetJapanese: cleanJp,
    targetReading: reading,
    targetMongolian: cleanMn,
    itemId,
    itemType,
    correctAnswer: cleanJp.replace(/[。．\.!！?？\s]+/g, ''),
    wordTiles: scrambled,
    explanation: `Зөв өгүүлбэр: ${cleanJp} — ${cleanMn}`
  };
}

function getReviewPriorityScore(
  itemId: string,
  studyRecords: Record<string, ItemStudyRecord> = {}
): number {
  const rec = studyRecords[itemId];
  if (!rec) return 50;
  if (rec.masteryStatus === 'review_needed' || rec.incorrectCount > rec.correctCount) return 100;
  if (rec.masteryStatus === 'learning') return 70;
  return 20;
}

export function generateExercisesForLesson(
  lesson: CurriculumLesson,
  allVocab: VocabularyItem[],
  allKanji: KanjiItem[],
  allGrammar: GrammarItem[],
  itemStudyRecords: Record<string, ItemStudyRecord> = {}
): CurriculumExercise[] {
  const exercises: CurriculumExercise[] = [];

  const vocabIdSet = new Set(lesson.vocabIds);
  const kanjiIdSet = new Set(lesson.kanjiIds);
  const grammarIdSet = new Set(lesson.grammarIds);

  let lessonVocab = allVocab.filter(v => vocabIdSet.has(v.id));
  let lessonKanji = allKanji.filter(k => kanjiIdSet.has(k.id));
  let lessonGrammar = allGrammar.filter(g => grammarIdSet.has(g.id));

  const levelVocab = allVocab.filter(v => v.jlptLevel === lesson.jlptLevel);
  const levelKanji = allKanji.filter(k => k.jlptLevel === lesson.jlptLevel);
  const levelGrammar = allGrammar.filter(g => g.jlptLevel === lesson.jlptLevel);

  const poolVocab = levelVocab.length >= 4 ? levelVocab : allVocab;
  const poolKanji = levelKanji.length >= 4 ? levelKanji : allKanji;
  const poolGrammar = levelGrammar.length >= 4 ? levelGrammar : allGrammar;

  const isReviewOrChallenge = lesson.type === 'review' || lesson.type === 'boss_challenge';

  if (isReviewOrChallenge) {
    // Prioritize items with errors or weak SRS records first, then mix
    lessonVocab = [...lessonVocab].sort(
      (a, b) => getReviewPriorityScore(b.id, itemStudyRecords) - getReviewPriorityScore(a.id, itemStudyRecords)
    );
    lessonKanji = [...lessonKanji].sort(
      (a, b) => getReviewPriorityScore(b.id, itemStudyRecords) - getReviewPriorityScore(a.id, itemStudyRecords)
    );
    lessonGrammar = [...lessonGrammar].sort(
      (a, b) => getReviewPriorityScore(b.id, itemStudyRecords) - getReviewPriorityScore(a.id, itemStudyRecords)
    );

    // Build focused active recall session (up to totalExercises)
    const targetCount = lesson.totalExercises || (lesson.type === 'boss_challenge' ? 10 : 8);
    let vIdx = 0;
    let kIdx = 0;
    let gIdx = 0;
    let scrambleAdded = false;
    let guard = 0;

    while (exercises.length < targetCount && guard < 40) {
      guard++;
      const slot = guard % 4;

      if (slot === 0 && lessonVocab[vIdx]) {
        const vocab = lessonVocab[vIdx++];
        const distractors = getDistractors(poolVocab.map(p => p.mongolian), vocab.mongolian, 3);
        if (distractors.length >= 1) {
          const { options } = assembleOptions(vocab.mongolian, distractors);
          exercises.push({
            id: `ex-${lesson.id}-rv-v-${vocab.id}`,
            type: 'multiple_choice',
            prompt: 'Үгийн зөв монгол утгыг сонгоно уу',
            targetJapanese: vocab.japanese,
            targetReading: vocab.reading,
            targetMongolian: vocab.mongolian,
            itemId: vocab.id,
            itemType: 'vocab',
            options,
            correctAnswer: vocab.mongolian,
            explanation: `「${vocab.japanese}」${vocab.reading ? `(${vocab.reading})` : ''} — ${vocab.mongolian}`
          });
        }
      } else if (slot === 1 && lessonKanji[kIdx]) {
        const kanji = lessonKanji[kIdx++];
        const distractors = getDistractors(poolKanji.map(p => p.mongolian), kanji.mongolian, 3);
        if (distractors.length >= 1) {
          const { options } = assembleOptions(kanji.mongolian, distractors);
          exercises.push({
            id: `ex-${lesson.id}-rv-k-${kanji.id}`,
            type: 'multiple_choice',
            prompt: 'Энэ ханзны зөв утгыг сонгоно уу',
            targetJapanese: kanji.kanji,
            targetReading: kanji.onyomi || kanji.kunyomi || '',
            targetMongolian: kanji.mongolian,
            itemId: kanji.id,
            itemType: 'kanji',
            onyomi: kanji.onyomi,
            kunyomi: kanji.kunyomi,
            options,
            correctAnswer: kanji.mongolian,
            explanation: `「${kanji.kanji}」ханз — ${kanji.mongolian}`
          });
        }
      } else if (slot === 2 && lessonGrammar[gIdx]) {
        const grammar = lessonGrammar[gIdx++];
        const gq = learningEngine.buildGrammarQuestion(grammar, poolGrammar);
        if (gq && gq.options.length >= 2) {
          exercises.push({
            id: `ex-${lesson.id}-rv-g-${grammar.id}`,
            type: 'multiple_choice',
            prompt: gq.promptInstruction || 'Зөв дүрмийн утгыг сонгоно уу',
            targetJapanese: gq.prompt,
            targetReading: gq.reading,
            targetMongolian: grammar.mongolian,
            itemId: grammar.id,
            itemType: 'grammar',
            structure: grammar.structure,
            options: gq.options,
            correctAnswer: gq.options[gq.correctIndex],
            explanation: gq.explanation
          });
        }
      } else if (slot === 3 && !scrambleAdded) {
        const candidateVocab = lessonVocab.find(v => v.exampleSentence && v.exampleMongolian);
        if (candidateVocab && candidateVocab.exampleSentence && candidateVocab.exampleMongolian) {
          const scramble = buildSentenceScrambleExercise(
            `ex-${lesson.id}-rv-scr-${candidateVocab.id}`,
            candidateVocab.exampleSentence,
            candidateVocab.exampleMongolian,
            candidateVocab.exampleReading,
            candidateVocab.id,
            'vocab'
          );
          if (scramble) {
            exercises.push(scramble);
            scrambleAdded = true;
          }
        }
      } else if (lessonVocab[vIdx]) {
        // Fallback fill with remaining vocab questions if kanji/grammar exhausted
        const vocab = lessonVocab[vIdx++];
        const distractors = getDistractors(poolVocab.map(p => p.mongolian), vocab.mongolian, 3);
        if (distractors.length >= 1) {
          const { options } = assembleOptions(vocab.mongolian, distractors);
          exercises.push({
            id: `ex-${lesson.id}-rv-vf-${vocab.id}`,
            type: 'multiple_choice',
            prompt: 'Үгийн зөв монгол утгыг сонгоно уу',
            targetJapanese: vocab.japanese,
            targetReading: vocab.reading,
            targetMongolian: vocab.mongolian,
            itemId: vocab.id,
            itemType: 'vocab',
            options,
            correctAnswer: vocab.mongolian,
            explanation: `「${vocab.japanese}」${vocab.reading ? `(${vocab.reading})` : ''} — ${vocab.mongolian}`
          });
        }
      }
    }

    return exercises.slice(0, targetCount);
  }

  // ==========================================================================
  // STANDARD TEACHING LESSON: TEACH -> TEST VOCAB / KANJI / GRAMMAR -> APPLY
  // Balanced 6-10 exercise session (~5-8 mins) preserving all domains
  // ==========================================================================

  // Budget allocation inside max 10 exercises
  const hasKanji = lessonKanji.length > 0;
  const hasGrammar = lessonGrammar.length > 0;
  const hasScrambleCandidate =
    lessonVocab.some(v => Boolean(v.exampleSentence)) ||
    lessonGrammar.some(g => Boolean(g.examples?.some(e => e.japanese && e.mongolian)));

  const reservedForGrammar = hasGrammar ? 2 : 0; // 1 intro + 1 mc
  const reservedForKanji = hasKanji ? 2 : 0; // 1 intro + 1 mc
  const reservedForScramble = hasScrambleCandidate ? 1 : 0;
  const remainingBudget = Math.max(4, 10 - reservedForGrammar - reservedForKanji - reservedForScramble);

  const vocabIntroLimit = Math.min(lessonVocab.length, hasKanji && hasGrammar ? 2 : 3);
  const vocabMcLimit = Math.max(1, remainingBudget - vocabIntroLimit);

  // 1. Teach key vocabulary items (2-3 intro cards)
  lessonVocab.slice(0, vocabIntroLimit).forEach((vocab, idx) => {
    exercises.push({
      id: `ex-${lesson.id}-v-intro-${idx}`,
      type: 'vocab_intro',
      prompt: 'Шинэ үгтэй танилцаарай',
      targetJapanese: vocab.japanese,
      targetReading: vocab.reading,
      targetMongolian: vocab.mongolian,
      itemId: vocab.id,
      itemType: 'vocab',
      exampleJapanese: vocab.exampleSentence,
      exampleReading: vocab.exampleReading,
      exampleMongolian: vocab.exampleMongolian,
      correctAnswer: vocab.mongolian,
      explanation: vocab.explanation || `Үгийн аймаг: ${vocab.partOfSpeech}`
    });
  });

  // 2. Teach key Kanji if assigned (1 intro card)
  if (hasKanji) {
    const primaryKanji = lessonKanji[0];
    const exWord = primaryKanji.exampleWords?.[0];
    exercises.push({
      id: `ex-${lesson.id}-k-intro-0`,
      type: 'kanji_intro',
      prompt: 'Шинэ ханзтай танилцаарай',
      targetJapanese: primaryKanji.kanji,
      targetReading: primaryKanji.onyomi || primaryKanji.kunyomi || '',
      targetMongolian: primaryKanji.mongolian,
      itemId: primaryKanji.id,
      itemType: 'kanji',
      onyomi: primaryKanji.onyomi,
      kunyomi: primaryKanji.kunyomi,
      exampleJapanese: exWord?.word,
      exampleReading: exWord?.reading,
      exampleMongolian: exWord?.mongolian,
      correctAnswer: primaryKanji.mongolian,
      explanation: `Оньёми: ${primaryKanji.onyomi || '—'} · Күньёми: ${primaryKanji.kunyomi || '—'}`
    });
  }

  // 3. Teach key Grammar if assigned (1 intro card)
  if (hasGrammar) {
    const primaryGrammar = lessonGrammar[0];
    const ex = primaryGrammar.examples?.[0];
    exercises.push({
      id: `ex-${lesson.id}-g-intro-0`,
      type: 'grammar_intro',
      prompt: 'Дүрмийн бүтэцтэй танилцаарай',
      targetJapanese: primaryGrammar.pattern,
      targetMongolian: primaryGrammar.mongolian,
      itemId: primaryGrammar.id,
      itemType: 'grammar',
      structure: primaryGrammar.structure,
      exampleJapanese: ex?.japanese,
      exampleReading: ex?.reading,
      exampleMongolian: ex?.mongolian,
      correctAnswer: primaryGrammar.mongolian,
      explanation: primaryGrammar.explanation
    });
  }

  // 4. Active Recall: Vocabulary Multiple Choice (mix new + remaining lesson vocab)
  const mcVocabPool =
    lessonVocab.length > vocabIntroLimit
      ? [...lessonVocab.slice(vocabIntroLimit), ...lessonVocab.slice(0, vocabIntroLimit)]
      : lessonVocab;
  mcVocabPool.slice(0, vocabMcLimit).forEach((vocab, idx) => {
    const distractors = getDistractors(poolVocab.map(v => v.mongolian), vocab.mongolian, 3);
    if (distractors.length >= 1) {
      const { options } = assembleOptions(vocab.mongolian, distractors);
      exercises.push({
        id: `ex-${lesson.id}-v-mc-${idx}`,
        type: 'multiple_choice',
        prompt: 'Зөв монгол утгыг сонгоно уу',
        targetJapanese: vocab.japanese,
        targetReading: vocab.reading,
        targetMongolian: vocab.mongolian,
        itemId: vocab.id,
        itemType: 'vocab',
        options,
        correctAnswer: vocab.mongolian,
        explanation: `「${vocab.japanese}」${vocab.reading ? `(${vocab.reading})` : ''} — ${vocab.mongolian}`
      });
    }
  });

  // 5. Active Recall: Kanji Check (using real pool distractors)
  lessonKanji.slice(0, hasKanji ? 1 : 0).forEach((kanji, idx) => {
    const distractors = getDistractors(poolKanji.map(k => k.mongolian), kanji.mongolian, 3);
    if (distractors.length >= 1) {
      const { options } = assembleOptions(kanji.mongolian, distractors);
      exercises.push({
        id: `ex-${lesson.id}-k-mc-${idx}`,
        type: 'multiple_choice',
        prompt: 'Энэ ханзны утга юу вэ?',
        targetJapanese: kanji.kanji,
        targetReading: kanji.onyomi || kanji.kunyomi || '',
        targetMongolian: kanji.mongolian,
        itemId: kanji.id,
        itemType: 'kanji',
        onyomi: kanji.onyomi,
        kunyomi: kanji.kunyomi,
        options,
        correctAnswer: kanji.mongolian,
        explanation: `「${kanji.kanji}」ханз нь 「${kanji.mongolian}」утгатай.`
      });
    }
  });

  // 6. Active Recall: Grammar Check
  lessonGrammar.slice(0, hasGrammar ? 1 : 0).forEach((grammar, idx) => {
    const gq = learningEngine.buildGrammarQuestion(grammar, poolGrammar);
    if (gq && gq.options.length >= 2) {
      exercises.push({
        id: `ex-${lesson.id}-g-mc-${idx}`,
        type: 'multiple_choice',
        prompt: gq.promptInstruction || 'Дүрмийн зөв утгыг сонгоно уу',
        targetJapanese: gq.prompt,
        targetReading: gq.reading,
        targetMongolian: grammar.mongolian,
        itemId: grammar.id,
        itemType: 'grammar',
        structure: grammar.structure,
        options: gq.options,
        correctAnswer: gq.options[gq.correctIndex],
        explanation: gq.explanation
      });
    }
  });

  // 7. Contextual Sentence Scramble (1 sentence from vocab or grammar examples)
  let addedScramble = false;
  for (const v of lessonVocab) {
    if (v.exampleSentence) {
      const scramble = buildSentenceScrambleExercise(
        `ex-${lesson.id}-scr-v-${v.id}`,
        v.exampleSentence,
        v.exampleMongolian || '',
        v.exampleReading,
        v.id,
        'vocab'
      );
      if (scramble) {
        exercises.push(scramble);
        addedScramble = true;
        break;
      }
    }
  }

  if (!addedScramble) {
    for (const g of lessonGrammar) {
      const ex = g.examples?.find(e => e.japanese && e.mongolian);
      if (ex) {
        const scramble = buildSentenceScrambleExercise(
          `ex-${lesson.id}-scr-g-${g.id}`,
          ex.japanese,
          ex.mongolian,
          ex.reading,
          g.id,
          'grammar'
        );
        if (scramble) {
          exercises.push(scramble);
          break;
        }
      }
    }
  }

  return exercises.slice(0, 10);
}
