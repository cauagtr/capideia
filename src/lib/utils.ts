import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// CPF Validator with digit verification algorithm
export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length !== 11) return false
  if (/^(\d)\1+$/.test(cleaned)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i)
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i)
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  return remainder === parseInt(cleaned[10])
}

export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '').slice(0, 11)
  return cleaned
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) return { valid: false, message: 'Mínimo 8 caracteres' }
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Precisa de uma letra maiúscula' }
  if (!/[a-z]/.test(password)) return { valid: false, message: 'Precisa de uma letra minúscula' }
  if (!/[^A-Za-z0-9]/.test(password)) return { valid: false, message: 'Precisa de um caractere especial' }
  return { valid: true, message: '' }
}

export function generateFriendshipCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export function formatCountdown(expiresAt: string): string {
  const now = new Date().getTime()
  const expiry = new Date(expiresAt).getTime()
  const diff = expiry - now
  if (diff <= 0) return 'Expirado'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${minutes}m restantes`
}

export function planLimits(plan: string): number {
  if (plan === 'capivara') return Infinity
  if (plan === 'curitibano') return 5
  return 1
}

export function planLabel(plan: string): string {
  if (plan === 'capivara') return 'Capivara 🦫'
  if (plan === 'curitibano') return 'Curitibano Raiz 🌲'
  return 'Casual 🆓'
}

export const CATEGORIES = [
  '🍽️ Gastronomia Clássica',
  '🥩 Churrasco & Boteco',
  '☕ Cafés & Confeitarias',
  '🍣 Culinária Internacional',
  '🌿 Comida Saudável & Vegana',
  '🎭 Teatro & Artes Cênicas',
  '🎵 Shows & Música ao Vivo',
  '🏛️ Cultura & Museus',
  '🌳 Parques & Natureza',
  '🧗 Aventura & Esportes',
  '💆 Bem-estar & Spa',
  '🎨 Arte & Experiências Criativas',
  '🌇 Pontos Turísticos',
  '🎳 Entretenimento & Lazer',
  '💃 Baladas & Vida Noturna',
  '💧 Parques Aquáticos & Piscinas',
  '🛍️ Compras & Feiras',
  '📸 Experiências Instagramáveis',
  '🎬 Cinema & Cultura Pop',
  '👨‍👩‍👧 Família & Crianças',
]
