'use client';

import { BookOpen } from 'lucide-react';

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="py-24 px-6 flex flex-col items-center text-center animate-fade-up">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gold/20 blur-2xl" />
        <div className="relative w-20 h-20 border border-ink/30 flex items-center justify-center bg-cream-light">
          <BookOpen size={28} className="text-ink-soft" strokeWidth={1.3} />
        </div>
      </div>
      <p className="eyebrow mb-3">Estante vazia</p>
      <h2 className="display text-[36px] sm:text-[44px] leading-[1.05] font-normal max-w-md">
        Nenhum livro <span className="display-italic text-bordeaux">ainda</span>.
      </h2>
      <p className="mt-3 text-ink-soft max-w-sm text-[15px]">
        Suba seu primeiro PDF para começar a montar sua biblioteca pessoal.
      </p>
      <button onClick={onAdd} className="btn-primary mt-8 inline-flex items-center gap-2.5">
        <span className="font-serif text-lg leading-none font-light">+</span>
        Adicionar primeiro livro
      </button>
    </div>
  );
}
