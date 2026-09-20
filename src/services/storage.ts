import { UserProgress, JLPTLevel } from '../types';

const PROGRESS_STORAGE_KEY = 'nihongo_mongol_progress_v1';
const THEME_STORAGE_KEY = 'nihongo_mongol_theme_v1';
const SELECTED_LEVEL_STORAGE_KEY = 'nihongo_mongol_selected_level_v1';
const BANNER_DISMISSED_KEY = 'nihongo_mongol_sync_banner_dismissed_v1';

export const defaultProgress: UserProgress = {
  selectedLevel: null,
  learnedVocabIds: [],
  learnedKanjiIds: [],
  learnedGrammarIds: [],
  completedLessonIds: [],
  completedReadingIds: [],
  completedListeningIds: [],
  quizResults: [],
  quizHistory: [],
  practiceHistory: [],
  itemStudyRecords: {},
  dailyActivity: {},
  favorites: {
    vocabIds: [],
    kanjiIds: [],
    grammarIds: [],
    sentenceIds: []
  },
  streak: {
    current: 0,
    longest: 0,
    lastActiveDate: ''
  },
  updatedAt: new Date().toISOString(),
  settings: {
    targetLevel: 'N5',
    dailyGoalCount: 10,
    speechRate: 0.9,
    autoPlayAudio: false,
    showFurigana: true
  }
};

