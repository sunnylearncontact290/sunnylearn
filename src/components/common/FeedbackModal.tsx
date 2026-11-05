import React, { useState, useEffect } from 'react';
import { X, Send, MessageSquare, AlertCircle, Sparkles, Volume2, Globe, CheckCircle2, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';
import { FeedbackType } from '../../types';

interface FeedbackCategoryOption {
  type: FeedbackType;
  label: string;
  desc: string;
  icon: React.ElementType;
}

const CATEGORIES: FeedbackCategoryOption[] = [
  {
    type: 'bug',
    label: 'Алдаа мэдээлэх',
    desc: 'Товч ажиллахгүй байх, дэлгэц гацах гэх мэт техникийн алдаа',
    icon: AlertCircle
  },
  {
    type: 'suggestion',
    label: 'Шинэ боломж санал болгох',
    desc: 'Цаашид нэмэхэд хэрэгтэй шинэ санаа, сайжруулалт',
    icon: Sparkles
  },
  {
    type: 'japanese_content',
    label: 'Япон агуулгын алдаа',
    desc: 'Ханз, үг, дүрэм, жишээ өгүүлбэрийн алдаа',
    icon: Globe
  },
  {
    type: 'translation',
    label: 'Монгол орчуулгын алдаа',
    desc: 'Монгол тайлбар, утгын зөрүү, үг үсгийн алдаа',
    icon: MessageSquare
  },
  {
    type: 'audio',
    label: 'Дуудлагын алдаа',
    desc: 'Япон дуудлага зөрөх, аудио дуугарахгүй байх',
    icon: Volume2
  },
  {
    type: 'other',
    label: 'Бусад санал хүсэлт',
    desc: 'Бусад ерөнхий санал, сэтгэгдэл',
    icon: MessageSquare
  }
];

export const FeedbackModal: React.FC = () => {
  const { isFeedbackModalOpen, setIsFeedbackModalOpen, currentUser, showToast } = useApp();

  const [type, setType] = useState<FeedbackType>('bug');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pre-fill user data if authenticated
  useEffect(() => {
    if (isFeedbackModalOpen) {
      setName(currentUser?.name || '');
      setEmail(currentUser?.email || '');
      setMessage('');
      setErrorMessage(null);
      setIsSuccess(false);
      setIsSubmitting(false);
    }
  }, [isFeedbackModalOpen, currentUser]);

  if (!isFeedbackModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMsg = message.trim();
    if (!trimmedMsg) {
      setErrorMessage('Санал хүсэлтийнхээ агуулгыг бичнэ үү.');
      return;
    }

    if (trimmedMsg.length < 5) {
      setErrorMessage('Санал хүсэлтээ доод тал нь 5 тэмдэгтэд багтаан дэлгэрэнгүй бичнэ үү.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await apiService.submitFeedback({
        name: name.trim() || currentUser?.name || 'Зочин',
        email: email.trim() || currentUser?.email || '',
        type,
        message: trimmedMsg
      });

      if (res.success) {
        setIsSuccess(true);
        showToast('Таны санал хүсэлтийг амжилттай хүлээн авлаа. Баярлалаа!', 'success');
        setTimeout(() => {
          setIsFeedbackModalOpen(false);
          setIsSuccess(false);
        }, 2000);
      } else {
        setErrorMessage(res.message || 'Илгээхэд алдаа гарлаа.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Сервертэй холбогдоход алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="relative w-full max-w-xl my-auto rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-red-500/10 via-rose-500/10 to-transparent border-b border-stone-100 dark:border-stone-800">
          <button
            type="button"
            onClick={() => setIsFeedbackModalOpen(false)}
            className="absolute top-5 right-5 p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            title="Хаах"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#CC0000] to-[#FF3366] text-white flex items-center justify-center shadow-md shadow-red-500/20 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100">
                  Санал хүсэлт илгээх
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-[#CC0000] dark:text-[#FF6699] text-[10px] font-black uppercase tracking-wider">
                  Public Beta
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                SunnyLearn-ийг улам сайжруулахад таны санал үнэтэй хувь нэмэр болно.
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                Баярлалаа!
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-sm mx-auto">
                Таны санал хүсэлтийг админ баг хүлээн авлаа. Бид шалгаад платформдоо тусгах болно.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
            {/* Category selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                Саналын төрөл сонгох
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const isSelected = type === cat.type;
                  return (
                    <button
                      key={cat.type}
                      type="button"
                      onClick={() => setType(cat.type)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#FF3366] bg-red-500/10 dark:bg-red-950/40 text-[#CC0000] dark:text-[#FF6699] shadow-xs'
                          : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 text-stone-700 dark:text-stone-300 bg-stone-50/50 dark:bg-stone-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs font-bold truncate">{cat.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name & Email (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  Таны нэр (Заавал биш)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Жишээ: Бат"
                  maxLength={50}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3366]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                  И-мэйл хаяг (Хариу авах бол)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  maxLength={80}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3366]/30"
                />
              </div>
            </div>

            {/* Message Textarea */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                  Санал хүсэлт, дэлгэрэнгүй тайлбар *
                </label>
                <span className="text-[10px] text-stone-400">
                  {message.length} / 1000
                </span>
              </div>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Жишээ нь: N4 түвшний 2-р хичээлийн жишээ өгүүлбэрийн орчуулгад алдаа байна..."
                rows={4}
                maxLength={1000}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3366]/30 resize-none leading-relaxed"
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setIsFeedbackModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Болих
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#CC0000] via-[#FF0000] to-[#FF3366] hover:opacity-95 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Илгээж байна...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Илгээх</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
