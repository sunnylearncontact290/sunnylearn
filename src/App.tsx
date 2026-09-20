import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { SearchModal } from './components/common/SearchModal';
import { AuthModal } from './components/common/AuthModal';
import { ToastContainer } from './components/common/ToastContainer';
import { HomePage } from './components/home/HomePage';
import { LearnHub } from './components/learn/LearnHub';
import { DictionaryView } from './components/dictionary/DictionaryView';
import { PracticeView } from './components/practice/PracticeView';
import { QuizView } from './components/quiz/QuizView';
import { ProgressView } from './components/progress/ProgressView';
import { ProfileView } from './components/profile/ProfileView';
import { ContactView } from './components/contact/ContactView';
import { PremiumView } from './components/premium/PremiumView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SunnyAIView } from './components/ai/SunnyAIView';
import { SunnyAIModal } from './components/ai/SunnyAIModal';
import { SunnyAIFloatingButton } from './components/ai/SunnyAIFloatingButton';

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab, isAdmin, inAppNotification, dismissInAppNotification } = useApp();

  // Route security: If activeTab is 'admin' but the user is NOT authenticated as sanaa0419z@gmail.com,
  // deny access immediately and redirect back to the home page.
  useEffect(() => {
    if (activeTab === 'admin' && !isAdmin) {
      setActiveTab('home');
      if (typeof window !== 'undefined') {
        if (window.location.hash === '#admin' || window.location.search.includes('admin')) {
          window.history.replaceState(null, '', window.location.pathname || '/');
        }
      }
    }
  }, [activeTab, isAdmin, setActiveTab]);

  // If in admin mode and user is strictly authenticated as sanaa0419z@gmail.com, show full Admin Dashboard
  if (activeTab === 'admin' && isAdmin) {
    return <AdminDashboard />;
  }

  // Normal public pages - NO LOGIN required
  return (
    <div className="w-full max-w-full overflow-x-hidden relative min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans transition-colors duration-200">
      {/* Premium in-app celebratory notification banner */}
      {inAppNotification && !inAppNotification.read && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs sm:text-sm font-bold z-50">
          <div className="flex items-center gap-2 max-w-5xl mx-auto flex-1">
            <span className="text-base">🎉</span>
            <span>{inAppNotification.message || 'SunnyLearn Premium 30 хоногийн эрх амжилттай идэвхжлээ! Тавтай морил.'}</span>
          </div>
          <button
            type="button"
            onClick={dismissInAppNotification}
            className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-black transition-colors cursor-pointer shrink-0"
          >
            Хаах
          </button>
        </div>
      )}

      <Navbar />
      <main className="w-full max-w-full flex-1 pb-16">
        {(activeTab === 'home' || activeTab === 'admin') && <HomePage />}
        {activeTab === 'learn' && <LearnHub />}
        {activeTab === 'dictionary' && <DictionaryView />}
        {activeTab === 'practice' && <PracticeView />}
        {activeTab === 'quiz' && <QuizView />}
        {(activeTab === 'ai' || activeTab === 'tutor') && <SunnyAIView />}
        {activeTab === 'progress' && <ProgressView />}
        {activeTab === 'premium' && <PremiumView />}
        {activeTab === 'profile' && <ProfileView />}
        {activeTab === 'contact' && <ContactView />}
      </main>
      <Footer />
      <SearchModal />
      <AuthModal />
      <SunnyAIModal />
      <SunnyAIFloatingButton />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
