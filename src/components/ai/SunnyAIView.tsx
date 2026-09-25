import React from 'react';
import { SunnyAITutor } from './SunnyAITutor';
import { Sparkles, HelpCircle, BookOpen, ShieldCheck, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SunnyAIView: React.FC = () => {
  const { isPremium, setActiveTab } = useApp();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 animate-fade-in">
      {/* Top Banner / Heading */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-extrabold bg-red-500/10 dark:bg-red-400/15 text-[#EF233C] dark:text-red-400 border border-red-500/20 shadow-2xs">
          <Sparkles className="w-4 h-4 text-[#EF233C]" />
          <span>JLPT N5-N1 Хиймэл Оюуны Багш</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
          Sunny AI Багш
        </h1>
        <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 leading-relaxed">
          Япон хэлний үг, дүрэм, ханз, сорилын асуулт бүрийг монгол хэлээр цэгцтэй, ойлгомжтойгоор шууд тайлбарлана.
        </p>
      </div>

      {/* Main Chat Frame */}
      <SunnyAITutor mode="page" />

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto pt-4 text-left">
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold text-sm">
            <BookOpen className="w-4 h-4" />
            <span>Бүх түвшний дэмжлэг</span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            JLPT N5, N4, N3, N2, N1 бүх түвшний дүрмийн нарийн ялгаа, холболт, жишээг харуулна.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            <HelpCircle className="w-4 h-4" />
            <span>Сорилын алдаа шинжилгээ</span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            Таны сонгосон хариулт яагаад буруу болсныг, зөв хариултын дүрмийг монголоор задлан тайлбарлана.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>{isPremium ? 'Premium Хязгааргүй' : 'Өдөрт 20 мессеж үнэгүй'}</span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            {isPremium
              ? 'Таны Premium эрх идэвхтэй байгаа тул Sunny AI-г ямар ч хязгааргүй ашиглах боломжтой.'
              : 'Энгийн хэрэглэгчид 24 цагт 20 асуулт үнэгүй. Premium эрх авснаар хязгааргүй болно.'}
          </p>
        </div>
      </div>
    </div>
  );
};
