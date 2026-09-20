import React from 'react';
import { useApp } from '../../context/AppContext';
import { SunnyAITutor } from './SunnyAITutor';

export const SunnyAIModal: React.FC = () => {
  const { isSunnyAIOpen, closeSunnyAI, sunnyAIQuizContext } = useApp();

  if (!isSunnyAIOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="fixed inset-0"
        onClick={closeSunnyAI}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-3xl animate-scale-up">
        <SunnyAITutor
          mode="modal"
          onClose={closeSunnyAI}
          initialQuizContext={sunnyAIQuizContext}
        />
      </div>
    </div>
  );
};
