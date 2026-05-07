# 📚 Biblioteca Pessoal (Liber)

Sua estante digital de PDFs, com login privado, leitor próprio e isolamento total entre usuários. Construída como um produto de verdade — Next.js 14 + TypeScript + Supabase + Postgres com Row Level Security.

---

## ✨ O que ela faz

- **Login e cadastro** próprios (email + senha) — cada usuário tem sua biblioteca, ninguém vê o que é dos outros.
- **Upload de PDFs** com drag-and-drop, validação de tipo/tamanho, contagem automática de páginas.
- **Leitor de PDF embutido** — paginação, zoom, ajuste à largura, atalhos de teclado, salvamento automático da página atual.
- **Capas geradas proceduralmente** baseadas no título do livro (cor única para cada).
- **Busca e ordenação** (título, mais recente, última leitura).
- **Progresso de leitura** salvo automaticamente — você volta exatamente onde parou.

---

## 🏗 Arquitetura

```
src/
├── app/
│   ├── (auth)/              ← grupo de rotas públicas (login/signup)
│   │   ├── layout.tsx       ← splitscreen editorial
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── actions.ts       ← server actions de auth
│   ├── (app)/               ← grupo de rotas protegidas
│   │   ├── layout.tsx       ← header + container
│   │   └── library/
│   │       ├── page.tsx
│   │       ├── library-client.tsx
│   │       └── [id]/        ← leitor por livro
│   │           ├── page.tsx
│   │           └── reader-client.tsx
│   ├── layout.tsx           ← root + fontes + toaster
│   ├── providers.tsx        ← TanStack Query
│   ├── globals.css
│   └── page.tsx             ← redirect via middleware
├── components/
│   ├── auth-form.tsx
│   ├── header.tsx
│   ├── book-cover.tsx       ← capa procedural (HSL + Fraunces)
│   ├── book-card.tsx
│   ├── empty-state.tsx
│   └── upload-dialog.tsx    ← dropzone + upload + insert
├── lib/
│   ├── supabase/
│   │   ├── client.ts        ← browser
│   │   ├── server.ts        ← server components / actions
│   │   └── middleware.ts    ← refresh de sessão
│   ├── stores/reader-store.ts  ← Zustand persistido
│   ├── hooks/use-books.ts      ← TanStack Query
│   ├── types.ts
│   └── utils.ts
├── middleware.ts            ← proteção de rotas
└── supabase/
    └── schema.sql           ← tabelas + RLS + bucket
```

**Como o isolamento funciona:** as políticas de Row Level Security (RLS) do Postgres garantem na camada do banco que `auth.uid() = user_id`. As políticas de Storage exigem que o caminho do arquivo comece com o `user_id` da sessão (`books/{user_id}/...`). É **impossível** um usuário acessar conteúdo do outro mesmo se modificar o frontend.

---

## 🚀 Como rodar (passo a passo)

### 1. Crie um projeto no Supabase (grátis)

1. Vá em [supabase.com](https://supabase.com) e crie uma conta.
2. Clique em **New project** — escolha um nome (ex.: `biblioteca`), uma senha forte (não vai precisar usar) e a região mais próxima (`South America`).
3. Espere ~2 minutos enquanto provisiona.

### 2. Rode o schema SQL

1. No painel, vá em **SQL Editor** → **New query**.
2. Abra o arquivo `supabase/schema.sql` deste projeto, copie tudo, cole no editor e clique em **Run**.
3. Isso cria: tabela `profiles`, tabela `books`, bucket de storage `books`, todas as políticas RLS e o trigger de criação de perfil.

### 3. Configure as variáveis de ambiente

1. No Supabase, vá em **Settings** → **API**.
2. Copie:
   - **Project URL** (algo como `https://abc.supabase.co`)
   - **anon / public** key (chave longa começando com `eyJ...`)
3. Na raiz do projeto, copie `.env.local.example` para `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
4. Cole as duas variáveis dentro do `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-aqui
   ```

### 4. (Importante) Desabilite a confirmação por email

Para login funcionar imediatamente sem precisar configurar SMTP:

1. **Authentication** → **Providers** → **Email**.
2. Desmarque **Confirm email** → **Save**.

> Se quiser confirmação por email depois, é só reativar e configurar o SMTP nas configurações.

### 5. Instale e rode

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Crie sua conta, suba um PDF, leia.

---

## 🌐 Deploy gratuito na Vercel

1. Suba o código para um repositório no GitHub.
2. Vá em [vercel.com/new](https://vercel.com/new), importe o repositório.
3. Em **Environment Variables**, adicione as duas variáveis do `.env.local` (`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Clique em **Deploy**. Em ~1 min está no ar com URL `seu-projeto.vercel.app`.

Pronto, é o link que você cola no LinkedIn. Qualquer pessoa que entrar pode criar uma conta — e cada uma terá sua própria estante isolada.

---

## 🧱 Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router, Server Components, Server Actions) |
| Linguagem | TypeScript (strict) |
| Auth + Banco + Storage | Supabase (Postgres + RLS + Storage privado) |
| Data fetching | TanStack Query v5 |
| State global | Zustand (com persist no leitor) |
| Estilo | Tailwind CSS (tema customizado, sem libs UI) |
| Animação | Framer Motion |
| Upload | react-dropzone |
| Leitor PDF | react-pdf (pdfjs-dist) |
| Feedback | react-hot-toast |
| Ícones | lucide-react |
| Tipografia | Fraunces (display variável) + Manrope (body), via `next/font` |

---

## ⌨️ Atalhos do leitor

| Tecla | Ação |
|---|---|
| `→` `Espaço` `PgDn` | Próxima página |
| `←` `PgUp` | Página anterior |
| `+` `=` | Mais zoom |
| `-` | Menos zoom |
| `0` | Reset zoom |

---

## 🔐 Notas de segurança

- O bucket de Storage é **privado**. PDFs são acessados via **signed URLs** com TTL de 1 hora.
- Toda query no Postgres é validada por RLS no banco — não há como burlar pelo frontend.
- Caminho dos arquivos: `books/{user_id}/{timestamp}_{nome.pdf}` — checado pelas policies de Storage.
- Cookies de sessão são `httpOnly` e gerenciados pelo `@supabase/ssr`.

---

## 💸 Limites do plano gratuito

| Recurso | Free Supabase | Free Vercel |
|---|---|---|
| Storage | 1 GB | — |
| Banco | 500 MB | — |
| Bandwidth | 5 GB/mês | 100 GB/mês |
| Usuários ativos | 50.000 / mês | — |

Mais que suficiente para um portfolio que vive no LinkedIn.
