import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { loadKanjiStrokeData, KanjiStrokeData, StrokePath } from '../../utils/kanjiVG';

export interface KanjiStrokeOrderProps {
  kanji: string;
  size?: number;
  autoPlay?: boolean;
  isPlaying?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  currentStroke?: number; // 1-based (0 = none, 1..total, total = all)
  onStrokeChange?: (currentStroke: number, totalStrokes: number) => void;
  onFinish?: () => void;
  showNumbers?: boolean;
  showGrid?: boolean;
  speedMultiplier?: number;
  className?: string;
}

export const KanjiStrokeOrder: React.FC<KanjiStrokeOrderProps> = ({
  kanji,
  size = 240,
  autoPlay = true,
  isPlaying: externalIsPlaying,
  onPlayingChange,
  currentStroke: externalCurrentStroke,
  onStrokeChange,
  onFinish,
  showNumbers = true,
  showGrid = true,
  speedMultiplier = 1,
  className = '',
}) => {
  const [data, setData] = useState<KanjiStrokeData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Internal playback state if not controlled externally
  const [internalCurrentStroke, setInternalCurrentStroke] = useState<number>(0);
  const [internalIsPlaying, setInternalIsPlaying] = useState<boolean>(autoPlay);
  const [strokeProgress, setStrokeProgress] = useState<number>(1); // 0 (start) to 1 (drawn)

  const activeStrokeIndex = externalCurrentStroke !== undefined ? externalCurrentStroke : internalCurrentStroke;
  const isPlaying = externalIsPlaying !== undefined ? externalIsPlaying : internalIsPlaying;

  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const setIsPlaying = useCallback(
    (val: boolean) => {
      if (onPlayingChange) {
        onPlayingChange(val);
      } else {
        setInternalIsPlaying(val);
      }
    },
    [onPlayingChange]
  );

  const setCurrentStroke = useCallback(
    (strokeNum: number, total: number) => {
      if (onStrokeChange) {
        onStrokeChange(strokeNum, total);
      }
      setInternalCurrentStroke(strokeNum);
    },
    [onStrokeChange]
  );

  // Load KanjiVG data when kanji changes
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setError(null);
    setData(null);
    setStrokeProgress(0);
    setInternalCurrentStroke(0);

    loadKanjiStrokeData(kanji)
      .then(result => {
        if (isCancelled) return;
        if (result && result.strokes.length > 0) {
          setData(result);
          setIsLoading(false);
          // Start drawing stroke 1
          if (autoPlay) {
            setInternalIsPlaying(true);
            setInternalCurrentStroke(1);
            setStrokeProgress(0);
            if (onStrokeChange) {
              onStrokeChange(1, result.strokeCount);
            }
          } else {
            setInternalCurrentStroke(result.strokeCount);
            setStrokeProgress(1);
            if (onStrokeChange) {
              onStrokeChange(result.strokeCount, result.strokeCount);
            }
          }
        } else {
          setError('Энэ ханзны зурлагын мэдээлэл одоогоор байхгүй байна.');
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (isCancelled) return;
        console.error('[KanjiStrokeOrder] Error loading data:', err);
        setError('Энэ ханзны зурлагын мэдээлэл одоогоор байхгүй байна.');
        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [kanji, autoPlay]);

  // Frame animation loop for active stroke drawing
  useEffect(() => {
    if (!isPlaying || !data || activeStrokeIndex <= 0 || activeStrokeIndex > data.strokeCount) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      lastTimeRef.current = null;
      return;
    }

    // Base duration for drawing 1 stroke: ~700ms adjusted by speedMultiplier
    const strokeDuration = Math.max(250, 700 / (speedMultiplier || 1));
    const pauseBetweenStrokes = Math.max(100, 200 / (speedMultiplier || 1));

    let localProgress = strokeProgress;
    let isPausing = false;
    let pauseStartTime = 0;

    const tick = (now: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = now;
      }
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (isPausing) {
        if (now - pauseStartTime >= pauseBetweenStrokes) {
          isPausing = false;
          // Advance to next stroke
          if (activeStrokeIndex < data.strokeCount) {
            const nextStroke = activeStrokeIndex + 1;
            setCurrentStroke(nextStroke, data.strokeCount);
            localProgress = 0;
            setStrokeProgress(0);
          } else {
            // Finished all strokes!
            setIsPlaying(false);
            if (onFinish) {
              onFinish();
            }
            return;
          }
        }
      } else {
        localProgress += delta / strokeDuration;
        if (localProgress >= 1) {
          localProgress = 1;
          setStrokeProgress(1);
          isPausing = true;
          pauseStartTime = now;
        } else {
          setStrokeProgress(localProgress);
        }
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, data, activeStrokeIndex, speedMultiplier, setCurrentStroke, setIsPlaying, onFinish]);

  // Loading indicator
  if (isLoading) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex flex-col items-center justify-center rounded-3xl bg-white/70 dark:bg-stone-900/70 border border-red-500/15 backdrop-blur-md shadow-inner ${className}`}
      >
        <Loader2 className="w-8 h-8 text-[#FF3366] animate-spin mb-2" />
        <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
          Зурлага ачаалж байна...
        </span>
      </div>
    );
  }

  // Error / missing data fallback
  if (error || !data) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`p-6 flex flex-col items-center justify-center text-center rounded-3xl bg-white/70 dark:bg-stone-900/70 border border-red-500/20 backdrop-blur-md space-y-2.5 ${className}`}
      >
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-[#FF3366] flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
            {error || 'Энэ ханзны зурлагын мэдээлэл одоогоор байхгүй байна.'}
          </p>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 font-jp">
            この漢字の書き順データは現在利用できません。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative select-none rounded-3xl overflow-hidden shadow-md border border-[rgba(255,51,102,0.18)] dark:border-[rgba(255,51,102,0.25)] transition-all ${className}`}
    >
      {/* Background with traditional practice grid canvas styling */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-[#FFF7F8] to-[#FFF0F3] dark:from-[#170D10] dark:via-[#1F1216] dark:to-[#120B0D]" />

      <svg
        viewBox={data.viewBox}
        className="w-full h-full relative z-10 block"
        xmlns="http://www.w3.org/2000/svg"
        style={{ touchAction: 'none' }}
      >
        <defs>
          {/* Subtle gradient for active animated stroke */}
          <linearGradient id="slActiveStrokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF0000" />
            <stop offset="100%" stopColor="#FF3366" />
          </linearGradient>

          {/* Practice paper grid pattern */}
          {showGrid && (
            <pattern id="slGridPattern" width="109" height="109" patternUnits="userSpaceOnUse">
              {/* Outer boundary inner border */}
              <rect
                x="4.5"
                y="4.5"
                width="100"
                height="100"
                rx="6"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.75"
                strokeDasharray="2,2"
                className="text-red-400/20 dark:text-red-300/20"
              />
              {/* Diagonal guide lines */}
              <line
                x1="4.5"
                y1="4.5"
                x2="104.5"
                y2="104.5"
                stroke="currentColor"
                strokeWidth="0.4"
                strokeDasharray="2,3"
                className="text-red-400/15 dark:text-red-300/15"
              />
              <line
                x1="104.5"
                y1="4.5"
                x2="4.5"
                y2="104.5"
                stroke="currentColor"
                strokeWidth="0.4"
                strokeDasharray="2,3"
                className="text-red-400/15 dark:text-red-300/15"
              />
              {/* Vertical center cross line */}
              <line
                x1="54.5"
                y1="4.5"
                x2="54.5"
                y2="104.5"
                stroke="currentColor"
                strokeWidth="0.75"
                strokeDasharray="2.5,2.5"
                className="text-red-500/25 dark:text-red-400/25"
              />
              {/* Horizontal center cross line */}
              <line
                x1="4.5"
                y1="54.5"
                x2="104.5"
                y2="54.5"
                stroke="currentColor"
                strokeWidth="0.75"
                strokeDasharray="2.5,2.5"
                className="text-red-500/25 dark:text-red-400/25"
              />
            </pattern>
          )}
        </defs>

        {/* 1. Practice Grid Background */}
        {showGrid && (
          <rect width="109" height="109" fill="url(#slGridPattern)" />
        )}

        {/* 2. LAYER A: Ghost / Future Strokes (translucent reference silhouette) */}
        <g
          id="kvgGhostStrokes"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3.2"
          className="text-red-500/12 dark:text-pink-300/10"
        >
          {data.strokes.map((stroke: StrokePath) => (
            <path
              key={`ghost-${stroke.id}`}
              d={stroke.d}
              stroke="currentColor"
            />
          ))}
        </g>

        {/* 3. LAYER B: Completed Solid Strokes */}
        <g
          id="kvgCompletedStrokes"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3.6"
          className="text-stone-900 dark:text-stone-100"
        >
          {data.strokes.map((stroke: StrokePath) => {
            const isCompleted = stroke.index + 1 < activeStrokeIndex;
            if (!isCompleted) return null;

            return (
              <path
                key={`completed-${stroke.id}`}
                d={stroke.d}
                stroke="currentColor"
              />
            );
          })}
        </g>

        {/* 4. LAYER C: Active Animated Stroke */}
        {activeStrokeIndex > 0 && activeStrokeIndex <= data.strokeCount && (
          <g
            id="kvgActiveStroke"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4.2"
          >
            {(() => {
              const currentStrokeObj = data.strokes[activeStrokeIndex - 1];
              if (!currentStrokeObj) return null;

              // Use standard SVG pathLength normalization
              // offset ranges from 100 (hidden) down to 0 (fully drawn)
              const offset = Math.max(0, Math.min(100, 100 * (1 - strokeProgress)));

              return (
                <path
                  key={`active-${currentStrokeObj.id}`}
                  d={currentStrokeObj.d}
                  pathLength={100}
                  stroke="url(#slActiveStrokeGrad)"
                  strokeDasharray="100"
                  strokeDashoffset={offset}
                  className="filter drop-shadow-[0_1px_3px_rgba(255,0,0,0.35)]"
                />
              );
            })()}
          </g>
        )}

        {/* 5. LAYER D: Stroke Numbers (1..N positioned by KanjiVG) */}
        {showNumbers && (
          <g id="kvgNumbers" className="select-none font-bold" style={{ fontSize: '6.8px' }}>
            {data.numbers.map(num => {
              const strokeIdx = num.index;
              const isPastOrCurrent = strokeIdx <= activeStrokeIndex;
              const isCurrent = strokeIdx === activeStrokeIndex;

              return (
                <text
                  key={`num-${num.index}`}
                  transform={num.transform}
                  x={num.x}
                  y={num.y}
                  className={`transition-all duration-200 ${
                    isCurrent
                      ? 'fill-[#FF0000] font-black scale-110 drop-shadow-xs'
                      : isPastOrCurrent
                      ? 'fill-[#CC0000] dark:fill-[#FF6699] opacity-90'
                      : 'fill-stone-400/40 dark:fill-stone-600/40'
                  }`}
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  {num.text}
                </text>
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
};
