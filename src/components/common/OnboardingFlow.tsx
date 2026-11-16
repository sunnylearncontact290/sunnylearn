import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Bot, Target } from 'lucide-react';
import { JLPTLevel } from '../../types';
import { useApp } from '../../context/AppContext';
import { SunnyLogo } from './SunnyLogo';
import { triggerHapticFeedback } from '../../services/nativePlatform';
import { storageService } from '../../services/storage';

interface LevelOption {
  level: JLPTLevel;
  title: string;
  description: string;
  recommendedBadge?: string;
}

const LEVEL_OPTIONS: LevelOption[] = [
  {
    level: 'N5',
    title: 'Анхан шат',
    description: 'Хирагана, катакана, өдөр тутмын үндсэн үгс',
    recommendedBadge: 'Эхлэгчдэд санал болгоно',
  },
  {
    level: 'N4',
    title: 'Суурь шат',
    description: 'Өдөр тутмын энгийн яриа, өгүүлбэрүүд',
  },
  {
    level: 'N3',
    title: 'Дунд шат',
    description: 'Өдөр тутмын яриа, илүү өргөн үгс ба дүрэм',
  },
  {
    level: 'N2',
    title: 'Ахисан шат',
    description: 'Мэдээ, ажил, сургууль, илүү нарийн хэллэг',
  },
  {
    level: 'N1',
    title: 'Мэргэжлийн шат',
    description: 'Өндөр түвшний үгс, уншлага, нарийн хэрэглээ',
  },
];

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const { setSelectedLevel } = useApp();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<JLPTLevel | null>(null);

  const handleSelectLevel = (level: JLPTLevel) => {
    triggerHapticFeedback('light');
    setSelected(level);
  };

  const handleStartFromWelcome = () => {
    triggerHapticFeedback('light');
    setStep(2);
  };

  const handleSkipWelcome = () => {
    triggerHapticFeedback('light');
    setStep(2);
  };

  const handleBack = () => {
    triggerHapticFeedback('light');
    if (step === 3) {
      setStep(2);
    } else if (step === 2) {
      setStep(1);
    }
  };

  const handleContinueFromLevel = () => {
    if (!selected) return;
    triggerHapticFeedback('light');
    setStep(3);
  };

  const handleCompleteOnboarding = () => {
    if (!selected) return;
    triggerHapticFeedback('medium');
    setSelectedLevel(selected);
    storageService.setOnboardingCompleted(true);
    onComplete();
  };

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col bg-transparent text-stone-900 dark:text-stone-100 select-none"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
      }}
    >
      <div className="w-full max-w-[580px] mx-auto px-4 sm:px-6 flex-1 flex flex-col">
        {/* Minimal Top Header */}
        <header className="h-12 flex items-center justify-between gap-2 shrink-0">
          {/* Left: Back (Step 2-3) + Minimal SunnyLearn identity */}
          <div className="flex items-center gap-2 min-w-0">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                aria-label="Буцах"
                className="w-9 h-9 -ml-1.5 rounded-xl flex items-center justify-center text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white hover:bg-stone-100/80 dark:hover:bg-stone-800/80 transition-colors cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[22%] overflow-hidden shadow-xs shrink-0">
                <SunnyLogo className="block w-full h-full object-cover" />
              </div>
              <div className="flex items-baseline gap-1.5 truncate">
                <span className="font-black text-sm sm:text-base tracking-tight text-stone-900 dark:text-white">
                  Sunny<span className="text-[#CC0000] dark:text-[#FF3366]">Learn</span>
                </span>
                <span className="text-[11px] font-medium text-stone-400 dark:text-stone-500">
                  2.0
                </span>
              </div>
            </div>
          </div>

          {/* Center: Compact Step Progress */}
          <div className="flex items-center gap-2 shrink-0" aria-label={`Алхам ${step} / 3`}>
            <span className="text-[11px] font-bold text-stone-400 dark:text-stone-500 tabular-nums">
              {step} / 3
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((dot) => {
                const isActive = dot === step;
                const isDone = dot < step;
                return (
                  <span
                    key={dot}
                    className={`h-1.5 rounded-full transition-all duration-200 ${
                      isActive
                        ? 'w-5 bg-[#CC0000] dark:bg-[#FF3366]'
                        : isDone
                        ? 'w-2.5 bg-[#CC0000]/40 dark:bg-[#FF3366]/40'
                        : 'w-2.5 bg-stone-200 dark:bg-stone-800'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Right: Skip intro ONLY on Step 1 -> advances to JLPT selection */}
          <div className="min-w-[68px] flex justify-end shrink-0">
            {step === 1 && (
              <button
                type="button"
                onClick={handleSkipWelcome}
                className="text-xs font-semibold text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Алгасах
              </button>
            )}
          </div>
        </header>

        {/* Step Content */}
        <div className="flex-1 flex flex-col justify-between py-2.5 sm:py-6">
          {step === 1 && (
            <>
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6 space-y-6 animate-fadeIn">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[22%] overflow-hidden shadow-xl shadow-red-500/10 mx-auto">
                  <SunnyLogo className="block w-full h-full object-cover" />
                </div>

                <div className="space-y-3 max-w-md mx-auto">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight text-stone-900 dark:text-stone-100">
                    SunnyLearn-д тавтай морил 👋
                  </h1>
                  <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed">
                    Япон хэлээ өөрийн түвшинд, өдөр бүр бага багаар сураарай.
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-stone-400 dark:text-stone-500 pt-1">
                    Үг · Ханз · Дүрэм · Дасгал · Sunny AI
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleStartFromWelcome}
                  className="w-full min-h-[52px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#CC0000] via-[#FF0000] to-[#FF3366] text-white font-black text-base shadow-lg shadow-red-500/20 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Эхлэх</span>
                  <ArrowRight className="w-5 h-5 shrink-0" />
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-3 sm:space-y-5 animate-fadeIn">
                <div className="space-y-1">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">
                    Та аль түвшнээс эхлэх вэ?
                  </h1>
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-snug sm:leading-relaxed">
                    Одоогийн түвшиндээ хамгийн ойрыг сонгоорой. Дараа нь хүссэн үедээ сольж болно.
                  </p>
                </div>

                <div
                  role="radiogroup"
                  aria-label="JLPT түвшин сонгох"
                  className="space-y-1.5 sm:space-y-2.5"
                >
                  {LEVEL_OPTIONS.map((opt) => {
                    const isChosen = selected === opt.level;
                    return (
                      <button
                        key={opt.level}
                        type="button"
                        role="radio"
                        aria-checked={isChosen}
                        onClick={() => handleSelectLevel(opt.level)}
                        className={`w-full px-3 py-2 sm:px-4 sm:py-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left min-h-[52px] sm:min-h-[60px] ${
                          isChosen
                            ? 'border-[#CC0000] dark:border-[#FF3366] bg-[#FFF5F7] dark:bg-red-950/30 shadow-xs ring-1 ring-[#CC0000]/20 dark:ring-[#FF3366]/25'
                            : 'border-stone-200/90 dark:border-stone-800 bg-white/90 dark:bg-[#170D10]/90 hover:border-stone-300 dark:hover:border-stone-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm shrink-0 transition-colors ${
                              isChosen
                                ? 'bg-gradient-to-br from-[#CC0000] to-[#FF3366] text-white shadow-xs'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200'
                            }`}
                          >
                            {opt.level}
                          </span>

                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-sm sm:text-[15px] text-stone-900 dark:text-stone-100">
                                {opt.title}
                              </span>
                              {opt.recommendedBadge && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 dark:bg-red-950/60 text-[#CC0000] dark:text-[#FF6699] border border-red-200/60 dark:border-red-900/50">
                                  {opt.recommendedBadge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 leading-snug">
                              {opt.description}
                            </p>
                          </div>
                        </div>

                        <span
                          aria-hidden="true"
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isChosen
                              ? 'border-[#CC0000] dark:border-[#FF3366] bg-[#CC0000] dark:bg-[#FF3366]'
                              : 'border-stone-300 dark:border-stone-700 bg-transparent'
                          }`}
                        >
                          {isChosen && <span className="w-2 h-2 rounded-full bg-white" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 sm:pt-4 mt-auto">
                <button
                  type="button"
                  disabled={!selected}
                  onClick={handleContinueFromLevel}
                  className={`w-full min-h-[50px] sm:min-h-[52px] py-3 sm:py-3.5 px-6 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 ${
                    selected
                      ? 'bg-gradient-to-r from-[#CC0000] via-[#FF0000] to-[#FF3366] text-white shadow-lg shadow-red-500/20 hover:opacity-95 active:scale-[0.99] cursor-pointer'
                      : 'bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-500 cursor-not-allowed'
                  }`}
                >
                  <span>Энэ түвшнээс эхлэх</span>
                  <ArrowRight className="w-5 h-5 shrink-0" />
                </button>
              </div>
            </>
          )}

          {step === 3 && selected && (
            <>
              <div className="flex-1 flex flex-col justify-center space-y-5 py-2 animate-fadeIn">
                <div className="text-center space-y-2.5">
                  <div className="w-16 h-16 rounded-[22%] overflow-hidden shadow-md mx-auto">
                    <SunnyLogo className="block w-full h-full object-cover" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 dark:text-stone-100">
                    Бэлэн боллоо 🎉
                  </h1>
                  <p className="text-sm sm:text-base font-bold text-stone-700 dark:text-stone-200">
                    Таны сурах түвшин:{' '}
                    <span className="text-[#CC0000] dark:text-[#FF6699] font-black">
                      JLPT {selected}
                    </span>
                  </p>
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                    Өнөөдрийн эхний хичээлээс шууд эхэлж болно.
                  </p>
                </div>

                <div className="rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white/90 dark:bg-[#170D10]/90 divide-y divide-stone-100 dark:divide-stone-800/80 shadow-xs">
                  <div className="flex items-center gap-3.5 px-4 py-3.5">
                    <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/50 text-[#CC0000] dark:text-[#FF6699] flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                        Өнөөдрийн хичээл
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        JLPT {selected} түвшний үндсэн үг, ханз, дүрмийн зам
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 px-4 py-3.5">
                    <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/50 text-[#CC0000] dark:text-[#FF6699] flex items-center justify-center shrink-0">
                      <Target className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                        Өдрийн зорилго
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        Өдөр бүр 5–10 минут, өөрийн хурдаар
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 px-4 py-3.5">
                    <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/50 text-[#CC0000] dark:text-[#FF6699] flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                        Sunny AI
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        Ойлгоогүй зүйлээ шууд асуух багш туслах
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleCompleteOnboarding}
                  className="w-full min-h-[52px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#CC0000] via-[#FF0000] to-[#FF3366] text-white font-black text-base shadow-lg shadow-red-500/20 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Суралцаж эхлэх</span>
                  <ArrowRight className="w-5 h-5 shrink-0" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
