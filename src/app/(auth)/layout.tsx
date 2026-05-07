import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-content min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      {/* Lado esquerdo — apresentação */}
      <aside className="hidden lg:flex relative bg-bordeaux-deep text-cream-light px-14 py-16 flex-col justify-between overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-1/4 -right-1/4 w-[80%] h-[140%] rounded-full opacity-30 pointer-events-none"
          style={{
            background:
              'radial-gradient(closest-side, rgba(201,169,97,0.45), transparent 70%)',
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-40"
          style={{ backgroundImage: 'var(--paper-noise)' }}
        />

        <div className="relative">
          <Link href="/login" className="flex items-baseline gap-3 group">
            <span className="text-gold tracking-[0.4em] text-[11px] uppercase font-medium">
              Liber
            </span>
            <span className="h-px w-8 bg-gold/60" />
          </Link>
        </div>

        <div className="relative">
          <h1 className="display text-[clamp(56px,7vw,104px)] leading-[0.92] font-normal">
            Sua estante,
            <br />
            <span className="display-italic text-gold">em qualquer</span>
            <br />
            lugar.
          </h1>
          <p className="mt-8 max-w-md text-cream-light/70 text-[15px] leading-relaxed">
            Suba seus PDFs, organize sua coleção e leia de onde estiver. Cada
            biblioteca é privada — só você acessa o que é seu.
          </p>
        </div>

        <div className="relative">
          <blockquote className="border-l-2 border-gold pl-5 max-w-md">
            <p className="font-serif italic text-[17px] text-cream-light/80 leading-relaxed">
              &ldquo;Uma sala sem livros é como um corpo sem alma.&rdquo;
            </p>
            <cite className="not-italic mt-3 block text-[11px] tracking-[0.3em] uppercase text-gold">
              — Cícero
            </cite>
          </blockquote>
        </div>
      </aside>

      {/* Lado direito — formulário */}
      <main className="flex items-center justify-center px-6 py-16 sm:px-14">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
