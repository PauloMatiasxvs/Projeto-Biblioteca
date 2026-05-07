'use client';

import { useMemo, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { useBooks } from '@/lib/hooks/use-books';
import { BookCard } from '@/components/book-card';
import { EmptyState } from '@/components/empty-state';
import { UploadDialog } from '@/components/upload-dialog';

type SortMode = 'recent' | 'title' | 'last-read';

export function LibraryClient() {
  const { data: books, isLoading, error } = useBooks();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('recent');

  const filtered = useMemo(() => {
    if (!books) return [];
    const q = search.trim().toLowerCase();
    let list = q
      ? books.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            (b.author?.toLowerCase().includes(q) ?? false)
        )
      : books;

    list = [...list].sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title, 'pt-BR');
      if (sort === 'last-read') {
        const av = a.last_opened_at ? new Date(a.last_opened_at).getTime() : 0;
        const bv = b.last_opened_at ? new Date(b.last_opened_at).getTime() : 0;
        return bv - av;
      }
      return new Date(b.added_at).getTime() - new Date(a.added_at).getTime();
    });
    return list;
  }, [books, search, sort]);

  if (isLoading) {
    return (
      <div className="px-6 sm:px-12 py-16 flex items-center gap-3 text-ink-mute">
        <div className="w-1 h-1 rounded-full bg-ink-mute animate-pulse" />
        <span className="text-[12px] uppercase tracking-widest">Abrindo a estante</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 sm:px-12 py-16">
        <p className="text-bordeaux">
          Erro ao carregar livros: {(error as Error).message}
        </p>
      </div>
    );
  }

  const isEmpty = filtered.length === 0 && !search;

  return (
    <>
      {!isEmpty && (
        <div className="border-b border-ink/15 px-6 sm:px-12 py-5 flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-[12px] uppercase tracking-widest text-ink-mute">
              <span className="font-serif italic text-[15px] tracking-normal text-ink mr-1.5">
                {books?.length ?? 0}
              </span>
              {books?.length === 1 ? 'volume' : 'volumes'}
            </div>

            <div className="hidden sm:block w-px h-4 bg-ink/20" />

            <div className="relative">
              <Search size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-ink-mute" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título ou autor"
                className="pl-6 pr-2 py-1.5 bg-transparent border-b border-ink/20 text-[14px] outline-none focus:border-ink min-w-[200px] placeholder:text-ink-mute placeholder:italic"
              />
            </div>

            <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest">
              {(['recent', 'title', 'last-read'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSort(mode)}
                  className={`px-2 py-1 transition-colors ${
                    sort === mode
                      ? 'text-ink border-b border-ink'
                      : 'text-ink-mute hover:text-ink'
                  }`}
                >
                  {mode === 'recent' ? 'Recente' : mode === 'title' ? 'Título' : 'Últ. leitura'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setUploadOpen(true)}
            className="bg-ink text-cream-light px-5 py-2.5 text-[11px] uppercase tracking-widest font-semibold hover:bg-bordeaux transition-colors inline-flex items-center gap-2"
          >
            <Plus size={14} strokeWidth={2.5} />
            Novo livro
          </button>
        </div>
      )}

      {isEmpty ? (
        <EmptyState onAdd={() => setUploadOpen(true)} />
      ) : filtered.length === 0 ? (
        <div className="px-6 sm:px-12 py-16 text-center">
          <p className="font-serif italic text-ink-soft text-[18px]">
            Nada encontrado para &ldquo;{search}&rdquo;.
          </p>
        </div>
      ) : (
        <div className="px-6 sm:px-12 py-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-7 gap-y-12">
          {filtered.map((book, i) => (
            <BookCard key={book.id} book={book} index={i} />
          ))}
        </div>
      )}

      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </>
  );
}
