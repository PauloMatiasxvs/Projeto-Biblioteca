-- =====================================================================
-- BIBLIOTECA PESSOAL — Schema do Supabase
-- Execute este arquivo inteiro no SQL Editor do Supabase (ordem importa)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tabela de perfis (extende auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Trigger: ao criar usuário em auth.users, cria perfil correspondente
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. Tabela de livros
-- ---------------------------------------------------------------------
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  author text,
  description text,
  file_path text not null,        -- caminho dentro do bucket "books"
  file_size bigint not null default 0,
  page_count integer,
  cover_hue integer not null default 0, -- 0-360, para cor da capa procedural
  current_page integer not null default 1,
  added_at timestamptz not null default now(),
  last_opened_at timestamptz,
  constraint books_title_not_empty check (length(trim(title)) > 0)
);

create index if not exists books_user_id_idx on public.books(user_id);
create index if not exists books_added_at_idx on public.books(user_id, added_at desc);

alter table public.books enable row level security;

drop policy if exists "books_select_own" on public.books;
create policy "books_select_own" on public.books
  for select using (auth.uid() = user_id);

drop policy if exists "books_insert_own" on public.books;
create policy "books_insert_own" on public.books
  for insert with check (auth.uid() = user_id);

drop policy if exists "books_update_own" on public.books;
create policy "books_update_own" on public.books
  for update using (auth.uid() = user_id);

drop policy if exists "books_delete_own" on public.books;
create policy "books_delete_own" on public.books
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 3. Bucket de Storage para os PDFs
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('books', 'books', false, 52428800, array['application/pdf'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Políticas: cada usuário só enxerga arquivos dentro de uma pasta
-- com o nome do próprio user_id. Estrutura: books/{user_id}/{filename}.pdf
drop policy if exists "books_storage_select_own" on storage.objects;
create policy "books_storage_select_own" on storage.objects
  for select using (
    bucket_id = 'books' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "books_storage_insert_own" on storage.objects;
create policy "books_storage_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'books' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "books_storage_delete_own" on storage.objects;
create policy "books_storage_delete_own" on storage.objects
  for delete using (
    bucket_id = 'books' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "books_storage_update_own" on storage.objects;
create policy "books_storage_update_own" on storage.objects
  for update using (
    bucket_id = 'books' and
    (storage.foldername(name))[1] = auth.uid()::text
  );
