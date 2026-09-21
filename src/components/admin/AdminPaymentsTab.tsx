import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  Mail,
  User,
  Calendar,
  DollarSign,
  Check,
  X,
  FileText,
  ShieldCheck,
  Send
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentRequestItem } from '../../types';

export const AdminPaymentsTab: React.FC = () => {
  const {
    adminPayments,
    adminPaymentStats,
    loadAdminPayments,
    approvePayment,
    rejectPayment,
    showToast
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Approve Modal State (Section 40)
  const [approvingPayment, setApprovingPayment] = useState<PaymentRequestItem | null>(null);

  // Reject Modal State (Section 43)
  const [rejectingPayment, setRejectingPayment] = useState<PaymentRequestItem | null>(null);
  const [rejectReason, setRejectReason] = useState('Таны илгээсэн мэдээллээр төлбөрийг баталгаажуулах боломжгүй байна. Төлбөрийн мэдээллээ шалгаад дахин хүсэлт илгээх боломжтой.');

  useEffect(() => {
    loadAdminPayments();
  }, [loadAdminPayments]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAdminPayments();
    setIsRefreshing(false);
    showToast('Төлбөрийн жагсаалт шинэчлэгдлээ.', 'info');
  };

  const handleOpenApprove = (payment: PaymentRequestItem) => {
    setApprovingPayment(payment);
  };

  const handleConfirmApprove = async () => {
    if (!approvingPayment) return;
    setActionLoadingId(approvingPayment.id);
    try {
      await approvePayment(approvingPayment.id);
      setApprovingPayment(null);
      showToast(`Хэрэглэгчийн Premium эрх 30 хоногоор амжилттай идэвхжлээ.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Баталгаажуулахад алдаа гарлаа.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenReject = (payment: PaymentRequestItem) => {
    setRejectingPayment(payment);
    setRejectReason('Таны илгээсэн мэдээллээр төлбөрийг баталгаажуулах боломжгүй байна. Төлбөрийн мэдээллээ шалгаад дахин хүсэлт илгээх боломжтой.');
  };

  const handleConfirmReject = async () => {
    if (!rejectingPayment) return;
    setActionLoadingId(rejectingPayment.id);
    try {
      await rejectPayment(rejectingPayment.id, rejectReason.trim() || 'Таны илгээсэн мэдээллээр төлбөрийг баталгаажуулах боломжгүй байна. Төлбөрийн мэдээллээ шалгаад дахин хүсэлт илгээх боломжтой.');
      setRejectingPayment(null);
    } catch (err: any) {
      showToast(err.message || 'Буцаахад алдаа гарлаа.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredPayments = adminPayments
    .filter(p => {
      if (statusFilter === 'ALL') return true;
      return p.status === statusFilter;
    })
    .filter(p => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.id.toLowerCase().includes(q) ||
        p.senderName.toLowerCase().includes(q) ||
        p.userEmail.toLowerCase().includes(q) ||
        p.userName.toLowerCase().includes(q) ||
        p.transferDate.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      // PENDING first, then newest first
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
      if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="space-y-6">
      {/* Top Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-500" />
            Төлбөр баталгаажуулалт (¥880 / 30 хоног)
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Банкны шилжүүлгийг гараар нягталж, хэрэглэгчдийн Premium эрхийг нээх хяналтын самбар
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Шинэчлэх</span>
        </button>
      </div>

      {/* Critical Admin Security Warning Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start gap-3.5">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-amber-950 dark:text-amber-100">
          <p className="font-extrabold text-sm">
            Админы шалгалтын анхааруулга (ゆうちょ銀行):
          </p>
          <p className="leading-relaxed">
            Хэрэглэгчийн оруулсан <strong>Шилжүүлэгчийн нэр (振込名義)</strong> болон огноог өөрийн <strong>ゆうちょ銀行</strong> дансны хуулгатай тулган нягталж, <strong>¥880</strong> орж ирснийг бодитоор баталгаажуулсны дараа <strong>[ Зөвшөөрөх ]</strong> товч дарна уу. Зөвшөөрснөөр тухайн хэрэглэгчийн Premium эрх шууд 30 хоногоор идэвхжинэ.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Хүлээгдэж буй</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-900 dark:text-amber-200">
            {adminPaymentStats.pendingCount}
          </p>
          <span className="text-[10px] text-stone-500">Шалгах шаардлагатай</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Баталгаажсан</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-900 dark:text-emerald-200">
            {adminPaymentStats.approvedCount}
          </p>
          <span className="text-[10px] text-stone-500">Нийт амжилттай төлөлт</span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400">Буцаасан</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-900 dark:text-rose-200">
            {adminPaymentStats.rejectedCount}
          </p>
          <span className="text-[10px] text-stone-500">Ороогүй эсвэл зөрсөн</span>
        </div>

        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400">Баталгаажсан орлого</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-900 dark:text-blue-200">
            ¥{adminPaymentStats.totalYenApproved.toLocaleString()}
          </p>
          <span className="text-[10px] text-stone-500">Нийт ゆうちょ дансанд</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-100 dark:bg-stone-800 self-stretch sm:self-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'ALL'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Бүгд ({adminPayments.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'PENDING'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-700 dark:text-amber-400 hover:bg-amber-100/50'
            }`}
          >
            <span>Хүлээгдэж буй</span>
            {adminPaymentStats.pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white/30 text-[10px] font-black">
                {adminPaymentStats.pendingCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'APPROVED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/50'
            }`}
          >
            Баталгаажсан ({adminPaymentStats.approvedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('REJECTED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'REJECTED'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 dark:text-rose-400 hover:bg-rose-100/50'
            }`}
          >
            Буцаасан ({adminPaymentStats.rejectedCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Шилжүүлэгчийн нэр, имэйлээр хайх..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Payment Requests Table */}
      {filteredPayments.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
          <CreditCard className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto" />
          <p className="text-stone-500 text-sm font-medium">Төлбөрийн хүсэлт олдсонгүй.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredPayments.map(item => {
            const isActing = actionLoadingId === item.id;
            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all ${
                  item.status === 'PENDING'
                    ? 'bg-white dark:bg-stone-900 border-amber-300 dark:border-amber-800/80 shadow-md shadow-amber-500/5'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 opacity-90'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Identifiers and Status */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700">
                        {item.id}
                      </span>

                      {item.status === 'PENDING' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-extrabold text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Шалгаж байна (PENDING)
                        </span>
                      )}
                      {item.status === 'APPROVED' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Баталгаажсан (30 хоног)
                        </span>
                      )}
                      {item.status === 'REJECTED' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-extrabold text-[11px] flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Баталгаажаагүй (REJECTED)
                        </span>
                      )}

                      {/* Admin Email Notification Status (Section 39, 45) */}
                      {item.emailNotificationStatus === 'SENT' && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-semibold flex items-center gap-1">
                          <Mail className="w-2.5 h-2.5" /> Админд имэйл очсон
                        </span>
                      )}
                      {item.emailNotificationStatus === 'FAILED' && (
                        <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-[10px] font-semibold flex items-center gap-1">
                          <Mail className="w-2.5 h-2.5 text-stone-400" /> Имэйл алгассан (Хүсэлт бүртгэлтэй)
                        </span>
                      )}
                      {item.emailNotificationStatus === 'NOT_CONFIGURED' && (
                        <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 text-[10px] font-semibold">
                          SMTP тохируулаагүй
                        </span>
                      )}

                      <span className="text-[11px] text-stone-400">
                        Илгээсэн: {item.createdAt}
                      </span>
                    </div>

                    {/* Sender Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">
                          Шилжүүлэгч (振込名義)
                        </span>
                        <span className="text-base font-black text-stone-900 dark:text-white tracking-wide">
                          {item.senderName}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">
                          Шилжүүлсэн огноо (振込日)
                        </span>
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                          {item.transferDate}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">
                          Дүн
                        </span>
                        <span className="text-sm font-extrabold text-red-600 dark:text-red-400">
                          ¥{item.amount}
                        </span>
                      </div>
                    </div>

                    {/* User and notes info */}
                    <div className="flex items-center gap-4 text-xs text-stone-600 dark:text-stone-300 flex-wrap pt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-stone-400" />
                        <strong>Хэрэглэгч:</strong> {item.userName || 'Зочин'} ({item.userEmail})
                      </span>
                      {item.notes && (
                        <span className="p-1 px-2 rounded-md bg-stone-100 dark:bg-stone-800 text-[11px] text-stone-600 dark:text-stone-400">
                          Тэмдэглэл: {item.notes}
                        </span>
                      )}
                      {item.rejectionReason && (
                        <span className="p-1 px-2 rounded-md bg-rose-50 dark:bg-rose-950/40 text-[11px] text-rose-700 dark:text-rose-300 font-semibold">
                          Буцаасан шалтгаан: {item.rejectionReason}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-100 dark:border-stone-800">
                    {item.status === 'PENDING' ? (
                      <>
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() => handleOpenApprove(item)}
                          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          <span>承認 (Зөвшөөрөх)</span>
                        </button>
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() => handleOpenReject(item)}
                          className="px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>却下 (Буцаах)</span>
                        </button>
                      </>
                    ) : item.status === 'APPROVED' ? (
                      <div className="text-right text-[11px] text-stone-400">
                        Баталгаажсан: {item.reviewedAt}
                      </div>
                    ) : (
                      <div className="text-right text-[11px] text-stone-400">
                        Буцаасан: {item.reviewedAt}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Section 40: Admin Approval Modal */}
      {approvingPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border-2 border-emerald-500 dark:border-emerald-600 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="text-lg font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                入金を確認しましたか？
              </h3>
              <button
                onClick={() => setApprovingPayment(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 text-xs text-amber-950 dark:text-amber-100 space-y-1">
              <p className="font-extrabold text-sm">
                ⚠️ ¥880の入金を実際に確認してから承認してください。
              </p>
              <p className="leading-relaxed text-amber-900 dark:text-amber-200">
                ゆうちょ銀行 дансны хуулга дээр шилжүүлэгчийн нэр, огноо, ¥880 дүн бодитоор орж ирснийг шалгасны дараа зөвшөөрнө үү.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-700">
                <span className="text-stone-500">Хүсэлтийн дугаар:</span>
                <span className="font-mono font-bold text-stone-900 dark:text-white">{approvingPayment.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-700">
                <span className="text-stone-500">Шилжүүлэгч (振込名義):</span>
                <span className="font-black text-stone-900 dark:text-white text-sm">{approvingPayment.senderName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-700">
                <span className="text-stone-500">Шилжүүлсэн огноо (振込日):</span>
                <span className="font-bold text-stone-900 dark:text-white">{approvingPayment.transferDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-700">
                <span className="text-stone-500">Хэрэглэгчийн имэйл:</span>
                <span className="font-semibold text-stone-900 dark:text-white">{approvingPayment.userEmail}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-stone-500">Шилжүүлэх дүн:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-base">¥{approvingPayment.amount}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setApprovingPayment(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs hover:bg-stone-200 transition-colors"
              >
                Болих
              </button>
              <button
                type="button"
                disabled={actionLoadingId === approvingPayment.id}
                onClick={handleConfirmApprove}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>このユーザーにPremiumを30日間付与する</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-500" />
                Төлбөрийн хүсэлтийг буцаах (却下)
              </h3>
              <button
                onClick={() => setRejectingPayment(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-400">
              Хэрэглэгч: <strong>{rejectingPayment.senderName}</strong> ({rejectingPayment.userEmail})
            </p>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Буцаах шалтгаан (Хэрэглэгчид тайлбарлан харагдана):
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingPayment(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs"
              >
                Болих
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20"
              >
                Буцаах (却下)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
