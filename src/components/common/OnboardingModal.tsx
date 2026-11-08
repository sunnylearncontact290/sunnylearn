import React, { useState } from 'react';
import {
  Compass,
  Check,
  ArrowRight,
  Sparkles,
  BookOpen,
  Award,
  Zap,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { JLPTLevel } from '../../types';
import { useApp } from '../../context/AppContext';
import { SunnyLogo } from './SunnyLogo';
import { triggerHapticFeedback } from '../../services/nativePlatform';
import { storageService } from '../../services/storage';

interface LevelOption {
  level: JLPTLevel;
  title: string;
  badge: string;
  description: string;
  recommendedFor: string;
  color: string;
}

const LEVEL_OPTIONS: LevelOption[] = [
  {
    level: 'N5',
    title: 'Анхан шат',
    badge: 'Эхлэн суралцагчдад',
    description: 'Мэндчилгээ, өдөр тутмын үндсэн үгс, хирагана, катакана болон суурь ханз',
    recommendedFor: 'Япон хэл шинээр сурч эхэлж буй хүмүүст',
    color: '#CC0000'
  },
  {
    level: 'N4',
    title: 'Суурь шат',
    badge: 'Өдөр тутмын хэрэглээ',
    description: 'Ажил, сургууль дээр өдөр тутам хэрэглэгддэг яриа, энгийн өгүүлбэрийн бүтэц',
    recommendedFor: 'Анхан шатны мэдлэгтэй, яриагаа бататгах хүсэлтэй хүмүүст',
    color: '#DC2626'
  },
  {
    level: 'N3',
    title: 'Дунд шат',
    badge: 'Чөлөөт ойлголцол',
    description: 'Өдөр тутмын амьдралд бүрэн ойлголцох, мэдээ мэдээлэл ойлгох, нийтлэг дүрэм',
    recommendedFor: 'Япон хэлээр чөлөөтэй харилцах зорилготой суралцагчдад',
    color: '#990000'
  },
  {
    level: 'N2',
    title: 'Ахисан шат',
    badge: 'Бизнес & Их сургууль',
    description: 'Мэргэжлийн харилцаа, бизнесийн ёс зүй, сонин сэтгүүл болон эссэ бичвэр',
    recommendedFor: 'Японд их сургуульд суралцах эсвэл ажиллах хүсэлтэй хүмүүст',
    color: '#7F1D1D'
  },
  {
    level: 'N1',
    title: 'Дээд шат',
    badge: 'Мэргэжлийн түвшин',
    description: 'Гүнзгийрүүлсэн уран зохиол, эрдэм шинжилгээний өгүүлэл, соёлын нарийн хэллэг',
    recommendedFor: 'Орчуулга хийх, удирдах түвшний мэргэжилтнүүдэд',
    color: '#450A0A'
  }
];

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { setSelectedLevel } = useApp();
  const [selected, setSelected] = useState<JLPTLevel>('N5');

  if (!isOpen) return null;

  const handleSelectLevel = (level: JLPTLevel) => {
    triggerHapticFeedback('light');
    setSelected(level);
  };

  const handleConfirm = () => {
    triggerHapticFeedback('medium');
    setSelectedLevel(selected);
    storageService.setOnboardingCompleted(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fade-in select-none">
      <div className="w-full max-w-xl bg-white dark:bg-[#150F12] rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-5 sm:p-7 space-y-5 my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Header & Mascot */}
        <div className="flex items-center gap-3.5 pb-2 border-b border-stone-100 dark:border-stone-800/80">
          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-xs shrink-0">
            <SunnyLogo className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
                Тавтай морилно уу!
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 dark:bg-red-950/60 text-[#CC0000] dark:text-[#FF6699]">
                SunnyLearn 2.0
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              Та суралцахыг хүсэж буй <strong>JLPT түвшнээ</strong> сонгоно уу:
            </p>
          </div>
        </div>

        {/* Level Cards */}
        <div className="space-y-2.5">
          {LEVEL_OPTIONS.map(opt => {
            const isChosen = selected === opt.level;
            return (
              <button
                key={opt.level}
                type="button"
                onClick={() => handleSelectLevel(opt.level)}
                className={`w-full p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between text-left ${
                  isChosen
                    ? 'border-[#CC0000] bg-red-50/70 dark:bg-red-950/30 shadow-md shadow-red-500/10 scale-[1.01]'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 hover:border-stone-300 dark:hover:border-stone-700'
                }`}
              >
                <div className="flex items-start gap-3 sm:gap-3.5">
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-black text-sm sm:text-base shrink-0 shadow-xs transition-colors ${
                      isChosen
                        ? 'bg-gradient-to-br from-[#CC0000] to-[#FF3366] text-white shadow-md shadow-red-500/25'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {opt.level}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm sm:text-base text-stone-900 dark:text-stone-100">
                        {opt.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      {opt.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 pl-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isChosen
                        ? 'border-[#CC0000] bg-[#CC0000] text-white'
                        : 'border-stone-300 dark:border-stone-700'
                    }`}
                  >
                    {isChosen && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Security / Switching Guarantee Notice */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400">
          <ShieldCheck className="w-4 h-4 text-[#CC0000] shrink-0" />
          <span>
            Та дараа нь хэдийд ч Профайл → Тохиргоо хэсгээс түвшнээ чөлөөтэй сольж болно. Сурсан явц, XP, streak хэзээ ч устахгүй.
          </span>
        </div>

        {/* Submit Action */}
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#CC0000] via-[#FF0000] to-[#FF3366] text-white font-black text-sm sm:text-base shadow-lg shadow-red-500/25 hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{selected} түвшингээр суралцаж эхлэх</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
