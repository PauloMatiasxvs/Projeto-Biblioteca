'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import type { Book } from '@/lib/types';

const SIGNED_URL_TTL = 60 * 60;

export function useBooks() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['books'],
    queryFn: async (): Promise<Book[]> => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('added_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useBook(id: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['book', id],
    queryFn: async (): Promise<Book | null> => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSignedBookUrl(filePath: string | undefined) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['signed-url', filePath],
    enabled: Boolean(filePath),
    queryFn: async () => {
      if (!filePath) return null;
      const { data, error } = await supabase.storage
        .from('books')
        .createSignedUrl(filePath, SIGNED_URL_TTL);
      if (error) throw error;
      return data.signedUrl;
    },
    staleTime: SIGNED_URL_TTL * 1000 * 0.8,
  });
}

export function useDeleteBook() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (book: Book) => {
      const { error: storageError } = await supabase.storage
        .from('books')
        .remove([book.file_path]);
      if (storageError && !storageError.message.toLowerCase().includes('not found')) {
        throw storageError;
      }
      const { error: dbError } = await supabase
        .from('books')
        .delete()
        .eq('id', book.id);
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['books'] });
      toast.success('Livro removido');
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });
}

export function useUpdateProgress() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookId, page }: { bookId: string; page: number }) => {
      const { error } = await supabase
        .from('books')
        .update({ current_page: page, last_opened_at: new Date().toISOString() })
        .eq('id', bookId);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['book', vars.bookId] });
    },
  });
}

export function useUpdateBookMeta() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookId, page_count }: { bookId: string; page_count: number }) => {
      const { error } = await supabase
        .from('books')
        .update({ page_count })
        .eq('id', bookId);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['book', vars.bookId] });
      qc.invalidateQueries({ queryKey: ['books'] });
    },
  });
}
