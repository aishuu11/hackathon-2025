'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  text: string;
  type: 'user' | 'bot';
}

interface ChatBotProps {
  onTypingChange?: (isTyping: boolean) => void;
  onGreeting?: () => void;
  onCaloriesDetected?: (calories: number, foodName: string) => void;
}

export default function ChatBot({ onTypingChange, onGreeting, onCaloriesDetected }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Check for greetings
    const greetingPattern = /\b(hi|hello|hey|hola|greetings|howdy|yo|sup|what's up|whats up)\b/i;
    if (greetingPattern.test(input)) {
      console.log('Greeting detected! Triggering wave animation');
      onGreeting?.();
    }

    // Add user message
    const userMessage: Message = { text: input, type: 'user' };
    setMessages(prev => [...prev, userMessage]);
    
    const currentInput = input;
    setInput('');

    try {
      // Call the backend API
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: currentInput }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Add bot response
      const botMessage: Message = { 
        text: data.response || data.message || 'Sorry, I could not process that.', 
        type: 'bot' 
      };
      setMessages(prev => [...prev, botMessage]);
      
      // Extract calories from response
      const calorieMatch = botMessage.text.match(/(\d+)\s*(?:kcal|calories|cal)/i);
      if (calorieMatch && onCaloriesDetected) {
        const calories = parseInt(calorieMatch[1], 10);
        // Try to extract food name from the user's input or response
        const foodName = currentInput.trim() || 'Food';
        onCaloriesDetected(calories, foodName);
      }
    } catch (error) {
      console.error('Error calling API:', error);
      // Fallback error message
      const errorMessage: Message = { 
        text: 'Sorry, I\'m having trouble connecting to the server. Please make sure the backend is running on port 5000.', 
        type: 'bot' 
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="chat-content">
      <div className="chat-messages">
        <div className="welcome-message">
          <p>Welcome! I'm here to help you separate nutrition facts from fiction. Ask me about any food or nutrition myth!</p>
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
          onChange={(e) => {
            setInput(e.target.value);
            const hasText = e.target.value.length > 0;
            
            // Clear previous timeout
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            
            // Set typing to true immediately when typing
            if (hasText) {
              onTypingChange?.(true);
              console.log('User is typing...');
              
              // Set a timeout to detect when user stops typing (1 second of inactivity)
              typingTimeoutRef.current = setTimeout(() => {
                onTypingChange?.(false);
                console.log('User stopped typing');
              }, 1000);
            } else {
              // If input is empty, immediately stop typing
              onTypingChange?.(false);
              console.log('Input cleared');
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
