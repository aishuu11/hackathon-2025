'use client';

import { useState } from 'react';
import VRMAvatar from '../components/VRMAvatar';
import LayeredChat from '../components/LayeredChat';
import SuperHelloHome from '../components/SuperHelloHome';

export default function Home() {
  const [showHomePage, setShowHomePage] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isWaving, setIsWaving] = useState(false);
  const [calorieData, setCalorieData] = useState<{ calories: number; foodName: string } | null>(null);

  const handleGreeting = () => {
    console.log('Greeting received! Triggering wave...');
    setIsWaving(true);
    // Reset after animation completes
    setTimeout(() => {
      setIsWaving(false);
    }, 2100); // Slightly longer than animation duration
  };

  const handleCaloriesDetected = (calories: number | null, foodName: string) => {
    console.log(`Calories detected: ${calories} for ${foodName}`);
    if (calories !== null) {
      setCalorieData({ calories, foodName });
    } else {
      setCalorieData(null);
    }
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
      
      <header className="header comic-header">
        {/* Simple Decorative Elements */}
        <div className="header-deco deco-star-left">
          <svg width="35" height="35" viewBox="0 0 35 35">
            <path d="M17.5 2 L21 13 L32 13 L23 20 L26 31 L17.5 24 L9 31 L12 20 L3 13 L14 13 Z" fill="#ffeb3b" stroke="#000" strokeWidth="3"/>
          </svg>
        </div>
        <div className="header-deco deco-circle-right">
          <svg width="30" height="30" viewBox="0 0 30 30">
            <circle cx="15" cy="15" r="12" fill="#ff6b9d" stroke="#000" strokeWidth="3"/>
          </svg>
        </div>
        <div className="header-deco deco-sparkle-left">
          <svg width="28" height="28" viewBox="0 0 28 28">
            <path d="M14 0 L16 12 L14 24 L12 12 Z M0 14 L12 16 L24 14 L12 12 Z" fill="#00d4ff" stroke="#000" strokeWidth="2.5"/>
          </svg>
        </div>
        <div className="header-deco deco-star-right">
          <svg width="32" height="32" viewBox="0 0 32 32">
            <path d="M16 2 L19 12 L29 12 L21 18 L24 28 L16 22 L8 28 L11 18 L3 12 L13 12 Z" fill="#F7A547" stroke="#000" strokeWidth="3"/>
          </svg>
        </div>

        {/* Main Title */}
        <div className="header-content">
          <p className="healthtok-tagline">
            Smarter than TikTok nutrition.
            <br />
            Welcome to the new <span className="healthtok-highlight">HealthTok</span>.
          </p>
          <h1 className="comic-title-clean">
            <span className="title-big-clean">Snack Intel</span>
          </h1>
        </div>
      </header>

      <main className="main-content">
        {showHomePage ? (
          <SuperHelloHome onGetStarted={() => setShowHomePage(false)} />
        ) : (
          <div className="panels-container">
            {/* Back Button */}
            <button 
              onClick={() => setShowHomePage(true)}
              className="back-button"
            >
              ← Back to Home
            </button>

            {/* <div className="glass-panel panel-left">
              <div className="panel-header">
                <h2>VRM Avatar</h2>
              </div>
              <VRMAvatar isTyping={isTyping} isWaving={isWaving} />
            </div> */}
            <VRMAvatar 
              isTyping={isTyping} 
              isWaving={isWaving}
              calories={calorieData?.calories ?? null}
              foodName={calorieData?.foodName ?? ''}
            />

            <div className="glass-panel panel-right">
              <LayeredChat 
                onTypingChange={setIsTyping} 
                onGreeting={handleGreeting}
                onCaloriesDetected={handleCaloriesDetected}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
