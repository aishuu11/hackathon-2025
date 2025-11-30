'use client';

import VRMAvatar from '../components/VRMAvatar';
import ChatBot from '../components/ChatBot';

export default function Home() {
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
          <div className="glass-panel panel-left">
            <div className="panel-header">
              <h2>VRM Avatar</h2>
            </div>
            <VRMAvatar />
          </div>

          <div className="glass-panel panel-right">
            <div className="panel-header">
              <h2>Nutrition Chat</h2>
            </div>
            <ChatBot />
          </div>
        </div>
      </main>
    </div>
  );
}
