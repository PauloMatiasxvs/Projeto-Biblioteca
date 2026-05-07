'use client';

import { cn } from '@/lib/utils';

type BookCoverProps = {
  title: string;
  author?: string | null;
  hue: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

export function BookCover({ title, author, hue, className, size = 'md' }: BookCoverProps) {
  // Paleta gerada — mantém saturação e luminosidade controladas para parecer uma editora
  const bg = `hsl(${hue}, 38%, 24%)`;
  const accent = `hsl(${(hue + 35) % 360}, 60%, 68%)`;
  const ink = `hsl(${hue}, 25%, 12%)`;

  const sizing = {
    sm: 'text-[10px] p-2.5',
    md: 'text-[11px] p-4',
    lg: 'text-[13px] p-5',
  }[size];

  const titleSize = {
    sm: 'text-[15px] leading-[1.05]',
    md: 'text-[22px] leading-[1.05]',
    lg: 'text-[28px] leading-[1.05]',
  }[size];

  return (
    <div
      className={cn(
        'relative aspect-[2/3] w-full overflow-hidden flex flex-col justify-between',
        'shadow-[inset_8px_0_14px_-8px_rgba(0,0,0,0.4),_0_16px_32px_-16px_rgba(28,22,17,0.45),_0_4px_8px_-4px_rgba(28,22,17,0.25)]',
        sizing,
        className
      )}
      style={{ backgroundColor: bg, color: '#faf6ec' }}
    >
      {/* Textura de papel */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30"
        style={{ backgroundImage: 'var(--paper-noise)' }}
      />

      {/* Borda decorativa interna */}
      <div
        aria-hidden
        className="absolute inset-2 border pointer-events-none"
        style={{ borderColor: `${accent}40` }}
      />

      {/* Top */}
      <div className="relative flex items-start justify-between">
        <span className="uppercase tracking-[0.3em] font-semibold" style={{ color: accent }}>
          Liber
        </span>
        <div className="w-5 h-px mt-2.5" style={{ backgroundColor: accent }} />
      </div>

      {/* Title - centro */}
      <div className="relative">
        <div
          className={cn('font-serif font-normal', titleSize)}
          style={{
            fontFamily: 'var(--font-fraunces), Georgia, serif',
            fontVariationSettings: '"opsz" 144, "SOFT" 30, "WONK" 1',
            letterSpacing: '-0.02em',
          }}
        >
          {title.length > 60 ? title.slice(0, 58).trim() + '…' : title}
        </div>
      </div>

      {/* Bottom */}
      <div className="relative flex items-end justify-between gap-2">
        {author ? (
          <span
            className="italic text-[10px] opacity-80 truncate max-w-[70%]"
            style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
          >
            {author}
          </span>
        ) : (
          <span />
        )}
        <span style={{ color: accent }} className="text-[10px] font-mono">
          № {String(Math.abs(hue)).padStart(3, '0')}
        </span>
      </div>

      {/* Lombada vertical à esquerda */}
      <div
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-[6px] pointer-events-none"
        style={{
          background: `linear-gradient(to right, ${ink}, transparent)`,
          opacity: 0.6,
        }}
      />
    </div>
  );
}
