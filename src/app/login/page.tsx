'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleLogin() {
    if (!identifier || !password) { toast.error('Preencha todos os campos'); return }
    setLoading(true)
    try {
      const isEmail = identifier.includes('@')
      const query = supabase.from('users').select('*')
      const { data: user, error } = await (isEmail
        ? query.eq('email', identifier.toLowerCase())
        : query.eq('username', identifier.toLowerCase())
      ).single()

      if (error || !user) { toast.error('Usuário não encontrado'); setLoading(false); return }

      const expectedHash = btoa(password + '_capideia_salt')
      if (user.password_hash !== expectedHash) { toast.error('Senha incorreta'); setLoading(false); return }

      localStorage.setItem('capideia_user', JSON.stringify(user))
      toast.success('Bem-vindo de volta! 🦫')
      
      // Force hard navigation to avoid auth state issues
      setTimeout(() => {
        window.location.href = '/app/inicio'
      }, 800)
    } catch {
      toast.error('Erro ao fazer login')
      setLoading(false)
    }
  }

  return (
    <div className="app-shell min-h-dvh flex flex-col hero-gradient">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <Link href="/" className="p-2 rounded-full hover:bg-surface">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold">Entrar</h1>
      </div>

      <div className="flex-1 flex flex-col px-4 pt-8">
        <div className="text-center mb-10">
          <span className="text-5xl">🦫</span>
          <h2 className="text-2xl font-black mt-2" style={{
            background: 'linear-gradient(135deg, #00c853, #7c4dff)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Capideia</h2>
          <p className="text-gray-400 text-sm mt-1">Entre para descobrir Curitiba</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Email ou nome de usuário</label>
            <input
              className="input-base"
              placeholder="joao@email.com ou joaosilva"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              autoCapitalize="none"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Senha</label>
            <div className="relative">
              <input
                className="input-base"
                style={{ paddingRight: '40px' }}
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
              <button className="absolute right-3 top-3 text-gray-500" onClick={() => setShowPw(p => !p)}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button className="btn-primary w-full py-4 text-base mt-2" onClick={handleLogin} disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '16px', border: '2px solid rgba(0,0,0,0.3)', borderTop: '2px solid black', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Entrando...
              </span>
            ) : 'Entrar 🚀'}
          </button>

          <p className="text-center text-sm text-gray-400 pt-2">
            Não tem conta?{' '}
            <Link href="/cadastro" className="font-semibold" style={{ color: '#00c853' }}>Cadastrar agora</Link>
          </p>
        </div>

        <div className="mt-auto pb-8 pt-12">
          <div className="border border-border rounded-xl p-4" style={{ background: 'rgba(20,20,20,0.5)' }}>
            <p className="text-xs text-gray-500 text-center mb-2">Admin demo</p>
            <p className="text-xs text-gray-400 text-center">Acesse <Link href="/admin" style={{ color: '#7c4dff' }}>/admin</Link> com usuário <code style={{ background: '#1a1a1a', padding: '1px 4px', borderRadius: '3px' }}>cauagtr</code></p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
