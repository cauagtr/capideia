'use client'
import { useState, useEffect, useRef } from 'react'
import { Copy, LogOut, Camera, Check, X, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { CATEGORIES, planLabel } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function PerfilPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', birth_date: '', categories: [] as string[] })
  const [friendCode, setFriendCode] = useState('')
  const [friendCount, setFriendCount] = useState(0)
  const [pendingFriends, setPendingFriends] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [addingFriend, setAddingFriend] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const stored = localStorage.getItem('capideia_user')
    if (stored) {
      const u = JSON.parse(stored)
      setUser(u)
      setForm({ name: u.name, birth_date: u.birth_date, categories: u.favorite_categories || [] })
    }
  }, [])

  useEffect(() => {
    if (user) loadFriends()
  }, [user])

  async function loadFriends() {
    if (!user) return
    // Get fresh user data
    const { data: freshUser } = await supabase.from('users').select('*').eq('id', user.id).single()
    if (freshUser) {
      setUser(freshUser)
      localStorage.setItem('capideia_user', JSON.stringify(freshUser))
    }

    const { count } = await supabase.from('friendships').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'accepted')
    setFriendCount(count || 0)

    const { data: pending } = await supabase.from('friendships').select('user_id').eq('friend_id', user.id).eq('status', 'pending')
    if (pending && pending.length > 0) {
      const ids = pending.map((f: any) => f.user_id)
      const { data: users } = await supabase.from('users').select('*').in('id', ids)
      setPendingFriends(users || [])
    } else {
      setPendingFriends([])
    }
  }

  async function addFriend() {
    if (!friendCode.trim() || !user) return
    setAddingFriend(true)
    try {
      const { data: friend } = await supabase.from('users').select('*').eq('friendship_code', friendCode.toUpperCase()).single()
      if (!friend) { toast.error('Código inválido — verifique e tente novamente'); return }
      if (friend.id === user.id) { toast.error('Este é o seu próprio código!'); return }

      // Check if already friends or pending
      const { data: existing } = await supabase.from('friendships').select('id').eq('user_id', user.id).eq('friend_id', friend.id).single()
      if (existing) { toast.error('Pedido já enviado para este usuário'); return }

      await supabase.from('friendships').insert({ user_id: user.id, friend_id: friend.id, status: 'pending' })
      toast.success(`Pedido enviado para ${friend.name}! 🎉`)
      setFriendCode('')
    } finally {
      setAddingFriend(false)
    }
  }

  async function acceptFriend(requesterId: string) {
    if (!user) return
    await supabase.from('friendships').update({ status: 'accepted' }).eq('user_id', requesterId).eq('friend_id', user.id)
    await supabase.from('friendships').upsert({ user_id: user.id, friend_id: requesterId, status: 'accepted' })
    // Create direct chat
    const { data: chat } = await supabase.from('chats').insert({ type: 'direct', members: [user.id, requesterId] }).select().single()
    if (chat) await supabase.from('messages').insert({ chat_id: chat.id, sender_id: user.id, content: 'Marquem uma experiência juntos! 🎉' })
    toast.success('Amizade aceita! 🎉')
    loadFriends()
  }

  async function rejectFriend(requesterId: string) {
    if (!user) return
    await supabase.from('friendships').delete().eq('user_id', requesterId).eq('friend_id', user.id)
    setPendingFriends(prev => prev.filter((f: any) => f.id !== requesterId))
    toast('Pedido recusado')
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0] || !user) return
    const file = e.target.files[0]
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `avatars/${user.id}.${ext}`
      await supabase.storage.from('capideia').upload(path, file, { upsert: true })
      const { data: { publicUrl } } = supabase.storage.from('capideia').getPublicUrl(path)
      await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id)
      const updated = { ...user, avatar_url: publicUrl }
      setUser(updated)
      localStorage.setItem('capideia_user', JSON.stringify(updated))
      toast.success('Foto atualizada!')
    } catch { toast.error('Erro ao enviar foto') }
    finally { setUploading(false) }
  }

  async function handleSave() {
    if (!user) return
    if (form.categories.length === 0) { toast.error('Selecione ao menos 1 categoria'); return }
    setSaving(true)
    await supabase.from('users').update({ name: form.name, birth_date: form.birth_date, favorite_categories: form.categories }).eq('id', user.id)
    const updated = { ...user, name: form.name, birth_date: form.birth_date, favorite_categories: form.categories }
    setUser(updated)
    localStorage.setItem('capideia_user', JSON.stringify(updated))
    setSaving(false)
    setEditing(false)
    toast.success('Perfil atualizado!')
  }

  function toggleCategory(cat: string) {
    setForm(prev => {
      const cats = prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : prev.categories.length < 5 ? [...prev.categories, cat] : prev.categories
      return { ...prev, categories: cats }
    })
  }

  async function handleLogout() {
    localStorage.removeItem('capideia_user')
    window.location.href = '/'
  }

  if (!user) return null

  const redeemCount = user.monthly_redeems_used || 0
  const planLimit = user.plan === 'capivara' ? 999 : user.plan === 'curitibano' ? 5 : 1
  const remaining = planLimit === 999 ? '∞' : Math.max(0, planLimit - redeemCount)

  return (
    <div className="app-shell flex flex-col min-h-dvh">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '48px 16px 16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 900 }}>Perfil</h1>
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <LogOut size={14} /> Sair
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#141414', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '16px' }}>
          <div style={{ position: 'relative' }}>
            <div onClick={() => fileRef.current?.click()} style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,rgba(0,200,83,0.2),rgba(124,77,255,0.2))', border: '2px solid #2a2a2a', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {user.avatar_url
                ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '24px', fontWeight: 900, color: 'white' }}>{user.name[0]}</span>}
            </div>
            <button onClick={() => fileRef.current?.click()} style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '24px', height: '24px', background: '#00c853', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {uploading ? <div style={{ width: '10px', height: '10px', border: '1px solid rgba(0,0,0,0.3)', borderTop: '1px solid black', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <Camera size={12} style={{ color: 'black' }} />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: '18px' }}>{user.name}</p>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>@{user.username}</p>
            <p style={{ fontSize: '12px', color: '#00c853', fontWeight: 600, marginTop: '2px' }}>{planLabel(user.plan)}</p>
          </div>
          <button onClick={() => setEditing(e => !e)} style={{ fontSize: '12px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '6px 12px', fontWeight: 600, color: 'white', cursor: 'pointer' }}>
            {editing ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {[
            { value: friendCount, label: 'Amigos', color: '#00c853' },
            { value: redeemCount, label: 'Resgates/mês', color: '#a78bfa' },
            { value: remaining, label: 'Disponíveis', color: 'white' },
          ].map(s => (
            <div key={s.label} style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: '22px', fontWeight: 900, color: s.color }}>{s.value}</p>
              <p style={{ fontSize: '11px', color: '#6b7280' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Friendship code */}
        <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '16px' }}>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Seu código de amizade</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '10px 16px', fontFamily: 'monospace', fontWeight: 900, fontSize: '22px', color: '#00c853', letterSpacing: '0.1em', textAlign: 'center' }}>
              {user.friendship_code}
            </div>
            <button onClick={() => { navigator.clipboard.writeText(user.friendship_code); toast.success('Código copiado!') }}
              style={{ width: '44px', height: '44px', background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.3)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Copy size={16} style={{ color: '#00c853' }} />
            </button>
          </div>
          <p style={{ fontSize: '12px', color: '#4b5563', marginTop: '8px', textAlign: 'center' }}>Compartilhe este código com seus amigos</p>
        </div>

        {/* Add friend */}
        <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '16px' }}>
          <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserPlus size={16} style={{ color: '#00c853' }} /> Adicionar amigo pelo código
          </p>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>
            Peça o código de 6 dígitos do seu amigo e cole aqui abaixo:
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              className="input-base"
              style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, fontSize: '16px', textAlign: 'center' }}
              placeholder="EX: AB1234"
              value={friendCode}
              onChange={e => setFriendCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <button onClick={addFriend} disabled={addingFriend || friendCode.length !== 6}
              style={{ padding: '12px 20px', background: friendCode.length === 6 ? '#00c853' : '#2a2a2a', color: friendCode.length === 6 ? 'black' : '#6b7280', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '14px', transition: 'all 0.15s' }}>
              {addingFriend ? '...' : 'Enviar'}
            </button>
          </div>
          <p style={{ fontSize: '11px', color: '#4b5563', marginTop: '6px', textAlign: 'center' }}>
            {friendCode.length}/6 caracteres {friendCode.length === 6 ? '✓' : ''}
          </p>
        </div>

        {/* Pending friend requests */}
        {pendingFriends.length > 0 && (
          <div style={{ background: '#141414', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '16px', padding: '16px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#fbbf24', marginBottom: '12px' }}>Pedidos de amizade ({pendingFriends.length})</p>
            {pendingFriends.map((f: any) => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(124,77,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#a78bfa', flexShrink: 0 }}>
                  {f.name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>@{f.username}</p>
                </div>
                <button onClick={() => acceptFriend(f.id)} style={{ width: '32px', height: '32px', background: '#00c853', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Check size={14} style={{ color: 'black' }} />
                </button>
                <button onClick={() => rejectFriend(f.id)} style={{ width: '32px', height: '32px', background: '#2a2a2a', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={14} style={{ color: '#9ca3af' }} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Edit form */}
        {editing && (
          <div style={{ background: '#141414', border: '1px solid rgba(0,200,83,0.3)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontWeight: 600, fontSize: '16px' }}>Editar perfil</h3>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>Nome</label>
              <input className="input-base" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>Data de nascimento</label>
              <input className="input-base" type="date" value={form.birth_date} onChange={e => setForm(p => ({ ...p, birth_date: e.target.value }))} style={{ colorScheme: 'dark' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>Categorias favoritas ({form.categories.length}/5)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                {CATEGORIES.map(cat => {
                  const sel = form.categories.includes(cat)
                  const dis = !sel && form.categories.length >= 5
                  return (
                    <button key={cat} onClick={() => !dis && toggleCategory(cat)} style={{
                      textAlign: 'left', padding: '8px', borderRadius: '8px', fontSize: '11px', cursor: dis ? 'not-allowed' : 'pointer', border: 'none',
                      background: sel ? 'rgba(0,200,83,0.15)' : '#1a1a1a', color: sel ? 'white' : dis ? '#4b5563' : '#d1d5db',
                      outline: sel ? '1px solid #00c853' : '1px solid #2a2a2a',
                    }}>
                      {sel && '✓ '}{cat}
                    </button>
                  )
                })}
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
