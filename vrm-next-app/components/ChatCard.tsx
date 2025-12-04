'use client';

import { motion } from 'framer-motion';

interface ChatCardProps {
  message: string;
  type: 'user' | 'bot';
  index: number;
  total: number;
  buttons?: Array<{
    label: string;
    value: string;
  }>;
  onButtonClick?: (value: string) => void;
  disabled?: boolean;
}

export default function ChatCard({ message, type, index, total, buttons, onButtonClick, disabled }: ChatCardProps) {
  // Calculate z-index so newer messages appear on top
  const zIndex = index + 1;
  // Slight scale variation for depth
  const baseScale = 0.96 + (index / total) * 0.04;

  return (
    <div className={`chat-card-wrapper ${type === 'user' ? 'user-wrapper' : 'bot-wrapper'}`}>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: baseScale,
        }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
        }}
        whileHover={{
          scale: 1,
          y: -8,
          zIndex: 9999,
          transition: { duration: 0.2 }
        }}
        className={`chat-card ${type === 'user' ? 'user-card' : 'bot-card'}`}
        style={{
          transformStyle: 'preserve-3d',
          zIndex,
        }}
      >
        <div className="card-content">
          <p style={{ whiteSpace: 'pre-line' }}>{message}</p>
          {buttons && buttons.length > 0 && (
            <div className="chat-buttons">
              {buttons.map((button, idx) => (
                <button
                  key={idx}
                  className="chat-option-button"
                  onClick={() => onButtonClick?.(button.value)}
                  disabled={disabled}
                >
                  {button.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {type === 'user' && <div className="card-glow user-glow" />}
        {type === 'bot' && <div className="card-glow bot-glow" />}
      </motion.div>
    </div>
  );
}
