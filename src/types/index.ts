export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export type MainTab = 'home' | 'learn' | 'dictionary' | 'practice' | 'quiz' | 'progress' | 'profile' | 'contact' | 'admin' | 'premium' | 'tutor' | 'ai' | 'tokushoho';

export const PREMIUM_PRICE_YEN = 880;
export const PREMIUM_DURATION_DAYS = 30;

export type LearnSubTab = 'vocab' | 'kanji' | 'grammar';

export type AdminSubTab = 'stats' | 'vocab' | 'kanji' | 'grammar' | 'examples' | 'lessons' | 'reading' | 'listening' | 'quizzes' | 'categories' | 'feedback' | 'payments';

export type AccessTier = 'FREE' | 'PREMIUM';

export interface VocabularyItem {
  id: string;
  japanese: string;
  kanji?: string;
  reading: string; // Hiragana or Katakana
  romaji?: string;
  mongolian: string; // Mongolian meaning
  explanation?: string; // Mongolian explanation & usage notes
  partOfSpeech: string; // Нэр үг, Үйл үг (1-р бүлэг), Тэмдэг нэр (И/На), Дайвар үг, etc.
  jlptLevel: JLPTLevel;
  category: string;
  exampleSentence?: string;
  exampleReading?: string;
  exampleMongolian?: string;
  audioUrl?: string;
  accessTier?: AccessTier; // FREE or PREMIUM
  createdAt: string;
  updatedAt?: string;
}

export interface KanjiExampleWord {
  word: string;
  reading: string;
  mongolian: string;
}

export interface KanjiItem {
  id: string;
  kanji: string;
  onyomi: string; // e.g. ニチ, ジツ
  kunyomi: string; // e.g. ひ, -び, -か
  mongolian: string; // Mongolian meaning e.g. Нар, өдөр
  jlptLevel: JLPTLevel;
  exampleWords: KanjiExampleWord[];
  exampleSentence?: string;
  exampleReading?: string;
  exampleMongolian?: string;
  audioUrl?: string;
  accessTier?: AccessTier; // FREE or PREMIUM
  createdAt: string;
  updatedAt?: string;
}

export interface GrammarExample {
  japanese: string;
  reading: string;
  mongolian: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  questionReading?: string;
  options: string[];
  answer: number; // 0-indexed
  explanation: string; // Mongolian explanation of why this answer is correct
}

export interface GrammarItem {
  id: string;
  pattern: string; // e.g. 〜てはいけません
  mongolian: string; // e.g. ...ж болохгүй (хориглох)
  explanation: string; // Detailed Mongolian explanation
  usage: string; // Usage rules e.g. V-て form + はいけません
  structure: string; // Sentence structure breakdown
  examples: GrammarExample[];
  similarGrammar?: string; // Similar grammar patterns
  differences?: string; // Differences in nuance
  commonMistakes?: string; // Common mistakes made by Mongolian learners
  practiceQuestions?: QuizQuestion[];
  jlptLevel: JLPTLevel;
  category?: string;
  accessTier?: AccessTier; // FREE or PREMIUM
  createdAt: string;
  updatedAt?: string;
}

export interface ExampleSentenceItem {
  id: string;
  japanese: string;
  reading: string;
  mongolian: string;
  notes?: string;
  jlptLevel: JLPTLevel;
  category: string;
  accessTier?: AccessTier;
  createdAt: string;
  updatedAt?: string;
}

