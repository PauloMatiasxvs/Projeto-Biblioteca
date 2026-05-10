'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

export type Bookmark = {
  id: string;
  user_id: string;
  book_id: string;
  page: number;
  label: string | null;
  created_at: string;
};

export function useBookmarks(bookId: string | undefined) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['bookmarks', bookId],
    enabled: !!bookId,
    queryFn: async (): Promise<Bookmark[]> => {
      if (!bookId) return [];
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('book_id', bookId)
        .order('page', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Bookmark[];
    },
  });
}

export function useAddBookmark() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bm: { book_id: string; page: number; label?: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Sessão expirada');
      const { error } = await supabase.from('bookmarks').insert({
        user_id: user.id,
        book_id: bm.book_id,
        page: bm.page,
        label: bm.label ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['bookmarks', vars.book_id] });
      toast.success('Marcador salvo');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteBookmark() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bm: Bookmark) => {
      const { error } = await supabase.from('bookmarks').delete().eq('id', bm.id);
      if (error) throw error;
      return bm;
    },
    onSuccess: (bm) => {
      qc.invalidateQueries({ queryKey: ['bookmarks', bm.book_id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}