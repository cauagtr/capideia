'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
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

      if (error || !user) { toast.error('Usuário não encontrado'); return }

      const expectedHash = btoa(password + '_capideia_salt')
      if (user.password_hash !== expectedHash) { toast.error('Senha incorreta'); return }

      localStorage.setItem('capideia_user', JSON.stringify(user))
      toast.success('Bem-vindo de volta! 🦫')
      router.push('/app/inicio')
    } catch {
      toast.error('Erro ao fazer login')
    } finally {
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
        {/* Logo */}
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
                className="input-base pr-10"
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
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Entrando...
              </span>
            ) : 'Entrar 🚀'}
          </button>

          <p className="text-center text-sm text-gray-400 pt-2">
            Não tem conta?{' '}
            <Link href="/cadastro" className="text-green-DEFAULT font-semibold">Cadastrar agora</Link>
          </p>
        </div>

        {/* Demo hint */}
        <div className="mt-auto pb-8 pt-12">
          <div className="border border-border/50 rounded-xl p-4 bg-surface/50">
            <p className="text-xs text-gray-500 text-center mb-2">Admin demo</p>
            <p className="text-xs text-gray-400 text-center">Acesse <Link href="/admin" className="text-purple-DEFAULT font-medium">/admin</Link> com usuário <code className="bg-card px-1 rounded">cauagtr</code></p>
          </div>
        </div>
      </div>
    </div>
  )
}
