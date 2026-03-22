'use client'
import { useAuth } from '@/hooks/useAuth'
import { Check, Star, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

const plans = [
  {
    id: 'casual',
    name: 'Casual',
    emoji: '🆓',
    price: 'Grátis',
    priceDetail: 'para sempre',
    color: '#6b7280',
    borderClass: 'border-border',
    features: [
      '1 experiência por mês',
      'Descontos de até 40%',
      'Feed personalizado',
      'Chat com amigos',
    ],
  },
  {
    id: 'curitibano',
    name: 'Curitibano Raiz',
    emoji: '🌲',
    price: 'R$ 19,90',
    priceAlt: 'R$ 189,90/ano',
    priceDetail: '/mês',
    color: '#00c853',
    borderClass: 'border-green-DEFAULT',
    badge: 'Mais popular',
    features: [
      '5 experiências por mês',
      'Descontos de até 40%',
      'Feed personalizado',
      'Chat com amigos',
      'Suporte prioritário',
    ],
  },
  {
    id: 'capivara',
    name: 'Capivara',
    emoji: '🦫',
    price: 'R$ 29,90',
    priceAlt: 'R$ 219,90/ano',
    priceDetail: '/mês',
    color: '#7c4dff',
    borderClass: 'border-purple-DEFAULT',
    badge: 'Premium',
    features: [
      'Experiências ilimitadas',
      'Descontos de até 40%',
      'Leve um, Ganhe Outro 🎁',
      'Feed personalizado',
      'Chat com amigos',
      'Suporte VIP',
      'Acesso antecipado',
    ],
  },
]

export default function PlanosPage() {
  const { user } = useAuth()

  function handleUpgrade(planId: string) {
    if (planId === user?.plan) return
    toast('Em breve! 🚀', { icon: '🦫', duration: 2000 })
  }

  return (
    <div className="app-shell flex flex-col min-h-dvh">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-black">Planos</h1>
        {user && (
          <p className="text-gray-400 text-sm mt-1">
            {user.name.split(' ')[0]}, seu plano atual é{' '}
            <span className="text-green-DEFAULT font-semibold capitalize">{
              user.plan === 'casual' ? 'Casual 🆓' :
              user.plan === 'curitibano' ? 'Curitibano Raiz 🌲' : 'Capivara 🦫'
            }</span>
          </p>
        )}
      </div>

      {/* Plans */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-6">
        {plans.map((plan) => {
          const isCurrent = user?.plan === plan.id
          return (
            <div
              key={plan.id}
              className={`relative border-2 rounded-2xl p-5 transition-all ${plan.borderClass} ${
                isCurrent ? 'bg-surface' : 'bg-card'
              }`}
              style={isCurrent ? { boxShadow: `0 0 20px ${plan.color}20` } : {}}
            >
              {/* Badge */}
              {plan.badge && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white"
                  style={{ background: plan.color }}
                >
                  {plan.badge}
                </div>
              )}

              {isCurrent && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-DEFAULT/10 border border-green-DEFAULT/30 rounded-full px-2 py-0.5">
                  <div className="w-1.5 h-1.5 bg-green-DEFAULT rounded-full animate-pulse" />
                  <span className="text-xs text-green-DEFAULT font-medium">Plano atual</span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{plan.emoji}</span>
                <div>
                  <h2 className="text-lg font-black text-white">{plan.name}</h2>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black" style={{ color: plan.color }}>{plan.price}</span>
                    <span className="text-gray-500 text-sm">{plan.priceDetail}</span>
                  </div>
                  {plan.priceAlt && (
                    <p className="text-xs text-gray-600 mt-0.5">ou {plan.priceAlt}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-5">
                {plan.features.map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <Check size={14} style={{ color: plan.color }} />
                    <span className="text-sm text-gray-300">{f}</span>
                  </div>
                ))}
              </div>

              {isCurrent ? (
                <div className="w-full py-3 rounded-xl bg-green-DEFAULT/10 border border-green-DEFAULT/20 text-center">
                  <span className="text-green-DEFAULT text-sm font-semibold">✓ Plano ativo</span>
                </div>
              ) : plan.id === 'casual' ? (
                <div className="w-full py-3 rounded-xl bg-surface border border-border text-center">
                  <span className="text-gray-500 text-sm">Gratuito</span>
                </div>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all active:scale-95"
                  style={{ background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`, boxShadow: `0 4px 15px ${plan.color}40` }}
                >
                  Fazer Upgrade · Em breve 🚀
                </button>
              )}
            </div>
          )
        })}

        {/* Feature comparison */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-yellow-400" />
            <h3 className="font-bold text-sm">Por que fazer upgrade?</h3>
          </div>
          <div className="space-y-2">
            {[
              { icon: '🎯', text: 'Mais resgates = mais experiências incríveis' },
              { icon: '💰', text: 'O plano se paga com 1 saída em família' },
              { icon: '🦫', text: 'Capivara: Leve 1, Ganhe Outro dobra seu valor' },
              { icon: '🌲', text: 'Curitibano Raiz: 5x por mês = toda semana!' },
            ].map(item => (
              <div key={item.text} className="flex items-start gap-2">
                <span>{item.icon}</span>
                <p className="text-xs text-gray-400">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
