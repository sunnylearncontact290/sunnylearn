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
  CloudOff,
  ChevronDown,
  Layers,
  Crown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MainTab, JLPTLevel } from '../../types';
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
    isComplimentaryPremium,
    selectedLevel,
    setSelectedLevel,
    effectiveLevel,
    isPublicBeta,
    setIsFeedbackModalOpen
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isLevelMenuOpen, setIsLevelMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const levelMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(target)) {
        setIsMoreMenuOpen(false);
      }
      if (levelMenuRef.current && !levelMenuRef.current.contains(target)) {
        setIsLevelMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const jlptLevels: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

  // Core Learning tabs shown on all desktop screens (lg, xl, 2xl)
  const coreNavItems: { tab: MainTab; label: string; icon: React.ElementType }[] = [
    { tab: 'learn', label: 'Сурах', icon: BookOpen },
    { tab: 'dictionary', label: 'Толь бичиг', icon: BookA },
    { tab: 'practice', label: 'Дасгал', icon: CheckSquare },
    { tab: 'quiz', label: 'Сорил', icon: Target },
  ];

  // Extended items shown directly on xl+ (1280px+), or moved to "Бусад" dropdown on lg (1024-1279px)
  const extendedNavItems: { tab: MainTab; label: string; icon: React.ElementType }[] = [
    { tab: 'home', label: 'Нүүр', icon: Compass },
    { tab: 'roleplay', label: 'AI Roleplay', icon: MessagesSquare },
    { tab: 'ai', label: 'Sunny AI', icon: Bot },
  ];

  // Secondary tabs always housed in accessible "Бусад" (More) dropdown
  const secondaryNavItems: { tab: MainTab; label: string; icon: React.ElementType }[] = [
    { tab: 'progress', label: 'Миний явц', icon: TrendingUp },
    { tab: 'premium', label: 'Premium эрх', icon: Crown },
    { tab: 'profile', label: 'Тохиргоо & Профайл', icon: User },
    { tab: 'contact', label: 'Бидэнтэй холбогдох', icon: MessageSquare },
  ];

  const handleNavClick = (tab: MainTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsMoreMenuOpen(false);
    setIsLevelMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLevelSelect = (lvl: JLPTLevel) => {
    setSelectedLevel(lvl);
    setIsLevelMenuOpen(false);
  };

  const isSecondaryActive = secondaryNavItems.some(item => item.tab === activeTab);
  const isExtendedActive = extendedNavItems.some(item => item.tab === activeTab);

  return (
    <header className="glass-header sticky top-0 z-40 w-full max-w-full transition-colors shadow-2xs box-border border-b border-stone-200/80 dark:border-stone-800/80 bg-white/95 dark:bg-[#120B0E]/95 backdrop-blur-md">
      <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-4 md:px-6 lg:px-6 xl:px-8 box-border">
        <div className="flex items-center justify-between h-14 sm:h-16 xl:h-17 gap-2 lg:gap-3 xl:gap-4 w-full max-w-full min-w-0 box-border">
          
          {/* ========================================================= */}
          {/* 1. LEFT SECTION: Logo, Brand & JLPT Level Selector       */}
          {/* ========================================================= */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
            {/* Logo and Brand */}
            <div
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group select-none shrink-0"
              title="SunnyLearn Нүүр хуудас"
            >
              <div className="relative w-8 h-8 sm:w-9 sm:h-9 xl:w-10 xl:h-10 rounded-xl overflow-hidden shadow-xs border border-stone-200 dark:border-stone-800 bg-transparent group-hover:scale-105 transition-transform shrink-0">
                <SunnyLogo className="w-full h-full object-cover" />
              </div>
              
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-black text-sm sm:text-base xl:text-lg tracking-tight text-stone-900 dark:text-white whitespace-nowrap">
                  Sunny<span className="text-[#CC0000] dark:text-[#FF3366]">Learn</span>
                </span>
                {isPublicBeta && (
                  <span className="hidden min-[480px]:inline-flex px-1.5 py-0.5 rounded-md bg-red-500/15 border border-red-500/30 text-[#CC0000] dark:text-[#FF6699] text-[9px] font-black uppercase tracking-wider">
                    BETA
                  </span>
                )}
              </div>
            </div>

            {/* Subtle vertical divider separating Brand from JLPT selector */}
            <div className="h-4 sm:h-5 w-px bg-stone-200 dark:bg-stone-800 shrink-0 hidden min-[400px]:block mx-0.5 sm:mx-1" />

            {/* JLPT Level Selector (Always visible, distinct, zero overlap) */}
            <div className="relative shrink-0" ref={levelMenuRef}>
              <button
                type="button"
                onClick={() => setIsLevelMenuOpen(prev => !prev)}
                className="inline-flex items-center gap-1 px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200/80 dark:border-red-900/60 text-[#CC0000] dark:text-[#FF6699] font-black text-xs transition-all cursor-pointer select-none shrink-0 shadow-2xs"
                title="JLPT түвшин солих"
              >
                <span className="font-mono">{effectiveLevel}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isLevelMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* JLPT Dropdown Menu */}
              {isLevelMenuOpen && (
                <div className="absolute left-0 mt-2 w-36 rounded-2xl bg-white dark:bg-stone-900 shadow-xl border border-stone-200 dark:border-stone-800 py-1.5 z-50 animate-fadeIn">
                  <div className="px-3 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    JLPT Түвшин
                  </div>
                  {jlptLevels.map(lvl => {
                    const isSelected = effectiveLevel === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => handleLevelSelect(lvl)}
                        className={`w-full flex items-center justify-between px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-red-50 dark:bg-red-950/60 text-[#CC0000] dark:text-[#FF4D4D]'
                            : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                      >
                        <span className="font-mono">JLPT {lvl}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#CC0000] dark:text-[#FF4D4D]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. CENTER SECTION: Desktop Navigation (Adaptive lg / xl) */}
          {/* ========================================================= */}
          <nav className="hidden lg:flex items-center justify-center gap-1 xl:gap-1.5 flex-1 min-w-0 mx-2 xl:mx-4">
            {/* Extended tab "Нүүр" visible directly on xl+ (1280px+) */}
            <button
              type="button"
              onClick={() => handleNavClick('home')}
              className={`hidden xl:inline-flex items-center gap-1.5 px-2.5 2xl:px-3 py-1.5 rounded-xl text-xs xl:text-[13px] font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-red-50 dark:bg-red-950/60 text-[#CC0000] dark:text-[#FF4D4D] font-extrabold border border-red-200 dark:border-red-900/50 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100/90 dark:hover:bg-stone-800/80 border border-transparent'
              }`}
            >
              <Compass className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'home' ? 'text-[#CC0000] dark:text-[#FF4D4D]' : 'text-stone-400'}`} />
              <span>Нүүр</span>
            </button>

            {/* Core 4 Learning tabs visible directly on both lg and xl */}
            {coreNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => handleNavClick(item.tab)}
                  className={`inline-flex items-center gap-1.5 px-2 xl:px-2.5 2xl:px-3 py-1.5 rounded-xl text-xs xl:text-[13px] font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-red-50 dark:bg-red-950/60 text-[#CC0000] dark:text-[#FF4D4D] font-extrabold border border-red-200 dark:border-red-900/50 shadow-2xs'
                      : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100/90 dark:hover:bg-stone-800/80 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#CC0000] dark:text-[#FF4D4D]' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* AI Roleplay & Sunny AI visible directly on xl+ (1280px+) */}
            <button
              type="button"
              onClick={() => handleNavClick('roleplay')}
              className={`hidden xl:inline-flex items-center gap-1.5 px-2.5 2xl:px-3 py-1.5 rounded-xl text-xs xl:text-[13px] font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'roleplay'
                  ? 'bg-red-50 dark:bg-red-950/60 text-[#CC0000] dark:text-[#FF4D4D] font-extrabold border border-red-200 dark:border-red-900/50 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100/90 dark:hover:bg-stone-800/80 border border-transparent'
              }`}
            >
              <MessagesSquare className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'roleplay' ? 'text-[#CC0000] dark:text-[#FF4D4D]' : 'text-stone-400'}`} />
              <span>AI Roleplay</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('ai')}
              className={`hidden xl:inline-flex items-center gap-1.5 px-2.5 2xl:px-3 py-1.5 rounded-xl text-xs xl:text-[13px] font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'ai'
                  ? 'bg-red-50 dark:bg-red-950/60 text-[#CC0000] dark:text-[#FF4D4D] font-extrabold border border-red-200 dark:border-red-900/50 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100/90 dark:hover:bg-stone-800/80 border border-transparent'
              }`}
            >
              <Bot className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'ai' ? 'text-[#CC0000] dark:text-[#FF4D4D]' : 'text-stone-400'}`} />
              <span>Sunny AI</span>
            </button>

            {/* "Бусад" (More) Accessible Dropdown for secondary tabs */}
            <div className="relative shrink-0" ref={moreMenuRef}>
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen(prev => !prev)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs xl:text-[13px] font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isSecondaryActive || isExtendedActive
                    ? 'bg-red-50 dark:bg-red-950/60 text-[#CC0000] dark:text-[#FF4D4D] font-extrabold border border-red-200 dark:border-red-900/50 shadow-2xs'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100/90 dark:hover:bg-stone-800/80 border border-transparent'
                }`}
                title="Бусад хуудаснууд"
              >
                <span>Бусад</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isMoreMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-stone-900 shadow-xl border border-stone-200 dark:border-stone-800 py-1.5 z-50 animate-fadeIn">
                  {/* On lg (1024-1279px), show the extended items in dropdown */}
                  <div className="xl:hidden border-b border-stone-100 dark:border-stone-800 pb-1 mb-1">
                    {extendedNavItems.map(item => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.tab;
                      return (
                        <button
                          key={item.tab}
                          type="button"
                          onClick={() => handleNavClick(item.tab)}
                          className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-red-50 dark:bg-red-950/60 text-[#CC0000] dark:text-[#FF4D4D] font-bold'
                              : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#CC0000] dark:text-[#FF4D4D]' : 'text-stone-400'}`} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Standard secondary items */}
                  {secondaryNavItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.tab;
                    return (
                      <button
                        key={item.tab}
                        type="button"
                        onClick={() => handleNavClick(item.tab)}
                        className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-red-50 dark:bg-red-950/60 text-[#CC0000] dark:text-[#FF4D4D] font-bold'
                            : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#CC0000] dark:text-[#FF4D4D]' : 'text-stone-400'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}

                  <div className="border-t border-stone-100 dark:border-stone-800 pt-1 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        setIsFeedbackModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-[#CC0000] dark:text-[#FF6699] hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span>Санал хүсэлт илгээх</span>
                    </button>
                  </div>

                  {/* Admin link inside More menu if authenticated */}
                  {isAdmin && (
                    <div className="border-t border-stone-100 dark:border-stone-800 pt-1 mt-1">
                      <button
                        type="button"
                        onClick={() => handleNavClick('admin')}
                        className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer ${
                          activeTab === 'admin'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : 'text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Админ удирдлага</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </nav>

          {/* ========================================================= */}
          {/* 3. RIGHT SECTION: Premium, Streak, Theme, User/Login     */}
          {/* ========================================================= */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0 min-w-0">
            
            {/* Quick Premium Pill Button */}
            <button
              type="button"
              onClick={() => handleNavClick('premium')}
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-xl font-bold text-xs transition-all shadow-xs shrink-0 cursor-pointer ${
                isPremium
                  ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25'
                  : 'bg-gradient-to-r from-[#CC0000] to-[#FF3366] text-white hover:opacity-95 shadow-red-500/20'
              }`}
              title={isPremium ? 'Premium гишүүнчлэл идэвхтэй' : 'Premium авах'}
            >
              <Crown className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">
                {isComplimentaryPremium ? 'Байнгын эрх' : isPremium ? 'Premium' : 'Premium'}
              </span>
            </button>

            {/* Streak Counter Pill: compact on small screens */}
            <div
              onClick={() => handleNavClick('progress')}
              className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/50 text-orange-700 dark:text-orange-300 text-[11px] sm:text-xs font-bold cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors select-none shrink-0 whitespace-nowrap shadow-2xs"
              title="Таны тасралтгүй суралцсан өдөр"
            >
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-orange-500 text-orange-500 shrink-0" />
              <span className="font-extrabold">{userProgress.streak?.current || 1}</span>
              <span className="hidden sm:inline font-bold">өдөр</span>
            </div>

            {/* Search Trigger (Hidden on narrow screens < 480px, available in bottom nav & menu) */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              title="Хайлт хийх"
              className="hidden min-[480px]:inline-flex p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-transparent hover:border-stone-200 dark:border-stone-700 transition-colors shrink-0 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            </button>

            {/* Dark Mode Switch */}
            <button
              type="button"
              onClick={toggleDarkMode}
              title={isDarkMode ? 'Гэгээлэг горим' : 'Харанхуй горим'}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-transparent hover:border-stone-200 dark:border-stone-700 transition-colors shrink-0 cursor-pointer"
            >
              {isDarkMode ? (
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400 shrink-0" />
              ) : (
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-600 shrink-0" />
              )}
            </button>

            {/* User Profile / Login Button */}
            {currentUser ? (
              <div className="relative shrink-0" ref={userMenuRef}>
                <button
                  type="button"
                  id="navbar-user-menu-btn"
                  onClick={() => setIsUserMenuOpen(prev => !prev)}
                  className="flex items-center gap-1 sm:gap-1.5 p-1 pl-1 sm:pl-1.5 pr-1.5 sm:pr-2 rounded-lg sm:rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-xs font-semibold shrink-0 cursor-pointer select-none"
                >
                  {currentUser.picture ? (
                    <img
                      src={currentUser.picture}
                      alt={currentUser.name}
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-[#FF0000] to-[#FF3366] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden md:inline text-stone-800 dark:text-stone-200 max-w-[80px] xl:max-w-[100px] truncate whitespace-nowrap">
                    {currentUser.name}
                  </span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
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
                    className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-24px)] rounded-2xl bg-white dark:bg-stone-900 shadow-xl border border-stone-200 dark:border-stone-800 py-2 z-50 animate-fadeIn"
                  >
                    <div className="px-4 py-2 border-b border-stone-100 dark:border-stone-800">
                      <p className="text-xs font-bold text-stone-900 dark:text-white truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                        {currentUser.email}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-stone-500 dark:text-stone-400">
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
                          type="button"
                          onClick={() => handleNavClick('admin')}
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100 font-bold transition-colors cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Админ удирдлага</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleNavClick('progress')}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 font-medium transition-colors cursor-pointer"
                      >
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                        <span>Миний явц</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNavClick('profile')}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 font-medium transition-colors cursor-pointer"
                      >
                        <User className="w-4 h-4 text-stone-400" />
                        <span>Тохиргоо & Профайл</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-stone-100 dark:border-stone-800">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          userLogout();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium transition-colors cursor-pointer"
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
                <span className="hidden min-[360px]:inline whitespace-nowrap">Нэвтрэх</span>
              </button>
            )}

            {/* Admin Badge if authenticated */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => handleNavClick('admin')}
                className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200 transition-all shrink-0 whitespace-nowrap cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Админ</span>
              </button>
            )}

            {/* Mobile menu hamburger (Visible < lg) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              aria-label="Цэс нээх"
              className="lg:hidden p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 shrink-0 cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. MOBILE / TABLET NAVIGATION DRAWER (< lg)              */}
      {/* ========================================================= */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3.5 sm:px-5 pt-3 pb-6 space-y-4 w-full max-w-full overflow-y-auto max-h-[calc(100vh-4rem)]">
          
          {/* User info or Login CTA */}
          {currentUser ? (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700">
              <div className="flex items-center gap-2.5 min-w-0 truncate">
                {currentUser.picture ? (
                  <img src={currentUser.picture} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF0000] to-[#FF3366] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 truncate">
                  <p className="text-xs font-bold text-stone-900 dark:text-white truncate">{currentUser.name}</p>
                  <p className="text-[11px] text-stone-500 truncate">{currentUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  userLogout();
                }}
                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-xs shrink-0 cursor-pointer"
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
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#CC0000] to-[#FF3366] text-white font-bold text-sm shadow-sm cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Google-ээр нэвтрэх / Бүртгүүлэх</span>
            </button>
          )}

          {/* Quick JLPT Level Selection in Mobile Drawer */}
          <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-1.5">
            <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#CC0000]" />
              <span>JLPT Түвшин сонгох</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {jlptLevels.map(lvl => {
                const isSelected = effectiveLevel === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleLevelSelect(lvl)}
                    className={`py-1.5 text-xs font-black rounded-lg text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#CC0000] to-[#FF3366] text-white shadow-xs scale-102'
                        : 'bg-white dark:bg-stone-700/70 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-600'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 1: Сургалт (Learning) */}
          <div className="space-y-1">
            <div className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider px-2">
              Сургалтын танхим
            </div>
            {[
              { tab: 'home' as MainTab, label: 'Нүүр хуудас', icon: Compass },
              { tab: 'learn' as MainTab, label: 'Сурах (JLPT Агуулга)', icon: BookOpen },
              { tab: 'dictionary' as MainTab, label: 'Толь бичиг', icon: BookA },
              { tab: 'practice' as MainTab, label: 'Дасгал ажил', icon: CheckSquare },
              { tab: 'quiz' as MainTab, label: 'Сорил & Тест', icon: Target },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => handleNavClick(item.tab)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-red-50 dark:bg-red-950/50 text-[#CC0000] dark:text-[#FF4D4D] font-bold border border-red-200 dark:border-red-900/50'
                      : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#CC0000] dark:text-[#FF4D4D]' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Section 2: Хиймэл оюун (AI) */}
          <div className="space-y-1 pt-1 border-t border-stone-100 dark:border-stone-800">
            <div className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider px-2 pt-1">
              Хиймэл Оюунт Багш
            </div>
            {[
              { tab: 'roleplay' as MainTab, label: 'AI Roleplay харилцан яриа', icon: MessagesSquare },
              { tab: 'ai' as MainTab, label: 'Sunny AI туслах', icon: Bot },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => handleNavClick(item.tab)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-red-50 dark:bg-red-950/50 text-[#CC0000] dark:text-[#FF4D4D] font-bold border border-red-200 dark:border-red-900/50'
                      : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#CC0000] dark:text-[#FF4D4D]' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Section 3: Бүртгэл & Тохиргоо (Account) */}
          <div className="space-y-1 pt-1 border-t border-stone-100 dark:border-stone-800">
            <div className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider px-2 pt-1">
              Хувийн танхим & Үйлчилгээ
            </div>
            {[
              { tab: 'progress' as MainTab, label: 'Миний явц', icon: TrendingUp },
              { tab: 'premium' as MainTab, label: 'Premium эрх авах', icon: Crown },
              { tab: 'profile' as MainTab, label: 'Тохиргоо & Профайл', icon: User },
              { tab: 'contact' as MainTab, label: 'Бидэнтэй холбогдох', icon: MessageSquare },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => handleNavClick(item.tab)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-red-50 dark:bg-red-950/50 text-[#CC0000] dark:text-[#FF4D4D] font-bold border border-red-200 dark:border-red-900/50'
                      : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#CC0000] dark:text-[#FF4D4D]' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsFeedbackModalOpen(true);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-[#CC0000] dark:text-[#FF6699] bg-red-50/60 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200/60 dark:border-red-900/40 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-[#CC0000] dark:text-[#FF4D4D]" />
              <span>Санал хүсэлт илгээх (Public Beta)</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => handleNavClick('admin')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Админ удирдлага</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
