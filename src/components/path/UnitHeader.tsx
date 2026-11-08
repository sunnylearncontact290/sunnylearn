import React from 'react';
import { BookOpen, Sparkles, Trophy, ChevronRight } from 'lucide-react';
import { CurriculumUnit } from '../../types';

interface UnitHeaderProps {
  unit: CurriculumUnit;
  completedCount: number;
  totalCount: number;
  onOpenGuidebook?: (unit: CurriculumUnit) => void;
}

export const UnitHeader: React.FC<UnitHeaderProps> = ({
  unit,
  completedCount,
  totalCount,
  onOpenGuidebook
}) => {
  const percent = Math.min(100, Math.round((completedCount / (totalCount || 1)) * 100));
  const isUnitCompleted = completedCount >= totalCount && totalCount > 0;

  return (
    <div className="w-full max-w-xl mx-auto my-6 sm:my-8 px-2">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#990000] via-[#CC0000] to-[#E11D48] text-white p-5 sm:p-6 shadow-xl shadow-red-950/20 border border-white/10">
        {/* Subtle decorative background watermark */}
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none blur-2xl" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-white/20 text-white/90 border border-white/15">
                БҮЛЭГ {unit.unitNumber}
              </span>
              {isUnitCompleted && (
                <span className="flex items-center gap-1 text-[11px] font-extrabold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-300/30">
                  <Trophy className="w-3 h-3" />
                  Дууссан
                </span>
              )}
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
              {unit.title}
            </h3>

            <p className="text-xs sm:text-sm text-white/80 leading-relaxed line-clamp-2">
              {unit.mongolianDescription}
            </p>
          </div>

          {/* Unit Progress Counter & Mini Guide Button */}
          <div className="flex items-center sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
            <div className="text-right">
              <div className="text-xs font-bold text-white/90">
                {completedCount} / {totalCount} хичээл
              </div>
              <div className="w-24 sm:w-28 h-2 rounded-full bg-black/30 overflow-hidden mt-1 p-0.5">
                <div
                  className="h-full rounded-full bg-amber-300 transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            {onOpenGuidebook && (
              <button
                type="button"
                onClick={() => onOpenGuidebook(unit)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-xs font-bold text-white transition-all cursor-pointer border border-white/15"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                <span>Хөтөч</span>
                <ChevronRight className="w-3 h-3 text-white/70" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
