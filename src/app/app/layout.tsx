'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { Home, Heart, Star, MessageCircle, User } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/app/inicio', icon: Home, label: 'Início' },
  { href: '/app/experiencias', icon: Heart, label: 'Minhas' },
  { href: '/app/planos', icon: Star, label: 'Planos', special: true },
  { href: '/app/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/app/perfil', icon: User, label: 'Perfil' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="app-shell min-h-dvh flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🦫</div>
          <div className="flex gap-1 justify-center">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-green-DEFAULT animate-bounce" style={{ animationDelay: i * 0.15 + 's' }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell flex flex-col min-h-dvh">
      <main className="flex-1 overflow-hidden pb-[calc(64px+env(safe-area-inset-bottom,0px))]">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile bg-surface/95 backdrop-blur-xl border-t border-border bottom-nav z-50">
        <div className="flex items-center justify-around px-2 pt-2 pb-1">
          {tabs.map(({ href, icon: Icon, label, special }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[56px]',
                  special
                    ? 'relative -top-3 bg-gradient-to-br from-green-DEFAULT to-purple-DEFAULT p-3 rounded-2xl shadow-lg'
                    : active ? 'text-green-DEFAULT' : 'text-gray-500'
                )}
              >
                <Icon size={special ? 22 : 20} className={special ? 'text-white' : ''} strokeWidth={active && !special ? 2.5 : 1.5} />
                <span className={cn('text-[10px] font-medium', special ? 'text-white text-[9px] mt-0.5' : '')}>{label}</span>
                {active && !special && (
                  <div className="w-1 h-1 rounded-full bg-green-DEFAULT" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
