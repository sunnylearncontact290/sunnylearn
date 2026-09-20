import React, { useState } from 'react';
import {
  Settings,
  Target,
  Eye,
  RotateCcw,
  CheckCircle2,
  LogIn,
  LogOut,
  User,
  Check,
  RefreshCw,
  CloudOff,
  ShieldCheck,
  Sparkles,
  CreditCard,
  Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { storageService } from '../../services/storage';
import { SunnyLogo } from '../common/SunnyLogo';
import { PremiumView } from '../premium/PremiumView';

export const ProfileView: React.FC = () => {
  const {
    userProgress,
    showToast,
    isDarkMode,
    setDarkMode,
    currentUser,
    userLogout,
    setIsAuthModalOpen,
    syncStatus,
    isPremium,
    latestPendingPayment,
    premiumExpiresAt
  } = useApp();

  const [activeSection, setActiveSection] = useState<'settings' | 'premium'>('settings');
  const [dailyGoal, setDailyGoal] = useState(userProgress.settings?.dailyGoalCount || 10);
  const [autoFurigana, setAutoFurigana] = useState(userProgress.settings?.showFurigana ?? true);

  const saveSettings = () => {
    const p = storageService.getProgress();
    p.settings = {
      ...p.settings,
      dailyGoalCount: dailyGoal,
      showFurigana: autoFurigana
    };
    storageService.saveProgress(p);
    showToast('Тохиргоо амжилттай хадгалагдлаа!', 'success');
  };

  const handleReset = () => {
    if (window.confirm('Та сургалтын бүх явцаа (цээжилсэн үгс, шалгалтын түүх) арилгахдаа итгэлтэй байна уу?')) {
      storageService.clearProgress();
      showToast('Сургалтын явцыг шинэчиллээ.', 'info');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Header & Cloud Sync User Profile Status */}
      <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm border border-stone-200 dark:border-stone-700 shrink-0">
              <SunnyLogo className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
                Суралцагчийн Бүртгэл & Тохиргоо
              </h1>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Таны төхөөрөмж дээрх болон клауд сургалтын явцын удирдлага
              </p>
            </div>
          </div>

          {currentUser ? (
            <div className="flex items-center gap-3 p-2 pl-3 pr-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
              {currentUser.picture ? (
                <img
                  src={currentUser.picture}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-stone-900 dark:text-white truncate">
                  {currentUser.name}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-stone-500">
                  {syncStatus === 'synced' ? (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <Check className="w-3 h-3" /> Синк хийгдсэн
                    </span>
                  ) : syncStatus === 'syncing' ? (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Синк хийгдэж байна...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-stone-400">
                      <CloudOff className="w-3 h-3" /> Офлайн горим
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={userLogout}
                className="ml-2 p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                title="Бүртгэлээс гарах"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Google-ээр нэвтрэх / Бүртгүүлэх</span>
            </button>
          )}
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            SunnyLearn нь бүртгэлгүй үед ч таны явцыг хөтөч дээрээ бүрэн хадгалдаг. Google хаягаараа нэвтэрснээр утас, таблет, компьютер дээрээ хаанаас ч хамаагүй сургалтаа үргэлжлүүлэх боломжтой болно.
          </span>
        </div>
      </div>

      {/* Section Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-stone-100 dark:bg-stone-800/80 rounded-2xl border border-stone-200/80 dark:border-stone-700/80">
        <button
          type="button"
          onClick={() => setActiveSection('settings')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeSection === 'settings'
              ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
              : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          <Settings className="w-4 h-4 text-amber-500" />
          <span>Сургалтын тохиргоо</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('premium')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeSection === 'premium'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20'
              : 'text-amber-700 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-950/40'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Premium гишүүнчлэл & Төлбөр</span>
          {isPremium ? (
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black">
              Идэвхтэй
            </span>
          ) : latestPendingPayment ? (
            <span className="px-2 py-0.5 rounded-full bg-amber-400/30 text-[10px] font-black animate-pulse">
              Шалгаж байна
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[10px] font-black">
              ¥980
            </span>
          )}
        </button>
      </div>

      {/* Render Premium Section if active */}
      {activeSection === 'premium' ? (
        <PremiumView />
      ) : (
        <>
          {/* Section 36: Pending Status in User Profile */}
          {latestPendingPayment ? (
            <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 space-y-3 shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-amber-950 dark:text-amber-100">
                      SunnyLearn Premium
                    </h3>
                    <span className="text-[11px] text-amber-800 dark:text-amber-300">
                      ¥980 • 30 хоног
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-200 dark:bg-amber-900/80 text-amber-950 dark:text-amber-200 text-xs font-black flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  🕒 Төлбөр шалгаж байна
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white/70 dark:bg-stone-900/60 p-3 rounded-xl border border-amber-200 dark:border-amber-800/80">
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-bold">Request ID</span>
                  <span className="font-mono font-bold text-stone-900 dark:text-white">{latestPendingPayment.id}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-bold">Submitted</span>
                  <span className="text-stone-800 dark:text-stone-200">{latestPendingPayment.createdAt}</span>
                </div>
              </div>

              <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                Таны төлбөрийг шалгаж байна. Баталгаажмагц Premium эрх автоматаар идэвхжинэ. <strong>Дахин төлбөр хийх шаардлагагүй.</strong>
              </p>

              <button
                type="button"
                onClick={() => setActiveSection('premium')}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Төлбөрийн мэдээлэл харах →
              </button>
            </div>
          ) : !isPremium ? (
            <div
              onClick={() => setActiveSection('premium')}
              className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-800/80 flex items-center justify-between gap-4 cursor-pointer hover:border-amber-500 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-amber-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 group-hover:text-amber-600 transition-colors">
                    SunnyLearn Premium гишүүн болох (¥980 / 30 хоног)
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Банкны шилжүүлгээр 30 хоногийн бүх эрхээ нээж, хязгааргүй суралцаарай
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
                Төлбөр шилжүүлэх →
              </span>
            </div>
          ) : (
            <div
              onClick={() => setActiveSection('premium')}
              className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-emerald-900 dark:text-emerald-100">
                    ✓ SunnyLearn Premium идэвхтэй байна
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Хүчинтэй хугацаа: {premiumExpiresAt ? new Date(premiumExpiresAt).toLocaleDateString('mn-MN') : 'Идэвхтэй'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                Дэлгэрэнгүй харах →
              </span>
            </div>
          )}

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Goal */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Өдрийн зорилтот үг
            </h2>
          </div>
          <p className="text-xs text-stone-500">
            Өдөрт цээжлэхээр төлөвлөж буй шинэ үгийн тоо.
          </p>

          <div className="flex items-center gap-2">
            {[5, 10, 15, 20, 30].map(cnt => (
              <button
                key={cnt}
                type="button"
                onClick={() => setDailyGoal(cnt)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                  dailyGoal === cnt
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                }`}
              >
                {cnt}
              </button>
            ))}
          </div>
        </div>

        {/* Furigana Display */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Фуригана (Ханзан дээрх уншлага)
            </h2>
          </div>
          <p className="text-xs text-stone-500">
            Ханзан дээрх уншлагын хираганаг байнга ил харуулах эсэх.
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAutoFurigana(true)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                autoFurigana
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
              }`}
            >
              Ил харуулах
            </button>
            <button
              type="button"
              onClick={() => setAutoFurigana(false)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                !autoFurigana
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
              }`}
            >
              Нуух (Өөрөө унших)
            </button>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Харагдах орчин (Theme)
            </h2>
          </div>
          <p className="text-xs text-stone-500">
            Өдрийн цагаар гэгээлэг, шөнийн цагаар нүдэнд ээлтэй бараан горим.
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDarkMode(false)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                !isDarkMode
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100'
              }`}
            >
              ☀️ Гэгээлэг (Light)
            </button>
            <button
              type="button"
              onClick={() => setDarkMode(true)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                isDarkMode
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100'
              }`}
            >
              🌙 Бараан (Dark)
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={saveSettings}
          className="px-8 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Тохиргоог хадгалах</span>
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1.5 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Явцыг бүрэн шинэчлэх</span>
        </button>
      </div>
      </>
      )}
    </div>
  );
};
