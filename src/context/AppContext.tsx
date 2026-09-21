import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import {
  DatabaseSchema,
  JLPTLevel,
  MainTab,
  LearnSubTab,
  AdminSubTab,
  UserProgress,
  UserProfile,
  VocabularyItem,
  KanjiItem,
  GrammarItem,
  ExampleSentenceItem,
  LessonItem,
  ReadingItem,
  ListeningItem,
  QuizSet,
  FeedbackItem,
  ContentType,
  QuizAttemptRecord,
  PracticeAttemptRecord,
  PaymentRequestItem,
  AccessTier,
  SunnyAIQuizContext,
  SunnyAIUsageStatus
} from '../types';
import { apiService } from '../services/api';
import { storageService } from '../services/storage';
import { speechService } from '../services/speech';
import { learningEngine } from '../services/learningEngine';
import { freeTierSeedData } from '../data/accessControl';
import {
  awardItemLearned,
  awardQuizCompleted,
  getTokyoDateString
} from '../services/gamificationEngine';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface AppContextType {
  data: DatabaseSchema;
  isLoading: boolean;
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  learnSubTab: LearnSubTab;
  setLearnSubTab: (subTab: LearnSubTab) => void;
  selectedLevel: JLPTLevel | null;
  effectiveLevel: JLPTLevel;
  setSelectedLevel: (level: JLPTLevel | null) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  
  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (val: boolean) => void;

  // Google User Authentication & Cloud Sync
  currentUser: UserProfile | null;
  isUserLoading: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'offline' | 'error';
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isBannerDismissed: boolean;
  dismissBanner: () => void;
  loginWithGoogle: (payload: {
    credential?: string;
    email?: string;
    name?: string;
    picture?: string;
    timezone?: string;
  }) => Promise<boolean>;
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  registerWithEmail: (payload: {
    email: string;
    password: string;
    confirmPassword: string;
    name?: string;
  }) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  userLogout: () => Promise<void>;
  triggerSync: () => Promise<void>;

  // Content Gating & Permissions
  canAccessItem: (item: { jlptLevel: JLPTLevel; accessTier?: AccessTier }) => boolean;
  canAccessLevel: (level: JLPTLevel) => boolean;

  // Progress & Local tracking
  userProgress: UserProgress;
  toggleVocabLearned: (id: string) => void;
  toggleKanjiLearned: (id: string) => void;
  toggleGrammarLearned: (id: string) => void;
  toggleFavorite: (type: 'vocab' | 'kanji' | 'grammar' | 'sentence', id: string) => void;
  recordQuizScore: (quizId: string, score: number, total: number, level: JLPTLevel) => void;
  recordAnswer: (itemId: string, itemType: ContentType, level: JLPTLevel, isCorrect: boolean) => void;
  recordQuizCompleted: (attempt: QuizAttemptRecord) => void;
  recordPracticeCompleted: (attempt: PracticeAttemptRecord) => void;
  practiceMissedItems: string[];
  setPracticeMissedItems: (ids: string[]) => void;
  updateSettings: (settings: Partial<UserProgress['settings']>) => void;
  resetProgress: () => void;
  markDailyCelebrationSeen: () => void;

  // Audio Speech
  playAudio: (text: string, onStart?: () => void) => Promise<void> | void;
  stopAudio: () => void;

  // Admin session
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  adminSubTab: AdminSubTab;
  setAdminSubTab: (sub: AdminSubTab) => void;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  adminLogout: () => void;

  // Admin CRUD Content Management (Persistent on Central Database)
  addVocab: (item: Partial<VocabularyItem>) => Promise<VocabularyItem>;
  updateVocab: (item: Partial<VocabularyItem> & { id: string }) => Promise<VocabularyItem>;
  deleteVocab: (id: string) => Promise<void>;

  addKanji: (item: Partial<KanjiItem>) => Promise<KanjiItem>;
  updateKanji: (item: Partial<KanjiItem> & { id: string }) => Promise<KanjiItem>;
  deleteKanji: (id: string) => Promise<void>;

  addGrammar: (item: Partial<GrammarItem>) => Promise<GrammarItem>;
  updateGrammar: (item: Partial<GrammarItem> & { id: string }) => Promise<GrammarItem>;
  deleteGrammar: (id: string) => Promise<void>;

  addSentence: (item: Partial<ExampleSentenceItem>) => Promise<ExampleSentenceItem>;
  updateSentence: (item: Partial<ExampleSentenceItem> & { id: string }) => Promise<ExampleSentenceItem>;
  deleteSentence: (id: string) => Promise<void>;

  addLesson: (item: Partial<LessonItem>) => Promise<LessonItem>;
  updateLesson: (item: Partial<LessonItem> & { id: string }) => Promise<LessonItem>;
  deleteLesson: (id: string) => Promise<void>;

  addReading: (item: Partial<ReadingItem>) => Promise<ReadingItem>;
  updateReading: (item: Partial<ReadingItem> & { id: string }) => Promise<ReadingItem>;
  deleteReading: (id: string) => Promise<void>;

  addListening: (item: Partial<ListeningItem>) => Promise<ListeningItem>;
  updateListening: (item: Partial<ListeningItem> & { id: string }) => Promise<ListeningItem>;
  deleteListening: (id: string) => Promise<void>;

  addQuiz: (item: Partial<QuizSet>) => Promise<QuizSet>;
  updateQuiz: (item: Partial<QuizSet> & { id: string }) => Promise<QuizSet>;
  deleteQuiz: (id: string) => Promise<void>;

  // Feedback Management
  feedbackList: FeedbackItem[];
  loadFeedback: () => Promise<void>;
  deleteFeedback: (id: string) => Promise<void>;
  updateFeedbackStatus: (id: string, status: 'new' | 'read') => Promise<void>;

  // Premium & User Payments
  isPremium: boolean;
  premiumExpiresAt: string | null;
  inAppNotification: any | null;
  dismissInAppNotification: () => Promise<void>;
  userPayments: PaymentRequestItem[];
  latestPendingPayment: PaymentRequestItem | null;
  refreshUserPayments: () => Promise<void>;
  submitPaymentRequest: (payload: {
    senderName: string;
    transferDate: string;
    userName?: string;
    userEmail?: string;
    notes?: string;
  }) => Promise<{
    success: boolean;
    isDuplicate?: boolean;
    payment?: PaymentRequestItem;
    existingRequest?: PaymentRequestItem;
    message?: string;
    error?: string;
  }>;

  // Admin Payment Management
  adminPayments: PaymentRequestItem[];
  adminPaymentStats: {
    total: number;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    totalYenApproved: number;
  };
  loadAdminPayments: () => Promise<void>;
  approvePayment: (id: string) => Promise<void>;
  rejectPayment: (id: string, reason?: string) => Promise<void>;

  // Sunny AI Tutor
  isSunnyAIOpen: boolean;
  setIsSunnyAIOpen: (open: boolean) => void;
  sunnyAIQuizContext: SunnyAIQuizContext | null;
  setSunnyAIQuizContext: (context: SunnyAIQuizContext | null) => void;
  openSunnyAIWithQuiz: (context: SunnyAIQuizContext) => void;
  closeSunnyAI: () => void;
  sunnyAIUsage: SunnyAIUsageStatus | null;
  refreshSunnyAIUsage: () => Promise<void>;

  // Toast & refresh
  toasts: ToastMessage[];
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const ADMIN_EMAIL = 'sanaa0419z@gmail.com';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<DatabaseSchema>(freeTierSeedData);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [learnSubTab, setLearnSubTab] = useState<LearnSubTab>('vocab');
  
  // JLPT Level Selection (Can be null if not selected yet)
  const [selectedLevel, setSelectedLevelState] = useState<JLPTLevel | null>(() => {
    return storageService.getSelectedLevel();
  });
  const effectiveLevel: JLPTLevel = selectedLevel || 'N5';
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // User Authentication & Cloud Sync
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isUserLoading, setIsUserLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'offline' | 'error'>('idle');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(() => {
    return storageService.isBannerDismissed();
  });

  // Admin status: strictly derived from authenticated user's account/session (sanaa0419z@gmail.com)
  const isAdmin = useMemo(() => {
    if (!currentUser || !currentUser.email) return false;
    return currentUser.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
  }, [currentUser]);

  const setIsAdmin = useCallback((_val: boolean) => {
    // Admin status is derived strictly from currentUser.email === 'sanaa0419z@gmail.com'
  }, []);

  const [activeTab, setActiveTabState] = useState<MainTab>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace(/^\/|\/$/g, '').toLowerCase();
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const queryTab = (params.get('tab') || params.get('page') || '').toLowerCase();
      const target = hash || queryTab || path;
      if (target === 'admin') {
        return 'home'; // Never initialize on admin before auth confirmation
      }
      const validTabs: MainTab[] = ['home', 'learn', 'dictionary', 'practice', 'quiz', 'progress', 'profile', 'contact', 'premium', 'tutor', 'ai'];
      if (validTabs.includes(target as MainTab)) {
        return (target === 'tutor' ? 'ai' : target) as MainTab;
      }
    }
    return 'home';
  });

  const setActiveTab = useCallback((tab: MainTab) => {
    if (tab === 'admin' && !isAdmin) {
      setActiveTabState('home');
      if (typeof window !== 'undefined') {
        if (window.location.hash === '#admin' || window.location.search.includes('admin')) {
          window.history.replaceState(null, '', window.location.pathname || '/');
        }
      }
      return;
    }
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      if (tab === 'admin') {
        window.location.hash = '#admin';
      } else if (window.location.hash === '#admin') {
        window.history.replaceState(null, '', window.location.pathname || '/');
      }
    }
  }, [isAdmin]);

  const dismissBanner = useCallback(() => {
    setIsBannerDismissed(true);
    storageService.setBannerDismissed(true);
  }, []);

  const setSelectedLevel = useCallback((level: JLPTLevel | null) => {
    setSelectedLevelState(level);
    storageService.setSelectedLevel(level);
    if (apiService.isUserAuthenticated()) {
      apiService.syncUserProgress({ selectedLevel: level }).catch(() => {});
    }
  }, []);

  // Theme
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return storageService.getTheme() === 'dark';
  });

  // User Progress
  const [userProgress, setUserProgress] = useState<UserProgress>(() => {
    return storageService.getProgress();
  });
  const [practiceMissedItems, setPracticeMissedItems] = useState<string[]>([]);

  // Admin sub-navigation & Feedback List
  const [adminSubTab, setAdminSubTab] = useState<AdminSubTab>('stats');
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);

  // User and Admin Payments State
  const [userPayments, setUserPayments] = useState<PaymentRequestItem[]>([]);
  const [latestPendingPayment, setLatestPendingPayment] = useState<PaymentRequestItem | null>(null);
  const [adminPayments, setAdminPayments] = useState<PaymentRequestItem[]>([]);
  const [adminPaymentStats, setAdminPaymentStats] = useState<{
    total: number;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    totalYenApproved: number;
  }>({ total: 0, pendingCount: 0, approvedCount: 0, rejectedCount: 0, totalYenApproved: 0 });

  // Sunny AI Tutor State
  const [isSunnyAIOpen, setIsSunnyAIOpen] = useState<boolean>(false);
  const [sunnyAIQuizContext, setSunnyAIQuizContext] = useState<SunnyAIQuizContext | null>(null);
  const [sunnyAIUsage, setSunnyAIUsage] = useState<SunnyAIUsageStatus | null>(null);

  const refreshSunnyAIUsage = useCallback(async () => {
    try {
      const res = await apiService.getSunnyAIUsage();
      if (res && res.usage) {
        setSunnyAIUsage(res.usage);
      }
    } catch (e) {
      console.warn('Failed to fetch Sunny AI usage:', e);
    }
  }, []);

  useEffect(() => {
    refreshSunnyAIUsage();
  }, [refreshSunnyAIUsage, currentUser]);

  const openSunnyAIWithQuiz = useCallback((context: SunnyAIQuizContext) => {
    setSunnyAIQuizContext(context);
    setIsSunnyAIOpen(true);
  }, []);

  const closeSunnyAI = useCallback(() => {
    setIsSunnyAIOpen(false);
  }, []);

  const isPremium = useMemo(() => {
    if (!currentUser) return false;
    // Authorized admin email always retains full access
    if (currentUser.email && currentUser.email.toLowerCase().trim() === 'sanaa0419z@gmail.com') {
      return true;
    }
    if (!currentUser.isPremium) return false;
    if (currentUser.premiumExpiresAt) {
      return new Date(currentUser.premiumExpiresAt).getTime() > Date.now();
    }
    return true;
  }, [currentUser]);

  const premiumExpiresAt = currentUser?.premiumExpiresAt || null;
  const inAppNotification = currentUser?.inAppNotification || null;

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const fresh = await apiService.fetchPublicData();
      setData(fresh);
    } catch (e) {
      console.error('Failed to load public data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadFeedback = useCallback(async () => {
    if (!apiService.isAuthenticated()) return;
    try {
      const fb = await apiService.getAdminFeedback();
      setFeedbackList(fb);
    } catch (e) {
      console.error('Failed to load feedback:', e);
    }
  }, []);

  const loadAdminPayments = useCallback(async () => {
    if (!apiService.isAuthenticated()) return;
    try {
      const res = await apiService.getAdminPayments();
      if (res && res.success) {
        setAdminPayments(res.payments || []);
        setAdminPaymentStats(res.stats || {
          total: 0,
          pendingCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
          totalYenApproved: 0
        });
      }
    } catch (e) {
      console.warn('Error loading admin payments:', e);
    }
  }, []);

  // Check & restore user authentication on mount
  useEffect(() => {
    if (apiService.isUserAuthenticated()) {
      apiService.getCurrentUser()
        .then(res => {
          if (res && res.user) {
            setCurrentUser(res.user);
            const localProgress = storageService.getProgress();
            const merged = storageService.mergeProgress(localProgress, res.user.progress);
            storageService.saveProgress(merged);
            setUserProgress(merged);

            if (res.user.selectedLevel) {
              setSelectedLevelState(res.user.selectedLevel);
              storageService.setSelectedLevel(res.user.selectedLevel);
            } else if (localProgress.selectedLevel) {
              apiService.syncUserProgress({ selectedLevel: localProgress.selectedLevel }).catch(() => {});
            }
          }
        })
        .catch(err => {
          console.warn('User session check error:', err);
          apiService.setUserToken(null);
        })
        .finally(() => {
          setIsUserLoading(false);
        });
    } else {
      setIsUserLoading(false);
    }
  }, []);

  // Manual & Debounced sync
  const triggerSync = useCallback(async () => {
    if (!apiService.isUserAuthenticated()) return;
    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }
    try {
      setSyncStatus('syncing');
      await apiService.syncUserProgress({
        progress: userProgress,
        selectedLevel
      });
      setSyncStatus('synced');
    } catch (e) {
      console.warn('Sync error:', e);
      setSyncStatus('error');
    }
  }, [userProgress, selectedLevel]);

  // Debounced auto sync on changes
  useEffect(() => {
    if (!currentUser || !apiService.isUserAuthenticated()) return;
    const timer = setTimeout(() => {
      triggerSync();
    }, 1500);
    return () => clearTimeout(timer);
  }, [userProgress, selectedLevel, currentUser, triggerSync]);

  // Network connection listener for automatic reconnection sync
  useEffect(() => {
    const handleOnline = () => {
      if (apiService.isUserAuthenticated()) {
        triggerSync();
      }
    };
    const handleOffline = () => {
      if (apiService.isUserAuthenticated()) {
        setSyncStatus('offline');
      }
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerSync]);

  // Google Login handler
  const loginWithGoogle = useCallback(async (payload: {
    credential?: string;
    email?: string;
    name?: string;
    picture?: string;
    timezone?: string;
  }): Promise<boolean> => {
    try {
      const res = await apiService.loginWithGoogle({
        ...payload,
        localProgress: userProgress,
        localSelectedLevel: selectedLevel
      });
      if (res.user) {
        setCurrentUser(res.user);
        if (res.user.progress) {
          storageService.saveProgress(res.user.progress);
          setUserProgress(res.user.progress);
        }
        if (res.user.selectedLevel) {
          setSelectedLevelState(res.user.selectedLevel);
          storageService.setSelectedLevel(res.user.selectedLevel);
        }
        setSyncStatus('synced');
        setIsAuthModalOpen(false);
        showToast(
          res.isNew
            ? 'Амжилттай бүртгэгдлээ! Таны сургалтын явц төхөөрөмж хооронд найдвартай хадгалагдана.'
            : 'Тавтай морилно уу! Таны сургалтын явц синк хийгдлээ.',
          'success'
        );
        refreshData();
        return true;
      }
      return false;
    } catch (err: any) {
      showToast(err.message || 'Нэвтрэхэд алдаа гарлаа.', 'error');
      return false;
    }
  }, [userProgress, selectedLevel, showToast, refreshData]);

  // Email + Password Login
  const loginWithEmail = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await apiService.loginWithEmail({
        email,
        password,
        localProgress: userProgress,
        localSelectedLevel: selectedLevel
      });
      if (res.user) {
        setCurrentUser(res.user);
        if (res.user.progress) {
          storageService.saveProgress(res.user.progress);
          setUserProgress(res.user.progress);
        }
        if (res.user.selectedLevel) {
          setSelectedLevelState(res.user.selectedLevel);
          storageService.setSelectedLevel(res.user.selectedLevel);
        }
        setSyncStatus('synced');
        setIsAuthModalOpen(false);
        showToast('Амжилттай нэвтэрлээ. Тавтай морилно уу!', 'success');
        refreshData();
        return true;
      }
      return false;
    } catch (err: any) {
      showToast(err.message || 'Нэвтрэхэд алдаа гарлаа.', 'error');
      return false;
    }
  }, [userProgress, selectedLevel, showToast, refreshData]);

  // Email + Password Registration
  const registerWithEmail = useCallback(async (payload: {
    email: string;
    password: string;
    confirmPassword: string;
    name?: string;
  }): Promise<boolean> => {
    try {
      const res = await apiService.registerWithEmail({
        ...payload,
        localProgress: userProgress,
        localSelectedLevel: selectedLevel
      });
      if (res.user) {
        setCurrentUser(res.user);
        if (res.user.progress) {
          storageService.saveProgress(res.user.progress);
          setUserProgress(res.user.progress);
        }
        if (res.user.selectedLevel) {
          setSelectedLevelState(res.user.selectedLevel);
          storageService.setSelectedLevel(res.user.selectedLevel);
        }
        setSyncStatus('synced');
        setIsAuthModalOpen(false);
        showToast('Бүртгэл амжилттай үүслээ! SunnyLearn-д тавтай морилно уу.', 'success');
        refreshData();
        return true;
      }
      return false;
    } catch (err: any) {
      showToast(err.message || 'Бүртгүүлэхэд алдаа гарлаа.', 'error');
      return false;
    }
  }, [userProgress, selectedLevel, showToast, refreshData]);

  // Forgot Password
  const forgotPassword = useCallback(async (email: string) => {
    try {
      const res = await apiService.forgotPassword(email);
      showToast(res.message || 'Хүсэлт илгээгдлээ.', 'info');
      return res;
    } catch (err: any) {
      showToast(err.message || 'Алдаа гарлаа.', 'error');
      return { success: false, message: err.message };
    }
  }, [showToast]);

  // Content Gating and Access Permissions
  const canAccessItem = useCallback((item: { jlptLevel: JLPTLevel; accessTier?: AccessTier }): boolean => {
    if (isAdmin || isPremium) return true;
    if (item.jlptLevel === 'N5') return true;
    return item.accessTier === 'FREE';
  }, [isAdmin, isPremium]);

  const canAccessLevel = useCallback((level: JLPTLevel): boolean => {
    if (isAdmin || isPremium) return true;
    if (level === 'N5') return true;
    return false;
  }, [isAdmin, isPremium]);

  // User Logout
  const userLogout = useCallback(async () => {
    try {
      await apiService.logoutUser();
    } finally {
      setCurrentUser(null);
      setActiveTabState('home');
      if (typeof window !== 'undefined') {
        if (window.location.hash === '#admin' || window.location.search.includes('admin')) {
          window.history.replaceState(null, '', window.location.pathname || '/');
        }
      }
      setData(freeTierSeedData);
      setSyncStatus('idle');
      storageService.clearProgress();
      const fresh = storageService.getProgress();
      setUserProgress(fresh);
      setSelectedLevelState(null);
      storageService.setSelectedLevel(null);
      showToast('Амжилттай гарлаа.', 'info');
      refreshData();
    }
  }, [showToast, refreshData]);

  // Initial load
  useEffect(() => {
    refreshData();

    // Apply theme to document and body
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [refreshData, isDarkMode]);

  // Automatically load admin data when authenticated as sanaa0419z@gmail.com
  useEffect(() => {
    if (isAdmin) {
      loadFeedback();
      loadAdminPayments();
    }
  }, [isAdmin, loadFeedback, loadAdminPayments]);

  // Route security: listen for hash and navigation events to protect Admin URL
  useEffect(() => {
    const handleUrlCheck = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const queryTab = (params.get('tab') || params.get('page') || '').toLowerCase();
      const pathname = window.location.pathname.toLowerCase();

      const isTargetingAdmin = hash === 'admin' || queryTab === 'admin' || pathname.endsWith('/admin');
      if (isTargetingAdmin) {
        if (!isAdmin) {
          if (!isUserLoading) {
            setActiveTabState('home');
            window.history.replaceState(null, '', '/');
          }
        } else {
          setActiveTabState('admin');
        }
      }
    };

    handleUrlCheck();
    window.addEventListener('hashchange', handleUrlCheck);
    window.addEventListener('popstate', handleUrlCheck);
    return () => {
      window.removeEventListener('hashchange', handleUrlCheck);
      window.removeEventListener('popstate', handleUrlCheck);
    };
  }, [isAdmin, isUserLoading]);

  // Guard activeTab if admin status changes (e.g. user logs out)
  useEffect(() => {
    if (activeTab === 'admin' && !isAdmin && !isUserLoading) {
      setActiveTabState('home');
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', '/');
      }
    }
  }, [activeTab, isAdmin, isUserLoading]);

  const setDarkMode = useCallback((val: boolean) => {
    setIsDarkMode(val);
    storageService.setTheme(val ? 'dark' : 'light');
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const next = !prev;
      storageService.setTheme(next ? 'dark' : 'light');
      return next;
    });
  }, []);

  // Audio helper
  const playAudio = useCallback(async (text: string, onStart?: () => void): Promise<void> => {
    try {
      await speechService.speak(text, userProgress.settings?.speechRate || 0.9, onStart);
    } catch (e) {
      console.warn('playAudio call error caught:', e);
    }
  }, [userProgress.settings?.speechRate]);

  const stopAudio = useCallback(() => {
    try {
      speechService.stop();
    } catch (e) {
      console.warn('stopAudio call error caught:', e);
    }
  }, []);

  // Progress helpers
  const toggleVocabLearned = useCallback((id: string) => {
    const isLearned = storageService.toggleVocabLearned(id);
    let progress = storageService.getProgress();

    if (isLearned) {
      const item = data.vocabulary.find(v => v.id === id);
      const level = item?.jlptLevel || selectedLevel || 'N5';
      const res = awardItemLearned(progress, id, 'vocab', level);
      progress = res.updatedProgress;
      storageService.saveProgress(progress);
      if (res.newlyReachedDailyGoal) {
        showToast('🎉 Өнөөдрийн 20 XP зорилго биеллээ! 🔥 Streak нэмэгдлээ!', 'success');
      } else if (res.awardedXP > 0) {
        showToast(`+${res.awardedXP} XP • Үгийг цээжилсэнд тэмдэглэлээ!`, 'success');
      } else {
        showToast('Үгийг цээжилсэнд тэмдэглэлээ!', 'success');
      }
    } else {
      showToast('Цээжилсэн жагсаалтаас хаслаа.', 'info');
    }
    setUserProgress(progress);
  }, [data.vocabulary, selectedLevel, showToast]);

  const toggleKanjiLearned = useCallback((id: string) => {
    const isLearned = storageService.toggleKanjiLearned(id);
    let progress = storageService.getProgress();

    if (isLearned) {
      const item = data.kanji.find(k => k.id === id);
      const level = item?.jlptLevel || selectedLevel || 'N5';
      const res = awardItemLearned(progress, id, 'kanji', level);
      progress = res.updatedProgress;
      storageService.saveProgress(progress);
      if (res.newlyReachedDailyGoal) {
        showToast('🎉 Өнөөдрийн 20 XP зорилго биеллээ! 🔥 Streak нэмэгдлээ!', 'success');
      } else if (res.awardedXP > 0) {
        showToast(`+${res.awardedXP} XP • Ханзыг сурсанд тэмдэглэлээ!`, 'success');
      } else {
        showToast('Ханзыг сурсанд тэмдэглэлээ!', 'success');
      }
    } else {
      showToast('Сурсан жагсаалтаас хаслаа.', 'info');
    }
    setUserProgress(progress);
  }, [data.kanji, selectedLevel, showToast]);

  const toggleGrammarLearned = useCallback((id: string) => {
    const isLearned = storageService.toggleGrammarLearned(id);
    let progress = storageService.getProgress();

    if (isLearned) {
      const item = data.grammar.find(g => g.id === id);
      const level = item?.jlptLevel || selectedLevel || 'N5';
      const res = awardItemLearned(progress, id, 'grammar', level);
      progress = res.updatedProgress;
      storageService.saveProgress(progress);
      if (res.newlyReachedDailyGoal) {
        showToast('🎉 Өнөөдрийн 20 XP зорилго биеллээ! 🔥 Streak нэмэгдлээ!', 'success');
      } else if (res.awardedXP > 0) {
        showToast(`+${res.awardedXP} XP • Дүрмийг эзэмшсэнд тэмдэглэлээ!`, 'success');
      } else {
        showToast('Дүрмийг эзэмшсэнд тэмдэглэлээ!', 'success');
      }
    } else {
      showToast('Эзэмшсэн жагсаалтаас хаслаа.', 'info');
    }
    setUserProgress(progress);
  }, [data.grammar, selectedLevel, showToast]);

  const toggleFavorite = useCallback((type: 'vocab' | 'kanji' | 'grammar' | 'sentence', id: string) => {
    const isFav = storageService.toggleFavorite(type, id);
    setUserProgress(storageService.getProgress());
    showToast(isFav ? 'Хадгалсан жагсаалтад нэмэгдлээ!' : 'Хадгалсан жагсаалтаас хасагдлаа.', 'info');
  }, [showToast]);

  const recordQuizScore = useCallback((quizId: string, score: number, total: number, level: JLPTLevel) => {
    storageService.recordQuizScore(quizId, score, total, level);
    setUserProgress(storageService.getProgress());
  }, []);

  const recordAnswer = useCallback((itemId: string, itemType: ContentType, level: JLPTLevel, isCorrect: boolean) => {
    setUserProgress(prev => {
      let updated = learningEngine.recordAnswer(prev, itemId, itemType, level, isCorrect);
      if (isCorrect) {
        updated = storageService.recordLearningAction(updated);
      }
      storageService.saveProgress(updated);
      return updated;
    });
  }, []);

  const recordQuizCompleted = useCallback((attempt: QuizAttemptRecord) => {
    setUserProgress(prev => {
      let updated = learningEngine.recordQuizCompleted(prev, attempt);
      const res = awardQuizCompleted(updated, attempt.id, attempt.jlptLevel, attempt.total);
      updated = res.updatedProgress;
      if (res.newlyReachedDailyGoal) {
        showToast('🎉 Өнөөдрийн 20 XP зорилго биеллээ! 🔥 Streak нэмэгдлээ!', 'success');
      } else if (res.awardedXP > 0) {
        showToast(`+${res.awardedXP} XP • Сорил амжилттай дууслаа!`, 'success');
      }
      storageService.saveProgress(updated);
      return updated;
    });
  }, [showToast]);

  const recordPracticeCompleted = useCallback((attempt: PracticeAttemptRecord) => {
    setUserProgress(prev => {
      let updated = learningEngine.recordPracticeCompleted(prev, attempt);
      updated = storageService.recordLearningAction(updated);
      storageService.saveProgress(updated);
      return updated;
    });
  }, []);

  const markDailyCelebrationSeen = useCallback(() => {
    setUserProgress(prev => {
      if (!prev.gamification) return prev;
      const todayTokyo = getTokyoDateString();
      const updated: UserProgress = {
        ...prev,
        gamification: {
          ...prev.gamification,
          dailyCelebratedDate: todayTokyo
        }
      };
      storageService.saveProgress(updated);
      return updated;
    });
  }, []);

  const updateSettings = useCallback((newSettings: Partial<UserProgress['settings']>) => {
    const current = storageService.getProgress();
    const updated = {
      ...current,
      settings: {
        ...current.settings,
        ...newSettings
      }
    };
    storageService.saveProgress(updated);
    setUserProgress(updated);
    showToast('Тохиргоо шинэчлэгдлээ.', 'success');
  }, [showToast]);

  const resetProgress = useCallback(() => {
    const current = storageService.getProgress();
    const fresh: UserProgress = {
      ...current,
      learnedVocabIds: [],
      learnedKanjiIds: [],
      learnedGrammarIds: [],
      completedLessonIds: [],
      completedReadingIds: [],
      completedListeningIds: [],
      quizResults: [],
      favorites: {
        vocabIds: [],
        kanjiIds: [],
        grammarIds: [],
        sentenceIds: []
      }
    };
    storageService.saveProgress(fresh);
    setUserProgress(fresh);
    showToast('Таны сургалтын явц амжилттай шинэчлэгдлээ.', 'info');
  }, [showToast]);

  const adminLogin = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await apiService.adminLogin(email, password);
      if (res && res.success) {
        setIsAdmin(true);
        setActiveTab('admin');
        loadFeedback();
        refreshData();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Admin login error:', err);
      return false;
    }
  }, [loadFeedback, refreshData]);

  const adminLogout = useCallback(() => {
    apiService.adminLogout();
    setActiveTabState('home');
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#admin' || window.location.search.includes('admin')) {
        window.history.replaceState(null, '', window.location.pathname || '/');
      }
    }
    showToast('Админ самбараас гарлаа.', 'info');
  }, [showToast]);

  // ----------------------------------------------------
  // ADMIN CRUD OPERATIONS (Synchronized with Backend DB)
  // ----------------------------------------------------

  // Vocabulary
  const addVocab = useCallback(async (item: Partial<VocabularyItem>) => {
    const newItem = await apiService.addVocab(item);
    setData(prev => ({
      ...prev,
      vocabulary: [newItem, ...(prev.vocabulary || [])]
    }));
    refreshData();
    return newItem;
  }, [refreshData]);

  const updateVocab = useCallback(async (item: Partial<VocabularyItem> & { id: string }) => {
    const updated = await apiService.updateVocab(item.id, item);
    setData(prev => ({
      ...prev,
      vocabulary: (prev.vocabulary || []).map(v => v.id === item.id ? updated : v)
    }));
    refreshData();
    return updated;
  }, [refreshData]);

  const deleteVocab = useCallback(async (id: string) => {
    await apiService.deleteVocab(id);
    setData(prev => ({
      ...prev,
      vocabulary: (prev.vocabulary || []).filter(v => v.id !== id)
    }));
    refreshData();
  }, [refreshData]);

  // Kanji
  const addKanji = useCallback(async (item: Partial<KanjiItem>) => {
    const newItem = await apiService.addKanji(item);
    setData(prev => ({
      ...prev,
      kanji: [newItem, ...(prev.kanji || [])]
    }));
    refreshData();
    return newItem;
  }, [refreshData]);

  const updateKanji = useCallback(async (item: Partial<KanjiItem> & { id: string }) => {
    const updated = await apiService.updateKanji(item.id, item);
    setData(prev => ({
      ...prev,
      kanji: (prev.kanji || []).map(k => k.id === item.id ? updated : k)
    }));
    refreshData();
    return updated;
  }, [refreshData]);

  const deleteKanji = useCallback(async (id: string) => {
    await apiService.deleteKanji(id);
    setData(prev => ({
      ...prev,
      kanji: (prev.kanji || []).filter(k => k.id !== id)
    }));
    refreshData();
  }, [refreshData]);

  // Grammar
  const addGrammar = useCallback(async (item: Partial<GrammarItem>) => {
    const newItem = await apiService.addGrammar(item);
    setData(prev => ({
      ...prev,
      grammar: [newItem, ...(prev.grammar || [])]
    }));
    refreshData();
    return newItem;
  }, [refreshData]);

  const updateGrammar = useCallback(async (item: Partial<GrammarItem> & { id: string }) => {
    const updated = await apiService.updateGrammar(item.id, item);
    setData(prev => ({
      ...prev,
      grammar: (prev.grammar || []).map(g => g.id === item.id ? updated : g)
    }));
    refreshData();
    return updated;
  }, [refreshData]);

  const deleteGrammar = useCallback(async (id: string) => {
    await apiService.deleteGrammar(id);
    setData(prev => ({
      ...prev,
      grammar: (prev.grammar || []).filter(g => g.id !== id)
    }));
    refreshData();
  }, [refreshData]);

  // Example Sentences
  const addSentence = useCallback(async (item: Partial<ExampleSentenceItem>) => {
    const newItem = await apiService.addExample(item);
    setData(prev => ({
      ...prev,
      exampleSentences: [newItem, ...(prev.exampleSentences || [])]
    }));
    refreshData();
    return newItem;
  }, [refreshData]);

  const updateSentence = useCallback(async (item: Partial<ExampleSentenceItem> & { id: string }) => {
    const updated = await apiService.updateExample(item.id, item);
    setData(prev => ({
      ...prev,
      exampleSentences: (prev.exampleSentences || []).map(s => s.id === item.id ? updated : s)
    }));
    refreshData();
    return updated;
  }, [refreshData]);

  const deleteSentence = useCallback(async (id: string) => {
    await apiService.deleteExample(id);
    setData(prev => ({
      ...prev,
      exampleSentences: (prev.exampleSentences || []).filter(s => s.id !== id)
    }));
    refreshData();
  }, [refreshData]);

  // Lessons
  const addLesson = useCallback(async (item: Partial<LessonItem>) => {
    const newItem = await apiService.addLesson(item);
    setData(prev => ({
      ...prev,
      lessons: [newItem, ...(prev.lessons || [])]
    }));
    refreshData();
    return newItem;
  }, [refreshData]);

  const updateLesson = useCallback(async (item: Partial<LessonItem> & { id: string }) => {
    const updated = await apiService.updateLesson(item.id, item);
    setData(prev => ({
      ...prev,
      lessons: (prev.lessons || []).map(l => l.id === item.id ? updated : l)
    }));
    refreshData();
    return updated;
  }, [refreshData]);

  const deleteLesson = useCallback(async (id: string) => {
    await apiService.deleteLesson(id);
    setData(prev => ({
      ...prev,
      lessons: (prev.lessons || []).filter(l => l.id !== id)
    }));
    refreshData();
  }, [refreshData]);

  // Reading
  const addReading = useCallback(async (item: Partial<ReadingItem>) => {
    const newItem = await apiService.addReading(item);
    setData(prev => ({
      ...prev,
      reading: [newItem, ...(prev.reading || [])]
    }));
    refreshData();
    return newItem;
  }, [refreshData]);

  const updateReading = useCallback(async (item: Partial<ReadingItem> & { id: string }) => {
    const updated = await apiService.updateReading(item.id, item);
    setData(prev => ({
      ...prev,
      reading: (prev.reading || []).map(r => r.id === item.id ? updated : r)
    }));
    refreshData();
    return updated;
  }, [refreshData]);

  const deleteReading = useCallback(async (id: string) => {
    await apiService.deleteReading(id);
    setData(prev => ({
      ...prev,
      reading: (prev.reading || []).filter(r => r.id !== id)
    }));
    refreshData();
  }, [refreshData]);

  // Listening
  const addListening = useCallback(async (item: Partial<ListeningItem>) => {
    const newItem = await apiService.addListening(item);
    setData(prev => ({
      ...prev,
      listening: [newItem, ...(prev.listening || [])]
    }));
    refreshData();
    return newItem;
  }, [refreshData]);

  const updateListening = useCallback(async (item: Partial<ListeningItem> & { id: string }) => {
    const updated = await apiService.updateListening(item.id, item);
    setData(prev => ({
      ...prev,
      listening: (prev.listening || []).map(li => li.id === item.id ? updated : li)
    }));
    refreshData();
    return updated;
  }, [refreshData]);

  const deleteListening = useCallback(async (id: string) => {
    await apiService.deleteListening(id);
    setData(prev => ({
      ...prev,
      listening: (prev.listening || []).filter(li => li.id !== id)
    }));
    refreshData();
  }, [refreshData]);

  // Quizzes
  const addQuiz = useCallback(async (item: Partial<QuizSet>) => {
    const newItem = await apiService.addQuiz(item);
    setData(prev => ({
      ...prev,
      quizzes: [newItem, ...(prev.quizzes || [])]
    }));
    refreshData();
    return newItem;
  }, [refreshData]);

  const updateQuiz = useCallback(async (item: Partial<QuizSet> & { id: string }) => {
    const updated = await apiService.updateQuiz(item.id, item);
    setData(prev => ({
      ...prev,
      quizzes: (prev.quizzes || []).map(q => q.id === item.id ? updated : q)
    }));
    refreshData();
    return updated;
  }, [refreshData]);

  const deleteQuiz = useCallback(async (id: string) => {
    await apiService.deleteQuiz(id);
    setData(prev => ({
      ...prev,
      quizzes: (prev.quizzes || []).filter(q => q.id !== id)
    }));
    refreshData();
  }, [refreshData]);

  // Feedback
  const deleteFeedback = useCallback(async (id: string) => {
    await apiService.deleteFeedback(id);
    setFeedbackList(prev => prev.filter(f => f.id !== id));
  }, []);

  const updateFeedbackStatus = useCallback(async (id: string, _status: 'new' | 'read') => {
    await apiService.markFeedbackRead(id);
    setFeedbackList(prev =>
      prev.map(f => (f.id === id ? { ...f, status: 'read' as const } : f))
    );
  }, []);

  // ----------------------------------------------------
  // PAYMENT & PREMIUM HANDLERS
  // ----------------------------------------------------

  const refreshUserPayments = useCallback(async () => {
    try {
      const email = currentUser?.email;
      const res = await apiService.getMyPaymentStatus(email);
      if (res && res.success) {
        setUserPayments(res.payments || []);
        setLatestPendingPayment(res.latestPending || null);
        if (res.isPremium !== undefined && currentUser) {
          setCurrentUser(prev => prev ? {
            ...prev,
            isPremium: res.isPremium,
            premiumExpiresAt: res.premiumExpiresAt,
            inAppNotification: res.inAppNotification
          } : prev);
        }
      }
    } catch (e) {
      console.warn('Error refreshing user payments:', e);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.email) {
      refreshUserPayments();
    }
  }, [currentUser?.email, refreshUserPayments]);

  const dismissInAppNotification = useCallback(async () => {
    try {
      await apiService.dismissInAppNotification();
      if (currentUser?.inAppNotification) {
        setCurrentUser(prev => prev ? {
          ...prev,
          inAppNotification: { ...prev.inAppNotification!, read: true }
        } : prev);
      }
    } catch (e) {
      console.warn('Error dismissing in-app notification:', e);
    }
  }, [currentUser]);

  const submitPaymentRequest = useCallback(async (payload: {
    senderName: string;
    transferDate: string;
    userName?: string;
    userEmail?: string;
    notes?: string;
  }) => {
    const res = await apiService.submitPaymentRequest({
      ...payload,
      userName: payload.userName || currentUser?.name,
      userEmail: payload.userEmail || currentUser?.email
    });
    if (res.payment) {
      setUserPayments(prev => [res.payment!, ...prev]);
      setLatestPendingPayment(res.payment);
    } else if (res.existingRequest) {
      setLatestPendingPayment(res.existingRequest);
    }
    return res;
  }, [currentUser]);

  const approvePayment = useCallback(async (id: string) => {
    const res = await apiService.approvePayment(id);
    showToast('Төлбөрийг амжилттай баталгаажуулж, хэрэглэгчийн эрхийг 30 хоногоор нээлээ!', 'success');
    await loadAdminPayments();
    if (currentUser && (res.payment.userId === currentUser.id || res.payment.userEmail.toLowerCase() === currentUser.email.toLowerCase())) {
      await refreshUserPayments();
    }
  }, [showToast, loadAdminPayments, currentUser, refreshUserPayments]);

  const rejectPayment = useCallback(async (id: string, reason?: string) => {
    await apiService.rejectPayment(id, reason);
    showToast('Төлбөрийн хүсэлтийг буцаалаа.', 'info');
    await loadAdminPayments();
  }, [showToast, loadAdminPayments]);

  return (
    <AppContext.Provider
      value={{
        data,
        isLoading,
        activeTab,
        setActiveTab,
        learnSubTab,
        setLearnSubTab,
        selectedLevel,
        effectiveLevel,
        setSelectedLevel,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        isSearchOpen,
        setIsSearchOpen,
        isDarkMode,
        toggleDarkMode,
        setDarkMode,
        currentUser,
        isUserLoading,
        syncStatus,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isBannerDismissed,
        dismissBanner,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        forgotPassword,
        userLogout,
        triggerSync,
        canAccessItem,
        canAccessLevel,
        userProgress,
        toggleVocabLearned,
        toggleKanjiLearned,
        toggleGrammarLearned,
        toggleFavorite,
        recordQuizScore,
        recordAnswer,
        recordQuizCompleted,
        recordPracticeCompleted,
        practiceMissedItems,
        setPracticeMissedItems,
        updateSettings,
        resetProgress,
        markDailyCelebrationSeen,
        playAudio,
        stopAudio,
        isAdmin,
        setIsAdmin,
        adminSubTab,
        setAdminSubTab,
        adminLogin,
        adminLogout,
        addVocab,
        updateVocab,
        deleteVocab,
        addKanji,
        updateKanji,
        deleteKanji,
        addGrammar,
        updateGrammar,
        deleteGrammar,
        addSentence,
        updateSentence,
        deleteSentence,
        addLesson,
        updateLesson,
        deleteLesson,
        addReading,
        updateReading,
        deleteReading,
        addListening,
        updateListening,
        deleteListening,
        addQuiz,
        updateQuiz,
        deleteQuiz,
        feedbackList,
        loadFeedback,
        deleteFeedback,
        updateFeedbackStatus,
        isPremium,
        premiumExpiresAt,
        inAppNotification,
        dismissInAppNotification,
        userPayments,
        latestPendingPayment,
        refreshUserPayments,
        submitPaymentRequest,
        adminPayments,
        adminPaymentStats,
        loadAdminPayments,
        approvePayment,
        rejectPayment,
        isSunnyAIOpen,
        setIsSunnyAIOpen,
        sunnyAIQuizContext,
        setSunnyAIQuizContext,
        openSunnyAIWithQuiz,
        closeSunnyAI,
        sunnyAIUsage,
        refreshSunnyAIUsage,
        toasts,
        showToast,
        removeToast,
        refreshData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
