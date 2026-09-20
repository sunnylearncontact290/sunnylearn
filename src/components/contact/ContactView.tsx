import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, MessageSquare, AlertCircle, HelpCircle, Lightbulb, ExternalLink, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';

export const ContactView: React.FC = () => {
  const { showToast } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'feedback' | 'question' | 'error_report' | 'content_suggestion'>('feedback');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<{
    name: string;
    email: string;
    subject: string;
    message: string;
    type: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subject.trim() || !message.trim()) {
      showToast('Нэр, сэдэв болон захидлын утгыг бөглөнө үү.', 'error');
      return;
    }

    setIsSubmitting(true);
    const submittedData = {
      name: name.trim(),
      email: email.trim() || 'Зочин (Мэйл бичээгүй)',
      subject: subject.trim(),
      message: message.trim(),
      type
    };

    try {
      const res = await apiService.submitFeedback({
        name: submittedData.name,
        email: submittedData.email,
        type,
        message: `[Сэдэв: ${submittedData.subject}]\n${submittedData.message}`
      });

      if (res.success) {
        setLastSubmitted(submittedData);
        setIsSuccess(true);
        showToast('Таны санал хүсэлтийг амжилттай хүлээн авлаа. Баярлалаа!', 'success');
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        showToast(res.message || 'Илгээхэд алдаа гарлаа.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Сервертэй холбогдоход алдаа гарлаа.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGmailComposeUrl = () => {
    if (!lastSubmitted) {
      return 'https://mail.google.com/mail/?view=cm&fs=1&to=sunnylearn.contact@gmail.com';
    }
    const su = encodeURIComponent(`[SunnyLearn ${lastSubmitted.type}] ${lastSubmitted.subject}`);
    const body = encodeURIComponent(
      `Сайн байна уу, SunnyLearn баг аа.\n\nИлгээгч: ${lastSubmitted.name}\nИмэйл: ${lastSubmitted.email}\nТөрөл: ${lastSubmitted.type}\n\nЗурвас:\n${lastSubmitted.message}`
    );
    return `https://mail.google.com/mail/?view=cm&fs=1&to=sunnylearn.contact@gmail.com&su=${su}&body=${body}`;
  };

  const getMailtoUrl = () => {
    if (!lastSubmitted) return 'mailto:sunnylearn.contact@gmail.com';
    const su = encodeURIComponent(`[SunnyLearn ${lastSubmitted.type}] ${lastSubmitted.subject}`);
    const body = encodeURIComponent(
      `Сайн байна уу, SunnyLearn баг аа.\n\nИлгээгч: ${lastSubmitted.name}\nИмэйл: ${lastSubmitted.email}\n\nЗурвас:\n${lastSubmitted.message}`
    );
    return `mailto:sunnylearn.contact@gmail.com?subject=${su}&body=${body}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shadow-sm shrink-0">
            <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              Бидэнтэй холбогдох / Санал хүсэлт
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
              Та платформын сайжруулалт, шинэ хичээл, эсвэл алдааны талаар санал хүсэлтээ чөлөөтэй илгээнэ үү.
            </p>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs text-stone-500 dark:text-stone-400 block">
              Холбогдох / Хүлээн авах Gmail хаяг:
            </span>
            <span className="text-sm font-bold text-red-600 dark:text-red-400 font-mono break-all">
              sunnylearn.contact@gmail.com
            </span>
          </div>
          <a
            href="https://mail.google.com/mail/?view=cm&fs=1&to=sunnylearn.contact@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 font-bold text-xs transition-colors border border-red-200/60 dark:border-red-900/50 shrink-0"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Gmail нээх</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white dark:bg-stone-900 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
        {isSuccess ? (
          <div className="text-center py-8 space-y-6 animate-fade-in max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
                Таны зурвасыг амжилттай хүлээн авлаа!
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                Таны санал хүсэлт мэдээллийн санд хадгалагдаж, <strong className="text-stone-900 dark:text-stone-200 font-mono">sunnylearn.contact@gmail.com</strong> хаягт хүргэгдлээ.
              </p>
            </div>

            {/* Direct Gmail Send Option */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-left space-y-3">
              <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200 font-bold text-xs">
                <Mail className="w-4 h-4 text-red-500" />
                <span>Өөрийн Gmail-ээр мөн давхар илгээх үү?</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-normal">
                Та доорх товчийг дарж өөрийн хувийн Gmail акаунтаар шууд бэлдсэн зурвасыг 1 товшилтоор илгээх боломжтой:
              </p>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <a
                  href={getGmailComposeUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-all"
                >
                  <Mail className="w-4 h-4" />
                  <span>Gmail-ээр шууд илгээх</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href={getMailtoUrl()}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 font-bold text-xs transition-colors"
                >
                  <span>Мэйл апп нээх</span>
                </a>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsSuccess(false)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Өөр зурвас бичих</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Feedback Type Buttons */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
                Санал хүсэлтийн төрөл
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'feedback', label: '💬 Сэтгэгдэл', icon: MessageSquare },
                  { id: 'question', label: '❓ Асуулт', icon: HelpCircle },
                  { id: 'error_report', label: '⚠️ Алдаа мэдээлэх', icon: AlertCircle },
                  { id: 'content_suggestion', label: '💡 Хичээл санал болгох', icon: Lightbulb }
                ].map(item => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setType(item.id as any)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border text-left ${
                      type === item.id
                        ? 'bg-red-600 text-white border-red-600 shadow-sm'
                        : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-750'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Name and Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  Таны нэр <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Нэрээ бичнэ үү"
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  Таны имэйл (сонголттой)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Хариу авах бол имэйлээ бичнэ үү"
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Гарчиг / Сэдэв <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Жишээ: N3 дүрмийн жишээний тухай"
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Санал хүсэлтийн дэлгэрэнгүй <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Дэлгэрэнгүй санал, асуулт эсвэл мэдээллээ бичнэ үү..."
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Илгээж байна...' : 'Илгээх'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

