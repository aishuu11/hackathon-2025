'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  onTyping?: (isTyping: boolean) => void;
}

export default function ChatInput({ onSend, onTyping }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput('');
    onTyping?.(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      className="chat-input-wrapper"
      animate={{
        scale: isFocused ? 1.02 : 1,
      }}
      transition={{ duration: 0.2 }}
    >
      <div className="chat-input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            onTyping?.(e.target.value.length > 0);
          }}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Ask about nutrition..."
          className="glass-input"
        />
        <motion.button
          onClick={handleSend}
          className="send-button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.5 10L17.5 3.75L11.25 18.75L10 11.25L2.5 10Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Send
        </motion.button>
      </div>
    </motion.div>
  );
}
