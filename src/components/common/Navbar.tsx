import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  Compass,
  BookA,
  CheckSquare,
  Target,
  TrendingUp,
  User,
  MessageSquare,
  Sun,
  Moon,
  Search,
  Menu,
  X,
  ShieldCheck,
  Sparkles,
  Bot,
  MessagesSquare,
  LogIn,
  LogOut,
  Check,
  RefreshCw,
  CloudOff
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MainTab } from '../../types';
import { SunnyLogo } from './SunnyLogo';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isDarkMode,
    toggleDarkMode,
    setIsSearchOpen,
    isAdmin,
    userProgress,
    currentUser,
    syncStatus,
    setIsAuthModalOpen,
    userLogout,
    isPremium,
    latestPendingPayment
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: { tab: MainTab; label: string; icon: React.ElementType }[] = [
    { tab: 'home', label: 'Нүүр', icon: Compass },
    { tab: 'learn', label: 'Сурах', icon: BookOpen },
    { tab: 'dictionary', label: 'Толь бичиг', icon: BookA },
    { tab: 'practice', label: 'Дасгал', icon: CheckSquare },
    { tab: 'quiz', label: 'Сорил', icon: Target },
    { tab: 'roleplay', label: 'AI Roleplay', icon: MessagesSquare },
    { tab: 'ai', label: 'Sunny AI', icon: Bot },
    { tab: 'progress', label: 'Миний явц', icon: TrendingUp },
    { tab: 'premium', label: 'Premium', icon: Sparkles },
    { tab: 'profile', label: 'Профайл', icon: User },
    { tab: 'contact', label: 'Бидэнтэй холбогдох', icon: MessageSquare }
  ];

  const handleNavClick = (tab: MainTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 w-full max-w-full bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors shadow-2xs box-border">
      <div className="w-full max-w-[1720px] mx-auto px-2 sm:px-4 md:px-6 lg:px-7 xl:px-8 2xl:px-10 box-border">
        <div className="flex items-center justify-between h-14 sm:h-16 xl:h-18 gap-1.5 sm:gap-2 md:gap-4 lg:gap-6 w-full max-w-full min-w-0 box-border">
          {/* 1. LEFT: SunnyLearn / JLPT Logo */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer group select-none shrink-0 min-w-0"
            title="SunnyLearn Нүүр хуудас"
          >
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 xl:w-11 xl:h-11 rounded-lg sm:rounded-xl xl:rounded-2xl overflow-hidden shadow-xs border border-stone-200 dark:border-stone-800 bg-transparent group-hover:scale-105 transition-transform shrink-0">
              <SunnyLogo className="w-full h-full object-cover" />
            </div>
            
            {/* Brand text: On mobile screens below 480px, text is hidden to ensure all vital controls fit comfortably. On >=480px and desktop, fully visible */}
            <div className="hidden min-[480px]:flex flex-col justify-center shrink-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="font-black text-sm sm:text-base xl:text-xl tracking-tight text-stone-900 dark:text-white whitespace-nowrap">
                  Sunny<span className="text-red-600 dark:text-red-400">Learn</span>
                </span>
                <span className="text-[9px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold shrink-0">
                  JLPT
                </span>
              </div>
              <p className="hidden 2xl:block text-[11px] text-stone-500 dark:text-stone-400 font-medium leading-none whitespace-nowrap mt-0.5">
                Япон хэлний цахим сургалт
              </p>
            </div>

            {/* Compact JLPT badge on screens < 480px next to logo */}
            <span className="min-[480px]:hidden text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold shrink-0">
              JLPT
            </span>
          </div>

          {/* 2. CENTER: Desktop Navigation Menu */}
          <nav className="hidden xl:flex items-center justify-center gap-1 2xl:gap-1.5 flex-1 min-w-0 mx-2 2xl:mx-4">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  onClick={() => handleNavClick(item.tab)}
                  className={`inline-flex items-center gap-1.5 2xl:gap-2 px-2.5 2xl:px-3.5 py-1.5 2xl:py-2 rounded-xl text-xs 2xl:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-bold border border-red-200 dark:border-red-900/50 shadow-2xs'
                      : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 2xl:w-4 2xl:h-4 shrink-0 ${isActive ? 'text-red-600 dark:text-red-400' : 'text-stone-400 dark:text-stone-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* 3. RIGHT: Search, Theme, Streak, Login/Profile, and Mobile Hamburger */}
          <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 xl:gap-2.5 shrink-0 ml-auto xl:ml-0 min-w-0">
            {/* Search Trigger */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              title="Хайлт хийх"
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-transparent hover:border-stone-200 dark:hover:border-stone-700 transition-colors shrink-0 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            </button>

            {/* Dark Mode Switch */}
            <button
              type="button"
              onClick={toggleDarkMode}
              title={isDarkMode ? 'Гэгээлэг горимд шилжих' : 'Харанхуй горимд шилжих'}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-transparent hover:border-stone-200 dark:hover:border-stone-700 transition-colors shrink-0 cursor-pointer"
            >
              {isDarkMode ? (
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400 shrink-0" />
              ) : (
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-600 shrink-0" />
              )}
            </button>

            {/* Streak / Daily Indicator - NEVER clipped, fully visible at all widths */}
            <div
              onClick={() => handleNavClick('progress')}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/50 text-orange-700 dark:text-orange-300 text-[11px] sm:text-xs font-bold cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors select-none shrink-0 whitespace-nowrap shadow-2xs"
              title="Таны тасралтгүй суралцсан өдөр"
            >
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-orange-500 text-orange-500 shrink-0" />
              <span className="whitespace-nowrap font-extrabold">{userProgress.streak?.current || 1} өдөр</span>
            </div>

            {/* User Profile / Login Button - ALWAYS visible and accessible */}
            {currentUser ? (
              <div className="relative shrink-0" ref={userMenuRef}>
                <button
                  type="button"
                  id="navbar-user-menu-btn"
                  onClick={() => setIsUserMenuOpen(prev => !prev)}
                  className="flex items-center gap-1 sm:gap-1.5 p-1 pl-1 sm:pl-1.5 pr-1.5 sm:pr-2.5 rounded-lg sm:rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-xs font-semibold shrink-0 cursor-pointer select-none"
                >
                  {currentUser.picture ? (
                    <img
                      src={currentUser.picture}
                      alt={currentUser.name}
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-red-600 to-orange-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden md:inline text-stone-800 dark:text-stone-200 max-w-[90px] xl:max-w-[110px] truncate whitespace-nowrap">
                    {currentUser.name}
                  </span>
                  <span
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${
                      syncStatus === 'synced'
                        ? 'bg-emerald-500'
                        : syncStatus === 'syncing'
                        ? 'bg-orange-500 animate-pulse'
                        : 'bg-stone-400'
                    }`}
                    title={
                      syncStatus === 'synced'
                        ? 'Явц серверт хадгалагдсан'
                        : syncStatus === 'syncing'
                        ? 'Синк хийгдэж байна...'
                        : 'Офлайн'
                    }
                  />
                </button>

                {/* Dropdown menu */}
                {isUserMenuOpen && (
                  <div
                    id="navbar-user-dropdown"
                    className="absolute right-0 mt-2 w-60 max-w-[calc(100vw-24px)] rounded-2xl bg-white dark:bg-stone-900 shadow-xl border border-stone-200 dark:border-stone-800 py-2 z-50 animate-fadeIn"
                  >
                    <div className="px-4 py-2 border-b border-stone-100 dark:border-stone-800">
                      <p className="text-xs font-bold text-stone-900 dark:text-white truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                        {currentUser.email}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-stone-500 dark:text-stone-400">
                        {syncStatus === 'synced' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Синк хийгдсэн</span>
                          </>
                        ) : syncStatus === 'syncing' ? (
                          <>
                            <RefreshCw className="w-3 h-3 text-orange-500 animate-spin" />
                            <span className="text-orange-600 dark:text-orange-400 font-medium">Синк хийгдэж байна...</span>
                          </>
                        ) : (
                          <>
                            <CloudOff className="w-3 h-3 text-stone-400" />
                            <span>Офлайн горим</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="py-1">
                      {isAdmin && (
                        <button
                          onClick={() => handleNavClick('admin')}
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 font-bold transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Админ удирдлага</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleNavClick('progress')}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 font-medium transition-colors"
                      >
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                        <span>Миний явц</span>
                      </button>
                      <button
                        onClick={() => handleNavClick('profile')}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 font-medium transition-colors"
                      >
                        <User className="w-4 h-4 text-stone-400" />
                        <span>Тохиргоо & Профайл</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-stone-100 dark:border-stone-800">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          userLogout();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Бүртгэлээс гарах</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                id="navbar-login-btn"
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100/90 dark:bg-stone-800 hover:bg-stone-200/90 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-100 text-[11px] sm:text-xs font-semibold transition-all shadow-2xs shrink-0 whitespace-nowrap cursor-pointer"
                title="Нэвтрэх"
              >
                <LogIn className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                <span className="hidden min-[340px]:inline whitespace-nowrap">Нэвтрэх</span>
              </button>
            )}

            {/* Admin Badge if authenticated */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => handleNavClick('admin')}
                className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200 transition-all shrink-0 whitespace-nowrap cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Админ</span>
              </button>
            )}

            {/* Mobile menu hamburger */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              aria-label="Цэс нээх"
              className="xl:hidden p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 shrink-0 cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {isMobileMenuOpen && (
        <div className="xl:hidden border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3 sm:px-4 pt-3 pb-5 space-y-1 w-full max-w-full overflow-hidden">
          {currentUser ? (
            <div className="flex items-center justify-between p-3 mb-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
              <div className="flex items-center gap-2.5 min-w-0 truncate">
                {currentUser.picture ? (
                  <img src={currentUser.picture} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-orange-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 truncate">
                  <p className="text-xs font-bold text-stone-900 dark:text-white truncate">{currentUser.name}</p>
                  <p className="text-[11px] text-stone-500 truncate">{currentUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  userLogout();
                }}
                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-xs shrink-0"
                title="Гарах"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsAuthModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mb-2 rounded-xl bg-[#EF233C] hover:bg-[#D90429] text-white font-semibold text-sm shadow-xs cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Google-ээр нэвтрэх / Бүртгүүлэх</span>
            </button>
          )}
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => handleNavClick(item.tab)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-base font-medium transition-colors ${
                  isActive
                    ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 font-bold border border-red-200 dark:border-red-900/50'
                    : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-red-600 dark:text-red-400' : 'text-stone-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {isAdmin && (
            <button
              onClick={() => handleNavClick('admin')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-base font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Админ удирдлага</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
