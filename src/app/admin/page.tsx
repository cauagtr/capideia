'use client'
import { useState, useEffect, useRef } from 'react'
import { BarChart3, Users, Star, Gift, PlusCircle, List, Eye, EyeOff, LogOut, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { CATEGORIES } from '@/lib/utils'
import type { Experience } from '@/types'
import toast from 'react-hot-toast'

type AdminView = 'login' | 'dashboard' | 'new' | 'list'

export default function AdminPage() {
  const [view, setView] = useState<AdminView>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [stats, setStats] = useState({ paid: 0, revenue: 0, active: 0, redeems: 0 })
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loadingStats, setLoadingStats] = useState(false)
  const supabase = createClient()

  function handleLogin() {
    if (username === 'cauagtr' && password === 'cauagtr1') {
      setView('dashboard')
      loadStats()
    } else {
      toast.error('Credenciais inválidas')
    }
  }

  async function loadStats() {
    setLoadingStats(true)
    const [{ count: paid }, { count: active }, { count: redeems }] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).in('plan', ['curitibano', 'capivara']),
      supabase.from('experiences').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('interests').select('*', { count: 'exact', head: true }).eq('status', 'redeemed'),
    ])
    const { data: planData } = await supabase.from('users').select('plan').in('plan', ['curitibano', 'capivara'])
    const revenue = (planData || []).reduce((sum: number, u: any) => sum + (u.plan === 'capivara' ? 29.9 : 19.9), 0)
    setStats({ paid: paid || 0, revenue, active: active || 0, redeems: redeems || 0 })
    setLoadingStats(false)
  }

  async function loadExperiences() {
    const { data } = await supabase.from('experiences').select('*').order('created_at', { ascending: false })
    setExperiences(data || [])
  }

  async function toggleActive(exp: Experience) {
    await supabase.from('experiences').update({ is_active: !exp.is_active }).eq('id', exp.id)
    await loadExperiences()
    toast.success(exp.is_active ? 'Experiência desativada' : 'Experiência ativada')
  }

  useEffect(() => { if (view === 'list') loadExperiences() }, [view])

  if (view === 'login') {
    return (
      <div className="app-shell min-h-dvh flex flex-col items-center justify-center px-6 hero-gradient">
        <div className="w-full space-y-6">
          <div className="text-center">
            <span className="text-4xl">🛡️</span>
            <h1 className="text-2xl font-black mt-2">Admin Capideia</h1>
            <p className="text-gray-400 text-sm mt-1">Acesso restrito</p>
          </div>
          <div className="space-y-3">
            <input className="input-base" placeholder="Usuário" value={username} onChange={e => setUsername(e.target.value)} />
            <div className="relative">
              <input className="input-base pr-10" type={showPw ? 'text' : 'password'} placeholder="Senha"
                value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
              <button className="absolute right-3 top-3 text-gray-500" onClick={() => setShowPw(p => !p)}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button className="btn-primary w-full py-4" onClick={handleLogin}>Entrar no Admin</button>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'new') return <NewExperienceForm onBack={() => setView('list')} onSaved={() => { setView('list'); toast.success('Experiência cadastrada! ✅') }} />

  if (view === 'list') {
    return (
      <div className="app-shell min-h-dvh flex flex-col">
        <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <button onClick={() => setView('dashboard')} className="p-2 rounded-full hover:bg-surface"><ArrowLeft size={20} /></button>
            <h1 className="text-xl font-bold">Experiências ({experiences.length})</h1>
          </div>
          <button onClick={() => setView('new')} className="text-xs bg-green-DEFAULT text-black font-bold rounded-xl px-3 py-2">+ Nova</button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {experiences.map(exp => (
            <div key={exp.id} className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{exp.name}</p>
                  <p className="text-xs text-gray-500">{exp.category}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${exp.b2b_plan === 'top' ? 'bg-yellow-500/20 text-yellow-400' : exp.b2b_plan === 'destaque' ? 'bg-purple-DEFAULT/20 text-purple-light' : 'bg-border text-gray-400'}`}>
                      {exp.b2b_plan.toUpperCase()}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${exp.is_active ? 'bg-green-DEFAULT/20 text-green-DEFAULT' : 'bg-red-500/20 text-red-400'}`}>
                      {exp.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(exp)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex-shrink-0 ${exp.is_active ? 'border-red-500/30 text-red-400 bg-red-500/10' : 'border-green-DEFAULT/30 text-green-DEFAULT bg-green-DEFAULT/10'}`}
                >
                  {exp.is_active ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </div>
          ))}
          {experiences.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhuma experiência cadastrada</p>
              <button onClick={() => setView('new')} className="btn-primary mt-4 px-6">Cadastrar primeira</button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Dashboard
  return (
    <div className="app-shell min-h-dvh flex flex-col">
      <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-black">Admin 🛡️</h1>
          <p className="text-xs text-gray-500">Painel Capideia</p>
        </div>
        <button onClick={() => setView('login')} className="flex items-center gap-1.5 text-gray-500 text-sm">
          <LogOut size={14} /> Sair
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Users, label: 'Planos pagos', value: stats.paid, color: 'text-green-DEFAULT', sub: 'Curitibano + Capivara' },
            { icon: BarChart3, label: 'Receita estimada', value: `R$ ${stats.revenue.toFixed(2)}`, color: 'text-purple-light', sub: 'Mensal' },
            { icon: Star, label: 'Experiências ativas', value: stats.active, color: 'text-amber-400', sub: 'No feed' },
            { icon: Gift, label: 'Resgates totais', value: stats.redeems, color: 'text-blue-400', sub: 'Desde o início' },
          ].map(s => (
            <div key={s.label} className="bg-surface border border-border rounded-2xl p-4">
              <s.icon size={18} className={`${s.color} mb-2`} />
              <p className={`text-2xl font-black ${s.color}`}>{loadingStats ? '...' : s.value}</p>
              <p className="text-xs font-semibold text-white mt-0.5">{s.label}</p>
              <p className="text-[10px] text-gray-600">{s.sub}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setView('new')} className="flex flex-col items-center gap-2 p-4 bg-green-DEFAULT/10 border border-green-DEFAULT/30 rounded-2xl">
            <PlusCircle size={24} className="text-green-DEFAULT" />
            <span className="text-sm font-semibold text-green-DEFAULT">Nova Experiência</span>
          </button>
          <button onClick={() => setView('list')} className="flex flex-col items-center gap-2 p-4 bg-purple-DEFAULT/10 border border-purple-DEFAULT/30 rounded-2xl">
            <List size={24} className="text-purple-light" />
            <span className="text-sm font-semibold text-purple-light">Ver Cadastradas</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function NewExperienceForm({ onBack, onSaved }: { onBack: () => void; onSaved: () => void }) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [uploadingVideos, setUploadingVideos] = useState(false)
  const videoRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    name: '', category: CATEGORIES[0], location: '', address: '', phone: '',
    responsible_name: '', responsible_phone: '', description: '',
    price_min: 0, price_max: 200, discount_percent: 20,
    coupon_code: '', coupon_description: '', instagram_url: '', whatsapp_number: '',
    opening_hours_raw: '{"seg-sex": "08:00-18:00"}',
    video_urls: [] as string[], thumbnail_url: '',
    b2b_plan: 'vitrine' as const,
    estimated_duration: '',
    is_active: true,
  })

  function set(field: string, value: any) { setForm(prev => ({ ...prev, [field]: value })) }

  async function uploadVideos(files: FileList) {
    setUploadingVideos(true)
    const urls: string[] = []
    for (let i = 0; i < Math.min(files.length, 3); i++) {
      const file = files[i]
      const path = `videos/${Date.now()}_${i}.${file.name.split('.').pop()}`
      const { error } = await supabase.storage.from('capideia').upload(path, file)
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('capideia').getPublicUrl(path)
        urls.push(publicUrl)
      }
    }
    setForm(prev => ({ ...prev, video_urls: urls, thumbnail_url: urls[0] || '' }))
    setUploadingVideos(false)
    toast.success(`${urls.length} vídeo(s) enviado(s)!`)
  }

  async function handleSubmit() {
    if (!form.name || !form.location || !form.address) { toast.error('Preencha campos obrigatórios'); return }
    setSaving(true)
    let oh: any = {}
    try { oh = JSON.parse(form.opening_hours_raw) } catch { oh = { info: form.opening_hours_raw } }
    const { opening_hours_raw, ...rest } = form
    const { error } = await supabase.from('experiences').insert({ ...rest, opening_hours: oh })
    setSaving(false)
    if (error) { toast.error('Erro ao salvar'); console.error(error); return }
    onSaved()
  }

  return (
    <div className="app-shell flex flex-col min-h-dvh">
      <div className="flex items-center gap-2 px-4 pt-12 pb-4 border-b border-border">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-surface"><ArrowLeft size={20} /></button>
        <h1 className="text-xl font-bold">Nova Experiência</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-10">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Vídeos (1-3)</label>
          <button onClick={() => videoRef.current?.click()}
            className="w-full border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-green-DEFAULT/50 transition-colors">
            {uploadingVideos ? (
              <span className="text-sm text-gray-400 flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-green-DEFAULT border-t-transparent rounded-full animate-spin" /> Enviando...
              </span>
            ) : form.video_urls.length > 0 ? (
              <p className="text-green-DEFAULT text-sm font-medium">✓ {form.video_urls.length} vídeo(s) enviado(s)</p>
            ) : (
              <p className="text-gray-500 text-sm">Clique para selecionar vídeos (1-3, serão hospedados no Supabase)</p>
            )}
          </button>
          <input ref={videoRef} type="file" accept="video/*" multiple className="hidden" onChange={e => e.target.files && uploadVideos(e.target.files)} />
        </div>

        {[
          { label: 'Nome da experiência *', field: 'name', placeholder: 'Ex: Jardim Botânico Tour' },
          { label: 'Localização', field: 'location', placeholder: 'Ex: Jardim Botânico, Curitiba' },
          { label: 'Endereço completo *', field: 'address', placeholder: 'Rua, número, bairro' },
          { label: 'Telefone do local', field: 'phone', placeholder: '(41) 99999-0000' },
          { label: 'Nome do responsável', field: 'responsible_name', placeholder: 'João Silva' },
          { label: 'Telefone do responsável', field: 'responsible_phone', placeholder: '(41) 99999-0000' },
          { label: 'Duração estimada', field: 'estimated_duration', placeholder: 'Ex: 2-3 horas' },
        ].map(f => (
          <div key={f.field}>
            <label className="block text-xs text-gray-400 mb-1.5">{f.label}</label>
            <input className="input-base" placeholder={f.placeholder} value={(form as any)[f.field]} onChange={e => set(f.field, e.target.value)} />
          </div>
        ))}

        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Categoria</label>
          <select className="input-base" value={form.category} onChange={e => set('category', e.target.value)} style={{ colorScheme: 'dark' }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Descrição (frase de impacto)</label>
          <textarea className="input-base resize-none h-20" placeholder="Uma frase que vende a experiência..."
            value={form.description} onChange={e => set('description', e.target.value)} />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-2">Faixa de preço: R${form.price_min} – R${form.price_max}</label>
          <div className="space-y-2">
            {(['price_min', 'price_max'] as const).map(f => (
              <div key={f} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-8">{f === 'price_min' ? 'Mín' : 'Máx'}</span>
                <input type="range" min={0} max={1000} step={5} value={form[f]} onChange={e => set(f, Number(e.target.value))} className="flex-1 accent-green-DEFAULT" />
                <span className="text-xs text-white w-14 text-right">R${form[f]}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-2">Desconto: {form.discount_percent}%</label>
          <input type="range" min={0} max={100} step={5} value={form.discount_percent} onChange={e => set('discount_percent', Number(e.target.value))} className="w-full accent-green-DEFAULT" />
        </div>

        {[
          { label: 'Código do cupom', field: 'coupon_code', placeholder: 'CAPIDEIA20' },
          { label: 'Descrição do cupom', field: 'coupon_description', placeholder: '20% OFF na conta' },
          { label: 'Instagram URL', field: 'instagram_url', placeholder: 'https://instagram.com/...' },
          { label: 'WhatsApp (só números)', field: 'whatsapp_number', placeholder: '41999999999' },
        ].map(f => (
          <div key={f.field}>
            <label className="block text-xs text-gray-400 mb-1.5">{f.label}</label>
            <input className="input-base" placeholder={f.placeholder} value={(form as any)[f.field]} onChange={e => set(f.field, e.target.value)} />
          </div>
        ))}

        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Horários de funcionamento (JSON)</label>
          <input className="input-base font-mono text-xs" value={form.opening_hours_raw} onChange={e => set('opening_hours_raw', e.target.value)} />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Plano B2B</label>
          <div className="grid grid-cols-3 gap-2">
            {(['vitrine', 'destaque', 'top'] as const).map(p => (
              <button key={p} onClick={() => set('b2b_plan', p)}
                className={`py-2.5 rounded-xl border text-sm font-bold transition-all ${form.b2b_plan === p ? 'border-green-DEFAULT bg-green-DEFAULT/10 text-green-DEFAULT' : 'border-border text-gray-400'}`}>
                {p === 'top' ? '⭐ Top' : p === 'destaque' ? '🔥 Destaque' : '📋 Vitrine'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between bg-surface border border-border rounded-xl p-4">
          <div>
            <p className="text-sm font-semibold">Status</p>
            <p className="text-xs text-gray-500">{form.is_active ? 'Ativo — aparece no feed' : 'Inativo — oculto'}</p>
          </div>
          <button onClick={() => set('is_active', !form.is_active)}
            className={`w-12 h-6 rounded-full transition-all relative ${form.is_active ? 'bg-green-DEFAULT' : 'bg-border'}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.is_active ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>

        <button onClick={handleSubmit} disabled={saving} className="btn-primary w-full py-4 text-base">
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Salvando...
            </span>
          ) : 'Cadastrar Experiência ✅'}
        </button>
      </div>
    </div>
  )
}
