'use client'
import { useState, useEffect, useRef } from 'react'
import { Copy, LogOut, Camera, UserPlus, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { CATEGORIES, planLabel } from '@/lib/utils'
import type { User as UserType } from '@/types'
import toast from 'react-hot-toast'

export default function PerfilPage() {
  const { user, logout, refreshUser } = useAuth()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', birth_date: '', categories: [] as string[] })
  const [friendCode, setFriendCode] = useState('')
  const [friendCount, setFriendCount] = useState(0)
  const [pendingFriends, setPendingFriends] = useState<UserType[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, birth_date: user.birth_date, categories: user.favorite_categories || [] })
      loadFriends()
    }
  }, [user])

  async function loadFriends() {
    if (!user) return
    const { count } = await supabase.from('friendships').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'accepted')
    setFriendCount(count || 0)
    // Pending requests received
    const { data } = await supabase.from('friendships').select('user_id').eq('friend_id', user.id).eq('status', 'pending')
    if (data && data.length > 0) {
      const ids = data.map(f => f.user_id)
      const { data: users } = await supabase.from('users').select('*').in('id', ids)
      setPendingFriends(users || [])
    }
  }

  async function addFriend() {
    if (!friendCode.trim() || !user) return
    const { data: friend } = await supabase.from('users').select('*').eq('friendship_code', friendCode.toUpperCase()).single()
    if (!friend) { toast.error('Código inválido'); return }
    if (friend.id === user.id) { toast.error('Este é seu próprio código!'); return }
    const { error } = await supabase.from('friendships').insert({ user_id: user.id, friend_id: friend.id, status: 'pending' })
    if (error) { toast.error('Pedido já enviado ou erro'); return }
    toast.success(`Pedido enviado para ${friend.name}! 🎉`)
    setFriendCode('')
  }

  async function acceptFriend(requesterId: string) {
    if (!user) return
    // Accept from requester -> me
    await supabase.from('friendships').update({ status: 'accepted' }).eq('user_id', requesterId).eq('friend_id', user.id)
    // Create reverse
    await supabase.from('friendships').upsert({ user_id: user.id, friend_id: requesterId, status: 'accepted' })
    // Create direct chat
    const { data: chat } = await supabase.from('chats').insert({
      type: 'direct', members: [user.id, requesterId],
    }).select().single()
    if (chat) {
      await supabase.from('messages').insert({
        chat_id: chat.id, sender_id: user.id,
        content: 'Marquem uma experiência juntos! 🎉',
      })
    }
    toast.success('Amizade aceita! 🎉')
    loadFriends()
  }

  async function rejectFriend(requesterId: string) {
    if (!user) return
    await supabase.from('friendships').delete().eq('user_id', requesterId).eq('friend_id', user.id)
    setPendingFriends(prev => prev.filter(f => f.id !== requesterId))
    toast('Pedido recusado')
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0] || !user) return
    const file = e.target.files[0]
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `avatars/${user.id}.${ext}`
      const { error: uploadError } = await supabase.storage.from('capideia').upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('capideia').getPublicUrl(path)
      await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id)
      await refreshUser()
      toast.success('Foto atualizada!')
    } catch {
      toast.error('Erro ao enviar foto')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!user) return
    if (form.categories.length === 0) { toast.error('Selecione ao menos 1 categoria'); return }
    setSaving(true)
    await supabase.from('users').update({
      name: form.name,
      birth_date: form.birth_date,
      favorite_categories: form.categories,
    }).eq('id', user.id)
    await refreshUser()
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
    await logout()
    router.push('/')
  }

  if (!user) return null

  return (
    <div className="app-shell flex flex-col min-h-dvh">
      <div className="px-4 pt-12 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-black">Perfil</h1>
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-gray-500 text-sm hover:text-red-400 transition-colors">
          <LogOut size={14} /> Sair
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
        {/* Avatar + name */}
        <div className="flex items-center gap-4 bg-surface border border-border rounded-2xl p-4">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-full bg-gradient-to-br from-green-DEFAULT/20 to-purple-DEFAULT/20 border-2 border-border overflow-hidden flex items-center justify-center cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-white">{user.name[0]}</span>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-DEFAULT rounded-full flex items-center justify-center"
            >
              {uploading ? <div className="w-3 h-3 border border-black/30 border-t-black rounded-full animate-spin" /> : <Camera size={12} className="text-black" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <p className="font-bold text-lg">{user.name}</p>
            <p className="text-sm text-gray-500">@{user.username}</p>
            <p className="text-xs text-green-DEFAULT font-medium mt-0.5">{planLabel(user.plan)}</p>
          </div>
          <button
            onClick={() => setEditing(e => !e)}
            className="ml-auto text-xs bg-surface border border-border rounded-xl px-3 py-1.5 font-medium hover:border-green-DEFAULT/50"
          >
            {editing ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <p className="text-xl font-black text-green-DEFAULT">{friendCount}</p>
            <p className="text-xs text-gray-500">Amigos</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <p className="text-xl font-black text-purple-light">{user.monthly_redeems_used}</p>
            <p className="text-xs text-gray-500">Resgates/mês</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <p className="text-xl font-black text-white capitalize">{user.plan === 'curitibano' ? '🌲' : user.plan === 'capivara' ? '🦫' : '🆓'}</p>
            <p className="text-xs text-gray-500">Plano</p>
          </div>
        </div>

        {/* Friendship code */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-2">Seu código de amizade</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-card border border-border rounded-xl px-4 py-2.5 font-mono font-black text-xl text-green-DEFAULT tracking-widest text-center">
              {user.friendship_code}
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(user.friendship_code); toast.success('Código copiado!') }}
              className="w-11 h-11 bg-green-DEFAULT/10 border border-green-DEFAULT/30 rounded-xl flex items-center justify-center"
            >
              <Copy size={16} className="text-green-DEFAULT" />
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">Compartilhe este código com amigos</p>
        </div>

        {/* Add friend */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-sm font-semibold mb-2 flex items-center gap-1.5"><UserPlus size={14} /> Adicionar amigo</p>
          <div className="flex gap-2">
            <input
              className="input-base flex-1 uppercase"
              placeholder="Código de 6 dígitos"
              value={friendCode}
              onChange={e => setFriendCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <button onClick={addFriend} className="btn-primary px-4">Enviar</button>
          </div>
        </div>

        {/* Pending friend requests */}
        {pendingFriends.length > 0 && (
          <div className="bg-surface border border-amber-500/30 rounded-2xl p-4">
            <p className="text-sm font-semibold text-amber-400 mb-3">Pedidos de amizade ({pendingFriends.length})</p>
            {pendingFriends.map(f => (
              <div key={f.id} className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-purple-DEFAULT/20 flex items-center justify-center font-bold text-purple-light flex-shrink-0">
                  {f.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.name}</p>
                  <p className="text-xs text-gray-500">@{f.username}</p>
                </div>
                <button onClick={() => acceptFriend(f.id)} className="w-8 h-8 bg-green-DEFAULT rounded-full flex items-center justify-center">
                  <Check size={14} className="text-black" />
                </button>
                <button onClick={() => rejectFriend(f.id)} className="w-8 h-8 bg-border rounded-full flex items-center justify-center">
                  <X size={14} className="text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Edit form */}
        {editing && (
          <div className="bg-surface border border-green-DEFAULT/30 rounded-2xl p-4 space-y-4 animate-fade-up">
            <h3 className="font-semibold">Editar perfil</h3>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Nome</label>
              <input className="input-base" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Data de nascimento</label>
              <input className="input-base" type="date" value={form.birth_date} onChange={e => setForm(p => ({ ...p, birth_date: e.target.value }))} style={{ colorScheme: 'dark' }} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Categorias favoritas (máx. 5)</label>
              <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto">
                {CATEGORIES.map(cat => {
                  const sel = form.categories.includes(cat)
                  const dis = !sel && form.categories.length >= 5
                  return (
                    <button
                      key={cat}
                      onClick={() => !dis && toggleCategory(cat)}
                      className={`text-left p-2 rounded-lg border text-xs transition-all ${sel ? 'border-green-DEFAULT bg-green-DEFAULT/10 text-white' : dis ? 'border-border text-gray-600' : 'border-border text-gray-300'}`}
                    >
                      {sel && '✓ '}{cat}
                    </button>
                  )
                })}
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
