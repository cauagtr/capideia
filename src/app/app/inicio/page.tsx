'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Heart, Share2, Link2, MapPin, Clock, DollarSign, Users, X, ChevronDown, Volume2, VolumeX } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Experience, User as UserType } from '@/types'
import toast from 'react-hot-toast'

export default function InicioPage() {
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(true)
  const [mode, setMode] = useState<'solo' | 'group' | null>(null)
  const [friendCode, setFriendCode] = useState('')
  const [friends, setFriends] = useState<UserType[]>([])
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(false)
  const [muted, setMuted] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [showCouponPopup, setShowCouponPopup] = useState<Experience | null>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadFriends()
  }, [])

  async function loadFriends() {
    if (!user) return
    const { data } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', user.id)
      .eq('status', 'accepted')
    if (!data) return
    const ids = data.map(f => f.friend_id)
    if (ids.length === 0) return
    const { data: friendUsers } = await supabase.from('users').select('*').in('id', ids)
    setFriends(friendUsers || [])
  }

  async function loadExperiences() {
    setLoading(true)
    const { data } = await supabase
      .from('experiences')
      .select('*')
      .eq('is_active', true)
    if (data) {
      // Sort by b2b plan: top > destaque > vitrine
      const sorted = data.sort((a, b) => {
        const rank = { top: 0, destaque: 1, vitrine: 2 }
        return (rank[a.b2b_plan as keyof typeof rank] ?? 2) - (rank[b.b2b_plan as keyof typeof rank] ?? 2)
      })
      setExperiences(sorted)
      // Load saved interests
      const { data: interests } = await supabase
        .from('interests')
        .select('experience_id')
        .eq('user_id', user?.id)
      if (interests) setLikedIds(new Set(interests.map(i => i.experience_id)))
    }
    setLoading(false)
  }

  function startSolo() {
    setMode('solo')
    setShowModal(false)
    loadExperiences()
  }

  async function addFriendByCode() {
    if (!friendCode.trim()) return
    const { data: friend } = await supabase.from('users').select('*').eq('friendship_code', friendCode.toUpperCase()).single()
    if (!friend) { toast.error('Código inválido'); return }
    if (friend.id === user?.id) { toast.error('Este é seu próprio código!'); return }
    const { error } = await supabase.from('friendships').insert({ user_id: user?.id, friend_id: friend.id, status: 'pending' })
    if (error) { toast.error('Já enviado ou erro'); return }
    toast.success(`Pedido enviado para ${friend.name}! 🎉`)
    setFriendCode('')
    loadFriends()
  }

  async function inviteFriend(friendId: string, exp?: Experience) {
    await supabase.from('experience_invites').insert({
      from_user_id: user?.id,
      to_user_id: friendId,
      experience_id: exp?.id || null,
      status: 'pending',
    })
    toast.success('Convite enviado! 🎉')
  }

  // Intersection observer for autoplay
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const video = entry.target as HTMLVideoElement
          if (entry.isIntersecting) {
            video.play().catch(() => {})
            const idx = videoRefs.current.indexOf(video)
            if (idx >= 0) setCurrentIndex(idx)
          } else {
            video.pause()
          }
        })
      },
      { threshold: 0.6 }
    )
    videoRefs.current.forEach(v => v && observer.observe(v))
    return () => observer.disconnect()
  }, [experiences])

  async function handleLike(exp: Experience) {
    if (!user) return
    if (likedIds.has(exp.id)) {
      await supabase.from('interests').delete().eq('user_id', user.id).eq('experience_id', exp.id)
      setLikedIds(prev => { const s = new Set(prev); s.delete(exp.id); return s })
      toast('Removido dos interesses')
      return
    }
    // Check plan limits
    const limits = { casual: 1, curitibano: 5, capivara: Infinity }
    const limit = limits[user.plan as keyof typeof limits] ?? 1
    const { count } = await supabase.from('interests').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'redeemed')
    const redeemed = count || 0
    await supabase.from('interests').upsert({ user_id: user.id, experience_id: exp.id, status: 'interested' })
    setLikedIds(prev => new Set([...prev, exp.id]))
    setShowCouponPopup(exp)
    // Animate heart
    const heartBtn = document.getElementById(`heart-${exp.id}`)
    heartBtn?.classList.add('animate-heart-pop')
    setTimeout(() => heartBtn?.classList.remove('animate-heart-pop'), 400)
  }

  function shareWhatsApp(exp: Experience) {
    const text = `Olha essa experiência incrível em Curitiba: *${exp.name}*! Desconto de ${exp.discount_percent}% com o cupom ${exp.coupon_code}. Descubra pelo Capideia 🦫`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  function copyLink(exp: Experience) {
    navigator.clipboard.writeText(`https://capideia.app/exp/${exp.id}`)
    toast.success('Link copiado!')
  }

  // Modal: Start Experience
  if (showModal) {
    return (
      <div className="app-shell min-h-dvh flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-5xl">🦫</span>
            <h1 className="text-2xl font-black mt-3 text-white">Olá, {user?.name.split(' ')[0]}!</h1>
            <p className="text-gray-400 text-sm mt-1">O que vamos descobrir hoje?</p>
          </div>

          {!mode ? (
            <>
              <button
                onClick={() => setMode('group')}
                className="w-full border border-border rounded-2xl p-5 text-left mb-3 hover:border-green-DEFAULT/50 transition-colors active:scale-95 bg-surface"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-DEFAULT/10 flex items-center justify-center">
                    <Users size={20} className="text-green-DEFAULT" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Começar em Grupo</p>
                    <p className="text-xs text-gray-500">Convide amigos para a experiência</p>
                  </div>
                </div>
              </button>

              <button
                onClick={startSolo}
                className="w-full border border-border rounded-2xl p-5 text-left hover:border-purple-DEFAULT/50 transition-colors active:scale-95 bg-surface"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-DEFAULT/10 flex items-center justify-center">
                    <span className="text-lg">🎯</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Experimentar Sozinho</p>
                    <p className="text-xs text-gray-500">Explore no seu próprio ritmo</p>
                  </div>
                </div>
              </button>
            </>
          ) : mode === 'group' ? (
            <div className="w-full space-y-4 animate-fade-up">
              <button onClick={() => setMode(null)} className="text-gray-500 text-sm flex items-center gap-1">
                <ChevronDown size={14} className="rotate-90" /> Voltar
              </button>
              <h2 className="font-bold text-lg">Convidar Amigos</h2>

              {friends.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-400 text-sm mb-4">Você não tem amigos para montar um grupo</p>
                  <div className="flex gap-2">
                    <input
                      className="input-base flex-1"
                      placeholder="Código de amizade (ex: AB1234)"
                      value={friendCode}
                      onChange={e => setFriendCode(e.target.value.toUpperCase())}
                      maxLength={6}
                    />
                    <button onClick={addFriendByCode} className="btn-primary px-4 py-3">+</button>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">Peça o código de 6 dígitos do seu amigo</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {friends.map(f => (
                    <div key={f.id} className="flex items-center gap-3 bg-surface rounded-xl p-3 border border-border">
                      <div className="w-9 h-9 rounded-full bg-purple-DEFAULT/20 flex items-center justify-center text-sm font-bold">
                        {f.name[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{f.name}</p>
                        <p className="text-xs text-gray-500">@{f.username}</p>
                      </div>
                      <button onClick={() => inviteFriend(f.id)} className="text-xs bg-green-DEFAULT/10 text-green-DEFAULT border border-green-DEFAULT/30 rounded-lg px-3 py-1.5 font-medium">
                        Convidar
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={startSolo} className="w-full btn-secondary mt-2">
                Começar Sozinho mesmo assim
              </button>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  // Loading
  if (loading) {
    return (
      <div className="app-shell min-h-dvh flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">🎯</div>
          <p className="text-gray-400 text-sm">Carregando experiências...</p>
        </div>
      </div>
    )
  }

  if (experiences.length === 0) {
    return (
      <div className="app-shell min-h-dvh flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-4xl mb-3">😕</div>
          <p className="text-white font-semibold">Nenhuma experiência disponível</p>
          <p className="text-gray-500 text-sm mt-1">Volte em breve!</p>
          <button onClick={() => setShowModal(true)} className="btn-secondary mt-6">Reiniciar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell relative">
      {/* Coupon popup */}
      {showCouponPopup && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8 bg-black/60">
          <div className="w-full max-w-mobile bg-card rounded-2xl p-6 border border-green-DEFAULT/30 animate-slide-up">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-bold text-white text-lg">Recompensa reservada! 🎉</p>
                <p className="text-gray-400 text-sm mt-1">Veja em Meus Interesses</p>
              </div>
              <button onClick={() => setShowCouponPopup(null)} className="text-gray-500 p-1">
                <X size={20} />
              </button>
            </div>
            <div className="bg-green-DEFAULT/10 border border-green-DEFAULT/20 rounded-xl p-4">
              <p className="text-green-DEFAULT font-bold text-xl text-center">{showCouponPopup.coupon_code}</p>
              <p className="text-gray-400 text-xs text-center mt-1">{showCouponPopup.coupon_description}</p>
            </div>
            <button onClick={() => setShowCouponPopup(null)} className="btn-primary w-full mt-4">
              Entendido!
            </button>
          </div>
        </div>
      )}

      {/* Feed */}
      <div ref={feedRef} className="feed-container">
        {experiences.map((exp, idx) => (
          <div key={exp.id} className="feed-item bg-black">
            {/* Video / Fallback thumbnail */}
            {exp.video_urls && exp.video_urls.length > 0 ? (
              <video
                ref={el => { videoRefs.current[idx] = el }}
                src={exp.video_urls[0]}
                className="absolute inset-0 w-full h-full object-cover"
                loop
                muted={muted}
                playsInline
                poster={exp.thumbnail_url || undefined}
                onClick={() => setMuted(m => !m)}
              />
            ) : (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: exp.thumbnail_url ? `url(${exp.thumbnail_url})` : 'linear-gradient(135deg,#141414,#0a0a0a)' }}
                onClick={() => setMuted(m => !m)}
              />
            )}

            {/* Top overlay */}
            <div className="overlay-top absolute top-0 left-0 right-0 pt-12 pb-8 px-4 z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-black text-white drop-shadow-lg">{exp.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-white/80">{exp.category}</span>
                    {exp.opening_hours && Object.entries(exp.opening_hours)[0] && (
                      <span className="text-xs bg-black/40 text-white/80 px-2 py-0.5 rounded-full border border-white/10">
                        <Clock size={10} className="inline mr-1" />
                        {Object.values(exp.opening_hours)[0] as string}
                      </span>
                    )}
                  </div>
                </div>

                {/* B2B badge */}
                {exp.b2b_plan === 'top' && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full px-2 py-0.5 font-bold">
                    ⭐ TOP
                  </span>
                )}
                {exp.b2b_plan === 'destaque' && (
                  <span className="text-xs bg-purple-DEFAULT/20 text-purple-light border border-purple-DEFAULT/30 rounded-full px-2 py-0.5 font-bold">
                    🔥 Destaque
                  </span>
                )}
              </div>
            </div>

            {/* Discount badge top-right */}
            {exp.discount_percent > 0 && (
              <div className="absolute top-16 right-4 z-20 discount-badge rounded-xl px-3 py-1.5 animate-spring-in">
                <p className="text-white font-black text-sm">{exp.discount_percent}% OFF</p>
              </div>
            )}

            {/* Mute indicator */}
            <button
              onClick={() => setMuted(m => !m)}
              className="absolute top-16 left-4 z-20 bg-black/40 rounded-full p-1.5 border border-white/10"
            >
              {muted ? <VolumeX size={14} className="text-white/60" /> : <Volume2 size={14} className="text-white" />}
            </button>

            {/* Bottom overlay */}
            <div className="overlay-bottom absolute bottom-0 left-0 right-0 pt-20 pb-24 px-4 z-10">
              <p className="text-white font-semibold text-base leading-tight mb-3">{exp.description}</p>

              <div className="flex flex-wrap gap-2 mb-2">
                <span className="flex items-center gap-1 text-xs text-white/70">
                  <MapPin size={11} /> {exp.location}
                </span>
                {exp.estimated_duration && (
                  <span className="flex items-center gap-1 text-xs text-white/70">
                    <Clock size={11} /> {exp.estimated_duration}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-sm font-semibold text-white">
                  <DollarSign size={13} />
                  {exp.price_min === 0 && exp.price_max === 0
                    ? 'Gratuito'
                    : `R$ ${exp.price_min} – R$ ${exp.price_max}`}
                </span>
              </div>
            </div>

            {/* Right action buttons */}
            <div className="absolute right-4 bottom-28 z-20 flex flex-col gap-4 items-center">
              {/* Heart */}
              <button
                id={`heart-${exp.id}`}
                onClick={() => handleLike(exp)}
                className="flex flex-col items-center gap-1"
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center ${likedIds.has(exp.id) ? 'bg-red-500' : 'bg-black/50 border border-white/20'}`}>
                  <Heart size={20} fill={likedIds.has(exp.id) ? 'white' : 'none'} className="text-white" />
                </div>
                <span className="text-[10px] text-white/70">Salvar</span>
              </button>

              {/* WhatsApp */}
              <button onClick={() => shareWhatsApp(exp)} className="flex flex-col items-center gap-1">
                <div className="w-11 h-11 rounded-full bg-black/50 border border-white/20 flex items-center justify-center">
                  <Share2 size={18} className="text-white" />
                </div>
                <span className="text-[10px] text-white/70">WhatsApp</span>
              </button>

              {/* Copy link */}
              <button onClick={() => copyLink(exp)} className="flex flex-col items-center gap-1">
                <div className="w-11 h-11 rounded-full bg-black/50 border border-white/20 flex items-center justify-center">
                  <Link2 size={18} className="text-white" />
                </div>
                <span className="text-[10px] text-white/70">Copiar</span>
              </button>
            </div>

            {/* Scroll hint - only first card */}
            {idx === 0 && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 animate-bounce">
                <ChevronDown size={20} className="text-white/40" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
