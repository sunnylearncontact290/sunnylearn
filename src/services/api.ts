import {
  DatabaseSchema,
  FeedbackItem,
  FeedbackType,
  AdminStats,
  VocabularyItem,
  KanjiItem,
  GrammarItem,
  ExampleSentenceItem,
  LessonItem,
  ReadingItem,
  ListeningItem,
  QuizSet,
  CategoryItem,
  UserProfile,
  UserProgress,
  JLPTLevel,
  PaymentRequestItem,
  SunnyAIUsageStatus,
  SunnyAIQuizContext
} from '../types';
import { freeTierSeedData } from '../data/accessControl';

const TOKEN_KEY = 'nihongo_admin_auth_token_v1';
const USER_TOKEN_KEY = 'nihongo_user_auth_token_v1';
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

class ApiService {
  private token: string | null = null;
  private userToken: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
      this.userToken = localStorage.getItem(USER_TOKEN_KEY);
    }
  }

  private async parseJsonResponse<T = any>(res: Response, defaultError: string): Promise<T> {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text().catch(() => '');
      if (!res.ok) {
        throw new Error(text.length > 0 && text.length < 150 ? text : defaultError);
      }
      throw new Error(defaultError);
    }
    try {
      const data = await res.json();
      return data as T;
    } catch {
      throw new Error(defaultError);
    }
  }

  public setUserToken(token: string | null) {
    this.userToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(USER_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(USER_TOKEN_KEY);
      }
    }
  }

  public getUserToken(): string | null {
    return this.userToken;
  }

  public isUserAuthenticated(): boolean {
    return !!this.userToken;
  }

  private getUserAuthHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.userToken) {
      headers['Authorization'] = `Bearer ${this.userToken}`;
    }
    return headers;
  }

  // Email/Password Registration
  public async registerWithEmail(payload: {
    email: string;
    password: string;
    confirmPassword: string;
    name?: string;
    timezone?: string;
    localProgress?: UserProgress;
    localSelectedLevel?: JLPTLevel | null;
  }): Promise<{
    success: boolean;
    isNew: boolean;
    token: string;
    user: UserProfile;
  }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await this.parseJsonResponse<{
      success: boolean;
      isNew: boolean;
      token: string;
      user: UserProfile;
      error?: string;
    }>(res, 'Бүртгүүлэхэд алдаа гарлаа.');
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Бүртгүүлэхэд алдаа гарлаа.');
    }
    this.setUserToken(data.token);
    return data;
  }

  // Email/Password Login
  public async loginWithEmail(payload: {
    email: string;
    password: string;
    localProgress?: UserProgress;
    localSelectedLevel?: JLPTLevel | null;
  }): Promise<{
    success: boolean;
    token: string;
    user: UserProfile;
  }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await this.parseJsonResponse<{
      success: boolean;
      token: string;
      user: UserProfile;
      error?: string;
    }>(res, 'Нэвтрэхэд алдаа гарлаа.');
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Имэйл эсвэл нууц үг буруу байна.');
    }
    this.setUserToken(data.token);
    return data;
  }

  // Forgot Password
  public async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return this.parseJsonResponse<{ success: boolean; message: string }>(res, 'Имэйл илгээхэд алдаа гарлаа.');
  }

  // Google Sign-In & Registration
  public async loginWithGoogle(payload: {
    credential?: string;
    email?: string;
    name?: string;
    picture?: string;
    timezone?: string;
    localProgress?: UserProgress;
    localSelectedLevel?: JLPTLevel | null;
  }): Promise<{
    success: boolean;
    isNew: boolean;
    token: string;
    user: UserProfile;
  }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await this.parseJsonResponse<{
      success: boolean;
      isNew: boolean;
      token: string;
      user: UserProfile;
      error?: string;
    }>(res, 'Google-ээр нэвтрэхэд алдаа гарлаа.');
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Google-ээр нэвтрэхэд алдаа гарлаа.');
    }
    this.setUserToken(data.token);
    return data;
  }

  // Fetch current user profile & cloud progress
  public async getUserProgress(): Promise<{
    success: boolean;
    selectedLevel: JLPTLevel | null;
    progress: UserProgress;
    updatedAt: string;
  }> {
    if (!this.userToken) throw new Error('Хэрэглэгч нэвтрээгүй байна.');
    const res = await fetch(`${API_BASE_URL}/api/user/progress`, {
      headers: this.getUserAuthHeaders()
    });
    if (!res.ok) {
      if (res.status === 401) {
        this.setUserToken(null);
      }
      throw new Error('Хэрэглэгчийн явц татахад алдаа гарлаа.');
    }
    return this.parseJsonResponse(res, 'Хэрэглэгчийн явц татахад алдаа гарлаа.');
  }

  // Sync user progress & level to cloud
  public async syncUserProgress(payload: {
    selectedLevel?: JLPTLevel | null;
    progress?: Partial<UserProgress>;
    clientUpdatedAt?: string;
  }): Promise<{
    success: boolean;
    selectedLevel: JLPTLevel | null;
    progress: UserProgress;
    updatedAt: string;
  }> {
    if (!this.userToken) throw new Error('Хэрэглэгч нэвтрээгүй байна.');
    const res = await fetch(`${API_BASE_URL}/api/user/progress`, {
      method: 'POST',
      headers: this.getUserAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      if (res.status === 401) {
        this.setUserToken(null);
      }
      throw new Error('Явц серверт хадгалахад алдаа гарлаа.');
    }
    return this.parseJsonResponse(res, 'Явц хадгалахад алдаа гарлаа.');
  }

  // Get current logged-in user details
  public async getCurrentUser(): Promise<{
    success: boolean;
    user: UserProfile;
  }> {
    if (!this.userToken) throw new Error('Нэвтрээгүй.');
    const res = await fetch(`${API_BASE_URL}/api/user/me`, {
      headers: this.getUserAuthHeaders()
    });
    if (!res.ok) {
      if (res.status === 401) {
        this.setUserToken(null);
      }
      throw new Error('Хэрэглэгчийн мэдээлэл авахад алдаа гарлаа.');
    }
    return this.parseJsonResponse(res, 'Хэрэглэгчийн мэдээлэл авахад алдаа гарлаа.');
  }

  // User Logout
  public async logoutUser(): Promise<void> {
    try {
      if (this.userToken) {
        await fetch(`${API_BASE_URL}/api/user/logout`, {
          method: 'POST',
          headers: this.getUserAuthHeaders()
        }).catch(() => {});
      }
    } finally {
      this.setUserToken(null);
    }
  }

  public setToken(token: string | null, remember: boolean = true) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        if (remember) {
          localStorage.setItem(TOKEN_KEY, token);
        } else {
          sessionStorage.setItem(TOKEN_KEY, token);
        }
      } else {
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
      }
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public isAuthenticated(): boolean {
    return !!(this.token || this.userToken);
  }

  private getAuthHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    const activeToken = this.token || this.userToken;
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }
    return headers;
  }

  // Fetch all learning data (respecting user access tier)
  public async fetchPublicData(): Promise<DatabaseSchema> {
    try {
      const headers: Record<string, string> = {};
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      } else if (this.userToken) {
        headers['Authorization'] = `Bearer ${this.userToken}`;
      }
      const res = await fetch(`${API_BASE_URL}/api/data`, { headers });
      if (!res.ok) throw new Error('Серверээс өгөгдөл татахад алдаа гарлаа.');
      const data = await this.parseJsonResponse<DatabaseSchema>(res, 'Өгөгдөл хөрвүүлэхэд алдаа гарлаа.');
      return {
        ...freeTierSeedData,
        ...data
      };
    } catch (err) {
      console.warn('Using client fallback free-tier seed data (Fail Closed):', err);
      return freeTierSeedData;
    }
  }

  // Submit Feedback (Бидэнтэй холбогдох)
  public async submitFeedback(payload: {
    name?: string;
    email?: string;
    type: FeedbackType;
    message: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await this.parseJsonResponse<{ success: boolean; message: string; error?: string }>(
      res,
      'Санал хүсэлт илгээхэд алдаа гарлаа.'
    );
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Санал хүсэлт илгээхэд алдаа гарлаа.');
    }
    return data;
  }

  // Admin Login
  public async adminLogin(email: string, password: string): Promise<{ success: boolean; token: string }> {
    const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await this.parseJsonResponse<{ success: boolean; token: string; error?: string }>(
      res,
      'Нэвтрэхэд алдаа гарлаа.'
    );
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Имэйл эсвэл нууц үг буруу байна.');
    }
    this.setToken(data.token, true);
    return data;
  }

  // Admin Logout
  public adminLogout() {
    this.setToken(null);
  }

  // Verify Admin Session - FAIL CLOSED: Must be 200 JSON with success: true and verified email
  public async verifyAdmin(): Promise<boolean> {
    const activeToken = this.token || this.userToken;
    if (!activeToken) return false;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/verify`, {
        headers: this.getAuthHeaders()
      });
      if (!res.ok) {
        return false;
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.warn('verifyAdmin received non-JSON response (e.g. HTML fallback), failing closed');
        return false;
      }
      const data = await res.json();
      const isValid = !!(data && data.success === true && data.email?.toLowerCase().trim() === 'sanaa0419z@gmail.com');
      return isValid;
    } catch (e) {
      console.warn('verifyAdmin failed closed:', e);
      return false;
    }
  }

  // Admin Stats
  public async getAdminStats(): Promise<AdminStats> {
    const res = await fetch('/api/admin/stats', {
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error('Статистик мэдээлэл авахад алдаа гарлаа.');
    return res.json();
  }

  // Admin Feedback list
  public async getAdminFeedback(): Promise<FeedbackItem[]> {
    const res = await fetch('/api/admin/feedback', {
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error('Санал хүсэлтүүдийг татахад алдаа гарлаа.');
    return res.json();
  }

  public async markFeedbackRead(id: string): Promise<void> {
    await fetch(`/api/admin/feedback/${id}/read`, {
      method: 'PATCH',
      headers: this.getAuthHeaders()
    });
  }

  public async deleteFeedback(id: string): Promise<void> {
    await fetch(`/api/admin/feedback/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
  }

  // ----------------------------------------------------
  // CRUD APIs for learning content
  // ----------------------------------------------------

  // Vocabulary
  public async addVocab(item: Partial<VocabularyItem>): Promise<VocabularyItem> {
    const res = await fetch('/api/admin/vocab', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Үг нэмэхэд алдаа гарлаа.');
    const data = await res.json();
    return data.item;
  }

  public async updateVocab(id: string, item: Partial<VocabularyItem>): Promise<VocabularyItem> {
    const res = await fetch(`/api/admin/vocab/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Үг засахад алдаа гарлаа.');
    const data = await res.json();
    return data.item;
  }

  public async deleteVocab(id: string): Promise<void> {
    const res = await fetch(`/api/admin/vocab/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error('Үг устгахад алдаа гарлаа.');
  }

  // Kanji
  public async addKanji(item: Partial<KanjiItem>): Promise<KanjiItem> {
    const res = await fetch('/api/admin/kanji', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Канжи нэмэхэд алдаа гарлаа.');
    const data = await res.json();
    return data.item;
  }

  public async updateKanji(id: string, item: Partial<KanjiItem>): Promise<KanjiItem> {
    const res = await fetch(`/api/admin/kanji/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Канжи засахад алдаа гарлаа.');
    const data = await res.json();
    return data.item;
  }

  public async deleteKanji(id: string): Promise<void> {
    const res = await fetch(`/api/admin/kanji/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error('Канжи устгахад алдаа гарлаа.');
  }

  // Grammar
  public async addGrammar(item: Partial<GrammarItem>): Promise<GrammarItem> {
    const res = await fetch('/api/admin/grammar', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Дүрэм нэмэхэд алдаа гарлаа.');
    const data = await res.json();
    return data.item;
  }

  public async updateGrammar(id: string, item: Partial<GrammarItem>): Promise<GrammarItem> {
    const res = await fetch(`/api/admin/grammar/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Дүрэм засахад алдаа гарлаа.');
    const data = await res.json();
    return data.item;
  }

  public async deleteGrammar(id: string): Promise<void> {
    const res = await fetch(`/api/admin/grammar/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error('Дүрэм устгахад алдаа гарлаа.');
  }

  // Example Sentences
  public async addExample(item: Partial<ExampleSentenceItem>): Promise<ExampleSentenceItem> {
    const res = await fetch('/api/admin/examples', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Жишээ өгүүлбэр нэмэхэд алдаа гарлаа.');
    const data = await res.json();
    return data.item;
  }

  public async updateExample(id: string, item: Partial<ExampleSentenceItem>): Promise<ExampleSentenceItem> {
    const res = await fetch(`/api/admin/examples/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Жишээ өгүүлбэр засахад алдаа гарлаа.');
    const data = await res.json();
    return data.item;
  }

  public async deleteExample(id: string): Promise<void> {
    const res = await fetch(`/api/admin/examples/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error('Жишээ өгүүлбэр устгахад алдаа гарлаа.');
  }

  // Lessons
  public async addLesson(item: Partial<LessonItem>): Promise<LessonItem> {
    const res = await fetch('/api/admin/lessons', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Хичээл нэмэхэд алдаа гарлаа.');
    const data = await res.json();
    return data.item;
  }

  public async updateLesson(id: string, item: Partial<LessonItem>): Promise<LessonItem> {
    const res = await fetch(`/api/admin/lessons/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Хичээл засахад алдаа гарлаа.');
    const data = await res.json();
    return data.item;
  }

  public async deleteLesson(id: string): Promise<void> {
    const res = await fetch(`/api/admin/lessons/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error('Хичээл устгахад алдаа гарлаа.');
  }

  // Reading
  public async addReading(item: Partial<ReadingItem>): Promise<ReadingItem> {
    const res = await fetch('/api/admin/reading', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Унших дасгал нэмэхэд алдаа гарлаа.');
    const data = await res.json();
    return data.item;
  }

  public async updateReading(id: string, item: Partial<ReadingItem>): Promise<ReadingItem> {
    const res = await fetch(`/api/admin/reading/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Унших дасгал засахад алдаа гарлаа.');
    const data = await res.json();
    return data.item;
  }

  public async deleteReading(id: string): Promise<void> {
    const res = await fetch(`/api/admin/reading/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error('Унших дасгал устгахад алдаа гарлаа.');
  }

  // Listening
  public async addListening(item: Partial<ListeningItem>): Promise<ListeningItem> {
    const res = await fetch('/api/admin/listening', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Сонсох дасгал нэмэхэд алдаа гарлаа.');
    const data = await res.json();
    return data.item;
  }

  public async updateListening(id: string, item: Partial<ListeningItem>): Promise<ListeningItem> {
    const res = await fetch(`/api/admin/listening/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Сонсох дасгал засахад алдаа гарлаа.');
    const data = await res.json();
    return data.item;
  }

  public async deleteListening(id: string): Promise<void> {
    const res = await fetch(`/api/admin/listening/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error('Сонсох дасгал устгахад алдаа гарлаа.');
  }

  // Quizzes
  public async addQuiz(item: Partial<QuizSet>): Promise<QuizSet> {
    const res = await fetch('/api/admin/quizzes', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Тест нэмэхэд алдаа гарлаа.');
    const data = await res.json();
    return data.item;
  }

  public async updateQuiz(id: string, item: Partial<QuizSet>): Promise<QuizSet> {
    const res = await fetch(`/api/admin/quizzes/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Тест засахад алдаа гарлаа.');
    const data = await res.json();
    return data.item;
  }

  public async deleteQuiz(id: string): Promise<void> {
    const res = await fetch(`/api/admin/quizzes/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error('Тест устгахад алдаа гарлаа.');
  }

  // Categories
  public async addCategory(item: Partial<CategoryItem>): Promise<CategoryItem> {
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Ангилал нэмэхэд алдаа гарлаа.');
    const data = await res.json();
    return data.item;
  }

  public async updateCategory(id: string, item: Partial<CategoryItem>): Promise<CategoryItem> {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Ангилал засахад алдаа гарлаа.');
    const data = await res.json();
    return data.item;
  }

  public async deleteCategory(id: string): Promise<void> {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error('Ангилал устгахад алдаа гарлаа.');
  }

  // ----------------------------------------------------
  // PAYMENT & PREMIUM METHODS
  // ----------------------------------------------------

  public async submitPaymentRequest(payload: {
    senderName: string;
    transferDate: string;
    userName?: string;
    userEmail?: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    isDuplicate?: boolean;
    payment?: PaymentRequestItem;
    existingRequest?: PaymentRequestItem;
    message?: string;
    error?: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/api/payment/request`, {
      method: 'POST',
      headers: this.getUserAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await this.parseJsonResponse<any>(res, 'Төлбөрийн хүсэлт илгээхэд алдаа гарлаа.');
    if (!res.ok && !data.isDuplicate) {
      throw new Error(data.error || 'Төлбөрийн хүсэлт илгээхэд алдаа гарлаа.');
    }
    return data;
  }

  public async getMyPaymentStatus(email?: string): Promise<{
    success: boolean;
    payments: PaymentRequestItem[];
    latestPending: PaymentRequestItem | null;
    latestPayment: PaymentRequestItem | null;
    isPremium: boolean;
    premiumExpiresAt: string | null;
    inAppNotification: any | null;
  }> {
    const path = email ? `/api/payment/my-status?email=${encodeURIComponent(email)}` : '/api/payment/my-status';
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: this.getUserAuthHeaders()
    });
    if (!res.ok) throw new Error('Төлбөрийн төлөв шалгахад алдаа гарлаа.');
    return await this.parseJsonResponse(res, 'Төлбөрийн төлөв шалгахад алдаа гарлаа.');
  }

  public async dismissInAppNotification(): Promise<void> {
    if (!this.userToken) return;
    await fetch(`${API_BASE_URL}/api/user/notification/dismiss`, {
      method: 'POST',
      headers: this.getUserAuthHeaders()
    }).catch(() => {});
  }

  public async getAdminPayments(): Promise<{
    success: boolean;
    payments: PaymentRequestItem[];
    stats: {
      total: number;
      pendingCount: number;
      approvedCount: number;
      rejectedCount: number;
      totalYenApproved: number;
    };
  }> {
    const res = await fetch(`${API_BASE_URL}/api/admin/payments`, {
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error('Төлбөрийн жагсаалт авахад алдаа гарлаа.');
    return await this.parseJsonResponse(res, 'Төлбөрийн жагсаалт авахад алдаа гарлаа.');
  }

  public async approvePayment(id: string): Promise<{
    success: boolean;
    payment: PaymentRequestItem;
    user: any;
    message: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/api/admin/payments/${id}/approve`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    const data = await this.parseJsonResponse<any>(res, 'Төлбөр баталгаажуулахад алдаа гарлаа.');
    if (!res.ok) throw new Error(data.error || 'Төлбөр баталгаажуулахад алдаа гарлаа.');
    return data;
  }

  public async rejectPayment(id: string, reason?: string): Promise<{
    success: boolean;
    payment: PaymentRequestItem;
    message: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/api/admin/payments/${id}/reject`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    const data = await this.parseJsonResponse<any>(res, 'Төлбөр буцаахад алдаа гарлаа.');
    if (!res.ok) throw new Error(data.error || 'Төлбөр буцаахад алдаа гарлаа.');
    return data;
  }

  // ----------------------------------------------------
  // SUNNY AI TUTOR & QUIZ EXPLANATION
  // ----------------------------------------------------
  private getAIClientHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.userToken) {
      headers['Authorization'] = `Bearer ${this.userToken}`;
    }
    if (typeof window !== 'undefined') {
      let anonId = localStorage.getItem('sunny_ai_anon_id');
      if (!anonId) {
        anonId = 'anon_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
        localStorage.setItem('sunny_ai_anon_id', anonId);
      }
      headers['X-Sunny-Client-Id'] = anonId;
    }
    return headers;
  }

  public async getSunnyAIUsage(): Promise<{ success: boolean; usage: SunnyAIUsageStatus }> {
    const res = await fetch(`${API_BASE_URL}/api/ai/usage`, {
      method: 'GET',
      headers: this.getAIClientHeaders()
    });
    const data = await this.parseJsonResponse<{ success: boolean; usage: SunnyAIUsageStatus }>(
      res,
      'Хиймэл оюуны мэдээлэл авахад алдаа гарлаа.'
    );
    return data;
  }

  public async sendSunnyAIMessage(payload: {
    message?: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    quizContext?: SunnyAIQuizContext;
    currentLevel?: JLPTLevel | string;
  }): Promise<{
    success: boolean;
    reply: string;
    usage: SunnyAIUsageStatus;
  }> {
    const res = await fetch(`${API_BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: this.getAIClientHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await this.parseJsonResponse<any>(res, 'Sunny AI хариулахад алдаа гарлаа.');
    if (!res.ok || !data.success) {
      const err: any = new Error(data.error || 'Sunny AI хариулахад алдаа гарлаа.');
      err.limitReached = data.limitReached;
      err.usage = data.usage;
      throw err;
    }
    return data;
  }
}

export const apiService = new ApiService();
