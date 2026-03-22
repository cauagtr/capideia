# 🦫 Capideia — Descubra o melhor de Curitiba

App mobile-first de descoberta de experiências em Curitiba, construído com **Next.js 14 (App Router)**, **Supabase** e **Tailwind CSS**.

---

## 🚀 Stack

| Tecnologia | Uso |
|---|---|
| Next.js 14 (App Router) | Frontend + API Routes |
| Supabase | Auth, Database (PostgreSQL), Realtime, Storage |
| Tailwind CSS | Estilização |
| TypeScript | Tipagem |
| Vercel | Deploy |

---

## 📦 Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🗄️ Configuração do Supabase

### 1. Criar projeto

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Anote a **URL** e a **anon key** (Settings → API)

### 2. Executar o schema

1. No Supabase, vá em **SQL Editor**
2. Clique em **New query**
3. Cole o conteúdo completo do arquivo `schema.sql`
4. Clique em **Run**

Isso vai criar todas as 9 tabelas, indexes, RLS policies e dados de exemplo.

### 3. Criar bucket de Storage

1. Vá em **Storage** no painel do Supabase
2. Clique em **Create a new bucket**
3. Nome: `capideia`
4. Marque como **Public bucket**
5. Clique em **Create bucket**

### 4. Policies de Storage

No SQL Editor, execute:

```sql
-- Permite upload autenticado
CREATE POLICY "Allow uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'capideia');

-- Permite leitura pública
CREATE POLICY "Allow public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'capideia');
```

### 5. Habilitar Realtime

1. Vá em **Database → Replication**
2. Habilite as tabelas: `messages`, `chats`

---

## 💻 Desenvolvimento Local

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/capideia.git
cd capideia

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais do Supabase

# Execute em desenvolvimento
npm run dev
```

Acesse: `http://localhost:3000`

---

## 🌐 Deploy no Vercel

### Via CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Via GitHub (recomendado)

1. Faça push do código para um repositório no GitHub
2. Acesse [vercel.com](https://vercel.com) e clique em **Import Project**
3. Selecione o repositório do GitHub
4. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Clique em **Deploy**

---

## 📱 Páginas do App

| Rota | Descrição |
|---|---|
| `/` | Landing page com arte CSS de Curitiba |
| `/cadastro` | Cadastro em 3 etapas (validação CPF real) |
| `/login` | Login com email ou username |
| `/app/inicio` | Feed reels-style de experiências |
| `/app/experiencias` | Interesses e resgates com timer 48h |
| `/app/planos` | Planos Casual, Curitibano Raiz, Capivara |
| `/app/chat` | Chat direto + grupos em tempo real |
| `/app/perfil` | Editar perfil, amigos, código de amizade |
| `/admin` | Painel admin (usuário: `cauagtr`, senha: `cauagtr1`) |

---

## 🔐 Acesso Admin

- **URL**: `/admin`
- **Usuário**: `cauagtr`
- **Senha**: `cauagtr1`

---

## 📊 Planos

| Plano | Preço | Resgates/mês |
|---|---|---|
| Casual | Grátis | 1 |
| Curitibano Raiz | R$ 19,90/mês | 5 |
| Capivara | R$ 29,90/mês | Ilimitado |

---

## 🏗️ Estrutura de Arquivos

```
capideia/
├── schema.sql                    # Schema completo do Supabase
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Design system CSS
│   │   ├── page.tsx              # Landing page
│   │   ├── cadastro/page.tsx     # Cadastro
│   │   ├── login/page.tsx        # Login
│   │   ├── admin/page.tsx        # Admin panel
│   │   └── app/
│   │       ├── layout.tsx        # App shell + bottom nav
│   │       ├── inicio/page.tsx   # Feed de experiências
│   │       ├── experiencias/     # Interesses + resgates
│   │       ├── planos/           # Planos
│   │       ├── chat/             # Chat realtime
│   │       └── perfil/           # Perfil do usuário
│   ├── lib/
│   │   ├── supabase.ts           # Client-side Supabase
│   │   ├── supabase-server.ts    # Server-side Supabase
│   │   └── utils.ts              # CPF validator, helpers, CATEGORIES
│   ├── hooks/
│   │   └── useAuth.tsx           # Auth context
│   └── types/
│       └── index.ts              # TypeScript interfaces
```

---

## ⚡ Capacidade

- Supabase free tier suporta **500MB de database**, **1GB de storage**, **2GB de bandwidth**
- Funciona para **50+ usuários simultâneos** sem custo
- Realtime via Supabase WebSockets (incluído no free tier)

---

## 🎨 Design System

- **Background**: `#0a0a0a`
- **Surface**: `#141414`
- **Card**: `#1a1a1a`
- **Verde**: `#00c853` (primary)
- **Roxo**: `#7c4dff` (secondary)
- **Font**: Inter
- **Max-width mobile**: 430px

---

## 📋 Categorias de Experiência

1. 🍽️ Gastronomia Clássica
2. 🥩 Churrasco & Boteco
3. ☕ Cafés & Confeitarias
4. 🍣 Culinária Internacional
5. 🌿 Comida Saudável & Vegana
6. 🎭 Teatro & Artes Cênicas
7. 🎵 Shows & Música ao Vivo
8. 🏛️ Cultura & Museus
9. 🌳 Parques & Natureza
10. 🧗 Aventura & Esportes
11. 💆 Bem-estar & Spa
12. 🎨 Arte & Experiências Criativas
13. 🌇 Pontos Turísticos
14. 🎳 Entretenimento & Lazer
15. 💃 Baladas & Vida Noturna
16. 💧 Parques Aquáticos & Piscinas
17. 🛍️ Compras & Feiras
18. 📸 Experiências Instagramáveis
19. 🎬 Cinema & Cultura Pop
20. 👨‍👩‍👧 Família & Crianças

---

## 🔒 Segurança

- Row Level Security (RLS) habilitado em todas as tabelas
- CPF validado com algoritmo de dígitos verificadores
- Senhas: mínimo 8 chars, 1 maiúscula, 1 minúscula, 1 especial
- Código de amizade: 6 caracteres alfanuméricos únicos
- Rotas `/app/*` protegidas por middleware de sessão

---

*Feito com 🦫 em Curitiba*
