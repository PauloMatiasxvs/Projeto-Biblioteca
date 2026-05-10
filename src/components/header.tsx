import Link from 'next/link';
import { BarChart3 } from 'lucide-react';
import { logout } from '@/app/(auth)/actions';
import { createClient } from '@/lib/supabase/server';
import { ThemeToggle } from '@/components/theme-toggle';

export async function Header() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle();
    const profileData = profile as { display_name: string | null } | null;
    displayName =
      profileData?.display_name ?? user.email?.split('@')[0] ?? null;
  }

  return (
    <header className="border-b border-ink/15 px-6 sm:px-12 pt-8 pb-6">
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <Link href="/library" className="block group">
          <span className="eyebrow block mb-1.5">Biblioteca pessoal</span>
          <h1 className="display text-[38px] leading-none font-normal">
            Liber<span className="display-italic text-bordeaux">.</span>
          </h1>
        </Link>

        <div className="flex items-center gap-3">
          {displayName && (
            <span className="hidden sm:inline-block font-serif italic text-[15px] text-ink-soft mr-1">
              {displayName}
            </span>
          )}
          <Link
            href="/library/stats"
            aria-label="Estatísticas"
            className="w-9 h-9 flex items-center justify-center border border-ink/30 hover:bg-ink hover:text-cream-light transition-colors"
          >
            <BarChart3 size={15} strokeWidth={1.5} />
          </Link>
          <ThemeToggle />
          <form action={logout}>
            <button type="submit" className="btn-ghost">
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}