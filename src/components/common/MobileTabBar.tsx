import React from 'react';
import {
  Compass,
  Target,
  BookA,
  MessagesSquare,
  User,
  Flame
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MainTab } from '../../types';
import { triggerHapticFeedback } from '../../services/nativePlatform';

export const MobileTabBar: React.FC = () => {
  const { activeTab, setActiveTab, userProgress } = useApp();

  const streakCount = userProgress.streak?.current || userProgress.gamification?.currentStreak || 0;

  const tabs: {
    id: MainTab;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
  }[] = [
    {
      id: 'learn',
      label: 'Зам',
      icon: Compass
    },
    {
      id: 'practice',
      label: 'Дасгал',
      icon: Target
    },
    {
      id: 'dictionary',
      label: 'Толь бичиг',
      icon: BookA
    },
    {
      id: 'roleplay',
      label: 'AI Яриа',
      icon: MessagesSquare
    },
    {
      id: 'profile',
      label: 'Профайл',
      icon: streakCount > 0 ? Flame : User,
      badge: streakCount > 0 ? `${streakCount}🔥` : undefined
    }
  ];

  const handleTabClick = (tabId: MainTab) => {
    triggerHapticFeedback('light');
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Determine if a tab is conceptually active
  const isTabActive = (tabId: MainTab): boolean => {
    if (tabId === 'learn') return activeTab === 'learn' || activeTab === 'home';
    if (tabId === 'roleplay') return activeTab === 'roleplay' || activeTab === 'ai' || activeTab === 'tutor';
    if (tabId === 'profile') return activeTab === 'profile' || activeTab === 'progress';
    return activeTab === tabId;
  };

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#120B0E]/95 backdrop-blur-xl border-t border-stone-200/90 dark:border-stone-800/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)] transition-colors select-none"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)'
      }}
    >
      <div className="grid grid-cols-5 items-center h-14 sm:h-15 max-w-md mx-auto px-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = isTabActive(tab.id);

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className={`relative flex flex-col items-center justify-center h-full min-w-[48px] py-1 transition-all cursor-pointer group active:scale-95 ${
                active
                  ? 'text-[#CC0000] dark:text-[#FF3366]'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              {/* Active glow indicator pill at top */}
              {active && (
                <span className="absolute top-0 w-8 h-1 rounded-full bg-gradient-to-r from-[#CC0000] to-[#FF3366] shadow-[0_0_8px_rgba(255,51,102,0.6)] animate-fade-in" />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 sm:w-5.5 sm:h-5.5 transition-transform duration-200 ${
                    active ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8] group-hover:scale-105'
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-3 px-1 py-0.2 rounded-full text-[9px] font-black bg-gradient-to-r from-amber-500 to-red-500 text-white shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] sm:text-[11px] font-bold mt-1 tracking-tight leading-tight transition-colors ${
                  active ? 'font-extrabold text-[#990000] dark:text-[#FF6699]' : ''
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
