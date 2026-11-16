import React from 'react';
import { Mail, ShieldCheck, Heart, Globe, BookOpen } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { JLPTLevel } from '../../types';
import { SunnyLogo } from './SunnyLogo';

export const Footer: React.FC = () => {
  const { setActiveTab, setSelectedLevel, isAdmin } = useApp();

  const handleLevelClick = (lvl: JLPTLevel) => {
    setSelectedLevel(lvl);
    setActiveTab('learn');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="glass-footer w-full max-w-full overflow-hidden text-stone-600 dark:text-stone-400 mt-12 sm:mt-20 transition-colors">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 sm:pt-12 lg:pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-8 sm:mb-10">
          {/* Brand Col */}
          <div className="space-y-3 sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[22%] overflow-hidden shadow-sm bg-transparent shrink-0">
                <SunnyLogo className="block w-full h-full object-cover" />
              </div>
              <span className="font-extrabold text-stone-900 dark:text-white tracking-tight text-base">
                Sunny<span className="text-red-600 dark:text-red-400">Learn</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-stone-500 dark:text-stone-400">
              Монгол хэлээр Япон хэл (JLPT N5-N1) бие даан суралцах цахим сургалтын нээлттэй систем.
            </p>
            <div className="pt-2 text-xs flex items-center gap-1.5 text-stone-500">
              <Mail className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <a href="mailto:sunnylearn.contact@gmail.com" className="hover:text-red-600 dark:hover:text-red-400 font-medium break-all">
                sunnylearn.contact@gmail.com
              </a>
            </div>

            {/* Social Media Section */}
            <div className="pt-3 border-t border-stone-200/70 dark:border-stone-800/80">
              <h4 className="font-bold text-xs uppercase tracking-wider text-stone-900 dark:text-stone-200 mb-1.5">
                Биднийг дагаарай
              </h4>
              <div className="flex flex-col items-start">
                <a
                  href="https://www.instagram.com/sunnylearn.japanese/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="SunnyLearn Instagram"
                  className="inline-flex items-center gap-2 min-h-[40px] py-1.5 pr-3 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <svg
                    className="w-4 h-4 shrink-0 text-stone-500 dark:text-stone-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                  <span>Instagram</span>
                </a>
                <a
                  href="https://www.facebook.com/share/19rr87Fhqj/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="SunnyLearn Facebook"
                  className="inline-flex items-center gap-2 min-h-[40px] py-1.5 pr-3 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <svg
                    className="w-4 h-4 shrink-0 text-stone-500 dark:text-stone-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                  <span>Facebook</span>
                </a>
              </div>
            </div>
          </div>

          {/* Levels Col */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-stone-900 dark:text-stone-200 mb-3">
              JLPT Түвшингүүд
            </h4>
            <ul className="space-y-1.5 text-xs">
              {(['N5', 'N4', 'N3', 'N2', 'N1'] as JLPTLevel[]).map(lvl => (
                <li key={lvl}>
                  <button
                    onClick={() => handleLevelClick(lvl)}
                    className="hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700" />
                    <span>JLPT {lvl} Түвшин</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Learning Sections */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-stone-900 dark:text-stone-200 mb-3">
              Сургалтын хэсэг
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button onClick={() => { setActiveTab('dictionary'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-red-600 dark:hover:text-red-400">
                  Япон-Монгол Толь бичиг
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('practice'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-red-600 dark:hover:text-red-400">
                  Тест ба Сорил шалгалт
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('progress'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-red-600 dark:hover:text-red-400">
                  Миний суралцсан явц
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('contact'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-red-600 dark:hover:text-red-400">
                  Санал хүсэлт, Холбогдох
                </button>
              </li>
              <li>
                <a
                  href="/tokushoho"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('tokushoho');
                    if (typeof window !== 'undefined') {
                      window.history.pushState(null, '', '/tokushoho');
                    }
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-red-600 dark:hover:text-red-400 text-[11px] sm:text-xs"
                >
                  特定商取引法に基づく表記
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} SunnyLearn. Бүх эрх хуулиар хамгаалагдсан.</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4">
            <a
              href="/tokushoho"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('tokushoho');
                if (typeof window !== 'undefined') {
                  window.history.pushState(null, '', '/tokushoho');
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors underline underline-offset-4 decoration-stone-300 dark:decoration-stone-700"
            >
              特定商取引法に基づく表記
            </a>
            <span className="text-stone-300 dark:text-stone-700">•</span>
            {isAdmin && (
              <>
                <button
                  onClick={() => {
                    setActiveTab('admin');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Админ самбар</span>
                </button>
                <span className="text-stone-300 dark:text-stone-700">•</span>
              </>
            )}
            <div className="flex items-center gap-1">
              <span>Монгол суралцагчдад зориулав</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
