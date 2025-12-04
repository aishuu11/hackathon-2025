'use client';

import { useEffect, useState } from 'react';

interface AvatarSpeechBubbleProps {
  myTake: string | null;
}

export default function AvatarSpeechBubble({ myTake }: AvatarSpeechBubbleProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    console.log('🎀 AvatarSpeechBubble received myTake:', myTake);
    if (myTake && myTake.trim()) {
      setDisplayText(myTake);
      setIsVisible(true);
      console.log('✅ Speech bubble should be visible now!');
    } else {
      setIsVisible(false);
      console.log('❌ No myTake, hiding bubble');
    }
  }, [myTake]);

  // Always show for testing
  useEffect(() => {
    // Test bubble after 2 seconds if no myTake
    const timer = setTimeout(() => {
      if (!myTake) {
        console.log('🧪 TEST: Showing test bubble');
        setDisplayText('Test bubble - ask me a nutrition question!');
        setIsVisible(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  console.log('🎨 Rendering bubble - isVisible:', isVisible, 'text:', displayText);

  if (!isVisible || !displayText) {
    return null;
  }

  return (
    <div className="avatar-speech-bubble-container">
      <div className="avatar-speech-bubble">
        <p className="speech-text">{displayText}</p>
        {/* Cloud tail pointing toward avatar */}
        <div className="speech-tail"></div>
      </div>

      <style jsx>{`
        .avatar-speech-bubble-container {
          position: absolute;
          right: -30px;
          top: 60px;
          transform: translateX(100%);
          z-index: 9999;
          pointer-events: none;
          animation: fadeIn 0.5s ease-out, gentleFloat 3s ease-in-out infinite;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(100%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(100%) translateY(0);
          }
        }

        @keyframes gentleFloat {
          0%, 100% {
            transform: translateX(100%) translateY(0px);
          }
          50% {
            transform: translateX(100%) translateY(-8px);
          }
        }

        .avatar-speech-bubble {
          position: relative;
          background: linear-gradient(135deg, #ffd9ea 0%, #ffcce6 50%, #ffb3db 100%);
          border-radius: 24px 24px 24px 8px;
          padding: 16px 20px;
          max-width: 280px;
          min-width: 180px;
          box-shadow: 
            0 10px 30px rgba(255, 182, 219, 0.4),
            0 4px 12px rgba(255, 105, 180, 0.3),
            inset 0 1px 3px rgba(255, 255, 255, 0.5);
          border: 2px solid rgba(255, 255, 255, 0.6);
        }

        .speech-text {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          color: #334155;
          font-weight: 600;
          letter-spacing: 0.01em;
          text-align: left;
          word-wrap: break-word;
        }

        .speech-tail {
          position: absolute;
          left: -12px;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 12px 14px 12px 0;
          border-color: transparent #ffcce6 transparent transparent;
          filter: drop-shadow(-2px 2px 4px rgba(255, 105, 180, 0.2));
        }

        .speech-tail::after {
          content: '';
          position: absolute;
          left: 2px;
          top: -10px;
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 10px 12px 10px 0;
          border-color: transparent rgba(255, 255, 255, 0.4) transparent transparent;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .avatar-speech-bubble-container {
            right: -10px;
            top: 60px;
          }

          .avatar-speech-bubble {
            max-width: 200px;
            min-width: 150px;
            padding: 12px 16px;
            border-radius: 20px 20px 20px 6px;
          }

          .speech-text {
            font-size: 12px;
          }

          .speech-tail {
            left: -10px;
            border-width: 10px 12px 10px 0;
          }
        }
      `}</style>
    </div>
  );
}
