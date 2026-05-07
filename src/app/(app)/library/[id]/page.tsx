import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ReaderClient } from './reader-client';

export const dynamic = 'force-dynamic';

export default async function ReaderPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (!book) notFound();
  return <ReaderClient initialBook={book} />;
}
