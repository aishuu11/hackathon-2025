'use client';

import { useState } from 'react';
import ChatContainer from './ChatContainer';
import ChatInput from './ChatInput';
import styles from "./styles.module.css";



interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

// Example initial messages showing stacked layered effect
const initialMessages: Message[] = [
  {
    id: '1',
    text: 'Welcome! I\'m here to help you separate nutrition facts from fiction. Ask me about any food or nutrition myth!',
    isUser: false,
  },
  {
    id: '2',
    text: 'Welcome! I\'m here to help you make sense of nutrition advice and debunk myths. Ask me about any food or health claim you\'ve heard! **I specialize in:** 🍎 Analyzing specific foods (e.g., keto, paleo) 🥗 Debunking diet myths ❌ Detecting false nutrition claims',
    isUser: false,
  },
  {
    id: '3',
    text: 'Is eating carbs at night bad for weight loss?',
    isUser: true,
  },
  {
    id: '4',
    text: '🌙 **Night carbs myth debunked!**\n\n❌ MYTH: Eating carbs at night makes you gain weight\n\n✅ FACT: Total calorie intake matters more than meal timing. Your body processes carbs the same way regardless of time.\n\n💡 What actually matters:\n• Total daily calories\n• Overall diet quality\n• Physical activity level\n\nEat when it fits your schedule!',
    isUser: false,
  },
  {
    id: '5',
    text: 'That makes sense! What about organic food?',
    isUser: true,
  },
];

export default function GlassChat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  const handleSend = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
    };
    setMessages((prev) => [...prev, newMessage]);

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: '💭 Great question! Let me help you understand that...',
        isUser: false,
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 800);
  };

  return (
    <div className="neon-chat-container">
      <ChatContainer messages={messages} />
      <ChatInput onSend={handleSend} placeholder="Ask about nutrition..." />
    </div>
  );
}
