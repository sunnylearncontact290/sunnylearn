import {
  JLPTLevel,
  UserProgress,
  GamificationProgress,
  DailyTaskProgress,
  BadgeDefinition
} from '../types';

export const DAILY_GOAL_XP = 20;

export const XP_REWARDS = {
  VOCAB: 1,
  KANJI: 2,
  GRAMMAR: 3,
  QUIZ: 8
};

export const DAILY_MISSION_TARGETS = {
  VOCAB: 5,
  KANJI: 2,
  GRAMMAR: 1,
  QUIZ: 1 // Completed quiz with at least 5 questions
};

// 1. Timezone-safe Asia/Tokyo date helpers (00:00 Japan Time reset)
export function getTokyoDateString(d: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(d);
  } catch {
    // Fallback if environment lacks timezone database
    const utcTime = d.getTime() + d.getTimezoneOffset() * 60000;
    const tokyoTime = new Date(utcTime + 9 * 3600000);
    return tokyoTime.toISOString().split('T')[0];
  }
}

export function getPreviousTokyoDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0];
}

export function getNextTokyoDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().split('T')[0];
}

// 2. SunnyLearn Learner Level calculation (clearly separate from JLPT N5-N1)
export interface LearnerLevelInfo {
  level: number;
  title: string;
  totalXP: number;
  minXP: number;
  nextXP: number;
  progressPercent: number;
}

const LEVEL_THRESHOLDS = [
  { level: 1, min: 0, max: 100, title: 'Шинэ суралцагч' },
  { level: 2, min: 100, max: 220, title: 'Идэвхтэй суралцагч' },
  { level: 3, min: 220, max: 360, title: 'Хичээнгүй суралцагч' },
  { level: 4, min: 360, max: 520, title: 'Зорилготой суралцагч' },
  { level: 5, min: 520, max: 710, title: 'Ахисан суралцагч' },
  { level: 6, min: 710, max: 930, title: 'Мэдлэг бүтээгч' },
  { level: 7, min: 930, max: 1190, title: 'Мэргэшсэн суралцагч' },
  { level: 8, min: 1190, max: 1500, title: 'Япон хэлний эзэн' },
];

export function calculateLearnerLevel(totalXP: number): LearnerLevelInfo {
  const safeXP = Math.max(0, totalXP || 0);

  for (const t of LEVEL_THRESHOLDS) {
    if (safeXP < t.max) {
      const progressPercent = Math.min(100, Math.max(0, Math.round(((safeXP - t.min) / (t.max - t.min)) * 100)));
      return {
        level: t.level,
        title: t.title,
        totalXP: safeXP,
        minXP: t.min,
        nextXP: t.max,
        progressPercent
      };
    }
  }

  // Dynamic formula for Level 9+
  let lvl = 8;
  let min = 1190;
  let max = 1500;
  let step = 310;

  while (safeXP >= max) {
    lvl++;
    min = max;
    step += 50;
    max = min + step;
  }

  const progressPercent = Math.min(100, Math.max(0, Math.round(((safeXP - min) / (max - min)) * 100)));
  return {
    level: lvl,
    title: 'Япон хэлний мастер',
    totalXP: safeXP,
    minXP: min,
    nextXP: max,
    progressPercent
  };
}

