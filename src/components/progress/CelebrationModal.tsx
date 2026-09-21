import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Sparkles, CheckCircle2, X } from 'lucide-react';

interface CelebrationModalProps {
  isOpen: boolean;
  streakCount: number;
  dailyXP: number;
  onClose: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  streakCount,
  dailyXP,
  onClose
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-white dark:bg-stone-900 border border-amber-500/30 dark:border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 overflow-hidden"
          >
            {/* Top decorative glow */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon stack */}
            <div className="relative inline-flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25"
              >
                <Flame className="w-10 h-10 text-white fill-white animate-pulse" />
              </motion.div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white dark:border-stone-900 shadow-md">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
                Өдрийн даалгавар биелэгдлээ
              </span>
              <h3 className="text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
                🎉 Өнөөдрийн зорилго биеллээ!
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                Та өнөөдрийн 20 XP-ийн зорилгоо амжилттай давуулан биелүүллээ.
              </p>
            </div>

            {/* Metrics highlight */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-800">
              <div>
                <div className="text-xs text-stone-500 dark:text-stone-400">Цуглуулсан XP</div>
                <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  +{dailyXP} XP
                </div>
              </div>
              <div className="border-l border-stone-200 dark:border-stone-700/60">
                <div className="text-xs text-stone-500 dark:text-stone-400">Дараалсан Streak</div>
                <div className="text-xl font-black text-orange-500 mt-0.5 flex items-center justify-center gap-1">
                  <span>🔥</span>
                  <span>{streakCount} өдөр</span>
                </div>
              </div>
            </div>

            {/* Action button */}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              Баярлалаа, үргэлжлүүлье!
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
