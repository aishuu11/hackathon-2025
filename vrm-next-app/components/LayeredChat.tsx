'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import ChatCard from './ChatCard';
import ChatInput from './ChatInput';

interface Message {
  text: string;
  type: 'user' | 'bot';
  id: string;
  buttons?: Array<{
    label: string;
    value: string;
  }>;
  originalQuery?: string;
}

interface LayeredChatProps {
  onTypingChange?: (isTyping: boolean) => void;
  onGreeting?: () => void;
  onCaloriesDetected?: (calories: number | null, foodName: string) => void;
  onAnswerTypeChange?: (answerType: 'myth' | 'fact' | 'general') => void;
  externalMessage?: string;
  onExternalMessageProcessed?: () => void;
  onMyTakeChange?: (myTake: string | null) => void;
}

export default function LayeredChat({ onTypingChange, onGreeting, onCaloriesDetected, onAnswerTypeChange, externalMessage, onExternalMessageProcessed, onMyTakeChange }: LayeredChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'Welcome! I\'m here to help you separate nutrition facts from fiction. Ask me about any food or nutrition myth!',
      type: 'bot'
    }
  ]);
  const [isWaitingForSelection, setIsWaitingForSelection] = useState(false);
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle external messages from MythFlipSection
  useEffect(() => {
    if (externalMessage) {
      handleSend(externalMessage);
      onExternalMessageProcessed?.();
    }
  }, [externalMessage]);

  const handleButtonClick = async (buttonValue: string, originalQuery: string, messageId: string) => {
    // Add user selection as a message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: buttonValue,
      type: 'user'
    };
    setMessages(prev => [...prev, userMessage]);
    setIsWaitingForSelection(false);
    
    // Store user preference
    setUserPreferences(prev => [...prev, buttonValue]);

    try {
      // Send selection to backend
      const response = await fetch('http://localhost:5002/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: originalQuery,
          userSelection: buttonValue,
          userPreferences: userPreferences
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const botText = data.answer || data.response || data.message || 'Sorry, I could not process that.';

      // Add personalized bot response
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
        text: 'Sorry, I\'m having trouble connecting to the server.',
        type: 'bot'
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSend = async (text: string) => {
    // Greeting detection disabled - no wave animation
    // const greetingPattern = /\b(hi|hello|hey|hola|greetings|howdy|yo|sup|what's up|whats up)\b/i;
    // if (greetingPattern.test(text)) {
    //   console.log('Greeting detected! Triggering wave animation');
    //   onGreeting?.();
    // }

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text,
      type: 'user'
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Call the backend API
      const response = await fetch('http://localhost:5002/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: text,
          userPreferences: userPreferences
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const botText = data.answer || data.response || data.message || 'Sorry, I could not process that.';
      const buttons = data.buttons || null;
      const originalQuery = data.originalQuery || null;
      const answerType = data.type === 'myth' || data.type === 'fact' ? data.type : 'general';
      const myTake = data.myTake || null;
      
      // Notify parent of answer type
      if (onAnswerTypeChange) {
        onAnswerTypeChange(answerType);
      }

      // Extract and pass myTake to avatar
      if (onMyTakeChange) {
        onMyTakeChange(myTake);
      }

      // Extract calorie information - improved regex to catch multiple formats
      const calorieMatch = botText.match(/(\d+)\s*(?:kcal|calories|cal)|calories[^\d]*?(\d+)/i);
      if (calorieMatch && onCaloriesDetected) {
        const calories = parseInt(calorieMatch[1] || calorieMatch[2]);
        // Try to extract food name from user input
        const foodName = text.toLowerCase()
          .replace(/calories|how many|what|about|in|a|the|nutritional|value|of/gi, '')
          .trim() || 'food';
        console.log(`🔍 Detected calories: ${calories} for ${foodName} (Type: ${answerType})`);
        onCaloriesDetected(calories, foodName);
      } else if ((answerType === 'myth' || answerType === 'fact') && onCaloriesDetected) {
        // For myth/fact without calories, use 0 to trigger hologram with just status
        console.log(`🔍 Detected ${answerType} without calories for: ${text}`);
        onCaloriesDetected(1, text); // Use 1 as placeholder, hologram will show MYTH/FACT text instead
      } else if (onCaloriesDetected) {
        onCaloriesDetected(null, '');
      }

      // Add bot response
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        text: botText,
        type: 'bot',
        buttons: buttons,
        originalQuery: originalQuery
      };
      setMessages(prev => [...prev, botMessage]);
      
      // Set waiting state if buttons are present
      if (buttons && buttons.length > 0) {
        setIsWaitingForSelection(true);
      }
    } catch (error) {
      console.error('Error calling API:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: 'Sorry, I\'m having trouble connecting to the server. Please make sure the backend is running on port 5002.',
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
              buttons={msg.buttons}
              onButtonClick={(value) => handleButtonClick(value, msg.originalQuery || '', msg.id)}
              disabled={isWaitingForSelection && index !== messages.length - 1}
            />
          ))}
        </AnimatePresence>
      </div>
      <ChatInput onSend={handleSend} onTyping={onTypingChange} />
    </div>
  );
}
