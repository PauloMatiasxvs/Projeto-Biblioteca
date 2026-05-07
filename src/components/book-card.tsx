'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { BookCover } from '@/components/book-cover';
import { useDeleteBook } from '@/lib/hooks/use-books';
import { relativeTime } from '@/lib/utils';
import type { Book } from '@/lib/types';

export function BookCard({ book, index }: { book: Book; index: number }) {
  const [confirming, setConfirming] = useState(false);
  const deleteBook = useDeleteBook();

  const progress =
    book.page_count && book.page_count > 0
      ? Math.round((book.current_page / book.page_count) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.2, 0.8, 0.3, 1] }}
      className="group flex flex-col"
    >
      <Link href={`/library/${book.id}`} className="relative">
        <div className="transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:rotate-[-0.6deg]">
          <BookCover title={book.title} author={book.author} hue={book.cover_hue} />
        </div>

        {progress > 0 && progress < 100 && (
          <div className="absolute -bottom-1 left-2 right-2 h-[3px] bg-cream-dark overflow-hidden">
            <div className="h-full bg-bordeaux" style={{ width: `${progress}%` }} />
          </div>
        )}
      </Link>

      <div className="mt-4 px-1">
        <Link href={`/library/${book.id}`}>
          <h3 className="font-serif text-[16px] leading-tight font-medium text-ink line-clamp-2 hover:text-bordeaux transition-colors">
            {book.title}
          </h3>
        </Link>
        {book.author && (
          <p className="mt-1 text-[12px] text-ink-mute italic font-serif truncate">
            {book.author}
          </p>
        )}

        <div className="mt-2.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-ink-mute">
          <span>
            {book.page_count
              ? `${book.current_page}/${book.page_count}`
              : `pág. ${book.current_page}`}
          </span>
          <span>{relativeTime(book.last_opened_at ?? book.added_at)}</span>
        </div>

        <div className="mt-3">
          {confirming ? (
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-ink-soft">Excluir?</span>
              <button
                onClick={() => deleteBook.mutate(book)}
                disabled={deleteBook.isPending}
                className="text-bordeaux font-semibold uppercase tracking-wider hover:underline disabled:opacity-50"
              >
                {deleteBook.isPending ? '...' : 'Sim'}
              </button>
              <span className="text-ink-mute">·</span>
              <button
                onClick={() => setConfirming(false)}
                className="text-ink-mute uppercase tracking-wider hover:text-ink"
              >
                Não
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-mute hover:text-bordeaux"
            >
              <Trash2 size={11} />
              Excluir
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
