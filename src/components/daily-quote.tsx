'use client';

import { useEffect, useState } from 'react';
import { getQuoteOfTheDay, type Quote } from '@/lib/quotes';

export function DailyQuote() {
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    setQuote(getQuoteOfTheDay());
  }, []);

  if (!quote) return null;

  return (
    <div className="px-6 sm:px-12 py-6 border-b border-ink/10">
      <div className="flex items-start gap-5 max-w-3xl">
        <div className="flex-shrink-0 mt-2">
          <span className="block w-8 h-px bg-bordeaux" />
        </div>
        <div>
          <p className="eyebrow mb-2">Frase do dia</p>
          <p className="font-serif italic text-[18px] sm:text-[20px] leading-snug text-ink-soft">
            &ldquo;{quote.text}&rdquo;
          </p>
          <p className="mt-2 text-[12px] uppercase tracking-widest text-ink-mute">
            — {quote.author}
          </p>
        </div>
      </div>
    </div>
  );
}