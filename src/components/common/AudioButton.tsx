import React from 'react';

export interface AudioButtonProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

// Audio/TTS speaker buttons have been completely removed globally across SunnyLearn.
export const AudioButton: React.FC<AudioButtonProps> = () => {
  return null;
};
