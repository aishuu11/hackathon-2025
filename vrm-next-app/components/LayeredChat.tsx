'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import ChatCard from './ChatCard';
import ChatInput from './ChatInput';

interface Message {
  text: string;
  type: 'user' | 'bot';
  id: string;
}

interface LayeredChatProps {
  onTypingChange?: (isTyping: boolean) => void;
  onGreeting?: () => void;
  onCaloriesDetected?: (calories: number | null, foodName: string) => void;
}

export default function LayeredChat({ onTypingChange, onGreeting, onCaloriesDetected }: LayeredChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'Welcome! I\'m here to help you separate nutrition facts from fiction. Ask me about any food or nutrition myth!',
      type: 'bot'
    }
  ]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string) => {
    // Check for greetings
    const greetingPattern = /\b(hi|hello|hey|hola|greetings|howdy|yo|sup|what's up|whats up)\b/i;
    if (greetingPattern.test(text)) {
      console.log('Greeting detected! Triggering wave animation');
      onGreeting?.();
    }

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text,
      type: 'user'
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Call the backend API
      const response = await fetch('http://localhost:5001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const botText = data.answer || data.response || data.message || 'Sorry, I could not process that.';

      // Extract calorie information - improved regex to catch multiple formats
      const calorieMatch = botText.match(/(\d+)\s*(?:kcal|calories|cal)|calories[^\d]*?(\d+)/i);
      if (calorieMatch && onCaloriesDetected) {
        const calories = parseInt(calorieMatch[1] || calorieMatch[2]);
        // Try to extract food name from user input
        const foodName = text.toLowerCase()
          .replace(/calories|how many|what|about|in|a|the|nutritional|value|of/gi, '')
          .trim() || 'food';
        console.log(`🔍 Detected calories: ${calories} for ${foodName}`);
        onCaloriesDetected(calories, foodName);
      } else if (onCaloriesDetected) {
        onCaloriesDetected(null, '');
      }

      // Add bot response
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        text: botText,
        type: 'bot'
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error calling API:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: 'Sorry, I\'m having trouble connecting to the server. Please make sure the backend is running on port 5001.',
        type: 'bot'
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  return (
    <div className="layered-chat-container">
      <div className="cards-viewport" ref={containerRef}>
        <AnimatePresence mode="popLayout">
          {messages.map((msg, index) => (
            <ChatCard
              key={msg.id}
              message={msg.text}
              type={msg.type}
              index={index}
              total={messages.length}
            />
          ))}
        </AnimatePresence>
      </div>
      <ChatInput onSend={handleSend} onTyping={onTypingChange} />
    </div>
  );
}
