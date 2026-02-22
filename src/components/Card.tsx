import React from 'react';
import { motion } from 'motion/react';
import { Card as CardType, CardColor } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps {
  card: CardType;
  onClick?: () => void;
  disabled?: boolean;
  isCurrentTurn?: boolean;
  className?: string;
}

const colorMap: Record<CardColor, string> = {
  red: 'border-red-500 text-red-500 bg-red-950/30',
  blue: 'border-neon-blue text-neon-blue bg-blue-950/30',
  green: 'border-neon-green text-neon-green bg-green-950/30',
  yellow: 'border-yellow-400 text-yellow-400 bg-yellow-950/30',
  wild: 'border-neon-purple text-neon-purple bg-purple-950/30',
};

const glowMap: Record<CardColor, string> = {
  red: 'card-glow-red',
  blue: 'card-glow-blue',
  green: 'card-glow-green',
  yellow: 'card-glow-yellow',
  wild: 'card-glow-wild',
};

export const Card: React.FC<CardProps> = ({ card, onClick, disabled, isCurrentTurn, className }) => {
  const isWild = card.color === 'wild';
  
  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={!disabled ? { scale: 1.05, y: -10, zIndex: 10 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={cn(
        'relative w-24 h-36 md:w-32 md:h-48 rounded-xl border-2 cursor-pointer transition-all duration-300',
        'flex flex-col items-center justify-center overflow-hidden backdrop-blur-sm',
        colorMap[card.color],
        glowMap[card.color],
        disabled && 'opacity-50 cursor-not-allowed grayscale-[0.5]',
        isCurrentTurn && 'ring-2 ring-white ring-offset-2 ring-offset-cyber-bg',
        className
      )}
    >
      {/* Holographic Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      
      {/* Corner Value */}
      <div className="absolute top-2 left-2 text-xs font-bold font-mono uppercase">
        {card.value}
      </div>
      
      {/* Center Value */}
      <div className="text-3xl md:text-5xl font-black tracking-tighter drop-shadow-lg">
        {renderValue(card.value)}
      </div>

      {/* Bottom Corner Value (Inverted) */}
      <div className="absolute bottom-2 right-2 text-xs font-bold font-mono uppercase rotate-180">
        {card.value}
      </div>

      {/* Cyber Accents */}
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-current opacity-30" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-current opacity-30" />
    </motion.div>
  );
};

const renderValue = (value: string) => {
  switch (value) {
    case 'skip': return '⊘';
    case 'reverse': return '⇄';
    case 'draw2': return '+2';
    case 'wild': return '❖';
    case 'wild_draw4': return '+4';
    default: return value;
  }
};
