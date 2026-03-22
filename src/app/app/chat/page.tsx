'use client'
import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Send, Plus, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Chat, Message, User as UserType } from '@/types'
import toast from 'react-hot-toast'

export default function ChatPage() {
  const { user } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChat, setActiveChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [friends, setFriends] = useState<UserType[]>([])
  const [groupName, setGroupName] = useState('')
  const [groupMembers, setGroupMembers] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (user) { loadChats(); loadFriends() }
  }, [user])

  useEffect(() => {
    if (activeChat) loadMessages(activeChat.id)
  }, [activeChat])

  useEffect(() => {
    if (!activeChat) return
    const channel = supabase
      .channel(`chat:${activeChat.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${activeChat.id}` },
        payload => {
          setMessages(prev => [...prev, payload.new as Message])
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [activeChat])

  async function loadChats() {
    if (!user) return
    const { data } = await supabase
      .from('chats')
      .select('*')
      .contains('members', [user.id])
      .order('created_at', { ascending: false })
    // Enrich direct chats with other user info
    const enriched: Chat[] = []
    for (const chat of (data || [])) {
      if (chat.type === 'direct') {
        const otherId = chat.members.find((m: string) => m !== user.id)
        if (otherId) {
          const { data: ou } = await supabase.from('users').select('*').eq('id', otherId).single()
          enriched.push({ ...chat, other_user: ou || undefined })
        } else enriched.push(chat)
      } else enriched.push(chat)
    }
    setChats(enriched)
    setLoading(false)
  }

  async function loadFriends() {
    if (!user) return
    const { data } = await supabase.from('friendships').select('friend_id').eq('user_id', user.id).eq('status', 'accepted')
    if (!data || data.length === 0) return
    const ids = data.map(f => f.friend_id)
    const { data: fu } = await supabase.from('users').select('*').in('id', ids)
    setFriends(fu || [])
  }

  async function loadMessages(chatId: string) {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:users(name, username, avatar_url)')
      .eq('chat_id', chatId)
      .order('created_at')
    setMessages((data as any) || [])
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  async function sendMessage() {
    if (!input.trim() || !activeChat || !user) return
    const content = input.trim()
    setInput('')
    await supabase.from('messages').insert({
      chat_id: activeChat.id,
      sender_id: user.id,
      content,
    })
  }

  async function createGroup() {
    if (!user) return
    if (!groupName.trim()) { toast.error('Dê um nome ao grupo'); return }
    if (groupMembers.length === 0) { toast.error('Selecione ao menos 1 amigo'); return }
    const members = [user.id, ...groupMembers]
    const { data: chat } = await supabase.from('chats').insert({
      type: 'group', members, name: groupName,
    }).select().single()
    if (chat) {
      await supabase.from('messages').insert({
        chat_id: chat.id, sender_id: user.id,
        content: `Grupo "${groupName}" criado! Marquem uma experiência juntos! 🎉`,
      })
      setShowNewGroup(false)
      setGroupName('')
      setGroupMembers([])
      loadChats()
      setActiveChat(chat)
    }
  }

  function getChatName(chat: Chat) {
    if (chat.type === 'group') return chat.name || 'Grupo'
    return chat.other_user?.name || 'Usuário'
  }

  function getChatInitial(chat: Chat) {
    return getChatName(chat)[0]?.toUpperCase() || '?'
  }

  // Chat View
  if (activeChat) {
    return (
      <div className="app-shell flex flex-col h-dvh">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b border-border bg-surface/80 backdrop-blur-sm">
          <button onClick={() => setActiveChat(null)} className="p-2 rounded-full hover:bg-card">
            <ArrowLeft size={20} />
          </button>
          <div className="w-9 h-9 rounded-full bg-purple-DEFAULT/20 flex items-center justify-center font-bold text-purple-light">
            {getChatInitial(activeChat)}
          </div>
          <div>
            <p className="font-semibold text-sm">{getChatName(activeChat)}</p>
            <p className="text-xs text-gray-500">{activeChat.type === 'group' ? `${activeChat.members.length} membros` : 'Online'}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {messages.map(msg => {
            const isMe = msg.sender_id === user?.id
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${isMe ? 'bg-green-DEFAULT text-black rounded-br-sm' : 'bg-card border border-border text-white rounded-bl-sm'}`}>
                  {!isMe && activeChat.type === 'group' && (
                    <p className="text-[10px] font-semibold text-purple-light mb-0.5">{(msg as any).sender?.name}</p>
                  )}
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-0.5 ${isMe ? 'text-black/50' : 'text-gray-600'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 px-4 py-3 border-t border-border bg-surface/80 backdrop-blur-sm">
          <input
            className="input-base flex-1"
            placeholder="Mensagem..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="w-11 h-11 rounded-xl bg-green-DEFAULT flex items-center justify-center disabled:opacity-40"
          >
            <Send size={16} className="text-black" />
          </button>
        </div>
      </div>
    )
  }

  // Chat List
  return (
    <div className="app-shell flex flex-col min-h-dvh">
      {/* New group modal */}
      {showNewGroup && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8 bg-black/70">
          <div className="w-full max-w-mobile bg-card rounded-2xl p-5 border border-border animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Criar Grupo</h3>
              <button onClick={() => setShowNewGroup(false)}><X size={20} className="text-gray-500" /></button>
            </div>
            <input
              className="input-base mb-3"
              placeholder="Nome do grupo"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
            />
            <p className="text-xs text-gray-500 mb-2">Selecione amigos:</p>
            {friends.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum amigo adicionado</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                {friends.map(f => {
                  const selected = groupMembers.includes(f.id)
                  return (
                    <div
                      key={f.id}
                      onClick={() => setGroupMembers(prev => selected ? prev.filter(id => id !== f.id) : [...prev, f.id])}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selected ? 'border-green-DEFAULT bg-green-DEFAULT/10' : 'border-border'}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-purple-DEFAULT/20 flex items-center justify-center text-sm font-bold text-purple-light">
                        {f.name[0]}
                      </div>
                      <p className="text-sm flex-1">{f.name}</p>
                      {selected && <Check size={14} className="text-green-DEFAULT" />}
                    </div>
                  )
                })}
              </div>
            )}
            <button onClick={createGroup} className="btn-primary w-full">Criar Grupo</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <h1 className="text-2xl font-black">Chat</h1>
        <button onClick={() => setShowNewGroup(true)} className="flex items-center gap-1.5 bg-surface border border-border rounded-xl px-3 py-2 text-sm font-medium hover:border-green-DEFAULT/50 transition-colors">
          <Plus size={14} /> Grupo
        </button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-4">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-green-DEFAULT border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && chats.length === 0 && (
          <div className="text-center py-16">
            <span className="text-4xl">💬</span>
            <p className="text-gray-400 mt-3">Nenhuma conversa ainda</p>
            <p className="text-xs text-gray-600 mt-1">Adicione amigos no seu perfil para conversar</p>
          </div>
        )}

        {chats.map(chat => (
          <button
            key={chat.id}
            onClick={() => setActiveChat(chat)}
            className="w-full flex items-center gap-3 p-3 bg-surface border border-border rounded-2xl hover:border-green-DEFAULT/30 transition-all active:scale-98 text-left"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${chat.type === 'group' ? 'bg-purple-DEFAULT/20 text-purple-light' : 'bg-green-DEFAULT/15 text-green-DEFAULT'}`}>
              {chat.type === 'group' ? '👥' : getChatInitial(chat)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm truncate">{getChatName(chat)}</p>
                <p className="text-xs text-gray-600 ml-2 flex-shrink-0">
                  {new Date(chat.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </p>
              </div>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {chat.type === 'group' ? `${chat.members.length} membros` : 'Toque para conversar'}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
