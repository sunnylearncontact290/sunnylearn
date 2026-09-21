import React, { useState, useEffect } from 'react';
import { RotateCcw, Check, X } from 'lucide-react';
import { normalizeAnswerText } from '../../services/learningEngine';

interface SentenceScrambleCardProps {
  prompt: string; // Mongolian meaning
  promptSub?: string;
  scrambleWords: string[];
  correctOrder: string[];
  explanation: string;
  audioText?: string;
  reading?: string;
  isAnswered: boolean;
  onAnswer: (isCorrect: boolean) => void;
}

export const SentenceScrambleCard: React.FC<SentenceScrambleCardProps> = ({
  prompt,
  promptSub,
  scrambleWords,
  correctOrder,
  explanation,
  audioText,
  reading,
  isAnswered,
  onAnswer
}) => {
  // Track selected chips by index in scrambleWords
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  // Reset selected chips when moving to another question
  useEffect(() => {
    setSelectedIndices([]);
  }, [prompt, scrambleWords]);

  const handleSelectWord = (index: number) => {
    if (isAnswered) return;
    if (selectedIndices.includes(index)) return;
    setSelectedIndices(prev => [...prev, index]);
  };

  const handleRemoveWord = (slotIndex: number) => {
    if (isAnswered) return;
    setSelectedIndices(prev => prev.filter((_, idx) => idx !== slotIndex));
  };

  const handleReset = () => {
    if (isAnswered) return;
    setSelectedIndices([]);
  };

  const handleCheck = () => {
    if (isAnswered || selectedIndices.length === 0) return;
    const userBuiltWords = selectedIndices.map(i => scrambleWords[i]);
    const isCorrect = normalizeAnswerText(userBuiltWords.join('')) === normalizeAnswerText(correctOrder.join(''));
    onAnswer(isCorrect);
  };

  const isAllPlaced = selectedIndices.length === scrambleWords.length;
  const userBuiltWords = selectedIndices.map(i => scrambleWords[i]);
  const isCorrect = isAnswered && normalizeAnswerText(userBuiltWords.join('')) === normalizeAnswerText(correctOrder.join(''));

  return (
    <div className="space-y-6">
      {/* Prompt / Target Meaning */}
      <div className="bg-stone-50 dark:bg-stone-800/60 p-5 rounded-2xl border border-stone-200 dark:border-stone-700/60 text-center space-y-2">
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
          Өгүүлбэр эвлүүлэх
        </span>
        <h3 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
          {prompt}
        </h3>
        {promptSub && (
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            {promptSub}
          </p>
        )}
      </div>

      {/* Answer Slot Area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-stone-500 dark:text-stone-400">
          <span>Таны бүтээсэн өгүүлбэр:</span>
          {!isAnswered && selectedIndices.length > 0 && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-amber-600 hover:text-amber-700 dark:text-amber-400 text-xs font-medium cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Эхнээс нь
            </button>
          )}
        </div>

        <div
          className={`min-h-[72px] p-3.5 rounded-xl border-2 border-dashed flex flex-wrap items-center gap-2 transition-all ${
            isAnswered
              ? isCorrect
                ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20'
                : 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/20'
              : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900'
          }`}
        >
          {selectedIndices.length === 0 ? (
            <span className="text-sm text-stone-400 dark:text-stone-500 italic mx-auto">
              Доорх үгсээс дарааллаар нь товшиж оруулна уу...
            </span>
          ) : (
            selectedIndices.map((wordIdx, slotIdx) => (
              <button
                key={`${wordIdx}-${slotIdx}`}
                type="button"
                disabled={isAnswered}
                onClick={() => handleRemoveWord(slotIdx)}
                className={`px-3 py-1.5 rounded-lg text-sm sm:text-base font-medium shadow-sm transition-all flex items-center gap-1.5 ${
                  isAnswered
                    ? isCorrect
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white'
                    : 'bg-amber-500 hover:bg-amber-600 text-white active:scale-95 cursor-pointer'
                }`}
              >
                <span>{scrambleWords[wordIdx]}</span>
                {!isAnswered && <span className="text-xs opacity-75">✕</span>}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Available Word Bank */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
          Сонгох үгс:
        </span>
        <div className="flex flex-wrap gap-2.5 p-3.5 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700/60">
          {scrambleWords.map((word, idx) => {
            const isUsed = selectedIndices.includes(idx);
            return (
              <button
                key={idx}
                type="button"
                disabled={isUsed || isAnswered}
                onClick={() => handleSelectWord(idx)}
                className={`px-3.5 py-2 rounded-xl text-sm sm:text-base font-semibold transition-all shadow-sm ${
                  isUsed
                    ? 'opacity-30 bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed border border-transparent'
                    : 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 hover:bg-amber-50 dark:hover:bg-stone-700 hover:border-amber-400 border border-stone-200 dark:border-stone-700 cursor-pointer active:scale-95'
                }`}
              >
                {word}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit button when not answered */}
      {!isAnswered && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={!isAllPlaced}
            onClick={handleCheck}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm sm:text-base shadow-sm transition-all ${
              isAllPlaced
                ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer active:scale-95 shadow-amber-600/20'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
            }`}
          >
            Хариулт шалгах
          </button>
        </div>
      )}

      {/* Explanation Feedback if answered */}
      {isAnswered && (
        <div
          className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${
            isCorrect
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-base sm:text-lg">
              {isCorrect ? (
                <>
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>Маш сайн! Зөв хариуллаа 🎉</span>
                </>
              ) : (
                <>
                  <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </div>
                  <span>Буруу хариуллаа</span>
                </>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-current/10 space-y-1">
            <p className="text-sm font-semibold">
              Зөв өгүүлбэр: <span className="font-bold">{correctOrder.join('')}</span>
            </p>
            {reading && (
              <p className="text-xs opacity-80">
                Уншлага: {reading}
              </p>
            )}
            <p className="text-xs opacity-90 leading-relaxed">
              {explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
