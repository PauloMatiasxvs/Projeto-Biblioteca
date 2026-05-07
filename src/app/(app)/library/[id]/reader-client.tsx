'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { useReaderStore } from '@/lib/stores/reader-store';
import { useSignedBookUrl, useUpdateProgress, useUpdateBookMeta } from '@/lib/hooks/use-books';
import type { Book } from '@/lib/types';

import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Configura o worker DENTRO do dynamic import — garante a mesma instância do pdfjs
const Document = dynamic(
  () =>
    import('react-pdf').then((mod) => {
      mod.pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${mod.pdfjs.version}/pdf.worker.min.mjs`;
      return mod.Document;
    }),
  { ssr: false }
);
const Page = dynamic(() => import('react-pdf').then((m) => m.Page), { ssr: false });

const SAVE_DEBOUNCE = 1500;

export function ReaderClient({ initialBook }: { initialBook: Book }) {
  const [book, setBook] = useState(initialBook);
  const { data: signedUrl, isLoading: loadingUrl } = useSignedBookUrl(book.file_path);
  const { zoom, fitMode, setZoom, setFitMode, resetZoom } = useReaderStore();

  const [numPages, setNumPages] = useState<number | null>(book.page_count);
  const [page, setPage] = useState(book.current_page);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const updateProgress = useUpdateProgress();
  const updateMeta = useUpdateBookMeta();

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setContainerWidth(e.contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (page === book.current_page) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateProgress.mutate({ bookId: book.id, page });
      setBook((b) => ({ ...b, current_page: page }));
    }, SAVE_DEBOUNCE);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setPage((p) => Math.min(numPages ?? p, p + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setPage((p) => Math.max(1, p - 1));
      } else if (e.key === '+' || e.key === '=') {
        setZoom(zoom + 0.1);
      } else if (e.key === '-') {
        setZoom(zoom - 0.1);
      } else if (e.key === '0') {
        resetZoom();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [numPages, zoom, setZoom, resetZoom]);

  const onDocumentLoad = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      if (book.page_count !== numPages) {
        updateMeta.mutate({ bookId: book.id, page_count: numPages });
        setBook((b) => ({ ...b, page_count: numPages }));
      }
    },
    [book.id, book.page_count, updateMeta]
  );

  const pageWidth =
    fitMode === 'width' && containerWidth > 0
      ? Math.min(containerWidth - 80, 900) * zoom
      : undefined;

  const progressPercent =
    numPages && numPages > 0 ? Math.round((page / numPages) * 100) : 0;

  return (
    <div className="flex flex-col min-h-[calc(100vh-110px)] bg-cream">
      <div className="sticky top-0 z-30 bg-cream-light border-b border-ink/15 px-4 sm:px-8 py-3 flex items-center gap-3 sm:gap-5 flex-wrap">
        <Link
          href="/library"
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-ink-soft hover:text-bordeaux font-semibold transition-colors"
        >
          <ArrowLeft size={14} />
          Estante
        </Link>

        <div className="hidden sm:block w-px h-5 bg-ink/15" />

        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-[16px] sm:text-[18px] text-ink truncate font-medium">
            {book.title}
          </h1>
          {book.author && (
            <p className="text-[11px] text-ink-mute italic font-serif truncate">
              {book.author}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 border border-ink/20">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 hover:bg-ink hover:text-cream-light disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink transition-colors"
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="px-3 text-[12px] tabular-nums">
            <input
              type="number"
              min={1}
              max={numPages ?? undefined}
              value={page}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 1 && (!numPages || v <= numPages)) setPage(v);
              }}
              className="w-10 bg-transparent text-center outline-none border-b border-transparent focus:border-ink"
            />
            <span className="text-ink-mute"> / {numPages ?? '…'}</span>
          </div>
          <button
            onClick={() => setPage((p) => Math.min(numPages ?? p, p + 1))}
            disabled={!!numPages && page >= numPages}
            className="p-2 hover:bg-ink hover:text-cream-light disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink transition-colors"
            aria-label="Próxima página"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-1 border border-ink/20">
          <button
            onClick={() => setZoom(zoom - 0.1)}
            className="p-2 hover:bg-ink hover:text-cream-light transition-colors"
            aria-label="Diminuir zoom"
          >
            <ZoomOut size={15} />
          </button>
          <span className="text-[11px] tabular-nums w-10 text-center text-ink-soft">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(zoom + 0.1)}
            className="p-2 hover:bg-ink hover:text-cream-light transition-colors"
            aria-label="Aumentar zoom"
          >
            <ZoomIn size={15} />
          </button>
          <button
            onClick={() => setFitMode(fitMode === 'width' ? 'page' : 'width')}
            className={`p-2 transition-colors ${
              fitMode === 'page' ? 'bg-ink text-cream-light' : 'hover:bg-ink hover:text-cream-light'
            }`}
            aria-label="Alternar ajuste"
            title={fitMode === 'width' ? 'Ajustar à página' : 'Ajustar à largura'}
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      <div className="h-[2px] bg-cream-dark relative">
        <div
          className="absolute top-0 left-0 h-full bg-bordeaux transition-[width] duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto py-10 px-4 bg-cream">
        {loadingUrl || !signedUrl ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <div className="w-10 h-10 border border-ink/20 animate-pulse" />
            <p className="text-[11px] uppercase tracking-widest text-ink-mute">
              Abrindo o livro
            </p>
          </div>
        ) : (
          <div className="flex justify-center">
            <Document
              file={signedUrl}
              onLoadSuccess={onDocumentLoad}
              loading={
                <div className="py-32 text-center">
                  <p className="text-[11px] uppercase tracking-widest text-ink-mute">
                    Carregando…
                  </p>
                </div>
              }
              error={
                <div className="py-32 text-center">
                  <p className="text-bordeaux font-serif italic">
                    Não foi possível abrir este arquivo.
                  </p>
                </div>
              }
            >
              <Page
                pageNumber={page}
                width={pageWidth}
                renderAnnotationLayer={false}
                renderTextLayer={true}
              />
            </Document>
          </div>
        )}
      </div>

      <div className="hidden sm:flex border-t border-ink/15 px-8 py-3 items-center justify-between text-[10px] uppercase tracking-widest text-ink-mute">
        <span>
          ← → para navegar · + − para zoom · 0 para resetar · espaço avança
        </span>
        <span>{progressPercent}% lido</span>
      </div>
    </div>
  );
}