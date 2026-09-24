import React, { useState, useEffect } from 'react';
import { Volume2, Loader2, VolumeX } from 'lucide-react';
import { speechService, SpeechState, DEFAULT_JAPANESE_VOICE, extractFullJapaneseSentence } from '../../services/speech';

export interface AudioButtonProps {
  text?: any;
  reading?: string;
  id?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'pill' | 'subtle';
  className?: string;
  label?: string;
  title?: string;
  voice?: string;
  rate?: number;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  text = '',
  reading,
  id,
  size = 'sm',
  variant = 'default',
  className = '',
  label,
  title = 'Япон дуудлага сонсох',
  voice = DEFAULT_JAPANESE_VOICE,
  rate = 1.0,
  onPlayStart,
  onPlayEnd
}) => {
  const [speechState, setSpeechState] = useState<SpeechState>(() => speechService.getState());

  useEffect(() => {
    const unsubscribe = speechService.subscribe((state) => {
      setSpeechState({ ...state });
    });
    return unsubscribe;
  }, []);

  const fullText = extractFullJapaneseSentence(text);

  if (!fullText && !reading) {
    return null;
  }

  const effectiveId = id || (reading ? `${fullText}_${reading}` : fullText);
  const isPlaying = speechState.isPlaying && speechState.currentId === effectiveId;
  const isLoading = speechState.loadingId === effectiveId;
  const hasError = speechState.errorId === effectiveId;

  const handlePrefetch = () => {
    if (fullText || reading) {
      speechService.prefetch(fullText, reading, voice);
    }
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isLoading) return;

    if (isPlaying) {
      speechService.stop();
      return;
    }

    await speechService.play(fullText, {
      id: effectiveId,
      reading,
      voice,
      rate,
      onStart: onPlayStart,
      onEnd: onPlayEnd
    });
  };

  // Size styling
  const sizeClasses = {
    xs: 'p-1 text-xs gap-1',
    sm: 'p-1.5 text-xs sm:text-sm gap-1.5',
    md: 'p-2 text-sm gap-2',
    lg: 'p-2.5 text-base gap-2.5'
  }[size];

  const iconSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }[size];

  // Variant styling
  const variantClasses = {
    default:
      'bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/25 rounded-xl shadow-2xs',
    subtle:
      'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-lg',
    ghost:
      'hover:bg-amber-500/15 text-stone-500 hover:text-amber-600 dark:text-stone-400 dark:hover:text-amber-400 rounded-lg',
    pill:
      'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 rounded-full px-3 py-1 font-medium'
  }[variant];

  // Playing / Loading / Error highlight states
  const activeClass = isPlaying
    ? 'ring-2 ring-amber-500/70 bg-amber-500/25 text-amber-800 dark:text-amber-200 animate-pulse'
    : hasError
    ? 'ring-1 ring-red-400 bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300'
    : '';

  const buttonTitle = isPlaying
    ? 'Зогсоох'
    : hasError
    ? 'Алдаа гарлаа. Дахин дарж оролдоно уу'
    : title;

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={handlePrefetch}
      onTouchStart={handlePrefetch}
      onFocus={handlePrefetch}
      disabled={isLoading}
      title={buttonTitle}
      aria-label={buttonTitle}
      className={`inline-flex items-center justify-center transition-all duration-150 cursor-pointer select-none disabled:opacity-75 disabled:cursor-wait ${sizeClasses} ${variantClasses} ${activeClass} ${className}`.trim()}
    >
      {isLoading ? (
        <Loader2 className={`${iconSizes} animate-spin text-amber-600 dark:text-amber-400`} />
      ) : isPlaying ? (
        <Volume2 className={`${iconSizes} text-amber-600 dark:text-amber-300 scale-110 transition-transform`} />
      ) : hasError ? (
        <VolumeX className={`${iconSizes} text-red-500 dark:text-red-400 transition-transform hover:scale-110`} />
      ) : (
        <Volume2 className={`${iconSizes} transition-transform group-hover:scale-110`} />
      )}
      {label && <span className="font-medium leading-none">{label}</span>}
    </button>
  );
};
