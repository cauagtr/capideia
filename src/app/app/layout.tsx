'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Home, Heart, Star, MessageCircle, User } from 'lucide-react'
import Link from 'next/link'

const tabs = [
  { href: '/app/inicio', icon: Home, label: 'Início' },
  { href: '/app/experiencias', icon: Heart, label: 'Minhas' },
  { href: '/app/planos', icon: Star, label: 'Planos', special: true },
  { href: '/app/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/app/perfil', icon: User, label: 'Perfil' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem('capideia_user')
    if (!user) {
      window.location.href = '/login'
    } else {
      setChecked(true)
    }
  }, [])

  if (!checked) {
    return (
      <div className="app-shell min-h-dvh flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4" style={{ animation: 'bounce 1s infinite' }}>🦫</div>
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00c853', animation: `bounce 1s infinite`, animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell flex flex-col min-h-dvh">
      <main style={{ flex: 1, overflow: 'hidden', paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}>
        {children}
      </main>

      <nav style={{
        position: 'fixed', bottom: 0,
        left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '430px',
        background: 'rgba(20,20,20,0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid #2a2a2a',
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '8px 8px 4px' }}>
          {tabs.map(({ href, icon: Icon, label, special }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                  padding: special ? '10px 12px' : '6px 12px',
                  borderRadius: special ? '16px' : '12px',
                  background: special ? 'linear-gradient(135deg, #00c853, #7c4dff)' : 'transparent',
                  color: special ? 'white' : active ? '#00c853' : '#6b7280',
                  textDecoration: 'none',
                  position: special ? 'relative' : 'static',
                  top: special ? '-12px' : '0',
                  boxShadow: special ? '0 4px 15px rgba(0,200,83,0.3)' : 'none',
                  minWidth: '52px',
                }}
              >
                <Icon size={special ? 22 : 20} strokeWidth={active && !special ? 2.5 : 1.5} />
                <span style={{ fontSize: '10px', fontWeight: 500 }}>{label}</span>
                {active && !special && (
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#00c853' }} />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
