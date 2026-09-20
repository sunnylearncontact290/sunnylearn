import React from 'react';
import { Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SunnyAIFloatingButton: React.FC = () => {
  const { activeTab, isSunnyAIOpen, setIsSunnyAIOpen } = useApp();

  // Do not show on tutor tab or when modal is already open
  if (activeTab === 'ai' || activeTab === 'tutor' || isSunnyAIOpen) {
    return null;
  }

  return (
    <button
      id="sunny-ai-quick-launcher"
      type="button"
      onClick={() => setIsSunnyAIOpen(true)}
      className="fixed bottom-6 right-5 sm:right-8 z-40 group flex items-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer border border-white/25"
      title="Sunny AI — Япон хэлний хиймэл оюун багштай ярилцах"
    >
      <div className="relative flex items-center justify-center">
        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
      </div>
      <span className="font-bold text-xs sm:text-sm tracking-wide">
        Sunny AI
      </span>
    </button>
  );
};
