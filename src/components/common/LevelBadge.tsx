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
      bg: 'bg-red-500/10 dark:bg-red-500/15',
      text: 'text-[#FF0000] dark:text-[#FF4D4D]',
      border: 'border-[#FF0000]/25 dark:border-[#FF0000]/30'
    },
    N4: {
      bg: 'bg-[#FF3366]/10 dark:bg-[#FF3366]/15',
      text: 'text-[#FF3366] dark:text-[#FF6688]',
      border: 'border-[#FF3366]/25 dark:border-[#FF3366]/30'
    },
    N3: {
      bg: 'bg-[#FF6666]/10 dark:bg-[#FF6666]/15',
      text: 'text-[#E64C4C] dark:text-[#FF8080]',
      border: 'border-[#FF6666]/25 dark:border-[#FF6666]/30'
    },
    N2: {
      bg: 'bg-[#CC0066]/10 dark:bg-[#CC0066]/15',
      text: 'text-[#CC0066] dark:text-[#FF3399]',
      border: 'border-[#CC0066]/25 dark:border-[#CC0066]/30'
    },
    N1: {
      bg: 'bg-[#990066]/10 dark:bg-[#990066]/15',
      text: 'text-[#990066] dark:text-[#E639B0]',
      border: 'border-[#990066]/25 dark:border-[#990066]/30'
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
