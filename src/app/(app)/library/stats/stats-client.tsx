'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowLeft, BookOpen, Bookmark, FileText, TrendingUp, Calendar, Award } from 'lucide-react';
import { useBooks } from '@/lib/hooks/use-books';
import { relativeTime } from '@/lib/utils';

export function StatsClient() {
  const { data: books, isLoading } = useBooks();

  const stats = useMemo(() => {
    const list = books ?? [];
    const total = list.length;
    const completed = list.filter((b) => b.page_count && b.current_page >= b.page_count).length;
    const inProgress = list.filter((b) => b.current_page > 1 && (!b.page_count || b.current_page < b.page_count)).length;

    const totalPagesRead = list.reduce((acc, b) => acc + Math.max(0, b.current_page - 1), 0);
    const totalPagesAvailable = list.reduce((acc, b) => acc + (b.page_count ?? 0), 0);
    const overallProgress = totalPagesAvailable > 0 ? Math.round((totalPagesRead / totalPagesAvailable) * 100) : 0;

    const recentlyRead = [...list]
      .filter((b) => b.last_opened_at)
      .sort((a, b) => new Date(b.last_opened_at!).getTime() - new Date(a.last_opened_at!).getTime())
      .slice(0, 5);

    const topProgress = [...list]
      .map((b) => ({
        ...b,
        progress: b.page_count && b.page_count > 0 ? (b.current_page / b.page_count) * 100 : 0,
      }))
      .filter((b) => b.progress > 0)
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 5);

    return { total, completed, inProgress, totalPagesRead, totalPagesAvailable, overallProgress, recentlyRead, topProgress };
  }, [books]);

  if (isLoading) {
    return (
      <div className="px-6 sm:px-12 py-16 flex items-center gap-3 text-ink-mute">
        <div className="w-1 h-1 rounded-full bg-ink-mute animate-pulse" />
        <span className="text-[12px] uppercase tracking-widest">Carregando estatísticas</span>
      </div>
    );
  }

  return (
    <div className="px-6 sm:px-12 py-10 max-w-6xl">
      <Link href="/library" className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-ink-soft hover:text-bordeaux font-semibold transition-colors mb-6">
        <ArrowLeft size={14} />
        Estante
      </Link>

      <div className="mb-10">
        <p className="eyebrow mb-2">Visão geral</p>
        <h1 className="display text-[44px] sm:text-[56px] leading-[1.05] font-normal">
          Suas <span className="display-italic text-bordeaux">leituras</span>
        </h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-12">
        <StatCard icon={<BookOpen size={18} strokeWidth={1.5} />} label="Volumes na estante" value={stats.total} />
        <StatCard icon={<Award size={18} strokeWidth={1.5} />} label="Livros completados" value={stats.completed} />
        <StatCard icon={<TrendingUp size={18} strokeWidth={1.5} />} label="Em leitura" value={stats.inProgress} />
        <StatCard icon={<FileText size={18} strokeWidth={1.5} />} label="Páginas lidas" value={stats.totalPagesRead.toLocaleString('pt-BR')} />
      </div>

      {stats.totalPagesAvailable > 0 && (
        <div className="mb-12 border border-ink/15 p-6">
          <div className="flex items-baseline justify-between mb-3">
            <p className="eyebrow">Progresso geral da biblioteca</p>
            <span className="font-serif italic text-[24px] text-bordeaux">{stats.overallProgress}%</span>
          </div>
          <div className="h-[6px] bg-cream-dark overflow-hidden">
            <div className="h-full bg-bordeaux transition-[width] duration-500" style={{ width: `${stats.overallProgress}%` }} />
          </div>
          <p className="mt-3 text-[12px] text-ink-mute">
            {stats.totalPagesRead.toLocaleString('pt-BR')} de {stats.totalPagesAvailable.toLocaleString('pt-BR')} páginas
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-10">
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={14} className="text-ink-mute" />
            <p className="eyebrow">Lidos recentemente</p>
          </div>
          {stats.recentlyRead.length === 0 ? (
            <p className="text-ink-mute font-serif italic text-[15px]">Nada por aqui ainda.</p>
          ) : (
            <ul className="space-y-3">
              {stats.recentlyRead.map((b) => (
                <li key={b.id} className="flex items-center justify-between border-b border-ink/10 pb-2">
                  <Link href={`/library/${b.id}`} className="font-serif text-[15px] text-ink hover:text-bordeaux truncate flex-1">
                    {b.title}
                  </Link>
                  <span className="text-[11px] uppercase tracking-wider text-ink-mute ml-3 whitespace-nowrap">
                    {relativeTime(b.last_opened_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Bookmark size={14} className="text-ink-mute" />
            <p className="eyebrow">Mais avançados</p>
          </div>
          {stats.topProgress.length === 0 ? (
            <p className="text-ink-mute font-serif italic text-[15px]">Comece a ler para acompanhar o progresso.</p>
          ) : (
            <ul className="space-y-4">
              {stats.topProgress.map((b) => (
                <li key={b.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <Link href={`/library/${b.id}`} className="font-serif text-[14px] text-ink hover:text-bordeaux truncate">
                      {b.title}
                    </Link>
                    <span className="text-[11px] tabular-nums text-ink-mute ml-2">{Math.round(b.progress)}%</span>
                  </div>
                  <div className="h-[3px] bg-cream-dark overflow-hidden">
                    <div className="h-full bg-bordeaux" style={{ width: `${b.progress}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="border border-ink/15 p-5">
      <div className="text-ink-mute mb-3">{icon}</div>
      <p className="display text-[36px] leading-none mb-1">{value}</p>
      <p className="text-[11px] uppercase tracking-widest text-ink-mute mt-2">{label}</p>
    </div>
  );
}