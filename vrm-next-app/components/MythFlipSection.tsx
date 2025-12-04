'use client';

import { useState, useEffect } from 'react';

interface Myth {
  text: string;
  isMyth: boolean;
  explanation: string;
}

interface FlipCardProps {
  myth: Myth;
  onLearnMore: (question: string) => void;
}

const MYTHS: Myth[] = [
  {
    text: "Carbs at night automatically make you gain fat.",
    isMyth: true,
    explanation: "Total calories and overall diet matter more than the time you eat."
  },
  {
    text: "You must completely cut out sugar to be healthy.",
    isMyth: true,
    explanation: "Moderation is more important; small amounts can fit in a balanced diet."
  },
  {
    text: "Eating fat makes you fat.",
    isMyth: true,
    explanation: "Healthy fats are essential; excess calories from any source lead to weight gain."
  },
  {
    text: "Fruit juice is as healthy as eating whole fruit.",
    isMyth: true,
    explanation: "Juice lacks fiber and has concentrated sugars; whole fruit is more nutritious."
  },
  {
    text: "Organic food is always more nutritious.",
    isMyth: true,
    explanation: "Organic means fewer pesticides, not necessarily higher nutrient content."
  }
];

function FlipCard({ myth, onLearnMore, isActive }: FlipCardProps & { isActive?: boolean }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [userGuess, setUserGuess] = useState<boolean | null>(null);

  const handleGuess = (guess: boolean) => {
    setUserGuess(guess);
    setIsFlipped(true);
  };

  const isCorrect = userGuess === myth.isMyth;

  return (
    <div className="relative w-full perspective flex-shrink-0">
      <div
        className={`relative w-full h-[400px] duration-700 transform-style-preserve-3d transition-transform ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* FRONT - Large card with background overlay and text */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-xl backface-hidden">
          {/* Background with gradient overlay */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black"
            style={{
              backgroundImage: myth.isMyth 
                ? 'radial-gradient(circle at 30% 50%, rgba(139, 92, 246, 0.3), transparent), radial-gradient(circle at 70% 50%, rgba(59, 130, 246, 0.2), transparent)'
                : 'radial-gradient(circle at 30% 50%, rgba(16, 185, 129, 0.3), transparent), radial-gradient(circle at 70% 50%, rgba(52, 211, 153, 0.2), transparent)'
            }}
          >
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-between p-8">
            {/* Top badge */}
            <div>
              <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-xs font-semibold uppercase tracking-wider">
                Nutrition Myth
              </span>
            </div>

            {/* Bottom text */}
            <div>
              <h3 className="text-3xl font-bold text-white mb-6 leading-tight">
                {myth.text}
              </h3>
              
              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleGuess(true)}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-xl text-sm font-semibold transition-all duration-300"
                >
                  Myth
                </button>
                <button
                  onClick={() => handleGuess(false)}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-xl text-sm font-semibold transition-all duration-300"
                >
                  Fact
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BACK - Result card with similar style */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-xl backface-hidden rotate-y-180">
          {/* Background */}
          <div 
            className={`absolute inset-0 ${
              isCorrect 
                ? 'bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950' 
                : 'bg-gradient-to-br from-orange-900 via-orange-800 to-orange-950'
            }`}
          >
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-between p-8">
            {/* Result indicator */}
            <div className="flex items-center gap-3">
              <div className="text-4xl">{isCorrect ? '🎉' : '🤔'}</div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {isCorrect ? 'Correct!' : 'Not quite!'}
                </p>
                <span className="text-sm text-white/70 font-semibold uppercase tracking-wider">
                  {myth.isMyth ? 'This is a MYTH' : 'This is a FACT'}
                </span>
              </div>
            </div>

            {/* Explanation and button */}
            <div>
              <p className="text-lg text-white/90 mb-6 leading-relaxed">
                {myth.explanation}
              </p>
              
              <button
                onClick={() => onLearnMore(myth.text)}
                className="w-full py-3 bg-white/90 hover:bg-white text-gray-900 rounded-xl text-sm font-bold transition-all duration-300"
              >
                💬 Learn more
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MythFlipSection({ onLearnMore }: { onLearnMore: (q: string) => void }) {
  return (
    <section className="w-full py-20 bg-black">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black mb-4 text-white">How it works</h2>
          <p className="text-gray-400 text-lg">
            Test your nutrition knowledge • Flip the cards to reveal the truth
          </p>
        </div>

        {/* Horizontal card layout - large landscape cards */}
        <div className="flex gap-8 overflow-x-auto pb-6 px-4 snap-x snap-mandatory scrollbar-hide">
          {MYTHS.map((myth, i) => (
            <div key={i} className="w-[500px] flex-shrink-0 snap-center">
              <FlipCard myth={myth} onLearnMore={onLearnMore} isActive={i === 0} />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