export const storageService = {
  getSelectedLevel(): JLPTLevel | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(SELECTED_LEVEL_STORAGE_KEY);
      if (stored && ['N5', 'N4', 'N3', 'N2', 'N1'].includes(stored)) {
        return stored as JLPTLevel;
      }
      return null;
    } catch {
      return null;
    }
  },

  setSelectedLevel(level: JLPTLevel | null) {
    if (typeof window === 'undefined') return;
    try {
      if (level && ['N5', 'N4', 'N3', 'N2', 'N1'].includes(level)) {
        localStorage.setItem(SELECTED_LEVEL_STORAGE_KEY, level);
      } else {
        localStorage.removeItem(SELECTED_LEVEL_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to save selected level:', e);
    }
  },

  isBannerDismissed(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(BANNER_DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  },

  setBannerDismissed(dismissed: boolean) {
    if (typeof window === 'undefined') return;
    try {
      if (dismissed) {
        localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
      } else {
        localStorage.removeItem(BANNER_DISMISSED_KEY);
      }
    } catch (e) {
      console.error('Failed to save banner dismissed state:', e);
    }
  },

  // Record a genuine learning activity to advance the daily streak
  recordLearningAction(progress: UserProgress): UserProgress {
    const today = new Date().toISOString().split('T')[0];
    const lastActive = progress.streak?.lastActiveDate || '';
    let currentStreak = progress.streak?.current || 0;

    if (!lastActive) {
      currentStreak = 1;
    } else if (lastActive === today) {
      // Already recorded learning today, maintain current streak
      currentStreak = Math.max(1, currentStreak);
    } else {
      const lastDate = new Date(lastActive);
      const currentDate = new Date(today);
      const diffTime = currentDate.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day!
        currentStreak += 1;
      } else if (diffDays > 1) {
        // Streak broken
        currentStreak = 1;
      }
    }

    const longest = Math.max(progress.streak?.longest || 0, currentStreak);
    return {
      ...progress,
      streak: {
        current: currentStreak,
        longest,
        lastActiveDate: today
      },
      updatedAt: new Date().toISOString()
    };
  },

  getProgress(): UserProgress {
    if (typeof window === 'undefined') return defaultProgress;
    try {
      const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (!stored) return defaultProgress;
      const parsed = JSON.parse(stored);

      return {
        ...defaultProgress,
        ...parsed,
        selectedLevel: this.getSelectedLevel() || parsed.selectedLevel || null,
        learnedVocabIds: Array.isArray(parsed.learnedVocabIds) ? parsed.learnedVocabIds : [],
        learnedKanjiIds: Array.isArray(parsed.learnedKanjiIds) ? parsed.learnedKanjiIds : [],
        learnedGrammarIds: Array.isArray(parsed.learnedGrammarIds) ? parsed.learnedGrammarIds : [],
        completedLessonIds: Array.isArray(parsed.completedLessonIds) ? parsed.completedLessonIds : [],
        completedReadingIds: Array.isArray(parsed.completedReadingIds) ? parsed.completedReadingIds : [],
        completedListeningIds: Array.isArray(parsed.completedListeningIds) ? parsed.completedListeningIds : [],
        quizResults: Array.isArray(parsed.quizResults)
          ? parsed.quizResults
          : Array.isArray(parsed.quizHistory)
          ? parsed.quizHistory
          : [],
        quizHistory: Array.isArray(parsed.quizHistory) ? parsed.quizHistory : [],
        practiceHistory: Array.isArray(parsed.practiceHistory) ? parsed.practiceHistory : [],
        itemStudyRecords: (parsed.itemStudyRecords && typeof parsed.itemStudyRecords === 'object')
          ? parsed.itemStudyRecords
          : {},
        dailyActivity: (parsed.dailyActivity && typeof parsed.dailyActivity === 'object')
          ? parsed.dailyActivity
          : {},
        favorites: {
          vocabIds: Array.isArray(parsed.favorites?.vocabIds) ? parsed.favorites.vocabIds : [],
          kanjiIds: Array.isArray(parsed.favorites?.kanjiIds) ? parsed.favorites.kanjiIds : [],
          grammarIds: Array.isArray(parsed.favorites?.grammarIds) ? parsed.favorites.grammarIds : [],
          sentenceIds: Array.isArray(parsed.favorites?.sentenceIds) ? parsed.favorites.sentenceIds : []
        },
        settings: { ...defaultProgress.settings, ...(parsed.settings || {}) },
        streak: {
          current: parsed.streak?.current || 0,
          longest: parsed.streak?.longest || 0,
          lastActiveDate: parsed.streak?.lastActiveDate || ''
        },
        updatedAt: parsed.updatedAt || new Date().toISOString()
      };
    } catch {
      return defaultProgress;
    }
  },

  saveProgress(progress: UserProgress) {
    if (typeof window === 'undefined') return;
    try {
      const toSave = {
        ...progress,
        updatedAt: progress.updatedAt || new Date().toISOString()
      };
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error('Failed to save progress locally:', e);
    }
  },

  mergeProgress(local: UserProgress, remote: UserProgress): UserProgress {
    // Merge array sets without duplicates
    const union = (a: string[] = [], b: string[] = []) => Array.from(new Set([...a, ...b]));

    // Merge quiz results without duplicate IDs/dates
    const quizMap = new Map<string, any>();
    [...(remote.quizResults || []), ...(local.quizResults || [])].forEach(q => {
      const key = `${q.quizId}-${q.date}`;
      if (!quizMap.has(key)) quizMap.set(key, q);
    });

    const longestStreak = Math.max(local.streak?.longest || 0, remote.streak?.longest || 0);
    const currentStreak = Math.max(local.streak?.current || 0, remote.streak?.current || 0);
    const latestActiveDate = (local.streak?.lastActiveDate || '') > (remote.streak?.lastActiveDate || '')
      ? local.streak?.lastActiveDate
      : remote.streak?.lastActiveDate;

    // Pick latest updated lastStudied
    const lastStudied = (local.lastStudied?.date || '') > (remote.lastStudied?.date || '')
      ? local.lastStudied
      : remote.lastStudied || local.lastStudied;

    // Pick selected level: prefer remote if set, otherwise local
    const selectedLevel = remote.selectedLevel || local.selectedLevel || null;

    // Merge quiz history
    const quizHistMap = new Map<string, any>();
    [...(remote.quizHistory || []), ...(local.quizHistory || [])].forEach(q => {
      if (q && q.id && !quizHistMap.has(q.id)) quizHistMap.set(q.id, q);
    });

    // Merge practice history
    const practiceHistMap = new Map<string, any>();
    [...(remote.practiceHistory || []), ...(local.practiceHistory || [])].forEach(p => {
      if (p && p.id && !practiceHistMap.has(p.id)) practiceHistMap.set(p.id, p);
    });

    // Merge item study records
    const itemRecords: Record<string, any> = { ...(remote.itemStudyRecords || {}), ...(local.itemStudyRecords || {}) };
    const allItemKeys = new Set([...Object.keys(remote.itemStudyRecords || {}), ...Object.keys(local.itemStudyRecords || {})]);
    allItemKeys.forEach(key => {
      const r = remote.itemStudyRecords?.[key];
      const l = local.itemStudyRecords?.[key];
      if (r && l) {
        itemRecords[key] = {
          ...r,
          ...l,
          timesEncountered: Math.max(r.timesEncountered || 0, l.timesEncountered || 0),
          correctCount: Math.max(r.correctCount || 0, l.correctCount || 0),
          incorrectCount: Math.max(r.incorrectCount || 0, l.incorrectCount || 0),
          lastPracticedDate: (l.lastPracticedDate || '') > (r.lastPracticedDate || '') ? l.lastPracticedDate : r.lastPracticedDate
        };
      }
    });

    // Merge daily activity
    const dailyRecords: Record<string, any> = { ...(remote.dailyActivity || {}), ...(local.dailyActivity || {}) };

    return {
      selectedLevel,
      learnedVocabIds: union(local.learnedVocabIds, remote.learnedVocabIds),
      learnedKanjiIds: union(local.learnedKanjiIds, remote.learnedKanjiIds),
      learnedGrammarIds: union(local.learnedGrammarIds, remote.learnedGrammarIds),
      completedLessonIds: union(local.completedLessonIds, remote.completedLessonIds),
      completedReadingIds: union(local.completedReadingIds, remote.completedReadingIds),
      completedListeningIds: union(local.completedListeningIds, remote.completedListeningIds),
      quizResults: Array.from(quizMap.values()).slice(0, 50),
      quizHistory: Array.from(quizHistMap.values()).slice(0, 50),
      practiceHistory: Array.from(practiceHistMap.values()).slice(0, 50),
      itemStudyRecords: itemRecords,
      dailyActivity: dailyRecords,
      favorites: {
        vocabIds: union(local.favorites?.vocabIds, remote.favorites?.vocabIds),
        kanjiIds: union(local.favorites?.kanjiIds, remote.favorites?.kanjiIds),
        grammarIds: union(local.favorites?.grammarIds, remote.favorites?.grammarIds),
        sentenceIds: union(local.favorites?.sentenceIds, remote.favorites?.sentenceIds)
      },
      streak: {
        current: currentStreak,
        longest: longestStreak,
        lastActiveDate: latestActiveDate || ''
      },
      lastStudied,
      updatedAt: new Date().toISOString(),
      settings: {
        ...remote.settings,
        ...local.settings
      }
    };
  },

  toggleVocabLearned(vocabId: string): boolean {
    let p = this.getProgress();
    const isLearned = p.learnedVocabIds.includes(vocabId);
    if (isLearned) {
      p.learnedVocabIds = p.learnedVocabIds.filter(id => id !== vocabId);
    } else {
      p.learnedVocabIds.push(vocabId);
      p = this.recordLearningAction(p);
    }
    p.lastStudied = {
      type: 'vocab',
      id: vocabId,
      date: new Date().toISOString()
    };
    p.updatedAt = new Date().toISOString();
    this.saveProgress(p);
    return !isLearned;
  },

  toggleKanjiLearned(kanjiId: string): boolean {
    let p = this.getProgress();
    const isLearned = p.learnedKanjiIds.includes(kanjiId);
    if (isLearned) {
      p.learnedKanjiIds = p.learnedKanjiIds.filter(id => id !== kanjiId);
    } else {
      p.learnedKanjiIds.push(kanjiId);
      p = this.recordLearningAction(p);
    }
    p.lastStudied = {
      type: 'kanji',
      id: kanjiId,
      date: new Date().toISOString()
    };
    p.updatedAt = new Date().toISOString();
    this.saveProgress(p);
    return !isLearned;
  },

  toggleGrammarLearned(grammarId: string): boolean {
    let p = this.getProgress();
    const isLearned = p.learnedGrammarIds.includes(grammarId);
    if (isLearned) {
      p.learnedGrammarIds = p.learnedGrammarIds.filter(id => id !== grammarId);
    } else {
      p.learnedGrammarIds.push(grammarId);
      p = this.recordLearningAction(p);
    }
    p.lastStudied = {
      type: 'grammar',
      id: grammarId,
      date: new Date().toISOString()
    };
    p.updatedAt = new Date().toISOString();
    this.saveProgress(p);
    return !isLearned;
  },

  toggleFavorite(type: 'vocab' | 'kanji' | 'grammar' | 'sentence', id: string): boolean {
    let p = this.getProgress();
    const map = {
      vocab: 'vocabIds',
      kanji: 'kanjiIds',
      grammar: 'grammarIds',
      sentence: 'sentenceIds'
    } as const;
    const key = map[type];
    const isFav = p.favorites[key].includes(id);

    if (isFav) {
      p.favorites[key] = p.favorites[key].filter(item => item !== id);
    } else {
      p.favorites[key].push(id);
      p = this.recordLearningAction(p);
    }

    p.updatedAt = new Date().toISOString();
    this.saveProgress(p);
    return !isFav;
  },

  recordQuizScore(quizId: string, score: number, total: number, jlptLevel: JLPTLevel) {
    let p = this.getProgress();
    p.quizResults.unshift({
      quizId,
      score,
      total,
      date: new Date().toISOString(),
      jlptLevel
    });
    p.quizResults = p.quizResults.slice(0, 50);
    p = this.recordLearningAction(p);
    p.lastStudied = {
      type: 'lesson',
      id: quizId,
      level: jlptLevel,
      date: new Date().toISOString()
    };
    p.updatedAt = new Date().toISOString();
    this.saveProgress(p);
  },

  clearProgress() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(PROGRESS_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear progress:', e);
    }
  },

  getTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light';
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') return stored;
      return 'light';
    } catch {
      return 'light';
    }
  },

  setTheme(theme: 'light' | 'dark') {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    } catch (e) {
      console.error('Failed to set theme:', e);
    }
  }
};
