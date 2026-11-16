import React from 'react';
import { BookOpen, CheckCircle2, ChevronDown, Lock } from 'lucide-react';
import { CurriculumUnit } from '../../types';

interface UnitHeaderProps {
  unit: CurriculumUnit;
  completedCount: number;
  totalCount: number;
  isCurrentUnit: boolean;
  isUnitCompleted: boolean;
  isUnitLocked: boolean;
  isExpanded: boolean;
  onToggleExpand: (unitId: string) => void;
  onOpenGuidebook?: (unit: CurriculumUnit) => void;
}

export const UnitHeader: React.FC<UnitHeaderProps> = ({
  unit,
  completedCount,
  totalCount,
  isCurrentUnit,
  isUnitCompleted,
  isUnitLocked,
  isExpanded,
  onToggleExpand,
  onOpenGuidebook
}) => {
  const percent = totalCount > 0 ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0;

  const containerStyle = isCurrentUnit
    ? 'bg-gradient-to-br from-[#990000] via-[#CC0000] to-[#E11D48] text-white border-red-400/30 shadow-lg shadow-red-950/20'
    : isUnitCompleted
    ? 'bg-white dark:bg-[#150F12] text-stone-900 dark:text-stone-100 border-emerald-300/70 dark:border-emerald-800/50 shadow-sm'
    : 'bg-white dark:bg-[#150F12] text-stone-900 dark:text-stone-100 border-stone-200 dark:border-stone-800 shadow-xs';

  const statusText = isUnitCompleted
    ? 'Дууссан'
    : isCurrentUnit
    ? 'Одоо суралцаж буй'
    : 'Дараагийн шат';

  return (
    <div id={`unit-anchor-${unit.id}`} className="w-full scroll-mt-24">
      <div className={`rounded-2xl sm:rounded-3xl border transition-all overflow-hidden ${containerStyle}`}>
        <div className="p-4 sm:p-5 flex flex-col gap-3">
          {/* Top Metadata Row: Unit number, status, progress */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-wrap text-xs font-bold">
              <span
                className={`uppercase tracking-wider font-black ${
                  isCurrentUnit ? 'text-white/95' : 'text-[#CC0000] dark:text-[#FF6699]'
                }`}
              >
                Бүлэг {unit.unitNumber}
              </span>
              <span className={isCurrentUnit ? 'text-white/40' : 'text-stone-300 dark:text-stone-700'}>·</span>
              <span
                className={`inline-flex items-center gap-1 font-extrabold ${
                  isCurrentUnit
                    ? 'text-amber-200'
                    : isUnitCompleted
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                {isUnitCompleted && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                {isUnitLocked && !isUnitCompleted && !isCurrentUnit && <Lock className="w-3.5 h-3.5 shrink-0" />}
                <span>{statusText}</span>
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`text-xs font-mono font-bold tabular-nums ${
                  isCurrentUnit ? 'text-white/95' : 'text-stone-600 dark:text-stone-300'
                }`}
              >
                {completedCount}/{totalCount}
              </span>
            </div>
          </div>

          {/* Main Clickable Row: Title, Description, Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onToggleExpand(unit.id)}
              aria-expanded={isExpanded}
              className="flex-1 min-w-0 text-left group cursor-pointer focus:outline-none"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <h3
                    className={`text-base sm:text-lg font-black tracking-tight leading-snug ${
                      isCurrentUnit
                        ? 'text-white'
                        : isUnitLocked
                        ? 'text-stone-700 dark:text-stone-300'
                        : 'text-stone-900 dark:text-stone-100'
                    }`}
                  >
                    {unit.title}
                  </h3>
                  <p
                    className={`text-xs leading-relaxed line-clamp-2 ${
                      isCurrentUnit ? 'text-white/85' : 'text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    {unit.mongolianDescription}
                  </p>
                </div>
              </div>
            </button>

            <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
              {onOpenGuidebook && (
                <button
                  type="button"
                  onClick={() => onOpenGuidebook(unit)}
                  className={`min-h-[40px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    isCurrentUnit
                      ? 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                      : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-200/80 dark:border-stone-700'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span>Хөтөч</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onToggleExpand(unit.id)}
                aria-label={isExpanded ? 'Бүлгийг хураах' : 'Бүлгийг дэлгэх'}
                className={`min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                  isCurrentUnit
                    ? 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                    : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-200/80 dark:border-stone-700'
                }`}
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div
            className={`w-full h-2 rounded-full overflow-hidden ${
              isCurrentUnit ? 'bg-black/25' : 'bg-stone-100 dark:bg-stone-800'
            }`}
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCurrentUnit
                  ? 'bg-amber-300'
                  : isUnitCompleted
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-[#CC0000] to-[#FF3366]'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
