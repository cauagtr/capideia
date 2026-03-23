'use client'
import { useState, useEffect, useCallback } from 'react'
import { Phone, MessageCircle, Instagram, Star, X, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { planLabel, formatCountdown } from '@/lib/utils'
import type { Interest, Experience, Review } from '@/types'
import toast from 'react-hot-toast'

function planLimitNum(plan: string): number {
  if (plan === 'capivara') return 999
  if (plan === 'curitibano') return 5
  return 1
}

export default function ExperienciasPage() {
  const [user, setUser] = useState<any>(null)
  const [tab, setTab] = useState<'interesses' | 'resgatados'>('interesses')
  const [interests, setInterests] = useState<(Interest & { experience: Experience })[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmRedeem, setConfirmRedeem] = useState<(Interest & { experience: Experience }) | null>(null)
  const [reviewTarget, setReviewTarget] = useState<Experience | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [reviews, setReviews] = useState<Record<string, Review>>({})
  const [redeemCount, setRedeemCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const stored = localStorage.getItem('capideia_user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  useEffect(() => {
    if (user) load()
  }, [user])

  // Refresh countdown every minute
  useEffect(() => {
    const t = setInterval(() => setInterests(p => [...p]), 60000)
    return () => clearInterval(t)
  }, [])

  async function load() {
    if (!user) return
    setLoading(true)

    // Always get fresh user data from DB (never trust localStorage for counts)
    const { data: freshUser } = await supabase.from('users').select('*').eq('id', user.id).single()
    if (freshUser) {
      setUser(freshUser)
      localStorage.setItem('capideia_user', JSON.stringify(freshUser))
      setRedeemCount(freshUser.monthly_redeems_used || 0)
    }
    
    // Also count redeemed interests this month as double-check
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const { count: monthlyCount } = await supabase
      .from('interests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'redeemed')
      .gte('redeemed_at', firstOfMonth)
    
    const actualCount = monthlyCount || 0
    if (freshUser && actualCount !== (freshUser.monthly_redeems_used || 0)) {
      // Sync the DB if out of sync
      await supabase.from('users').update({ monthly_redeems_used: actualCount }).eq('id', user.id)
      setRedeemCount(actualCount)
      const synced = { ...freshUser, monthly_redeems_used: actualCount }
      setUser(synced)
      localStorage.setItem('capideia_user', JSON.stringify(synced))
    }

    const { data } = await supabase
      .from('interests')
      .select('*, experience:experiences(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setInterests((data as any) || [])

    const { data: reviewData } = await supabase.from('reviews').select('*').eq('user_id', user.id)
    const map: Record<string, Review> = {}
    reviewData?.forEach((r: Review) => { map[r.experience_id] = r })
    setReviews(map)
    setLoading(false)
  }

  async function handleRedeem(item: Interest & { experience: Experience }) {
    if (!user) return
    const limit = planLimitNum(user.plan)
    const used = redeemCount

    if (used >= limit) {
      toast.error(`Limite do plano ${planLabel(user.plan)} atingido este mês (${limit} resgate${limit > 1 ? 's' : ''})`)
      setConfirmRedeem(null)
      return
    }

    const now = new Date()
    const expires = new Date(now.getTime() + 48 * 60 * 60 * 1000)

    const { error } = await supabase.from('interests').update({
      status: 'redeemed',
      redeemed_at: now.toISOString(),
      expires_at: expires.toISOString(),
    }).eq('id', item.id)

    if (error) { toast.error('Erro ao resgatar'); return }

    const newCount = used + 1
    await supabase.from('users').update({ monthly_redeems_used: newCount }).eq('id', user.id)

    const updatedUser = { ...user, monthly_redeems_used: newCount }
    setUser(updatedUser)
    localStorage.setItem('capideia_user', JSON.stringify(updatedUser))
    setRedeemCount(newCount)
    setConfirmRedeem(null)
    setTab('resgatados')
    toast.success('Recompensa resgatada! 🎉')
    await load()
  }

  async function submitReview() {
    if (!user || !reviewTarget || rating === 0) return
    await supabase.from('reviews').upsert({ user_id: user.id, experience_id: reviewTarget.id, rating, comment })
    toast.success('Avaliação enviada! ⭐')
    setReviewTarget(null); setRating(0); setComment('')
    load()
  }

  const interested = interests.filter(i => i.status === 'interested')
  const redeemed = interests.filter(i => i.status === 'redeemed')
  const limit = planLimitNum(user?.plan || 'casual')
  const remaining = limit === 999 ? '∞' : Math.max(0, limit - redeemCount)

  const pendingReview = redeemed.find(i => {
    if (!i.redeemed_at || reviews[i.experience_id]) return false
    const d = new Date(i.redeemed_at)
    const now = new Date()
    return d.getDate() < now.getDate()
  })

  return (
    <div className="app-shell flex flex-col min-h-dvh">
      {/* Confirm redeem modal */}
      {confirmRedeem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 16px 32px', background: 'rgba(0,0,0,0.7)' }}>
          <div style={{ width: '100%', maxWidth: '430px', background: '#1a1a1a', borderRadius: '20px', padding: '24px', border: '1px solid #2a2a2a' }}>
            <h3 style={{ fontWeight: 700, fontSize: '18px', marginBottom: '4px' }}>Resgatar recompensa?</h3>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>
              Você tem <strong style={{ color: remaining === '∞' ? '#a78bfa' : '#00c853' }}>{remaining}</strong> resgate(s) disponível(is) este mês.
              Após resgatar, você tem <strong>48h</strong> para usar.
            </p>
            <div style={{ background: '#141414', borderRadius: '12px', padding: '12px', border: '1px solid #2a2a2a', marginBottom: '16px' }}>
              <p style={{ fontWeight: 600, color: 'white' }}>{confirmRedeem.experience?.name}</p>
              <p style={{ fontSize: '14px', color: '#00c853', fontWeight: 700, marginTop: '4px' }}>Cupom: {confirmRedeem.experience?.coupon_code}</p>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{confirmRedeem.experience?.coupon_description}</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmRedeem(null)} className="btn-secondary" style={{ flex: 1 }}>Voltar</button>
              <button onClick={() => handleRedeem(confirmRedeem)} className="btn-primary" style={{ flex: 1 }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Review modal */}
      {reviewTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 16px 32px', background: 'rgba(0,0,0,0.7)' }}>
          <div style={{ width: '100%', maxWidth: '430px', background: '#1a1a1a', borderRadius: '20px', padding: '24px', border: '1px solid #2a2a2a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '18px' }}>Avalie sua experiência</h3>
                <p style={{ fontSize: '14px', color: '#9ca3af' }}>{reviewTarget.name}</p>
              </div>
              <button onClick={() => setReviewTarget(null)}><X size={20} style={{ color: '#6b7280' }} /></button>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setRating(n)}>
                  <Star size={32} fill={n <= rating ? '#f59e0b' : 'none'} style={{ color: n <= rating ? '#f59e0b' : '#4b5563' }} />
                </button>
              ))}
            </div>
            <textarea className="input-base" style={{ resize: 'none', height: '96px', marginBottom: '16px' }}
              placeholder="Conte como foi (opcional)..." value={comment} onChange={e => setComment(e.target.value)} />
            <button onClick={submitReview} disabled={rating === 0} className="btn-primary">Enviar Avaliação</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '48px 16px 8px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 900 }}>Minhas Experiências</h1>
        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
          Plano: <span style={{ color: '#00c853', fontWeight: 600 }}>{planLabel(user?.plan || 'casual')}</span>
          {' · '}
          <span style={{ color: remaining === '∞' ? '#a78bfa' : 'white' }}>{remaining}</span> resgate(s) disponível(is) este mês
        </p>
      </div>

      {/* Review prompt */}
      {pendingReview && (
        <div style={{ margin: '0 16px 8px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#fbbf24' }}>Avalie sua experiência de ontem!</p>
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>{pendingReview.experience?.name}</p>
          </div>
          <button onClick={() => setReviewTarget(pendingReview.experience)}
            style={{ fontSize: '12px', background: 'rgba(245,158,11,0.2)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', padding: '6px 12px', fontWeight: 600 }}>
            Avaliar
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '0 16px', gap: '8px', marginBottom: '16px' }}>
        {(['interesses', 'resgatados'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '10px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer',
            background: tab === t ? '#00c853' : '#141414', color: tab === t ? 'black' : '#9ca3af',
            outline: tab === t ? 'none' : '1px solid #2a2a2a',
          }}>
            {t === 'interesses' ? `❤️ Interesses (${interested.length})` : `✅ Resgatados (${redeemed.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading && <div style={{ textAlign: 'center', padding: '48px 0' }}><div style={{ width: '24px', height: '24px', border: '2px solid #00c853', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} /></div>}

        {!loading && tab === 'interesses' && interested.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <span style={{ fontSize: '40px' }}>💔</span>
            <p style={{ color: '#9ca3af', marginTop: '12px' }}>Nenhuma experiência salva ainda</p>
            <p style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>Explore os Reels e toque ❤️ para salvar</p>
          </div>
        )}

        {!loading && tab === 'resgatados' && redeemed.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <span style={{ fontSize: '40px' }}>🎫</span>
            <p style={{ color: '#9ca3af', marginTop: '12px' }}>Nenhuma recompensa resgatada</p>
          </div>
        )}

        {tab === 'interesses' && interested.map(item => {
          const exp = item.experience
          const review = reviews[exp?.id]
          return (
            <div key={item.id} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', overflow: 'hidden' }}>
              {exp?.thumbnail_url && <div style={{ height: '120px', backgroundImage: `url(${exp.thumbnail_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <h3 style={{ fontWeight: 700, color: 'white' }}>{exp?.name}</h3>
                  {exp?.discount_percent > 0 && <span style={{ fontSize: '11px', background: 'linear-gradient(135deg,#ff6b35,#ff3366)', color: 'white', borderRadius: '8px', padding: '2px 8px', fontWeight: 700 }}>{exp.discount_percent}% OFF</span>}
                </div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>{exp?.category}</p>
                {exp?.estimated_duration && <p style={{ fontSize: '12px', color: '#6b7280' }}>⏱ {exp.estimated_duration}</p>}
                <p style={{ fontSize: '14px', color: '#00c853', fontWeight: 600, marginTop: '4px' }}>
                  {exp?.price_min === 0 && exp?.price_max === 0 ? 'Gratuito' : `R$ ${exp?.price_min} – R$ ${exp?.price_max}`}
                </p>
                {review && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                    {[1,2,3,4,5].map(n => <Star key={n} size={12} fill={n <= review.rating ? '#f59e0b' : 'none'} style={{ color: n <= review.rating ? '#f59e0b' : '#4b5563' }} />)}
                    <span style={{ fontSize: '11px', color: '#6b7280', marginLeft: '4px' }}>Sua avaliação</span>
                  </div>
                )}
                <button onClick={() => setConfirmRedeem(item)} className="btn-primary" style={{ marginTop: '12px', padding: '10px 24px', fontSize: '14px' }}>
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
            <div key={item.id} style={{ background: '#1a1a1a', border: `1px solid ${expired ? '#2a2a2a' : 'rgba(0,200,83,0.3)'}`, borderRadius: '16px', overflow: 'hidden', opacity: expired ? 0.6 : 1 }}>
              {exp?.thumbnail_url && (
                <div style={{ height: '112px', backgroundImage: `url(${exp.thumbnail_url})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                  {expired && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: 'white', fontWeight: 700 }}>Expirado</span></div>}
                </div>
              )}
              <div style={{ padding: '16px' }}>
                <h3 style={{ fontWeight: 700, color: 'white', marginBottom: '8px' }}>{exp?.name}</h3>
                {!expired && item.expires_at && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,200,83,0.1)', borderRadius: '12px', padding: '10px', border: '1px solid rgba(0,200,83,0.2)', marginBottom: '12px' }}>
                    <Clock size={14} style={{ color: '#00c853', flexShrink: 0 }} />
                    <p style={{ fontSize: '12px', color: '#00c853', fontWeight: 600 }}>{formatCountdown(item.expires_at)}</p>
                  </div>
                )}
                <div style={{ background: '#141414', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
                  <p style={{ fontSize: '12px', color: '#9ca3af' }}>Seu cupom:</p>
                  <p style={{ color: '#00c853', fontWeight: 900, fontSize: '20px' }}>{exp?.coupon_code}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Informe que veio pelo Capideia e aproveite!</p>
                </div>
                {!expired && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {exp?.phone && <a href={`tel:${exp.phone}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: '#141414', border: '1px solid #2a2a2a', borderRadius: '12px', fontSize: '12px', fontWeight: 600, color: 'white', textDecoration: 'none' }}><Phone size={14} /> Ligar</a>}
                    {exp?.whatsapp_number && <a href={`https://wa.me/55${exp.whatsapp_number.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.3)', borderRadius: '12px', fontSize: '12px', fontWeight: 600, color: '#00c853', textDecoration: 'none' }}><MessageCircle size={14} /> WhatsApp</a>}
                    {exp?.instagram_url && <a href={exp.instagram_url} target="_blank" rel="noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: 'rgba(124,77,255,0.1)', border: '1px solid rgba(124,77,255,0.3)', borderRadius: '12px', fontSize: '12px', fontWeight: 600, color: '#a78bfa', textDecoration: 'none' }}><Instagram size={14} /> Instagram</a>}
                  </div>
                )}
                {!review && !expired && (
                  <button onClick={() => setReviewTarget(exp)} style={{ width: '100%', marginTop: '8px', padding: '8px', background: 'transparent', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', color: '#fbbf24', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    ⭐ Avaliar experiência
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