export interface LessonItem {
  id: string;
  title: string;
  description: string;
  jlptLevel: JLPTLevel;
  category: string;
  order: number;
  content: string; // Detailed lesson text with markdown / structured points
  vocabularyIds?: string[];
  grammarIds?: string[];
  kanjiIds?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface ReadingItem {
  id: string;
  title: string;
  japaneseText: string;
  furiganaText?: string;
  mongolianTranslation: string;
  vocabularyNotes: { word: string; reading: string; mongolian: string }[];
  questions: QuizQuestion[];
  jlptLevel: JLPTLevel;
  createdAt: string;
  updatedAt?: string;
}

export interface DialogueLine {
  speaker: string;
  japanese: string;
  reading: string;
  mongolian: string;
}

export interface ListeningItem {
  id: string;
  title: string;
  dialogue: DialogueLine[];
  audioUrl?: string;
  questions: QuizQuestion[];
  jlptLevel: JLPTLevel;
  createdAt: string;
  updatedAt?: string;
}

export interface QuizSet {
  id: string;
  title: string;
  type: 'vocab' | 'kanji' | 'grammar' | 'reading' | 'listening' | 'mixed';
  jlptLevel: JLPTLevel;
  questions: QuizQuestion[];
  createdAt: string;
  updatedAt?: string;
}

export interface CategoryItem {
  id: string;
  name: string; // Mongolian category name e.g. "Өдөр тутмын яриа", "Хоол хүнс"
  japaneseName: string; // e.g. "日常会話", "食べ物"
  icon: string;
  description?: string;
}

export type FeedbackType = 'feedback' | 'bug' | 'suggestion' | 'question' | 'other';

export interface FeedbackItem {
  id: string;
  name?: string;
  email?: string;
  type: FeedbackType;
  message: string;
  status: 'new' | 'read';
  createdAt: string;
}

export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface PaymentRequestItem {
  id: string; // e.g. SL-JP-20260915-A7K3P
  userId?: string;
  userName: string;
  userEmail: string;
  amount: number; // 880
  currency: string; // 'JPY'
  plan: string; // 'SunnyLearn Premium — 30 days'
  durationDays: number; // 30
  senderName: string; // 振込名義 (Furikomi Sender Name)
  transferDate: string; // 振込日 (Transfer Date)
  notes?: string;
  status: PaymentStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  emailNotificationStatus?: 'NOT_CONFIGURED' | 'QUEUED' | 'SENT' | 'FAILED';
  userNotified?: boolean;
}

export interface LevelCountDetails {
  totalVocab: number;
  accessibleVocab: number;
  lockedVocab: number;
  totalKanji: number;
  accessibleKanji: number;
  lockedKanji: number;
  totalGrammar: number;
  accessibleGrammar: number;
  lockedGrammar: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  authProvider?: 'email' | 'google';
  passwordHash?: string;
  selectedLevel: JLPTLevel | null;
  progress: UserProgress;
  createdAt: string;
  updatedAt: string;
  timezone?: string;
  notifiedAdmin?: boolean;
  isPremium?: boolean;
  premiumStartedAt?: string | null;
  premiumExpiresAt?: string | null;
  inAppNotification?: {
    id: string;
    type: 'premium_activated' | 'info';
    title: string;
    message: string;
    createdAt: string;
    read: boolean;
  } | null;
}

export interface DatabaseSchema {
  vocabulary: VocabularyItem[];
  kanji: KanjiItem[];
  grammar: GrammarItem[];
  exampleSentences: ExampleSentenceItem[];
  lessons: LessonItem[];
  reading: ReadingItem[];
  listening: ListeningItem[];
  quizzes: QuizSet[];
  categories: CategoryItem[];
  feedback: FeedbackItem[];
  users?: UserProfile[];
  payments?: PaymentRequestItem[];
  counts?: Record<JLPTLevel, LevelCountDetails>;
  aiUsageRecords?: Record<string, number[]>;
}

export interface SunnyAIQuizContext {
  question: string;
  questionReading?: string;
  userAnswer?: string;
  correctAnswer: string;
  options?: string[];
  explanation?: string;
  jlptLevel?: JLPTLevel;
}

export interface SunnyAIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  quizContext?: SunnyAIQuizContext;
}

export interface SunnyAIUsageStatus {
  isPremium: boolean;
  limit: number;
  used: number;
  remaining: number;
  resetInMs: number;
  resetInText: string;
  limitReached: boolean;
}

export interface AdminStats {
  totalVocab: number;
  totalKanji: number;
  totalGrammar: number;
  totalExamples: number;
  totalLessons: number;
  totalReading: number;
  totalListening: number;
  totalQuizzes: number;
  totalFeedback: number;
  unreadFeedback: number;
  pendingPayments?: number;
  totalPayments?: number;
  approvedPayments?: number;
  levelCounts: Record<JLPTLevel, { vocab: number; kanji: number; grammar: number; lessons: number }>;
}

export type MasteryStatus = 'unseen' | 'learning' | 'review_needed' | 'mastered';
export type ContentType = 'vocab' | 'kanji' | 'grammar' | 'sentence';

