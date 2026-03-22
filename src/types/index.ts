export interface User {
  id: string
  name: string
  cpf: string
  email: string
  birth_date: string
  username: string
  avatar_url?: string
  friendship_code: string
  plan: 'casual' | 'curitibano' | 'capivara'
  plan_expires_at?: string
  monthly_redeems_used: number
  favorite_categories: string[]
  created_at: string
}

export interface Experience {
  id: string
  name: string
  category: string
  location: string
  address: string
  phone?: string
  responsible_name?: string
  responsible_phone?: string
  description?: string
  price_min: number
  price_max: number
  discount_percent: number
  coupon_code?: string
  coupon_description?: string
  instagram_url?: string
  whatsapp_number?: string
  opening_hours: Record<string, string>
  video_urls: string[]
  thumbnail_url?: string
  b2b_plan: 'vitrine' | 'destaque' | 'top'
  is_active: boolean
  estimated_duration?: string
  created_at: string
}

export interface Interest {
  id: string
  user_id: string
  experience_id: string
  status: 'interested' | 'redeemed'
  redeemed_at?: string
  expires_at?: string
  created_at: string
  experience?: Experience
}

export interface Friendship {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted'
  created_at: string
  friend?: User
}

export interface Chat {
  id: string
  type: 'direct' | 'group'
  members: string[]
  name?: string
  created_at: string
  last_message?: Message
  other_user?: User
}

export interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: User
}

export interface Review {
  id: string
  user_id: string
  experience_id: string
  rating: number
  comment?: string
  created_at: string
}
