'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

export type Annotation = {
  id: string;
  user_id: string;
  book_id: string;
  page: number;
  content: string;
  color: string;
  created_at: string;
};

export function useAnnotations(bookId: string | undefined) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['annotations', bookId],
    enabled: !!bookId,
    queryFn: async (): Promise<Annotation[]> => {
      if (!bookId) return [];
      const { data, error } = await supabase
        .from('annotations')
        .select('*')
        .eq('book_id', bookId)
        .order('page', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Annotation[];
    },
  });
}

export function useAddAnnotation() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: { book_id: string; page: number; content: string; color?: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Sessão expirada');
      const { error } = await supabase.from('annotations').insert({
        user_id: user.id,
        book_id: a.book_id,
        page: a.page,
        content: a.content,
        color: a.color ?? 'gold',
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['annotations', vars.book_id] });
      toast.success('Anotação salva');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteAnnotation() {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: Annotation) => {
      const { error } = await supabase.from('annotations').delete().eq('id', a.id);
      if (error) throw error;
      return a;
    },
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: ['annotations', a.book_id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}