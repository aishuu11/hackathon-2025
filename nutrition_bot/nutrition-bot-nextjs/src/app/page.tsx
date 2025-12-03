'use client'

import { Suspense } from 'react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-950 text-white relative overflow-hidden flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl mx-auto px-8 relative z-10">
        <div className="flex flex-col gap-8 items-center text-center">
          {/* Header */}
          <header className="flex flex-col items-center gap-4">
            <h1 className="text-6xl lg:text-7xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent leading-tight tracking-tight font-orbitron text-shadow-glow">
              Nutrition Bot
            </h1>
            <p className="text-lg lg:text-xl text-gray-300 font-medium leading-relaxed font-rajdhani tracking-wider text-shadow-lg max-w-2xl">
              Debunking nutrition myths with science
            </p>
          </header>

          {/* Main Content */}
          <div className="glass-panel p-12 rounded-3xl backdrop-blur-md bg-white/10 border border-white/20 shadow-glow-intense max-w-2xl">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-cyan-300 font-orbitron">
                Welcome
              </h2>
              <p className="text-gray-200 leading-relaxed font-rajdhani">
                Your AI-powered nutrition assistant is ready to help debunk myths, answer questions, and provide science-backed nutrition advice. Ask me anything about nutrition!
              </p>
              <div className="pt-4">
                <button className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-bold font-orbitron hover:shadow-glow-intense transition-all duration-300 text-white">
                  Start Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
