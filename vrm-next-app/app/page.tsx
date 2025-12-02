'use client';

import { useState } from 'react';
import VRMAvatar from '../components/VRMAvatar';
import ChatBot from '../components/ChatBot';

export default function Home() {
  const [isTyping, setIsTyping] = useState(false);
  const [isWaving, setIsWaving] = useState(false);

  const handleGreeting = () => {
    console.log('Greeting received! Triggering wave...');
    setIsWaving(true);
    // Reset after animation completes
    setTimeout(() => {
      setIsWaving(false);
    }, 2100); // Slightly longer than animation duration
  };

  return (
    <div className="container">
      <div className="background-shapes">
        <div className="ring ring-1"></div>
        <div className="ring ring-2"></div>
        <div className="ring ring-3"></div>
        <div className="cube cube-1"></div>
        <div className="cube cube-2"></div>
      </div>
      
      <header className="header">
        <h1 className="title">Nutrition Bot</h1>
        <p className="subtitle">Debunking nutrition myths with science</p>
      </header>

      <main className="main-content">
        <div className="panels-container">
          {/* <div className="glass-panel panel-left">
            <div className="panel-header">
              <h2>VRM Avatar</h2>
            </div>
            <VRMAvatar isTyping={isTyping} isWaving={isWaving} />
          </div> */}
          <VRMAvatar isTyping={isTyping} isWaving={isWaving} />

          <div className="glass-panel panel-right">
            <div className="panel-header">
              <h2>Nutrition Chat</h2>
            </div>
            <ChatBot onTypingChange={setIsTyping} onGreeting={handleGreeting} />
          </div>
        </div>
      </main>
    </div>
  );
}
