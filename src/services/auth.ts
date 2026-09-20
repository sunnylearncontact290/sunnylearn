import { JLPTLevel, UserProfile, UserProgress } from '../types';

const USER_TOKEN_KEY = 'nihongo_mongol_user_token_v1';
const USER_PROFILE_KEY = 'nihongo_mongol_user_profile_v1';
const PENDING_SYNC_KEY = 'nihongo_mongol_pending_sync_v1';

export const authService = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(USER_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  getStoredUser(): UserProfile | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(USER_PROFILE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setSession(token: string, user: UserProfile) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(USER_TOKEN_KEY, token);
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to store session:', e);
    }
  },

  clearSession() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(USER_TOKEN_KEY);
      localStorage.removeItem(USER_PROFILE_KEY);
      localStorage.removeItem(PENDING_SYNC_KEY);
    } catch (e) {
      console.error('Failed to clear session:', e);
    }
  },

  async loginWithGoogle(payload: {
    credential?: string;
    email?: string;
    name?: string;
    picture?: string;
    timezone?: string;
    localProgress?: UserProgress;
    localSelectedLevel?: JLPTLevel | null;
  }): Promise<{ isNew: boolean; user: UserProfile; token: string }> {
    const timezone = payload.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ulaanbaatar';

    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, timezone })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Нэвтрэхэд алдаа гарлаа' }));
      throw new Error(err.error || 'Нэвтрэхэд алдаа гарлаа');
    }

    const data = await res.json();
    if (!data.success || !data.token) {
      throw new Error('Нэвтрэх амжилтгүй боллоо');
    }

    this.setSession(data.token, data.user);
    return {
      isNew: data.isNew,
      user: data.user,
      token: data.token
    };
  },

  async fetchRemoteProgress(): Promise<{ selectedLevel: JLPTLevel | null; progress: UserProgress; updatedAt: string } | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/user/progress', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.status === 401) {
        this.clearSession();
        return null;
      }

      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn('Could not fetch remote progress:', e);
      return null;
    }
  },

  async syncRemoteProgress(progress: UserProgress, selectedLevel: JLPTLevel | null): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      // Save pending sync to local storage
      try {
        localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify({ progress, selectedLevel, timestamp: Date.now() }));
      } catch (e) {
        console.error('Failed to save offline sync queue:', e);
      }
      return false;
    }

    try {
      const res = await fetch('/api/user/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          progress,
          selectedLevel,
          clientUpdatedAt: new Date().toISOString()
        })
      });

      if (res.status === 401) {
        this.clearSession();
        return false;
      }

      if (res.ok) {
        // Clear pending sync
        if (typeof window !== 'undefined') {
          localStorage.removeItem(PENDING_SYNC_KEY);
        }
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Progress sync network error:', e);
      return false;
    }
  }
};
