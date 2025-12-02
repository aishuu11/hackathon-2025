'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface ThemeToggleProps {
  onThemeChange?: (theme: 'neon' | 'medical') => void;
}

export default function ThemeToggle({ onThemeChange }: ThemeToggleProps) {
  const [theme, setTheme] = useState<'neon' | 'medical'>('neon');

  const handleToggle = (newTheme: 'neon' | 'medical') => {
    setTheme(newTheme);
    onThemeChange?.(newTheme);
  };

  return (
    <div className="theme-toggle-container">
      <motion.button
        className={`theme-btn ${theme === 'neon' ? 'active' : ''}`}
        onClick={() => handleToggle('neon')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        ⚡ Neon
      </motion.button>
      <motion.button
        className={`theme-btn ${theme === 'medical' ? 'active' : ''}`}
        onClick={() => handleToggle('medical')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        🏥 Medical
      </motion.button>
    </div>
  );
}
