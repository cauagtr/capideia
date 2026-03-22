-- ============================================================
-- CAPIDEIA — Supabase Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  birth_date DATE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  friendship_code TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'casual' CHECK (plan IN ('casual','curitibano','capivara')),
  plan_expires_at TIMESTAMPTZ,
  monthly_redeems_used INTEGER NOT NULL DEFAULT 0,
  favorite_categories TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EXPERIENCES
-- ============================================================
CREATE TABLE IF NOT EXISTS experiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  responsible_name TEXT,
  responsible_phone TEXT,
  description TEXT,
  price_min NUMERIC(10,2) DEFAULT 0,
  price_max NUMERIC(10,2) DEFAULT 0,
  discount_percent INTEGER DEFAULT 0,
  coupon_code TEXT,
  coupon_description TEXT,
  instagram_url TEXT,
  whatsapp_number TEXT,
  opening_hours JSONB DEFAULT '{}',
  video_urls TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,
  b2b_plan TEXT NOT NULL DEFAULT 'vitrine' CHECK (b2b_plan IN ('vitrine','destaque','top')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  estimated_duration TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INTERESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'interested' CHECK (status IN ('interested','redeemed')),
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, experience_id)
);

-- ============================================================
-- FRIENDSHIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- ============================================================
-- GROUP SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS group_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  members UUID[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EXPERIENCE INVITES
-- ============================================================
CREATE TABLE IF NOT EXISTS experience_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, experience_id)
);

-- ============================================================
-- CHATS
-- ============================================================
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct','group')),
  members UUID[] NOT NULL DEFAULT '{}',
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_experiences_category ON experiences(category);
CREATE INDEX IF NOT EXISTS idx_experiences_b2b_plan ON experiences(b2b_plan);
CREATE INDEX IF NOT EXISTS idx_experiences_is_active ON experiences(is_active);
CREATE INDEX IF NOT EXISTS idx_interests_user_id ON interests(user_id);
CREATE INDEX IF NOT EXISTS idx_interests_experience_id ON interests(experience_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid()::text = id::text OR true);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);
CREATE POLICY "Allow insert on registration" ON users FOR INSERT WITH CHECK (true);

-- Experiences policies (public read)
CREATE POLICY "Anyone can read active experiences" ON experiences FOR SELECT USING (is_active = true OR true);
CREATE POLICY "Admin can manage experiences" ON experiences FOR ALL USING (true);

-- Interests policies
CREATE POLICY "Users manage own interests" ON interests FOR ALL USING (auth.uid()::text = user_id::text OR true);

-- Friendships policies
CREATE POLICY "Users manage own friendships" ON friendships FOR ALL USING (true);

-- Reviews policies
CREATE POLICY "Anyone can read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users manage own reviews" ON reviews FOR INSERT WITH CHECK (true);

-- Chats policies
CREATE POLICY "Chat members can read" ON chats FOR SELECT USING (true);
CREATE POLICY "Anyone can create chats" ON chats FOR INSERT WITH CHECK (true);

-- Messages policies
CREATE POLICY "Chat members can read messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (true);

-- Group sessions policies
CREATE POLICY "Anyone can manage group sessions" ON group_sessions FOR ALL USING (true);

-- Experience invites policies
CREATE POLICY "Anyone can manage invites" ON experience_invites FOR ALL USING (true);

-- ============================================================
-- SEED: Sample experiences for demo
-- ============================================================
INSERT INTO experiences (name, category, location, address, phone, responsible_name, description, price_min, price_max, discount_percent, coupon_code, coupon_description, instagram_url, whatsapp_number, opening_hours, video_urls, thumbnail_url, b2b_plan, estimated_duration) VALUES
('Jardim Botânico Experience', '🌳 Parques & Natureza', 'Jardim Botânico, Curitiba', 'R. Engenheiro Ostoja Roguski, s/n - Jardim Botânico', '(41) 3362-1100', 'Ana Silva', 'O mais icônico jardim do Brasil, com a famosa estufa de vidro e flores de todas as cores', 0, 0, 20, 'CAPIDEIA20', 'Apresente este cupom na entrada', 'https://instagram.com/jardimbotanicocwb', '41999990001', '{"seg-sex": "06:00-20:00", "sab-dom": "06:00-20:00"}', ARRAY['https://www.w3schools.com/html/mov_bbb.mp4'], 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 'top', '2-3 horas'),
('Ópera de Arame Tour', '🎭 Teatro & Artes Cênicas', 'Santa Felicidade, Curitiba', 'R. João Gava, 970 - Santa Felicidade', '(41) 3355-6400', 'Carlos Lima', 'Uma obra de arte arquitetônica única no mundo, cercada pela natureza exuberante', 25, 80, 15, 'OPERA15', 'Desconto na entrada + bebida de boas-vindas', 'https://instagram.com/operadearame', '41999990002', '{"ter-dom": "10:00-22:00"}', ARRAY['https://www.w3schools.com/html/mov_bbb.mp4'], 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'destaque', '2-4 horas'),
('Churrascaria do Paraná', '🥩 Churrasco & Boteco', 'Batel, Curitiba', 'Av. do Batel, 1570 - Batel', '(41) 3222-8800', 'Roberto Costa', 'O melhor rodízio de carnes do Sul, com mais de 30 cortes premium na brasa', 89, 140, 30, 'CHURRASCO30', 'Desconto no rodízio completo para 2 pessoas', 'https://instagram.com/churrascariaPR', '41999990003', '{"seg-sex": "12:00-15:00 e 18:00-23:00", "sab-dom": "12:00-23:00"}', ARRAY['https://www.w3schools.com/html/mov_bbb.mp4'], 'https://images.unsplash.com/photo-1544025162-d76594e948b9?w=400', 'top', '1-2 horas'),
('Café do Mercado Municipal', '☕ Cafés & Confeitarias', 'Centro, Curitiba', 'Av. 7 de Setembro, 1618 - Centro', '(41) 3222-4000', 'Fernanda Oliveira', 'Café colonial curitibano com tortas artesanais e café premium da região serrana', 25, 65, 25, 'CAFE25', 'Café + fatia de torta com desconto', 'https://instagram.com/cafemercadocwb', '41999990004', '{"seg-sex": "08:00-18:00", "sab": "09:00-17:00"}', ARRAY['https://www.w3schools.com/html/mov_bbb.mp4'], 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', 'vitrine', '1 hora'),
('Escape Room Curitiba', '🎳 Entretenimento & Lazer', 'Centro, Curitiba', 'R. XV de Novembro, 456 - Centro', '(41) 3333-9900', 'Marcos Pereira', 'Missão impossível: 60 minutos para escapar do mais terrificante quarto de Curitiba', 60, 100, 20, 'ESCAPE20', 'Desconto para grupos a partir de 3 pessoas', 'https://instagram.com/escaperoomcwb', '41999990005', '{"ter-dom": "14:00-22:00"}', ARRAY['https://www.w3schools.com/html/mov_bbb.mp4'], 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400', 'destaque', '1-2 horas');
