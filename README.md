# 🎧 Sonely

Descubra músicas pelo que você está sentindo. Você escreve como está se sentindo, uma IA interpreta a emoção por trás do texto, e o app busca e ranqueia músicas do Spotify que combinam com esse momento, cruzando isso com o seu histórico de escuta real.

Além da recomendação, o app funciona como um painel pessoal sobre a sua relação com música: estatísticas do seu perfil, diário de humor, biblioteca do Spotify e histórico de escuta, tudo num só lugar.

## Índice

- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Como rodar localmente](#como-rodar-localmente)
- [Testes](#testes)
- [Limitações conhecidas da API do Spotify](#limitações-conhecidas-da-api-do-spotify)
- [Deploy](#deploy)

## Funcionalidades

O app é dividido em abas, acessadas por uma barra de navegação fixa na base da tela:

### ✨ Recomendar

Você escreve uma mensagem livre (ex: "hoje eu tô cansado, meio ansioso e queria ouvir algo mais leve pra relaxar"). O backend manda esse texto pra OpenAI, que extrai:

- sentimento atual e nível de energia (baixa/média/alta)
- objetivo (o que você quer sentir/fazer)
- vibes e gêneros sugeridos
- o que evitar

Com isso, o app monta uma busca no Spotify e ranqueia os resultados com uma pontuação que leva em conta: match de gênero/vibe com a emoção detectada, histórico de mensagens anteriores, se o artista/faixa já está no seu top pessoal do Spotify, e o feedback (👍/👎) que você já deu em recomendações passadas. Cada recomendação vira uma entrada no seu diário de humor.

### 🎶 Gerar

Um segundo modo na mesma tela (alternado por um toggle no topo): em vez de receber algumas sugestões, você descreve a playlist que quer criar — gosto musical, clima, atividade, sentimento, o que for — e a IA monta uma seleção de 20 músicas reais, resolvidas contra a busca do Spotify.

Você pode marcar ⭐ as faixas que mais gostou e pedir pra gerar de novo: as marcadas ficam, as outras são substituídas por novas sugestões, refinando a playlist aos poucos. Quando estiver satisfeito, um passo de revisão mostra o nome (padrão "SONELY PLAYLIST") e uma descrição gerada pela IA, ambos editáveis, antes de criar a playlist de verdade na sua conta do Spotify.

### 🔥 Mais ouvidas

Seu top faixas no Spotify, filtrando por período (recente / últimos 6 meses / sempre).

### 🕒 Recente

As últimas faixas que você ouviu no Spotify, com o horário do dia em que você mais costuma ouvir música. Toques repetidos da mesma faixa em sequência são agrupados (mas ela volta a aparecer se tocar de novo depois de outra faixa).

### 📚 Biblioteca

- Músicas curtidas e artistas seguidos, cada um abrindo um modal com a lista completa (busca por texto + infinite scroll, carregando 50 por vez conforme você rola)
- Suas playlists
- Curiosidades: dia da semana em que você mais curte músicas, sua maior playlist

### 📓 Diário

Histórico de todas as mensagens que você já mandou e a emoção que a IA detectou em cada uma, junto com:

- distribuição de energia (baixa/média/alta) das suas conversas
- gêneros mais pedidos
- quantas recomendações você já pediu e sua sequência de dias seguidos usando o app
- o objetivo mais comum nas suas mensagens

### Perfil

Estatísticas sobre o seu gosto musical, calculadas em cima do seu top 50 do Spotify: % de faixas explícitas, duração média, diversidade de artistas, tempo total pra ouvir o top 50, linha do tempo por década, artistas que aparecem no seu top em qualquer período (recente/6 meses/sempre — cada um linkado pro perfil dele no Spotify), taxa de acerto das recomendações (baseada no seu feedback), e curiosidades (palavra mais repetida nos títulos, álbum favorito, artista mais repetido, faixa/título mais longo e mais curto, faixa mais antiga e mais nova).

Dá pra gerar um **recap** — uma imagem (desenhada em canvas, sem depender de serviço externo) com o resumo desses dados, pra baixar ou compartilhar direto pelo celular.

É por essa aba também que você sai da conta.

## Stack

**Frontend** — React 19 + TypeScript + Vite. Sem biblioteca de UI: CSS puro com variáveis de tema. PWA instalável (manifest + service worker).

**Backend** — Express + TypeScript, Prisma com SQLite (via `better-sqlite3`), autenticação por JWT.

**Integrações externas**:
- **Spotify** — OAuth (login), busca de músicas/playlists, top tracks/artists, recently played, biblioteca (curtidas, seguidos, playlists), criação de playlists
- **OpenAI** — análise de emoção da mensagem do usuário, sugestão de faixas e descrição das playlists geradas

**Testes** — Vitest, cobrindo as funções puras do backend (ranqueamento, estatísticas).

## Estrutura do projeto

```
musicas/
├── backend/
│   ├── prisma/                  # schema + migrations (SQLite)
│   └── src/
│       ├── controllers/         # lógica de cada rota
│       ├── routes/               # definição das rotas Express
│       ├── services/             # chamadas à API do Spotify e da OpenAI
│       ├── middlewares/          # autenticação (JWT)
│       └── utils/                 # funções puras (ranking, insights, stats) + testes
└── frontend/
    ├── public/                   # manifest, service worker, ícones
    └── src/
        ├── pages/                 # Login e Home
        ├── components/            # uma seção por aba do app + Modal, ícones
        ├── services/               # cliente axios
        ├── types/                   # tipos compartilhados
        └── utils/                   # geração do recap, tempo relativo
```

## Como rodar localmente

Pré-requisitos: Node.js 20+, uma conta no [Spotify for Developers](https://developer.spotify.com/dashboard) (pra criar um app e pegar Client ID/Secret) e uma chave da [OpenAI](https://platform.openai.com/api-keys).

### 1. Configurar o app no Spotify

Crie um app no Spotify Dashboard e adicione `http://127.0.0.1:5173/` como Redirect URI.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # preencha com suas chaves
npx prisma migrate dev
npm run dev             # http://localhost:3000
```

Variáveis do `.env`:

| Variável | Descrição |
|---|---|
| `OPENAI_API_KEY` | chave da OpenAI |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | credenciais do app criado no Spotify |
| `SPOTIFY_REDIRECT_URI` | `http://127.0.0.1:5173/` em dev |
| `JWT_SECRET` | qualquer string aleatória longa (ex: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `DATABASE_URL` | string de conexão do Prisma (SQLite local por padrão) |

### 3. Frontend

```bash
cd frontend
npm install
npm run dev              # http://localhost:5173
```

Abra `http://localhost:5173` e entre com sua conta do Spotify.

### Escopos do Spotify usados

`user-read-email`, `user-read-private`, `user-top-read`, `user-read-recently-played`, `user-library-read`, `user-follow-read`, `playlist-read-private`, `playlist-modify-public`, `playlist-modify-private`.

Se você já tinha logado antes desses dois últimos escopos serem adicionados, é preciso sair e entrar de novo (ou usar o botão "reconectar com Spotify" que aparece se a criação de playlist falhar) pra autorizar a permissão nova.

## Testes

```bash
cd backend
npm test
```

## Limitações conhecidas da API do Spotify

Desde nov/2024 a Spotify restringiu vários dados e endpoints pra apps sem "Extended Quota Mode" (aprovação manual da Spotify). Isso afeta diretamente o que dá pra mostrar aqui:

- **Sem `genres`** no objeto de artista — por isso as recomendações usam o nome dos artistas mais ouvidos como sinal, em vez de gênero.
- **Sem `popularity`** nas faixas — não dá pra montar um indicador de "mainstream vs. indie".
- **Busca (`/search`) limitada a `limit ≤ 10`** quando combina `type=track,playlist`, e a **query tem limite de 250 caracteres** — o backend já trunca a query automaticamente por causa disso.
- Endpoints de `recommendations`, `audio-features` e `related-artists` estão bloqueados — não usados aqui.
- **Migração de fev/2026**: a Spotify removeu `POST /users/{user_id}/playlists` para apps em Development Mode. Criar playlist agora usa `POST /me/playlists`, e adicionar faixas usa `POST /playlists/{id}/items` (renomeado de `/tracks`). O código já está atualizado pros endpoints novos.

## Deploy

O backend usa SQLite em arquivo (via `better-sqlite3`), o que exige um host com **disco persistente** — não funciona em plataformas serverless (Vercel/Netlify Functions) sem antes migrar pra um banco externo (ex: Postgres no [Neon](https://neon.tech) ou [Supabase](https://supabase.com)).

- **Frontend** (build estático do Vite) → Vercel, Netlify ou GitHub Pages
- **Backend** → Railway ou Render (com volume persistente pro banco)

Lembre de atualizar o **Redirect URI** no Spotify Dashboard e o `baseURL` do axios no frontend (`frontend/src/services/api.ts`) pro domínio de produção.
