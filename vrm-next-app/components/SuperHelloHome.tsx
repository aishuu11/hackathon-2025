'use client';

import { motion } from 'framer-motion';

interface SuperHelloHomeProps {
  onGetStarted: () => void;
}

export default function SuperHelloHome({ onGetStarted }: SuperHelloHomeProps) {
  const steps = [
    {
      icon: '/step-1-icon.png',
      title: 'Ask Away',
      desc: 'Type any food question that pops into your head. No judgment, just answers.'
    },
    {
      icon: '/step-2-icon.png',
      title: 'AI Analyzes',
      desc: 'Our smart chatbot pulls real nutrition data and myth-busts in seconds.'
    },
    {
      icon: '/step-3-icon.png',
      title: 'Get Results',
      desc: 'Instant calorie counts, personalized tips, and science-backed advice.'
    }
  ];

  return (
    <div className="superhello-container">
      {/* Hero Section - Pink Background */}
      <section className="hero-pink">
        <div className="hero-content">
          <div className="hero-text">
            <motion.h1 
              className="superhello-title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="title-super">super</span>
              <br />
              <span className="title-hello">healthy</span>
            </motion.h1>
            <motion.p 
              className="hero-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Your nutrition buddy....kinda
            </motion.p>
            <motion.p 
              className="hero-description"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Accurate answers, evidence-based insights, and intelligent AI guidance.
            </motion.p>
            <motion.button
              className="cta-orange"
              onClick={onGetStarted}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Start Chatting
            </motion.button>
          </div>
          <div className="hero-illustration">
            <motion.div
              className="robot-main"
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <img src="/robot-main.png" alt="AI Robot" className="hero-image" />
            </motion.div>
            <motion.div className="character character-5" animate={{ y: [0, -11, 0] }} transition={{ duration: 2.4, repeat: Infinity, delay: 0.1 }}>
              <img src="/top-character.png" alt="Top Character" className="character-image" />
            </motion.div>
            <motion.div className="character character-6" animate={{ y: [0, -9, 0] }} transition={{ duration: 2.6, repeat: Infinity, delay: 0.4 }}>
              <img src="/bottom-character.png" alt="Bottom Character" className="character-image" />
            </motion.div>
            <motion.div className="character character-1" animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <img src="/chef-character.png" alt="Chef" className="character-image" />
            </motion.div>
            <motion.div className="character character-2" animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}>
              <img src="/doctor-character.png" alt="Doctor" className="character-image" />
            </motion.div>
            <motion.div className="character character-3" animate={{ y: [0, -12, 0] }} transition={{ duration: 2.3, repeat: Infinity, delay: 0.5 }}>
              <img src="/nutrition-character.png" alt="Nutrition Expert" className="character-image" />
            </motion.div>
            <motion.div className="character character-4" animate={{ y: [0, -9, 0] }} transition={{ duration: 2.7, repeat: Infinity, delay: 0.2 }}>
              <img src="/fitness-character.png" alt="Fitness Expert" className="character-image" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Wavy Divider */}
      <div className="wavy-divider">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,64 C240,96 480,96 720,64 C960,32 1200,32 1440,64 L1440,0 L0,0 Z" fill="url(#spaceGradient)"></path>
          <defs>
            <linearGradient id="spaceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(236,167,255,0.6)" stopOpacity="1" />
              <stop offset="50%" stopColor="rgba(255,235,153,0.6)" stopOpacity="1" />
              <stop offset="100%" stopColor="rgba(236,167,255,0.6)" stopOpacity="1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Feature Section - Yellow Background */}
      <section className="feature-yellow">
        <div className="feature-content">
          <div className="feature-illustration">
            <motion.div
              className="feature-left-icon"
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <img src="/left-feature-icon.png" alt="Feature Icon" className="feature-main-image" />
            </motion.div>
            <motion.div
              className="robot-secondary"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <img src="/apple-icon.png" alt="Apple" className="feature-main-image" />
            </motion.div>
          </div>
          <div className="feature-text">
            <motion.h2 
              className="section-heading"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              Goodbye fake nutrition tips.
              <br />
              Hello facts.
            </motion.h2>
            <motion.p 
              className="section-description"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Tired of "drink lemon water and lose 20kg" advice? Same.
              <br /><br />
              We filter the entire nutrition dataset by relevance, accuracy, and source credibility before the AI even speaks.
              <br /><br />
              
Only clean, verified data makes it through — zero fluff, zero misinformation.”
            </motion.p>
          </div>
        </div>
        
        {/* Floating decoration elements */}
        <div className="floating-decorations">
          <motion.div className="deco-element deco-1" animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>⚡</motion.div>
          <motion.div className="deco-element deco-2" animate={{ y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity }}>🌟</motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-comic">
        <motion.h2 
          className="section-heading centered"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          How it works
        </motion.h2>
        
        <div className="cards-container">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="comic-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <div className="card-icon-wrapper">
                <motion.div 
                  className="card-icon"
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <img src={step.icon} alt={step.title} className="card-icon-image" />
                </motion.div>
              </div>
              <h3 className="card-title">{step.title}</h3>
              <p className="card-description">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bottom Section Text */}
      <section className="bottom-text">
        <motion.h3 
          className="bottom-heading"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          We've got you. <span className="highlight">Nutrition</span> • <span className="highlight">Calories</span> • <span className="highlight">Health</span>
        </motion.h3>
      </section>
    </div>
  );
}
