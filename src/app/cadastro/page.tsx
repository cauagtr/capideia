'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { validateCPF, formatCPF, validatePassword, generateFriendshipCode, CATEGORIES } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function CadastroPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    name: '', cpf: '', email: '', birth_date: '',
    categories: [] as string[],
    username: '', password: '', confirm_password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const supabase = createClient()

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function toggleCategory(cat: string) {
    setForm(prev => {
      const cats = prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : prev.categories.length < 5
          ? [...prev.categories, cat]
          : prev.categories
      return { ...prev, categories: cats }
    })
  }

  function validateStep1() {
    const errs: Record<string, string> = {}
    if (!form.name.trim() || form.name.trim().split(' ').length < 2) errs.name = 'Digite nome e sobrenome'
    if (!validateCPF(form.cpf)) errs.cpf = 'CPF inválido'
    if (!form.email.includes('@')) errs.email = 'Email inválido'
    if (!form.birth_date) errs.birth_date = 'Data obrigatória'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validateStep2() {
    const errs: Record<string, string> = {}
    if (form.categories.length < 1) errs.categories = 'Selecione ao menos 1 categoria'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validateStep3() {
    const errs: Record<string, string> = {}
    if (!form.username || form.username.length < 3) errs.username = 'Mínimo 3 caracteres'
    if (/\s/.test(form.username)) errs.username = 'Sem espaços'
    const pwdResult = validatePassword(form.password)
    if (!pwdResult.valid) errs.password = pwdResult.message
    if (form.password !== form.confirm_password) errs.confirm_password = 'Senhas não coincidem'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit() {
    if (!validateStep3()) return
    setLoading(true)
    try {
      // Check uniqueness
      const { data: existingCpf } = await supabase.from('users').select('id').eq('cpf', form.cpf.replace(/\D/g, '')).single()
      if (existingCpf) { toast.error('CPF já cadastrado'); setLoading(false); return }
      const { data: existingEmail } = await supabase.from('users').select('id').eq('email', form.email).single()
      if (existingEmail) { toast.error('Email já cadastrado'); setLoading(false); return }
      const { data: existingUser } = await supabase.from('users').select('id').eq('username', form.username).single()
      if (existingUser) { toast.error('Nome de usuário já em uso'); setLoading(false); return }

      let code = generateFriendshipCode()
      // Simple hash (not production-grade — use Supabase Auth in production)
      const pw_hash = btoa(form.password + '_capideia_salt')

      const { data: newUser, error } = await supabase.from('users').insert({
        name: form.name.trim(),
        cpf: form.cpf.replace(/\D/g, ''),
        email: form.email.toLowerCase(),
        birth_date: form.birth_date,
        username: form.username.toLowerCase(),
        password_hash: pw_hash,
        friendship_code: code,
        plan: 'casual',
        monthly_redeems_used: 0,
        favorite_categories: form.categories,
      }).select().single()

      if (error) throw error

      localStorage.setItem('capideia_user', JSON.stringify(newUser))
      setShowSuccess(true)
      setTimeout(() => router.push('/app/inicio'), 2500)
    } catch (err: unknown) {
      toast.error('Erro ao criar conta. Tente novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const pwdCheck = validatePassword(form.password)

  if (showSuccess) {
    return (
      <div className="app-shell min-h-dvh flex items-center justify-center hero-gradient">
        <div className="text-center px-8 animate-spring-in">
          <div className="text-7xl mb-4 animate-bounce">🦫</div>
          <h1 className="text-3xl font-black mb-2" style={{
            background: 'linear-gradient(135deg, #00c853, #7c4dff)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Bem-vindo ao Paraíso!
          </h1>
          <p className="text-gray-400">Preparando sua experiência curitibana...</p>
          <div className="mt-6 flex justify-center gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-green-DEFAULT animate-bounce" style={{ animationDelay: i * 0.15 + 's' }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell min-h-dvh flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        {step > 1 ? (
          <button onClick={() => setStep(s => s - 1)} className="p-2 rounded-full hover:bg-surface">
            <ArrowLeft size={20} />
          </button>
        ) : (
          <Link href="/" className="p-2 rounded-full hover:bg-surface">
            <ArrowLeft size={20} />
          </Link>
        )}
        <div className="flex-1">
          <h1 className="text-xl font-bold">Criar Conta</h1>
          <p className="text-xs text-gray-500">Passo {step} de 3</p>
        </div>
        <div className="flex gap-1">
          {[1,2,3].map(s => (
            <div key={s} className={`h-1 w-8 rounded-full transition-colors ${s <= step ? 'bg-green-DEFAULT' : 'bg-border'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 pb-8 overflow-y-auto">
        {/* Step 1: Personal Data */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-up">
            <div>
              <h2 className="text-2xl font-bold">Dados pessoais</h2>
              <p className="text-gray-400 text-sm mt-1">Preencha suas informações básicas</p>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Nome completo</label>
              <input className="input-base" placeholder="João da Silva" value={form.name} onChange={e => set('name', e.target.value)} />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">CPF</label>
              <input className="input-base" placeholder="000.000.000-00" value={form.cpf}
                onChange={e => set('cpf', formatCPF(e.target.value))} maxLength={14} />
              {errors.cpf && <p className="text-red-400 text-xs mt-1">{errors.cpf}</p>}
              {form.cpf.length === 14 && !errors.cpf && (
                <p className={`text-xs mt-1 ${validateCPF(form.cpf) ? 'text-green-DEFAULT' : 'text-red-400'}`}>
                  {validateCPF(form.cpf) ? '✓ CPF válido' : '✗ CPF inválido'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Email</label>
              <input className="input-base" type="email" placeholder="joao@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Data de nascimento</label>
              <input className="input-base" type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)}
                style={{ colorScheme: 'dark' }} />
              {errors.birth_date && <p className="text-red-400 text-xs mt-1">{errors.birth_date}</p>}
            </div>

            <button className="btn-primary w-full mt-4" onClick={() => { if (validateStep1()) setStep(2) }}>
              Continuar
            </button>
          </div>
        )}

        {/* Step 2: Categories */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-up">
            <div>
              <h2 className="text-2xl font-bold">Seus interesses</h2>
              <p className="text-gray-400 text-sm mt-1">Selecione de 1 a 5 categorias favoritas</p>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Selecionadas: {form.categories.length}/5</span>
              {errors.categories && <p className="text-red-400 text-xs">{errors.categories}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => {
                const selected = form.categories.includes(cat)
                const disabled = !selected && form.categories.length >= 5
                return (
                  <button
                    key={cat}
                    onClick={() => !disabled && toggleCategory(cat)}
                    className={`text-left p-3 rounded-xl border text-sm transition-all active:scale-95 ${
                      selected ? 'border-green-DEFAULT bg-green-DEFAULT/10 text-white' :
                      disabled ? 'border-border text-gray-600 cursor-not-allowed' :
                      'border-border text-gray-300 hover:border-green-DEFAULT/50'
                    }`}
                  >
                    {selected && <span className="text-green-DEFAULT mr-1">✓</span>}
                    {cat}
                  </button>
                )
              })}
            </div>

            <button className="btn-primary w-full mt-4" onClick={() => { if (validateStep2()) setStep(3) }}>
              Continuar
            </button>
          </div>
        )}

        {/* Step 3: Credentials */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-up">
            <div>
              <h2 className="text-2xl font-bold">Suas credenciais</h2>
              <p className="text-gray-400 text-sm mt-1">Crie seu usuário e senha</p>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Nome de usuário</label>
              <input className="input-base" placeholder="joaosilva123" value={form.username}
                onChange={e => set('username', e.target.value.toLowerCase().replace(/\s/g, ''))} />
              {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Senha</label>
              <div className="relative">
                <input className="input-base pr-10" type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} />
                <button className="absolute right-3 top-3 text-gray-500" onClick={() => setShowPassword(p => !p)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2 space-y-1">
                  {[
                    { check: form.password.length >= 8, label: 'Mínimo 8 caracteres' },
                    { check: /[A-Z]/.test(form.password), label: 'Uma letra maiúscula' },
                    { check: /[a-z]/.test(form.password), label: 'Uma letra minúscula' },
                    { check: /[^A-Za-z0-9]/.test(form.password), label: 'Um caractere especial' },
                  ].map(r => (
                    <div key={r.label} className="flex items-center gap-1.5">
                      {r.check ? <Check size={12} className="text-green-DEFAULT" /> : <X size={12} className="text-gray-500" />}
                      <span className={`text-xs ${r.check ? 'text-green-DEFAULT' : 'text-gray-500'}`}>{r.label}</span>
                    </div>
                  ))}
                </div>
              )}
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Confirmar senha</label>
              <input className="input-base" type="password" placeholder="••••••••"
                value={form.confirm_password} onChange={e => set('confirm_password', e.target.value)} />
              {errors.confirm_password && <p className="text-red-400 text-xs mt-1">{errors.confirm_password}</p>}
              {form.confirm_password && form.password === form.confirm_password && (
                <p className="text-green-DEFAULT text-xs mt-1">✓ Senhas coincidem</p>
              )}
            </div>

            <button className="btn-primary w-full mt-4 py-4 text-base" onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Criando conta...
                </span>
              ) : 'Criar Conta 🎉'}
            </button>

            <p className="text-center text-xs text-gray-500 mt-2">
              Já tem conta?{' '}
              <Link href="/login" className="text-green-DEFAULT font-medium">Fazer login</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
