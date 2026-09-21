import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  CreditCard,
  AlertCircle,
  Building2,
  Calendar,
  Send,
  HelpCircle,
  Lock,
  RefreshCw,
  Award,
  ChevronRight,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SunnyLogo } from '../common/SunnyLogo';

export const PremiumView: React.FC = () => {
  const {
    currentUser,
    isPremium,
    premiumExpiresAt,
    latestPendingPayment,
    userPayments,
    refreshUserPayments,
    submitPaymentRequest,
    showToast,
    setIsAuthModalOpen,
    setActiveTab
  } = useApp();

  // Form State
  const [senderName, setSenderName] = useState('');
  const [transferDate, setTransferDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [userEmail, setUserEmail] = useState(currentUser?.email || '');
  const [userName, setUserName] = useState(currentUser?.name || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    if (currentUser) {
      if (!userEmail) setUserEmail(currentUser.email);
      if (!userName) setUserName(currentUser.name);
    }
  }, [currentUser, userEmail, userName]);

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    showToast(`"${text}" амжилттай хуулагдлаа!`, 'success');
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUserPayments();
    setIsRefreshing(false);
    showToast('Төлөв шинэчлэгдлээ.', 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setShowAuthPrompt(true);
      return;
    }
    if (!senderName.trim()) {
      showToast('Шилжүүлэгчийн нэр (振込名義)-ээ оруулна уу.', 'error');
      return;
    }
    if (!transferDate.trim()) {
      showToast('Шилжүүлсэн огноогоо сонгоно уу.', 'error');
      return;
    }
    if (!userEmail.trim() || !userEmail.includes('@')) {
      showToast('Зөв имэйл хаягаа оруулна уу.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitPaymentRequest({
        senderName: senderName.trim(),
        transferDate: transferDate.trim(),
        userEmail: userEmail.trim(),
        userName: userName.trim(),
        notes: notes.trim()
      });

      if (res.isDuplicate) {
        showToast(res.message || 'Таны өмнөх хүсэлт одоогоор шалгагдаж байна.', 'info');
      } else if (res.success) {
        showToast('Төлбөрийн хүсэлт амжилттай бүртгэгдлээ! Админ удахгүй шалгаж баталгаажуулна.', 'success');
        setNotes('');
      } else {
        showToast(res.error || 'Алдаа гарлаа.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Төлбөрийн хүсэлт илгээхэд алдаа гарлаа.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remaining days calculation
  const remainingDays = React.useMemo(() => {
    if (!premiumExpiresAt) return 0;
    const diff = new Date(premiumExpiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [premiumExpiresAt]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white p-6 sm:p-10 shadow-lg shadow-amber-500/20">
        <div className="absolute -right-8 -bottom-8 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold uppercase tracking-wider text-amber-100">
              <Sparkles className="w-3.5 h-3.5" />
              SunnyLearn Premium
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Япон хэлийг хязгааргүй, үр дүнтэй суралц
            </h1>
            <p className="text-sm sm:text-base text-amber-100/90 leading-relaxed">
              30 хоногийн хугацаатай бүх түвшний сургалтын хөтөлбөр, интерактив сорил, дүрэм, толь бичгийг бүрэн ашиглах боломж.
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-start md:items-end gap-2 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20">
            <span className="text-xs text-amber-200 font-semibold">Багцын үнэ</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-black text-white">¥880</span>
              <span className="text-xs text-amber-100 font-medium">/ 30 хоног</span>
            </div>
            <span className="text-[11px] text-amber-200/80">Гар шилжүүлэг (Банк)</span>
          </div>
        </div>
      </div>

      {/* Current User Premium Status Banner */}
      {isPremium ? (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800 p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                  Таны SunnyLearn Premium эрх идэвхтэй байна!
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[10px] font-black uppercase">
                  Active
                </span>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Хүчинтэй хугацаа: <span className="font-bold">{premiumExpiresAt ? new Date(premiumExpiresAt).toLocaleDateString('mn-MN') : 'Тодорхойгүй'}</span> (Үлдсэн: <span className="font-bold">{remainingDays} хоног</span>)
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('learn')}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all shrink-0 flex items-center gap-1.5"
          >
            Хичээл рүүгээ орох <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : null}

      {/* Pending Request Status Banner (If user has one) */}
      {latestPendingPayment ? (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 p-6 sm:p-8 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-amber-950 dark:text-amber-100">
                    Төлбөр шалгагдаж байна (PENDING)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[11px] font-bold">
                    Шалгаж байна
                  </span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                  Таны шилжүүлгийн хүсэлтийг хүлээн авлаа. Админ ゆうちょ銀行 дансны хуулгыг шалгаад Premium эрхийг шууд нээнэ.
                </p>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors shrink-0"
              title="Төлөв дахин шалгах"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-white/80 dark:bg-stone-900/80 rounded-xl border border-amber-200 dark:border-amber-800/80">
              <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400 block">Хүсэлтийн дугаар</span>
              <span className="text-xs font-mono font-extrabold text-stone-900 dark:text-stone-100 truncate block">
                {latestPendingPayment.id}
              </span>
            </div>
            <div className="p-3 bg-white/80 dark:bg-stone-900/80 rounded-xl border border-amber-200 dark:border-amber-800/80">
              <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400 block">Шилжүүлэгч (振込名義)</span>
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate block">
                {latestPendingPayment.senderName}
              </span>
            </div>
            <div className="p-3 bg-white/80 dark:bg-stone-900/80 rounded-xl border border-amber-200 dark:border-amber-800/80">
              <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400 block">Шилжүүлсэн дүн</span>
              <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400 block">
                ¥{latestPendingPayment.amount} (30 хоног)
              </span>
            </div>
            <div className="p-3 bg-white/80 dark:bg-stone-900/80 rounded-xl border border-amber-200 dark:border-amber-800/80">
              <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400 block">Шилжүүлсэн огноо</span>
              <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 block">
                {latestPendingPayment.transferDate}
              </span>
            </div>
          </div>

          <div className="bg-amber-100/60 dark:bg-amber-900/30 p-3.5 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <p>
              <strong>Санамж:</strong> Та дахин ¥880 шилжүүлэх шаардлагагүй. Таны хүсэлт аюулгүй хадгалагдсан тул админ хуулга шалгаад баталгаажуулна. Энэ хугацаанд та сайтын үндсэн хичээлүүдээ чөлөөтэй үзэж болно.
            </p>
          </div>
        </div>
      ) : null}

      {/* Section 30: Informative Notice Before Paying */}
      <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 p-5 sm:p-6 rounded-3xl space-y-3">
        <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-extrabold text-base">
          <Info className="w-5 h-5 text-amber-500 shrink-0" />
          <span>「Төлбөр баталгаажуулах тухай」</span>
        </div>
        <div className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed space-y-2">
          <p>
            SunnyLearn одоогоор банкны шилжүүлгийг гараар баталгаажуулж байна. Тиймээс төлбөр хийсний дараа Premium эрх шууд идэвхжихгүй байж болно.
          </p>
          <p>
            Төлбөрөө хийсний дараа “Төлбөр хийсэн” товчийг дарж хүсэлтээ илгээнэ үү. Таны төлбөр баталгаажмагц Premium эрх таны бүртгэлд идэвхжинэ.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
          <span className="px-3 py-1 rounded-full bg-amber-200/70 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200 font-black text-xs">
            ¥880
          </span>
          <span className="px-3 py-1 rounded-full bg-stone-200/70 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold text-xs">
            30 хоног
          </span>
          <span className="px-3 py-1 rounded-full bg-stone-200/70 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold text-xs">
            Автомат сунгалтгүй
          </span>
        </div>
      </div>

      {latestPendingPayment ? (
        /* Section 33 & 35: Pending Confirmation Screen (Replaces bank transfer form & prevents duplicate submissions) */
        <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-3xl border-2 border-amber-400 dark:border-amber-600 shadow-md space-y-6">
          <div className="flex items-center gap-3.5 pb-4 border-b border-stone-200 dark:border-stone-800">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shrink-0 shadow-md shadow-amber-500/20 text-lg">
              ✓
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100">
                Төлбөрийн хүсэлт илгээгдлээ
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-extrabold">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  Төлөв: Шалгаж байна (PENDING)
                </span>
                <span className="text-[11px] text-stone-400 font-mono">#{latestPendingPayment.id}</span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-xs">
            <div>
              <span className="text-[11px] text-stone-500 block font-medium">Төлбөр:</span>
              <span className="font-extrabold text-stone-900 dark:text-white text-sm">¥{latestPendingPayment.amount}</span>
            </div>
            <div>
              <span className="text-[11px] text-stone-500 block font-medium">Premium хугацаа:</span>
              <span className="font-bold text-stone-900 dark:text-white">30 хоног</span>
            </div>
            <div>
              <span className="text-[11px] text-stone-500 block font-medium">Хүсэлтийн дугаар:</span>
              <span className="font-mono font-extrabold text-stone-900 dark:text-white">{latestPendingPayment.id}</span>
            </div>
            <div>
              <span className="text-[11px] text-stone-500 block font-medium">Шилжүүлсэн нэр (振込名義):</span>
              <span className="font-bold text-stone-900 dark:text-white">{latestPendingPayment.senderName}</span>
            </div>
            <div>
              <span className="text-[11px] text-stone-500 block font-medium">Шилжүүлсэн огноо (振込日):</span>
              <span className="font-semibold text-stone-900 dark:text-white">{latestPendingPayment.transferDate}</span>
            </div>
            <div>
              <span className="text-[11px] text-stone-500 block font-medium">Бүртгүүлсэн цаг:</span>
              <span className="text-stone-700 dark:text-stone-300">{latestPendingPayment.createdAt}</span>
            </div>
          </div>

          {/* Reassuring Message */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 space-y-2.5">
            <p className="text-xs sm:text-sm text-amber-950 dark:text-amber-100 font-semibold">
              Таны төлбөрийн мэдээлэл амжилттай илгээгдлээ.
            </p>
            <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
              Одоогоор төлбөрийг шалгаж байна. Баталгаажмагц SunnyLearn Premium эрх таны бүртгэлд идэвхжинэ.
            </p>
            <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
              Шалгаж байх хугацаанд та SunnyLearn-ийн үнэгүй боломжуудыг хэвийн ашиглаж болно.
            </p>

            {/* Prominent Mandatory Banner */}
            <div className="p-3 mt-3 rounded-xl bg-amber-200/80 dark:bg-amber-900/60 border border-amber-400 dark:border-amber-700 text-center">
              <span className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-100 tracking-wide">
                ⚠️ Дахин төлбөр хийх шаардлагагүй.
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('learn')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Үргэлжлүүлэн сурах →
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Төлөв дахин шалгах</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Step 1: Bank Transfer Details (Section 31) */}
          <div className="lg:col-span-5 bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-black flex items-center justify-center text-xs">
                  1
                </div>
                <h2 className="font-extrabold text-stone-900 dark:text-stone-100 text-base sm:text-lg">
                  Банкны шилжүүлгийн данс
                </h2>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                ゆうちょ銀行
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* 銀行（金融機関名） */}
              <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 block">銀行（金融機関名）</span>
                  <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">ゆうちょ銀行</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('ゆうちょ銀行', 'bank')}
                  className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                  title="Хуулах"
                >
                  {copiedField === 'bank' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* 記号番号 */}
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-amber-800 dark:text-amber-400 block font-semibold">記号番号</span>
                  <span className="font-extrabold text-amber-950 dark:text-amber-100 text-base font-mono tracking-wider">
                    11370-18362191
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('11370-18362191', 'account')}
                  className="p-2 rounded-lg bg-amber-200/60 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 hover:bg-amber-200 transition-colors"
                  title="記号番号 хуулах"
                >
                  {copiedField === 'account' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* お名前 */}
              <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 block">お名前</span>
                  <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">アマルサナー　アリウンサナー</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('アマルサナー　アリウンサナー', 'name')}
                  className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                  title="Хуулах"
                >
                  {copiedField === 'name' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* 振込金額 */}
              <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 block">振込金額</span>
                  <span className="font-extrabold text-red-600 dark:text-red-400 text-base">¥880</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('880', 'amount')}
                  className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                  title="Хуулах"
                >
                  {copiedField === 'amount' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Premium期間 */}
              <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 block">Premium期間</span>
                  <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">30 хоног</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-[11px] text-stone-600 dark:text-stone-300 space-y-1">
              <div className="font-bold text-stone-800 dark:text-stone-200">Зөвлөмж:</div>
              <p>ゆうちょ銀行 ATM эсвэл Yucho Direct апп ашиглан шилжүүлэх боломжтой.</p>
            </div>

            {/* Button: 「Төлбөр хийсэн」 (Section 31) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  const formEl = document.getElementById('payment-verify-form');
                  formEl?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Төлбөр хийсэн (Хүсэлт илгээх) ↓</span>
              </button>
            </div>
          </div>

          {/* Step 2: Payment Verification Form (Section 32) */}
          <div
            id="payment-verify-form"
            className="lg:col-span-7 bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-black flex items-center justify-center text-xs">
                  2
                </div>
                <h2 className="font-extrabold text-stone-900 dark:text-stone-100 text-base sm:text-lg">
                  Шилжүүлсэн мэдээллээ илгээх
                </h2>
              </div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                Гараар баталгаажуулалт
              </span>
            </div>

            {!currentUser && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Зочноор үзэж байна — Нэвтрэх эсвэл бүртгүүлнэ үү</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Төлбөр баталгаажмагц 30 хоногийн Premium эрх таны бүртгэлд шууд идэвхжинэ. Шилжүүлэг хийж хүсэлт илгээхийн өмнө бүртгэлдээ нэвтэрнэ үү.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer"
                >
                  <span>Нэвтрэх / Шинээр бүртгүүлэх</span>
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Transfer Sender Name (振込名義) */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Шилжүүлэгчийн нэр (振込名義) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Жишээ: BAT-ERDENE эсвэл バトエルデネ"
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                  Банкны апп эсвэл ATM дээр оруулсан яг тэр нэрээр нь бичнэ үү.
                </p>
              </div>

              {/* Transfer Date (振込日) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Шилжүүлсэн огноо (振込日) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={transferDate}
                    onChange={e => setTransferDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Шилжүүлсэн дүн
                  </label>
                  <div className="px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-bold">
                    ¥880 (SunnyLearn Premium — 30 days)
                  </div>
                </div>
              </div>

              {/* User Email */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Таны имэйл хаяг <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="таны-имэйл@gmail.com"
                  value={userEmail}
                  onChange={e => setUserEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {!currentUser && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                    <span>Хэрэв та өмнө нь Google-ээр нэвтэрсэн бол тэр хаягаа оруулаарай.</span>
                    <button
                      type="button"
                      onClick={() => setIsAuthModalOpen(true)}
                      className="underline font-bold"
                    >
                      Нэвтрэх
                    </button>
                  </p>
                )}
              </div>

              {/* User Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Хэрэглэгчийн нэр
                </label>
                <input
                  type="text"
                  placeholder="Таны нэр"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Нэмэлт тэмдэглэл (заавал биш)
                </label>
                <input
                  type="text"
                  placeholder="Жишээ: SMBC банкнаас шилжүүлэв гэх мэт"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Бүртгэж байна...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Төлбөр шалгуулах хүсэлт илгээх
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-stone-400">
                🔒 Таны мэдээлэл зөвхөн төлбөр шалгах зорилгоор админд аюулгүй илгээгдэнэ.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Past Payment History (if any) */}
      {userPayments.length > 0 && (
        <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-stone-500" />
              Миний төлбөрийн түүх
            </h3>
            <span className="text-xs text-stone-500 font-medium">Нийт: {userPayments.length} хүсэлт</span>
          </div>

          <div className="space-y-2.5">
            {userPayments.map(p => (
              <div
                key={p.id}
                className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-stone-50 dark:bg-stone-800/40"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-stone-900 dark:text-white">{p.id}</span>
                    <span className="font-semibold text-stone-600 dark:text-stone-400">({p.senderName})</span>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Огноо: {p.transferDate} • Илгээсэн: {p.createdAt}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-stone-900 dark:text-white">¥{p.amount}</span>
                  {p.status === 'APPROVED' ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Баталгаажсан
                    </span>
                  ) : p.status === 'PENDING' ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Шалгаж байна
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-[11px] flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {p.rejectionReason || 'Буцаасан'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Support and FAQ */}
      <div className="p-6 rounded-3xl bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            Асуулт эсвэл тусламж хэрэгтэй юу?
          </h4>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Төлбөр баталгаажуулах болон бусад асуудлаар манай дэмжлэгийн багтай холбогдоно уу.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('contact')}
          className="px-4 py-2 rounded-xl bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 font-bold text-xs border border-stone-300 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-600 transition-colors shrink-0"
        >
          Бидэнтэй холбогдох
        </button>
      </div>

      {/* Auth Prompt Modal */}
      {showAuthPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-stone-900 dark:text-stone-100">
                Нэвтрэх шаардлагатай
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Premium эрх нь таны суралцагчийн хувийн бүртгэлд холбогдож 30 хоног идэвхжих тул төлбөрийн хүсэлт илгээхийн тулд эхлээд нэвтэрнэ үү эсвэл бүртгүүлнэ үү.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAuthPrompt(false);
                  setIsAuthModalOpen(true);
                }}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                Нэвтрэх / Бүртгүүлэх
              </button>
              <button
                type="button"
                onClick={() => setShowAuthPrompt(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs transition-all cursor-pointer"
              >
                Цуцлах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
