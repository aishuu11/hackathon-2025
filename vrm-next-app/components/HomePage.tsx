'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface HomePageProps {
  onGetStarted: () => void;
}

export default function HomePage({ onGetStarted }: HomePageProps) {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [selectedExample, setSelectedExample] = useState<number | null>(null);

  const features = [
    {
      icon: '🍎',
      title: 'Know What You\'re Eating',
      desc: 'Curious about that snack? We\'ll break down the calories and tell you if it\'s worth it',
      color: '#00ff88'
    },
    {
      icon: '❌',
      title: 'Myth Buster',
      desc: 'That viral TikTok diet hack? Yeah, we\'ll tell you if it\'s actually legit or total nonsense',
      color: '#ff0066'
    },
    {
      icon: '💡',
      title: 'Your Personal Guide',
      desc: 'Everyone\'s different. Get advice that actually fits your goals, not generic cookie-cutter tips',
      color: '#ffaa00'
    },
    {
      icon: '🤖',
      title: 'Chat Like a Human',
      desc: 'No robotic answers here. Our avatar responds naturally and even shows you visual info',
      color: '#00ddff'
    },
    {
      icon: '💬',
      title: 'Clean Interface',
      desc: 'Scroll through your conversation history with smooth animations. No clutter, just answers',
      color: '#aa00ff'
    },
    {
      icon: '🎨',
      title: 'See It, Don\'t Just Read It',
      desc: 'Calorie info pops up in color: green means you\'re good, red means maybe reconsider',
      color: '#ff6600'
    }
  ];

  const examples = [
    "Is bubble tea really that bad for me?",
    "Do carbs actually make you gain weight?",
    "What's a realistic way to lose weight without starving?"
  ];

  return (
    <div className="homepage-container">
      {/* Animated background particles */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="particle"
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="homepage-content">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="hero-section"
        >
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="hero-emoji"
          >
            🍽️
          </motion.div>
          <h1 className="hero-title">
            Stop guessing about <span className="neon-text">nutrition</span>
          </h1>
          <p className="hero-subtitle">
            We cut through the BS and give you real answers about what you eat
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(0, 255, 255, 0.6)" }}
            whileTap={{ scale: 0.95 }}
            onClick={onGetStarted}
            className="cta-button"
          >
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Let's Talk
            </motion.span>
            <motion.svg 
              width="20" 
              height="20" 
              viewBox="0 0 20 20" 
              fill="none"
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            >
              <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </motion.svg>
          </motion.button>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="features-grid"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -12, scale: 1.03 }}
              onHoverStart={() => setHoveredFeature(index)}
              onHoverEnd={() => setHoveredFeature(null)}
              className="feature-card"
              style={{
                borderColor: hoveredFeature === index ? feature.color : undefined,
              }}
            >
              <motion.div 
                className="feature-icon"
                animate={{
                  scale: hoveredFeature === index ? [1, 1.2, 1] : 1,
                  rotate: hoveredFeature === index ? [0, 10, -10, 0] : 0,
                }}
                transition={{ duration: 0.5 }}
              >
                {feature.icon}
              </motion.div>
              <h3 style={{ color: hoveredFeature === index ? feature.color : undefined }}>
                {feature.title}
              </h3>
              <p>{feature.desc}</p>
              {hoveredFeature === index && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  className="feature-underline"
                  style={{ backgroundColor: feature.color }}
                />
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="how-it-works"
        >
          <h2 className="section-title">Here's the deal</h2>
          <div className="steps-container">
            {[
              { num: 1, title: "Ask anything", desc: "Type whatever's on your mind about food or nutrition" },
              { num: 2, title: "We dig deep", desc: "No fluff—just straight facts backed by real science" },
              { num: 3, title: "Get it visually", desc: "See calories pop up in color on our avatar's hand" }
            ].map((step, i) => (
              <motion.div
                key={i}
                className="step"
                whileHover={{ scale: 1.05 }}
              >
                <motion.div 
                  className="step-number"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  {step.num}
                </motion.div>
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
                {i < 2 && (
                  <motion.div 
                    className="step-arrow"
                    animate={{ x: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    →
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Examples */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="examples-section"
        >
          <h2 className="section-title">Not sure where to start?</h2>
          <p className="examples-subtitle">Click one to try it out!</p>
          <div className="examples-list">
            {examples.map((example, i) => (
              <motion.div
                key={i}
                whileHover={{ x: 10, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedExample(i);
                  setTimeout(() => onGetStarted(), 500);
                }}
                className={`example-item ${selectedExample === i ? 'selected' : ''}`}
              >
                <motion.span 
                  className="example-icon"
                  animate={{ 
                    rotate: selectedExample === i ? 360 : 0,
                    scale: selectedExample === i ? 1.3 : 1 
                  }}
                >
                  💭
                </motion.span>
                {example}
                {selectedExample === i && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    className="example-loading"
                  />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
