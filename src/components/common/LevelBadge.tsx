import React from 'react';
import { JLPTLevel } from '../../types';

interface LevelBadgeProps {
  level: JLPTLevel;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({ level, size = 'md', className = '' }) => {
  const colorMap: Record<JLPTLevel, { bg: string; text: string; border: string }> = {
    N5: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800/60'
    },
    N4: {
      bg: 'bg-sky-50 dark:bg-sky-950/50',
      text: 'text-sky-700 dark:text-sky-300',
      border: 'border-sky-200 dark:border-sky-800/60'
    },
    N3: {
      bg: 'bg-orange-50 dark:bg-orange-950/50',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-800/60'
    },
    N2: {
      bg: 'bg-red-50 dark:bg-red-950/50',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-200 dark:border-red-800/60'
    },
    N1: {
      bg: 'bg-rose-50 dark:bg-rose-950/50',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800/60'
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-semibold rounded-md border',
    md: 'text-xs px-2.5 py-1 font-bold rounded-lg border tracking-wide',
    lg: 'text-sm px-3.5 py-1.5 font-extrabold rounded-xl border tracking-wide'
  };

  const style = colorMap[level] || colorMap.N5;

  return (
    <span
      className={`inline-flex items-center justify-center select-none font-mono ${style.bg} ${style.text} ${style.border} ${sizeClasses[size]} ${className}`}
    >
      {level}
    </span>
  );
};