// 3. Reliable Streak calculation based on stored completion dates
export function calculateStreakFromDates(
  completedDates: string[],
  todayTokyo: string = getTokyoDateString()
): { currentStreak: number; longestStreak: number; completedToday: boolean; completedYesterday: boolean } {
  const dateSet = new Set(completedDates || []);
  const completedToday = dateSet.has(todayTokyo);
  const yesterdayTokyo = getPreviousTokyoDate(todayTokyo);
  const completedYesterday = dateSet.has(yesterdayTokyo);

  let currentStreak = 0;

  if (completedToday) {
    // Count consecutive days leading up to today
    let checkDate = todayTokyo;
    while (dateSet.has(checkDate)) {
      currentStreak++;
      checkDate = getPreviousTokyoDate(checkDate);
    }
  } else if (completedYesterday) {
    // Yesterday was completed, streak is alive and waiting for today's completion
    let checkDate = yesterdayTokyo;
    while (dateSet.has(checkDate)) {
      currentStreak++;
      checkDate = getPreviousTokyoDate(checkDate);
    }
  } else {
    // Yesterday was missed and today is not completed -> active streak is 0
    currentStreak = 0;
  }

  // Calculate longest historical streak
  let longestStreak = 0;
  const sortedDates = Array.from(dateSet).sort();
  let tempStreak = 0;
  let prevDate: string | null = null;

  for (const d of sortedDates) {
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const expectedNext = getNextTokyoDate(prevDate);
      if (d === expectedNext) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    prevDate = d;
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  return { currentStreak, longestStreak, completedToday, completedYesterday };
}

// 4. Default factory
export function createDefaultDailyTaskProgress(): Record<JLPTLevel, DailyTaskProgress> {
  return {
    N5: { vocabCount: 0, kanjiCount: 0, grammarCount: 0, quizCount: 0 },
    N4: { vocabCount: 0, kanjiCount: 0, grammarCount: 0, quizCount: 0 },
    N3: { vocabCount: 0, kanjiCount: 0, grammarCount: 0, quizCount: 0 },
    N2: { vocabCount: 0, kanjiCount: 0, grammarCount: 0, quizCount: 0 },
    N1: { vocabCount: 0, kanjiCount: 0, grammarCount: 0, quizCount: 0 }
  };
}

export function createDefaultGamificationProgress(existing?: Partial<UserProgress>): GamificationProgress {
  const todayTokyo = getTokyoDateString();
  const existingVocab = existing?.learnedVocabIds || [];
  const existingKanji = existing?.learnedKanjiIds || [];
  const existingGrammar = existing?.learnedGrammarIds || [];
  const existingQuizzes = existing?.quizHistory || [];

  // Seed awarded item IDs with existing progress so existing items can't be repeatedly farmed
  const awardedItemIds = Array.from(new Set([
    ...existingVocab,
    ...existingKanji,
    ...existingGrammar
  ]));

  const awardedQuizIds = Array.from(new Set(
    existingQuizzes.map(q => q.id).filter(Boolean)
  ));

  // Compute fair initial lifetime XP from existing verified achievements
  const initialTotalXP =
    existingVocab.length * XP_REWARDS.VOCAB +
    existingKanji.length * XP_REWARDS.KANJI +
    existingGrammar.length * XP_REWARDS.GRAMMAR +
    existingQuizzes.length * XP_REWARDS.QUIZ;

  const levelInfo = calculateLearnerLevel(initialTotalXP);

  // If existing streak was recorded, initialize completed dates appropriately so existing streak is preserved
  const existingStreak = existing?.streak?.current || 0;
  const existingLongest = existing?.streak?.longest || existingStreak;
  const completedGoalDates: string[] = [];

  if (existingStreak > 0) {
    const lastActive = existing?.streak?.lastActiveDate || todayTokyo;
    let curr = lastActive;
    for (let i = 0; i < existingStreak; i++) {
      completedGoalDates.push(curr);
      curr = getPreviousTokyoDate(curr);
    }
  }

  const initialBadges = evaluateBadges(
    existingStreak,
    existingLongest,
    initialTotalXP,
    completedGoalDates.length,
    existingVocab.length,
    existingQuizzes.length,
    []
  );

  return {
    totalXP: initialTotalXP,
    level: levelInfo.level,
    dailyDate: todayTokyo,
    dailyXP: 0,
    dailyGoalXP: DAILY_GOAL_XP,
    dailyGoalCompleted: false,
    dailyCelebratedDate: undefined,
    dailyTaskProgress: createDefaultDailyTaskProgress(),
    awardedItemIds,
    awardedQuizIds,
    completedGoalDates,
    currentStreak: existingStreak,
    longestStreak: existingLongest,
    unlockedBadgeIds: initialBadges
  };
}

// 5. Ensure GamificationProgress is up to date with daily reset (Asia/Tokyo 00:00)
export function ensureGamificationProgress(progress: UserProgress): UserProgress {
  const todayTokyo = getTokyoDateString();
  let g = progress.gamification;

  if (!g) {
    g = createDefaultGamificationProgress(progress);
    return {
      ...progress,
      gamification: g
    };
  }

  // Check if daily reset is needed
  if (g.dailyDate !== todayTokyo) {
    const streakInfo = calculateStreakFromDates(g.completedGoalDates || [], todayTokyo);

    const updatedGamification: GamificationProgress = {
      ...g,
      dailyDate: todayTokyo,
      dailyXP: 0,
      dailyGoalCompleted: false,
      dailyTaskProgress: createDefaultDailyTaskProgress(),
      currentStreak: streakInfo.currentStreak,
      longestStreak: Math.max(g.longestStreak || 0, streakInfo.longestStreak),
      // Clean celebrated date if not today so today's completion will celebrate once
      dailyCelebratedDate: g.dailyCelebratedDate === todayTokyo ? g.dailyCelebratedDate : undefined
    };

    return {
      ...progress,
      streak: {
        current: streakInfo.currentStreak,
        longest: Math.max(progress.streak?.longest || 0, streakInfo.longestStreak),
        lastActiveDate: progress.streak?.lastActiveDate || ''
      },
      gamification: updatedGamification
    };
  }

  // Ensure daily task progress has all keys
  if (!g.dailyTaskProgress || !g.dailyTaskProgress.N5) {
    g = {
      ...g,
      dailyTaskProgress: {
        ...createDefaultDailyTaskProgress(),
        ...(g.dailyTaskProgress || {})
      }
    };
    return {
      ...progress,
      gamification: g
    };
  }

  return progress;
}

// 6. Award XP for Learning an Item (Vocab, Kanji, Grammar)
export function awardItemLearned(
  progress: UserProgress,
  itemId: string,
  itemType: 'vocab' | 'kanji' | 'grammar',
  level: JLPTLevel
): { updatedProgress: UserProgress; awardedXP: number; newlyReachedDailyGoal: boolean } {
  const verified = ensureGamificationProgress(progress);
  const g = verified.gamification!;
  const todayTokyo = getTokyoDateString();

  // ANTI-FARMING: Prevent awarding XP repeatedly for the same item ID
  if (g.awardedItemIds && g.awardedItemIds.includes(itemId)) {
    return {
      updatedProgress: verified,
      awardedXP: 0,
      newlyReachedDailyGoal: false
    };
  }

  let xpToAdd = 0;
  if (itemType === 'vocab') xpToAdd = XP_REWARDS.VOCAB;
  else if (itemType === 'kanji') xpToAdd = XP_REWARDS.KANJI;
  else if (itemType === 'grammar') xpToAdd = XP_REWARDS.GRAMMAR;

  const newTotalXP = (g.totalXP || 0) + xpToAdd;
  const newDailyXP = (g.dailyXP || 0) + xpToAdd;
  const levelInfo = calculateLearnerLevel(newTotalXP);

  const safeLevel = (['N5', 'N4', 'N3', 'N2', 'N1'].includes(level) ? level : 'N5') as JLPTLevel;
  const currentTaskProgress = g.dailyTaskProgress?.[safeLevel] || {
    vocabCount: 0,
    kanjiCount: 0,
    grammarCount: 0,
    quizCount: 0
  };

  const updatedTasksForLevel: DailyTaskProgress = {
    ...currentTaskProgress,
    vocabCount: currentTaskProgress.vocabCount + (itemType === 'vocab' ? 1 : 0),
    kanjiCount: currentTaskProgress.kanjiCount + (itemType === 'kanji' ? 1 : 0),
    grammarCount: currentTaskProgress.grammarCount + (itemType === 'grammar' ? 1 : 0)
  };

  const wasGoalCompletedBefore = g.dailyGoalCompleted;
  const isGoalCompletedNow = newDailyXP >= (g.dailyGoalXP || DAILY_GOAL_XP);
  const newlyReachedDailyGoal = !wasGoalCompletedBefore && isGoalCompletedNow;

  let completedDates = [...(g.completedGoalDates || [])];
  if (newlyReachedDailyGoal && !completedDates.includes(todayTokyo)) {
    completedDates.push(todayTokyo);
  }

  const streakInfo = calculateStreakFromDates(completedDates, todayTokyo);

  // Check badges
  const unlockedBadges = evaluateBadges(
    streakInfo.currentStreak,
    streakInfo.longestStreak,
    newTotalXP,
    completedDates.length,
    (verified.learnedVocabIds?.length || 0) + (itemType === 'vocab' ? 1 : 0),
    (verified.quizHistory?.length || 0),
    g.unlockedBadgeIds || []
  );

  const updatedGamification: GamificationProgress = {
    ...g,
    totalXP: newTotalXP,
    level: levelInfo.level,
    dailyXP: newDailyXP,
    dailyGoalCompleted: isGoalCompletedNow,
    dailyTaskProgress: {
      ...g.dailyTaskProgress,
      [safeLevel]: updatedTasksForLevel
    },
    awardedItemIds: [...(g.awardedItemIds || []), itemId],
    completedGoalDates: completedDates,
    currentStreak: streakInfo.currentStreak,
    longestStreak: Math.max(g.longestStreak || 0, streakInfo.longestStreak),
    unlockedBadgeIds: unlockedBadges
  };

  const updatedProgress: UserProgress = {
    ...verified,
    streak: {
      current: streakInfo.currentStreak,
      longest: Math.max(verified.streak?.longest || 0, streakInfo.longestStreak),
      lastActiveDate: todayTokyo
    },
    gamification: updatedGamification,
    updatedAt: new Date().toISOString()
  };

  return {
    updatedProgress,
    awardedXP: xpToAdd,
    newlyReachedDailyGoal
  };
}

// 7. Award XP for Completing a Quiz
export function awardQuizCompleted(
  progress: UserProgress,
  quizAttemptId: string,
  level: JLPTLevel,
  questionCount: number
): { updatedProgress: UserProgress; awardedXP: number; newlyReachedDailyGoal: boolean } {
  const verified = ensureGamificationProgress(progress);
  const g = verified.gamification!;
  const todayTokyo = getTokyoDateString();

  // Requirements: completed 5-question Quiz = +8 XP
  if (questionCount < 5) {
    return {
      updatedProgress: verified,
      awardedXP: 0,
      newlyReachedDailyGoal: false
    };
  }

  // ANTI-FARMING: Prevent awarding XP repeatedly for the same quiz attempt ID
  if (g.awardedQuizIds && g.awardedQuizIds.includes(quizAttemptId)) {
    return {
      updatedProgress: verified,
      awardedXP: 0,
      newlyReachedDailyGoal: false
    };
  }

  const xpToAdd = XP_REWARDS.QUIZ;
  const newTotalXP = (g.totalXP || 0) + xpToAdd;
  const newDailyXP = (g.dailyXP || 0) + xpToAdd;
  const levelInfo = calculateLearnerLevel(newTotalXP);

  const safeLevel = (['N5', 'N4', 'N3', 'N2', 'N1'].includes(level) ? level : 'N5') as JLPTLevel;
  const currentTaskProgress = g.dailyTaskProgress?.[safeLevel] || {
    vocabCount: 0,
    kanjiCount: 0,
    grammarCount: 0,
    quizCount: 0
  };

  const updatedTasksForLevel: DailyTaskProgress = {
    ...currentTaskProgress,
    quizCount: currentTaskProgress.quizCount + 1
  };

  const wasGoalCompletedBefore = g.dailyGoalCompleted;
  const isGoalCompletedNow = newDailyXP >= (g.dailyGoalXP || DAILY_GOAL_XP);
  const newlyReachedDailyGoal = !wasGoalCompletedBefore && isGoalCompletedNow;

  let completedDates = [...(g.completedGoalDates || [])];
  if (newlyReachedDailyGoal && !completedDates.includes(todayTokyo)) {
    completedDates.push(todayTokyo);
  }

  const streakInfo = calculateStreakFromDates(completedDates, todayTokyo);

  const unlockedBadges = evaluateBadges(
    streakInfo.currentStreak,
    streakInfo.longestStreak,
    newTotalXP,
    completedDates.length,
    verified.learnedVocabIds?.length || 0,
    (verified.quizHistory?.length || 0) + 1,
    g.unlockedBadgeIds || []
  );

  const updatedGamification: GamificationProgress = {
    ...g,
    totalXP: newTotalXP,
    level: levelInfo.level,
    dailyXP: newDailyXP,
    dailyGoalCompleted: isGoalCompletedNow,
    dailyTaskProgress: {
      ...g.dailyTaskProgress,
      [safeLevel]: updatedTasksForLevel
    },
    awardedQuizIds: [...(g.awardedQuizIds || []), quizAttemptId],
    completedGoalDates: completedDates,
    currentStreak: streakInfo.currentStreak,
    longestStreak: Math.max(g.longestStreak || 0, streakInfo.longestStreak),
    unlockedBadgeIds: unlockedBadges
  };

  const updatedProgress: UserProgress = {
    ...verified,
    streak: {
      current: streakInfo.currentStreak,
      longest: Math.max(verified.streak?.longest || 0, streakInfo.longestStreak),
      lastActiveDate: todayTokyo
    },
    gamification: updatedGamification,
    updatedAt: new Date().toISOString()
  };

  return {
    updatedProgress,
    awardedXP: xpToAdd,
    newlyReachedDailyGoal
  };
}

// 8. Badges and Achievements evaluation
function evaluateBadges(
  currentStreak: number,
  longestStreak: number,
  totalXP: number,
  completedGoalCount: number,
  vocabCount: number,
  quizCount: number,
  alreadyUnlocked: string[]
): string[] {
  const unlocked = new Set(alreadyUnlocked || []);
  const bestStreak = Math.max(currentStreak || 0, longestStreak || 0);

  if (bestStreak >= 7) unlocked.add('streak-7');
  if (bestStreak >= 30) unlocked.add('streak-30');
  if (bestStreak >= 100) unlocked.add('streak-100');
  if (bestStreak >= 3) unlocked.add('streak-3');
  if (completedGoalCount >= 1) unlocked.add('first-goal');
  if (quizCount >= 5) unlocked.add('quiz-master');
  if (vocabCount >= 50) unlocked.add('vocab-50');

  return Array.from(unlocked);
}

// 9. Badges List Definition for Display
export function getBadgesList(
  gamification: GamificationProgress,
  userProgress: UserProgress
): BadgeDefinition[] {
  const bestStreak = Math.max(gamification.currentStreak || 0, gamification.longestStreak || 0);
  const unlockedSet = new Set(gamification.unlockedBadgeIds || []);

  const definitions = [
    {
      id: 'streak-7',
      title: '7 өдөр',
      description: '7 өдрийн тасралтгүй суралцагч',
      iconName: 'Flame',
      category: 'streak' as const,
      target: 7,
      current: bestStreak
    },
    {
      id: 'streak-30',
      title: '30 өдөр',
      description: '30 өдрийн тасралтгүй суралцагч',
      iconName: 'Trophy',
      category: 'streak' as const,
      target: 30,
      current: bestStreak
    },
    {
      id: 'streak-100',
      title: '100 өдөр',
      description: '100 өдрийн тасралтгүй суралцагч',
      iconName: 'Crown',
      category: 'streak' as const,
      target: 100,
      current: bestStreak
    },
    {
      id: 'first-goal',
      title: 'Анхны зорилго',
      description: 'Өдрийн 20 XP зорилгоо биелүүлсэн',
      iconName: 'Target',
      category: 'special' as const,
      target: 1,
      current: (gamification.completedGoalDates || []).length
    },
    {
      id: 'streak-3',
      title: '3 өдөр',
      description: '3 өдрийн дараалсан дадал үүсгэгч',
      iconName: 'Sparkles',
      category: 'streak' as const,
      target: 3,
      current: bestStreak
    },
    {
      id: 'quiz-master',
      title: 'Сорилын мастер',
      description: '5 болон түүнээс дээш асуулттай 5 сорил дуусгасан',
      iconName: 'Award',
      category: 'learning' as const,
      target: 5,
      current: userProgress.quizHistory?.length || 0
    },
    {
      id: 'vocab-50',
      title: '50 үг эзэмшсэн',
      description: '50 япон үг амжилттай цээжилсэн',
      iconName: 'BookOpen',
      category: 'learning' as const,
      target: 50,
      current: userProgress.learnedVocabIds?.length || 0
    }
  ];

  return definitions.map(def => {
    const isUnlocked = unlockedSet.has(def.id) || def.current >= def.target;
    let statusText = '🔒';

    if (isUnlocked) {
      statusText = '✅ Нээгдсэн';
    } else if (def.category === 'streak') {
      const remaining = Math.max(1, def.target - def.current);
      statusText = `🔒 ${remaining} өдөр үлдсэн`;
    } else {
      const remaining = Math.max(1, def.target - def.current);
      statusText = `🔒 ${remaining} үлдсэн`;
    }

    return {
      id: def.id,
      title: def.title,
      description: def.description,
      iconName: def.iconName,
      category: def.category,
      target: def.target,
      isUnlocked,
      statusText
    };
  });
}
