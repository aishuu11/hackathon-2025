'use client';

import GlassChat from '@/components/GlassChat';

export default function GlassDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-8">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            ✨ Glassmorphism Chat
          </h1>
          <p className="text-white/60 text-sm">
            Layered translucent cards with holographic effect
          </p>
        </div>
        
        <GlassChat />
      </div>
    </div>
  );
}
