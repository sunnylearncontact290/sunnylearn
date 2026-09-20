import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SunnyLogo } from './SunnyLogo';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    forgotPassword
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const googleClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isAuthModalOpen) {
      setError(null);
      setSuccessMessage(null);
      setPassword('');
      setConfirmPassword('');
      return;
    }

    if (googleClientId && typeof window !== 'undefined') {
      const scriptId = 'google-gsi-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => initializeGoogleGsi();
        document.body.appendChild(script);
      } else {
        initializeGoogleGsi();
      }
    }
  }, [isAuthModalOpen, googleClientId]);

  const initializeGoogleGsi = () => {
    if (typeof window === 'undefined' || !(window as any).google?.accounts?.id) return;
    try {
      (window as any).google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: any) => {
          if (response.credential) {
            setIsSubmitting(true);
            setError(null);
            const success = await loginWithGoogle({
              credential: response.credential,
              timezone: 'Asia/Ulaanbaatar'
            });
            setIsSubmitting(false);
            if (!success) {
              setError('Google-ээр нэвтрэх явцад алдаа гарлаа.');
            }
          }
        }
      });

      if (googleBtnRef.current) {
        googleBtnRef.current.innerHTML = '';
        const btnWidth = Math.min(Math.max(window.innerWidth - 64, 240), 320);
        (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: btnWidth
        });
      }
    } catch (e) {
      console.warn('Google GSI initialization error:', e);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Зөв имэйл хаяг оруулна уу.');
      return;
    }
    if (!password) {
      setError('Нууц үгээ оруулна уу.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const success = await loginWithEmail(email.trim(), password);
      if (!success) {
        setError('Нэвтрэхэд алдаа гарлаа. Имэйл болон нууц үгээ шалгана уу.');
      }
    } catch (err: any) {
      setError(err.message || 'Нэвтрэхэд алдаа гарлаа.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Зөв имэйл хаяг оруулна уу.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Нууц үг хамгийн багадаа 6 тэмдэгттэй байх ёстой.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Нууц үг тохирохгүй байна. Дахин шалгана уу.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const success = await registerWithEmail({
        email: email.trim(),
        name: name.trim() || undefined,
        password,
        confirmPassword
      });
      if (!success) {
        setError('Бүртгүүлэхэд алдаа гарлаа.');
      }
    } catch (err: any) {
      setError(err.message || 'Бүртгүүлэхэд алдаа гарлаа.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Зөв имэйл хаяг оруулна уу.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await forgotPassword(email.trim());
      setSuccessMessage(res.message || 'Хэрэв тус имэйл бүртгэлтэй бол нууц үг сэргээх заавар илгээгдлээ.');
    } catch (err: any) {
      setError(err.message || 'Алдаа гарлаа.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthModalOpen) return null;

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/60 backdrop-blur-sm animate-fadeIn overflow-y-auto"
      onClick={() => setIsAuthModalOpen(false)}
    >
      <div
        id="auth-modal-card"
        className="relative w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl transition-all dark:bg-stone-900 border border-stone-200 dark:border-stone-800 my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="auth-modal-close-btn"
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute right-4 top-4 p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          aria-label="Хаах"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center pt-2 pb-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm border border-stone-200 dark:border-stone-700 mx-auto mb-2">
            <SunnyLogo className="w-full h-full object-cover" />
          </div>
          <h3 className="text-xl font-extrabold text-stone-900 dark:text-white">
            {mode === 'login' && 'SunnyLearn-д нэвтрэх'}
            {mode === 'register' && 'Шинэ бүртгэл үүсгэх'}
            {mode === 'forgot' && 'Нууц үг сэргээх'}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-xs mx-auto">
            {mode === 'login' && 'Өөрийн хувийн хаягаар нэвтэрч явцаа синк хийх болон Premium эрхээ ашиглаарай.'}
            {mode === 'register' && 'Хувийн хаяг нээж сургалтын явц, Free/Premium эрхээ хадгалаарай.'}
            {mode === 'forgot' && 'Бүртгэлтэй имэйл хаягаа оруулж нууц үг сэргээнэ үү.'}
          </p>
        </div>

        {/* Navigation Tabs between Login / Register */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl mb-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm'
                  : 'text-stone-500 hover:text-stone-800 dark:text-stone-400'
              }`}
            >
              Нэвтрэх
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm'
                  : 'text-stone-500 hover:text-stone-800 dark:text-stone-400'
              }`}
            >
              Бүртгүүлэх
            </button>
          </div>
        )}

        {/* Notifications & Error messages */}
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 text-xs font-medium text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-800/50">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 flex items-center gap-2 p-3 text-xs font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form: Login */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Имэйл хаяг
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Нууц үг
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium"
                >
                  Нууц үг мартсан?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 mt-1"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              <span>Нэвтрэх</span>
            </button>
          </form>
        )}

        {/* Form: Register */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Таны нэр (заавал биш)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Бат, Болд гэх мэт"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Имэйл хаяг
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Нууц үг (дор хаяж 6 тэмдэгт)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Нууц үгээ давтах
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 mt-1"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Бүртгэл үүсгэх</span>
            </button>
          </form>
        )}

        {/* Form: Forgot Password */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Бүртгэлтэй имэйл хаяг
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              <span>Сэргээх заавар илгээх</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMessage(null);
              }}
              className="w-full text-center text-xs text-stone-500 hover:text-stone-800 dark:text-stone-400 py-1"
            >
              ← Нэвтрэх рүү буцах
            </button>
          </form>
        )}

        {/* Google SSO / Google Sign In Section */}
        {mode !== 'forgot' && (
          <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
            <div className="relative flex py-1 items-center mb-3">
              <div className="flex-grow border-t border-stone-200 dark:border-stone-700"></div>
              <span className="flex-shrink mx-3 text-stone-400 text-xs font-medium">эсвэл</span>
              <div className="flex-grow border-t border-stone-200 dark:border-stone-700"></div>
            </div>

            {googleClientId ? (
              <div className="flex justify-center" ref={googleBtnRef} />
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={async () => {
                  if (!email || !email.includes('@')) {
                    setError('Google-ээр нэвтрэхийн тулд эхлээд дээрх имэйл талбарт Gmail хаягаа оруулна уу.');
                    return;
                  }
                  setIsSubmitting(true);
                  setError(null);
                  try {
                    const success = await loginWithGoogle({
                      email: email.trim(),
                      name: name.trim() || email.split('@')[0],
                      timezone: 'Asia/Ulaanbaatar'
                    });
                    if (!success) setError('Google-ээр нэвтрэхэд алдаа гарлаа.');
                  } catch (err: any) {
                    setError(err.message || 'Алдаа гарлаа.');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 font-semibold hover:bg-stone-50 dark:hover:bg-stone-700/60 shadow-sm transition-all text-xs"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google-ээр үргэлжлүүлэх</span>
              </button>
            )}
          </div>
        )}

        {/* Security & Non-intrusive Guarantee */}
        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 space-y-1.5">
          <div className="flex items-start gap-2 text-[11px] text-stone-500 dark:text-stone-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              Бүх хэрэглэгчийн нууц үг найдвартай шифрлэгдэн хадгалагдана (PBKDF2).
            </span>
          </div>
          <div className="flex items-start gap-2 text-[11px] text-stone-500 dark:text-stone-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span>
              Нэвтрээгүй үед ч таны сурсан зүйл энэ төхөөрөмж дээрээ хадгалагдсаар байна.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