export interface ItemStudyRecord {
  itemId: string;
  itemType: ContentType;
  jlptLevel: JLPTLevel;
  timesEncountered: number;
  correctCount: number;
  incorrectCount: number;
  consecutiveCorrect: number;
  lastPracticedDate: string;
  masteryStatus: MasteryStatus;
}

export interface DailyActivityRecord {
  date: string; // YYYY-MM-DD
  itemCount: number;
  quizCount: number;
  practiceCount: number;
}

export interface QuizQuestionReview {
  id: string;
  type: ContentType;
  question: string;
  questionReading?: string;
  options: string[];
  userAnswerIndex: number;
  correctAnswerIndex: number;
  isCorrect: boolean;
  explanation?: string;
  itemId?: string;
}

export interface QuizAttemptRecord {
  id: string;
  category: 'vocab' | 'kanji' | 'grammar' | 'mixed';
  jlptLevel: JLPTLevel;
  score: number;
  total: number;
  percentage: number;
  categoryScores?: {
    vocab?: { score: number; total: number; percentage: number };
    kanji?: { score: number; total: number; percentage: number };
    grammar?: { score: number; total: number; percentage: number };
    sentence?: { score: number; total: number; percentage: number };
  };
  questions: QuizQuestionReview[];
  date: string;
}

export interface PracticeAttemptRecord {
  id: string;
  type: 'vocab' | 'kanji' | 'grammar' | 'sentence' | 'mixed' | 'review';
  jlptLevel: JLPTLevel;
  score: number;
  total: number;
  percentage: number;
  breakdown: {
    vocab?: { score: number; total: number };
    kanji?: { score: number; total: number };
    grammar?: { score: number; total: number };
    sentence?: { score: number; total: number };
  };
  missedItemIds: string[];
  date: string;
}

export interface DailyTaskProgress {
  vocabCount: number;
  kanjiCount: number;
  grammarCount: number;
  quizCount: number;
}

export interface GamificationProgress {
  totalXP: number;
  level: number;
  dailyDate: string; // YYYY-MM-DD in Asia/Tokyo
  dailyXP: number;
  dailyGoalXP: number; // default 20
  dailyGoalCompleted: boolean;
  dailyCelebratedDate?: string; // YYYY-MM-DD in Asia/Tokyo
  dailyTaskProgress: Record<JLPTLevel, DailyTaskProgress>;
  awardedItemIds: string[]; // Anti-farming: IDs of vocab/kanji/grammar that already awarded XP
  awardedQuizIds: string[]; // Anti-farming: IDs of completed quizzes that already awarded XP
  completedGoalDates: string[]; // YYYY-MM-DD dates in Asia/Tokyo when 20 XP was completed
  currentStreak: number;
  longestStreak: number;
  unlockedBadgeIds: string[];
}

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  iconName: string;
  category: 'streak' | 'xp' | 'learning' | 'special';
  target: number;
  isUnlocked: boolean;
  statusText: string;
  unlockedDate?: string;
}

export interface UserProgress {
  selectedLevel?: JLPTLevel | null;
  learnedVocabIds: string[];
  learnedKanjiIds: string[];
  learnedGrammarIds: string[];
  completedLessonIds: string[];
  completedReadingIds: string[];
  completedListeningIds: string[];
  quizResults: {
    quizId: string;
    score: number;
    total: number;
    date: string;
    jlptLevel: JLPTLevel;
  }[];
  // Extended history & item mastery tracking
  quizHistory?: QuizAttemptRecord[];
  practiceHistory?: PracticeAttemptRecord[];
  itemStudyRecords?: Record<string, ItemStudyRecord>;
  dailyActivity?: Record<string, DailyActivityRecord>;
  gamification?: GamificationProgress;
  favorites: {
    vocabIds: string[];
    kanjiIds: string[];
    grammarIds: string[];
    sentenceIds: string[];
  };
  streak: {
    current: number;
    longest?: number;
    lastActiveDate: string;
  };
  lastStudied?: {
    type: 'vocab' | 'kanji' | 'grammar' | 'lesson';
    id?: string;
    title?: string;
    level?: JLPTLevel;
    subTab?: LearnSubTab;
    date?: string;
  };
  updatedAt?: string;
  settings: {
    targetLevel: JLPTLevel;
    dailyGoalCount: number;
    speechRate: number; // 0.8 to 1.2
    autoPlayAudio: boolean;
    showFurigana: boolean;
  };
}
