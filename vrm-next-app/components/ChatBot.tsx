'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  text: string;
  type: 'user' | 'bot';
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = { text: input, type: 'user' };
    setMessages(prev => [...prev, userMessage]);
    
    const currentInput = input;
    setInput('');

    try {
      // Call the backend API
      const response = await fetch('http://localhost:8000/api/chat', {
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
    } catch (error) {
      console.error('Error calling API:', error);
      // Fallback error message
      const errorMessage: Message = { 
        text: 'Sorry, I\'m having trouble connecting to the server. Please make sure the backend is running on port 8000.', 
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
          onChange={(e) => setInput(e.target.value)}
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
