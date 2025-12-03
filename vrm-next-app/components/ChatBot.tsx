'use client';

import { useState, useEffect, useRef } from 'react';

type AnswerType = 'myth' | 'fact' | 'general';

interface Message {
  text: string;
  type: 'user' | 'bot';
  answerType?: AnswerType; // only used for bot messages
}

interface ChatBotProps {
  onTypingChange?: (isTyping: boolean) => void;
  onGreeting?: () => void;
  onCaloriesDetected?: (calories: number, foodName: string) => void;

  // NEW: let parent know if backend said myth / fact / general
  onAnswerTypeChange?: (answerType: AnswerType) => void;
}

export default function ChatBot({
  onTypingChange,
  onGreeting,
  onCaloriesDetected,
  onAnswerTypeChange,
}: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Detect greeting for wave animation
    const greetingPattern =
      /\b(hi|hello|hey|hola|greetings|howdy|yo|sup|what's up|whats up)\b/i;
    if (greetingPattern.test(trimmed)) {
      console.log('Greeting detected! Triggering wave animation');
      onGreeting?.();
    }

    // Add user message
    const userMessage: Message = { text: trimmed, type: 'user' };
    setMessages(prev => [...prev, userMessage]);

    const currentInput = trimmed;
    setInput('');
    onTypingChange?.(false);

    try {
      const response = await fetch('http://127.0.0.1:5002/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Backend shape: { answer, type, source, ... }
      const backendText: string =
        data.answer ??
        data.response ??
        data.message ??
        'Sorry, I could not process that.';

      const backendType: AnswerType =
        data.type === 'myth' || data.type === 'fact' ? data.type : 'general';

      const botMessage: Message = {
        text: backendText,
        type: 'bot',
        answerType: backendType,
      };

      setMessages(prev => [...prev, botMessage]);

      // Let parent know the answer type (to drive hologram colour / avatar mood)
      if (onAnswerTypeChange) {
        onAnswerTypeChange(backendType);
      }

      // Extract calories if present in the answer
      const calorieMatch = backendText.match(
        /(\d+)\s*(?:kcal|calories|cal)\b/i
      );
      if (calorieMatch && onCaloriesDetected) {
        const calories = parseInt(calorieMatch[1], 10);
        const foodName = currentInput || 'Food';
        onCaloriesDetected(calories, foodName);
      }
    } catch (error) {
      console.error('Error calling API:', error);
      const errorMessage: Message = {
        text:
          "Sorry, I'm having trouble connecting to the server. " +
          'Please make sure the backend is running on port 5002.',
        type: 'bot',
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-content">
      <div className="chat-messages">
        <div className="welcome-message">
          <p>
            Welcome! I'm here to help you separate nutrition facts from
            fiction. Ask me about any food or nutrition myth!
          </p>
        </div>
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.type}`}>
            <p style={{ whiteSpace: 'pre-line' }}>{msg.text}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-container">
        <input
          type="text"
          value={input}
          onChange={e => {
            const value = e.target.value;
            setInput(value);

            const hasText = value.length > 0;

            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }

            if (hasText) {
              onTypingChange?.(true);
              typingTimeoutRef.current = setTimeout(() => {
                onTypingChange?.(false);
              }, 1000);
            } else {
              onTypingChange?.(false);
            }
          }}
          onKeyPress={handleKeyPress}
          placeholder="Type your question..."
          className="futuristic-input"
        />
        <button onClick={handleSend} className="neon-button">
          Send
        </button>
      </div>
    </div>
  );
}
