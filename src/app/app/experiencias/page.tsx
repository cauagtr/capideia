'use client'
import { useState, useEffect } from 'react'
import { Phone, MessageCircle, Instagram, Star, X, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { planLimits, planLabel, formatCountdown } from '@/lib/utils'
import type { Interest, Experience, Review } from '@/types'
import toast from 'react-hot-toast'

export default function ExperienciasPage() {
  const { user, refreshUser } = useAuth()
  const [tab, setTab] = useState<'interesses' | 'resgatados'>('interesses')
  const [interests, setInterests] = useState<(Interest & { experience: Experience })[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmRedeem, setConfirmRedeem] = useState<(Interest & { experience: Experience }) | null>(null)
  const [reviewTarget, setReviewTarget] = useState<Experience | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [reviews, setReviews] = useState<Record<string, Review>>({})
  const supabase = createClient()

  useEffect(() => {
    load()
  }, [user])

  // Ticker for countdown
  useEffect(() => {
    const timer = setInterval(() => setInterests(p => [...p]), 30000)
    return () => clearInterval(timer)
  }, [])

  async function load() {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('interests')
      .select('*, experience:experiences(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setInterests((data as any) || [])

    const { data: reviewData } = await supabase.from('reviews').select('*').eq('user_id', user.id)
    const map: Record<string, Review> = {}
    reviewData?.forEach(r => { map[r.experience_id] = r })
    setReviews(map)
    setLoading(false)
  }

  async function handleRedeem(item: Interest & { experience: Experience }) {
    if (!user) return
    const limit = planLimits(user.plan)
    if (user.monthly_redeems_used >= limit) {
      toast.error(`Limite do plano ${planLabel(user.plan)} atingido este mês`)
      setConfirmRedeem(null)
      return
    }
    const now = new Date()
    const expires = new Date(now.getTime() + 48 * 60 * 60 * 1000)
    await supabase.from('interests').update({
      status: 'redeemed',
      redeemed_at: now.toISOString(),
      expires_at: expires.toISOString(),
    }).eq('id', item.id)
    await supabase.from('users').update({ monthly_redeems_used: (user.monthly_redeems_used || 0) + 1 }).eq('id', user.id)
    await refreshUser()
    setConfirmRedeem(null)
    setTab('resgatados')
    toast.success('Recompensa resgatada! 🎉')
    load()
  }

  async function submitReview() {
    if (!user || !reviewTarget || rating === 0) return
    await supabase.from('reviews').upsert({
      user_id: user.id,
      experience_id: reviewTarget.id,
      rating,
      comment,
    })
    toast.success('Avaliação enviada! ⭐')
    setReviewTarget(null)
    setRating(0)
    setComment('')
    load()
  }

  const interested = interests.filter(i => i.status === 'interested')
  const redeemed = interests.filter(i => i.status === 'redeemed')
  const limit = user ? planLimits(user.plan) : 1
  const remaining = limit === Infinity ? '∞' : Math.max(0, limit - (user?.monthly_redeems_used || 0))

  // Check if any redeemed yesterday (for review prompt)
  const pendingReview = redeemed.find(i => {
    if (!i.redeemed_at) return false
    const d = new Date(i.redeemed_at)
    const now = new Date()
    return d.getDate() < now.getDate() && !reviews[i.experience_id]
  })

  return (
    <div className="app-shell flex flex-col min-h-dvh">
      {/* Confirm redeem modal */}
      {confirmRedeem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8 bg-black/70">
          <div className="w-full max-w-mobile bg-card rounded-2xl p-6 border border-border animate-slide-up">
            <h3 className="font-bold text-lg mb-1">Resgatar recompensa?</h3>
            <p className="text-gray-400 text-sm mb-4">
              Você tem <strong className={remaining === '∞' ? 'text-purple-light' : 'text-green-DEFAULT'}>{remaining}</strong> experiência(s) disponível(is).
              Após resgatar, você tem 48h para usar.
            </p>
            <div className="bg-surface rounded-xl p-3 border border-border mb-4">
              <p className="font-semibold text-white">{confirmRedeem.experience?.name}</p>
              <p className="text-sm text-green-DEFAULT font-bold mt-1">Cupom: {confirmRedeem.experience?.coupon_code}</p>
              <p className="text-xs text-gray-400 mt-0.5">{confirmRedeem.experience?.coupon_description}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmRedeem(null)} className="btn-secondary flex-1">Voltar</button>
              <button onClick={() => handleRedeem(confirmRedeem)} className="btn-primary flex-1">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Review modal */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8 bg-black/70">
          <div className="w-full max-w-mobile bg-card rounded-2xl p-6 border border-border animate-slide-up">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg">Avalie sua experiência</h3>
                <p className="text-sm text-gray-400">{reviewTarget.name}</p>
              </div>
              <button onClick={() => setReviewTarget(null)}><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="flex gap-2 justify-center mb-4">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setRating(n)}>
                  <Star size={32} fill={n <= rating ? '#f59e0b' : 'none'} className={n <= rating ? 'text-amber-400' : 'text-gray-600'} />
                </button>
              ))}
            </div>
            <textarea
              className="input-base resize-none h-24"
              placeholder="Conte como foi (opcional)..."
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
            <button onClick={submitReview} disabled={rating === 0} className="btn-primary w-full mt-4">
              Enviar Avaliação
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-12 pb-2">
        <h1 className="text-2xl font-black">Minhas Experiências</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Plano: <span className="text-green-DEFAULT font-medium">{planLabel(user?.plan || 'casual')}</span>
          {' · '}
          <span className={remaining === '∞' ? 'text-purple-light' : 'text-white'}>{remaining}</span> resgate(s) disponível(is) este mês
        </p>
      </div>

      {/* Review prompt */}
      {pendingReview && (
        <div className="mx-4 mb-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-400">Avalie sua experiência de ontem!</p>
            <p className="text-xs text-gray-400">{pendingReview.experience?.name}</p>
          </div>
          <button onClick={() => setReviewTarget(pendingReview.experience)} className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg px-3 py-1.5 font-medium">
            Avaliar
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex px-4 gap-2 mb-4">
        {(['interesses', 'resgatados'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize ${
              tab === t ? 'bg-green-DEFAULT text-black' : 'bg-surface border border-border text-gray-400'
            }`}
          >
            {t === 'interesses' ? `❤️ Interesses (${interested.length})` : `✅ Resgatados (${redeemed.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4">
        {loading && (
          <div className="text-center py-12">
            <div className="w-6 h-6 border-2 border-green-DEFAULT border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}

        {!loading && tab === 'interesses' && interested.length === 0 && (
          <div className="text-center py-16">
            <span className="text-4xl">💔</span>
            <p className="text-gray-400 mt-3">Nenhuma experiência salva ainda</p>
            <p className="text-xs text-gray-600 mt-1">Explore o feed e toque ❤️ para salvar</p>
          </div>
        )}

        {!loading && tab === 'resgatados' && redeemed.length === 0 && (
          <div className="text-center py-16">
            <span className="text-4xl">🎫</span>
            <p className="text-gray-400 mt-3">Nenhuma recompensa resgatada</p>
            <p className="text-xs text-gray-600 mt-1">Salve e resgate experiências para ver aqui</p>
          </div>
        )}

        {tab === 'interesses' && interested.map(item => {
          const exp = item.experience
          const review = reviews[exp?.id]
          return (
            <div key={item.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              {exp?.thumbnail_url && (
                <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${exp.thumbnail_url})` }} />
              )}
              <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-white">{exp?.name}</h3>
                  {exp?.discount_percent > 0 && (
                    <span className="text-xs discount-badge rounded-lg px-2 py-0.5 text-white font-bold">{exp.discount_percent}% OFF</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-0.5">{exp?.category}</p>
                {exp?.estimated_duration && <p className="text-xs text-gray-500">⏱ {exp.estimated_duration}</p>}
                <p className="text-sm text-green-DEFAULT font-semibold mt-1">
                  {exp?.price_min === 0 && exp?.price_max === 0 ? 'Gratuito' : `R$ ${exp?.price_min} – R$ ${exp?.price_max}`}
                </p>

                {review ? (
                  <div className="flex items-center gap-1 mt-2">
                    {[1,2,3,4,5].map(n => <Star key={n} size={12} fill={n <= review.rating ? '#f59e0b' : 'none'} className={n <= review.rating ? 'text-amber-400' : 'text-gray-600'} />)}
                    <span className="text-xs text-gray-500 ml-1">Sua avaliação</span>
                  </div>
                ) : null}

                <button
                  onClick={() => setConfirmRedeem(item)}
                  className="btn-primary w-full mt-3 py-2.5 text-sm"
                >
                  Resgatar Recompensa 🎁
                </button>
              </div>
            </div>
          )
        })}

        {tab === 'resgatados' && redeemed.map(item => {
          const exp = item.experience
          const expired = item.expires_at && new Date(item.expires_at) < new Date()
          return (
            <div key={item.id} className={`bg-card border rounded-2xl overflow-hidden ${expired ? 'border-border opacity-60' : 'border-green-DEFAULT/30'}`}>
              {exp?.thumbnail_url && (
                <div className="h-28 bg-cover bg-center relative" style={{ backgroundImage: `url(${exp.thumbnail_url})` }}>
                  {expired && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><span className="text-white font-bold text-sm">Expirado</span></div>}
                </div>
              )}
              <div className="p-4">
                <h3 className="font-bold text-white">{exp?.name}</h3>

                {!expired && item.expires_at && (
                  <div className="flex items-center gap-2 my-2 bg-green-DEFAULT/10 rounded-xl p-2.5 border border-green-DEFAULT/20">
                    <Clock size={14} className="text-green-DEFAULT flex-shrink-0" />
                    <p className="text-xs text-green-light font-medium">{formatCountdown(item.expires_at)}</p>
                  </div>
                )}

                <div className="bg-surface rounded-xl p-3 mb-3">
                  <p className="text-xs text-gray-400">Seu cupom:</p>
                  <p className="text-green-DEFAULT font-black text-lg">{exp?.coupon_code}</p>
                  <p className="text-xs text-gray-500 mt-1">Informe que veio pelo Capideia e aproveite!</p>
                </div>

                {!expired && (
                  <div className="flex gap-2">
                    {exp?.phone && (
                      <a href={`tel:${exp.phone}`} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-medium text-white">
                        <Phone size={14} /> Ligar
                      </a>
                    )}
                    {exp?.whatsapp_number && (
                      <a href={`https://wa.me/55${exp.whatsapp_number.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-DEFAULT/10 border border-green-DEFAULT/30 rounded-xl text-xs font-medium text-green-DEFAULT">
                        <MessageCircle size={14} /> WhatsApp
                      </a>
                    )}
                    {exp?.instagram_url && (
                      <a href={exp.instagram_url} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-purple-DEFAULT/10 border border-purple-DEFAULT/30 rounded-xl text-xs font-medium text-purple-light">
                        <Instagram size={14} /> Instagram
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
