'use client';

import { motion } from 'framer-motion';

interface ChatCardProps {
  message: string;
  isUser: boolean;
  index?: number;
}

export default function ChatCard({ message, isUser, index = 0 }: ChatCardProps) {
  return (
    <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="relative inline-block max-w-full">
        {/* Main Card */}
        <div className="neon-card">
          <p className="neon-card-text">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
