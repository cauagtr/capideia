'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="app-shell hero-gradient min-h-dvh flex flex-col overflow-hidden">
      {/* CSS Art: Curitiba Illustration */}
      <div className="relative flex-1 flex flex-col">
        {/* Sky */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Stars */}
          {mounted && Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 2 + 1 + 'px',
                height: Math.random() * 2 + 1 + 'px',
                top: Math.random() * 40 + '%',
                left: Math.random() * 100 + '%',
                opacity: Math.random() * 0.6 + 0.2,
              }}
            />
          ))}

          {/* Moon */}
          <div className="absolute top-8 right-8 w-10 h-10 rounded-full bg-yellow-100 opacity-80" style={{ boxShadow: '0 0 20px rgba(255,255,200,0.3)' }} />

          {/* Ópera de Arame — wire structure */}
          <svg className="absolute bottom-40 left-4 opacity-70" width="120" height="90" viewBox="0 0 120 90">
            {/* Base dome */}
            <ellipse cx="60" cy="80" rx="55" ry="8" fill="none" stroke="#7c4dff" strokeWidth="1.5" opacity="0.6"/>
            {/* Wire ribs */}
            {[10,25,40,55,70,85,100].map((x, i) => (
              <path key={i} d={`M${x},80 Q60,10 ${120-x},80`} fill="none" stroke="#7c4dff" strokeWidth="0.8" opacity="0.5"/>
            ))}
            {/* Horizontal rings */}
            {[70, 55, 40, 28, 20].map((y, i) => {
              const r = (80 - y) * 0.7
              return <ellipse key={i} cx="60" cy={y} rx={r} ry={r*0.2} fill="none" stroke="#7c4dff" strokeWidth="0.6" opacity="0.4"/>
            })}
            {/* Stage box */}
            <rect x="40" y="72" width="40" height="12" fill="#1a0a2e" stroke="#7c4dff" strokeWidth="1"/>
            <rect x="50" y="64" width="20" height="8" fill="#1a0a2e" stroke="#7c4dff" strokeWidth="0.8"/>
          </svg>

          {/* Jardim Botânico greenhouse */}
          <svg className="absolute bottom-44 right-2 opacity-75" width="100" height="80" viewBox="0 0 100 80">
            {/* Glass panels */}
            <polygon points="50,5 95,40 95,75 5,75 5,40" fill="rgba(0,200,83,0.05)" stroke="#00c853" strokeWidth="1.5"/>
            {/* Internal ribs */}
            <line x1="50" y1="5" x2="50" y2="75" stroke="#00c853" strokeWidth="0.8" opacity="0.5"/>
            <line x1="50" y1="5" x2="72" y2="57" stroke="#00c853" strokeWidth="0.8" opacity="0.4"/>
            <line x1="50" y1="5" x2="28" y2="57" stroke="#00c853" strokeWidth="0.8" opacity="0.4"/>
            <line x1="5" y1="57" x2="95" y2="57" stroke="#00c853" strokeWidth="0.6" opacity="0.4"/>
            <line x1="5" y1="40" x2="95" y2="40" stroke="#00c853" strokeWidth="0.6" opacity="0.3"/>
            {/* Door */}
            <rect x="40" y="58" width="20" height="17" fill="none" stroke="#00c853" strokeWidth="1"/>
            {/* Trees inside */}
            <circle cx="25" cy="50" r="8" fill="rgba(0,200,83,0.15)" stroke="#00c853" strokeWidth="0.5"/>
            <circle cx="75" cy="50" r="8" fill="rgba(0,200,83,0.15)" stroke="#00c853" strokeWidth="0.5"/>
          </svg>

          {/* Capivaras */}
          <svg className="absolute bottom-32 left-1/2 -translate-x-1/2" width="160" height="40" viewBox="0 0 160 40">
            {/* Capivara 1 */}
            <ellipse cx="30" cy="28" rx="20" ry="10" fill="#8B6914" opacity="0.9"/>
            <ellipse cx="48" cy="25" rx="10" ry="8" fill="#8B6914" opacity="0.9"/>
            <ellipse cx="52" cy="22" rx="5" ry="4" fill="#7A5C10"/>
            {/* nose */}
            <ellipse cx="56" cy="22" rx="2" ry="1.5" fill="#5a3a00"/>
            {/* ear */}
            <ellipse cx="50" cy="17" rx="3" ry="2" fill="#7A5C10"/>
            {/* legs */}
            <rect x="15" y="36" width="5" height="4" rx="2" fill="#7A5C10"/>
            <rect x="25" y="36" width="5" height="4" rx="2" fill="#7A5C10"/>
            <rect x="35" y="36" width="5" height="4" rx="2" fill="#7A5C10"/>
            {/* Eye */}
            <circle cx="54" cy="20" r="1.5" fill="black"/>
            <circle cx="54.5" cy="19.5" r="0.5" fill="white"/>

            {/* Capivara 2 (smaller, offset) */}
            <ellipse cx="110" cy="30" rx="16" ry="8" fill="#7A5C10" opacity="0.85"/>
            <ellipse cx="124" cy="27" rx="8" ry="6.5" fill="#7A5C10" opacity="0.85"/>
            <ellipse cx="128" cy="24" rx="4" ry="3.5" fill="#6a4c0e"/>
            <ellipse cx="131" cy="24" rx="2" ry="1.5" fill="#4a2e00"/>
            <ellipse cx="126" cy="19" rx="2.5" ry="2" fill="#6a4c0e"/>
            <rect x="98" y="37" width="4" height="3" rx="1.5" fill="#6a4c0e"/>
            <rect x="106" y="37" width="4" height="3" rx="1.5" fill="#6a4c0e"/>
            <rect x="114" y="37" width="4" height="3" rx="1.5" fill="#6a4c0e"/>
            <circle cx="130" cy="22" r="1.2" fill="black"/>
          </svg>

          {/* City skyline silhouette */}
          <div className="absolute bottom-20 left-0 right-0 flex items-end justify-center gap-1 px-4 opacity-30">
            {[20,35,28,45,38,55,42,30,48,25,40,32,50,22,38].map((h, i) => (
              <div key={i} className="bg-purple-DEFAULT rounded-t-sm flex-1" style={{ height: h + 'px' }}>
                {h > 35 && <div className="w-1 h-1 bg-yellow-400 rounded-full mx-auto mt-1 opacity-60" />}
              </div>
            ))}
          </div>

          {/* Ground */}
          <div className="absolute bottom-16 left-0 right-0 h-6 bg-gradient-to-t from-green-dark/20 to-transparent" />

          {/* Flowers */}
          <div className="absolute bottom-16 left-0 right-0 flex justify-around px-8">
            {['#ff6b9d','#ff8c42','#ffd166','#00c853','#7c4dff'].map((color, i) => (
              <svg key={i} width="14" height="20" viewBox="0 0 14 20" opacity={0.6 + i * 0.08}>
                <line x1="7" y1="20" x2="7" y2="8" stroke="#00a040" strokeWidth="1.5"/>
                <circle cx="7" cy="6" r="5" fill={color} opacity="0.8"/>
                <circle cx="7" cy="6" r="2" fill="rgba(255,255,255,0.4)"/>
              </svg>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col flex-1 px-6 pt-16">
          {/* Logo */}
          <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-4xl">🦫</span>
              <h1 className="text-4xl font-black tracking-tight" style={{
                background: 'linear-gradient(135deg, #00c853, #7c4dff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Capideia
              </h1>
            </div>
            <p className="text-gray-400 text-lg font-light tracking-wide">
              Descubra o melhor de Curitiba
            </p>
          </div>

          {/* Tagline cards */}
          <div className={`mt-6 flex gap-2 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {['🌳 Natureza', '🎭 Cultura', '🍽️ Gastronomia'].map(tag => (
              <span key={tag} className="text-xs px-3 py-1 rounded-full border border-border text-gray-400 bg-surface/50">
                {tag}
              </span>
            ))}
          </div>

          {/* Features */}
          <div className={`mt-8 space-y-3 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {[
              { icon: '🎯', title: 'Experiências personalizadas', desc: 'Recomendações baseadas nos seus gostos' },
              { icon: '🏷️', title: 'Descontos exclusivos', desc: 'Até 40% OFF nos melhores locais' },
              { icon: '👫', title: 'Compartilhe com amigos', desc: 'Monte grupos e descubra juntos' },
            ].map(f => (
              <div key={f.title} className="flex items-center gap-3 glass-card rounded-xl p-3 border border-border/50">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className={`mt-8 space-y-3 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Link href="/cadastro" className="block">
              <button className="btn-primary w-full text-base py-4 rounded-2xl shadow-lg" style={{ boxShadow: '0 4px 20px rgba(0,200,83,0.3)' }}>
                Cadastrar Agora 🚀
              </button>
            </Link>
            <div className="text-center">
              <span className="text-gray-500 text-sm">Já é usuário? </span>
              <Link href="/login" className="text-green-DEFAULT text-sm font-semibold hover:underline">
                Faça o login agora
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className={`mt-8 grid grid-cols-3 gap-3 pb-8 transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {[
              { value: '200+', label: 'Experiências' },
              { value: '40%', label: 'Desconto máx.' },
              { value: 'Gratuito', label: 'Para começar' },
            ].map(s => (
              <div key={s.label} className="text-center glass-card rounded-xl py-3 border border-border/30">
                <p className="text-lg font-bold text-green-DEFAULT">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
