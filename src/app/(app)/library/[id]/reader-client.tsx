'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Bookmark,
  PenLine,
  X,
  Trash2,
} from 'lucide-react';
import { useReaderStore } from '@/lib/stores/reader-store';
import { useSignedBookUrl, useUpdateProgress, useUpdateBookMeta } from '@/lib/hooks/use-books';
import {
  useBookmarks,
  useAddBookmark,
  useDeleteBookmark,
} from '@/lib/hooks/use-bookmarks';
import {
  useAnnotations,
  useAddAnnotation,
  useDeleteAnnotation,
} from '@/lib/hooks/use-annotations';
import type { Book } from '@/lib/types';

import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

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

type Side = 'bookmarks' | 'annotations' | null;

export function ReaderClient({ initialBook }: { initialBook: Book }) {
  const [book, setBook] = useState(initialBook);
  const { data: signedUrl, isLoading: loadingUrl } = useSignedBookUrl(book.file_path);
  const { zoom, fitMode, setZoom, setFitMode, resetZoom } = useReaderStore();

  const [numPages, setNumPages] = useState<number | null>(book.page_count);
  const [page, setPage] = useState(book.current_page);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [side, setSide] = useState<Side>(null);
  const [annotInput, setAnnotInput] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const updateProgress = useUpdateProgress();
  const updateMeta = useUpdateBookMeta();

  const { data: bookmarks } = useBookmarks(book.id);
  const addBookmark = useAddBookmark();
  const delBookmark = useDeleteBookmark();

  const { data: annotations } = useAnnotations(book.id);
  const addAnnot = useAddAnnotation();
  const delAnnot = useDeleteAnnotation();

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
      const tgt = e.target as HTMLElement;
      if (tgt?.tagName === 'INPUT' || tgt?.tagName === 'TEXTAREA') return;
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
      } else if (e.key === 'b' || e.key === 'B') {
        addBookmark.mutate({ book_id: book.id, page });
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [numPages, zoom, page, book.id, setZoom, resetZoom, addBookmark]);

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

  const annotationsHere = (annotations ?? []).filter((a) => a.page === page);

  const handleAddAnnotation = () => {
    const content = annotInput.trim();
    if (!content) return;
    addAnnot.mutate(
      { book_id: book.id, page, content },
      { onSuccess: () => setAnnotInput('') }
    );
  };

  const isBookmarked = (bookmarks ?? []).some((b) => b.page === page);

  return (
    <div className="flex flex-col min-h-[calc(100vh-110px)] bg-cream">
      <div className="sticky top-0 z-30 bg-cream-light border-b border-ink/15 px-4 sm:px-8 py-3 flex items-center gap-3 sm:gap-4 flex-wrap">
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

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              const existing = (bookmarks ?? []).find((b) => b.page === page);
              if (existing) {
                delBookmark.mutate(existing);
              } else {
                addBookmark.mutate({ book_id: book.id, page });
              }
            }}
            aria-label="Marcar página"
            title="Marcar (B)"
            className={`p-2 border transition-colors ${
              isBookmarked
                ? 'bg-bordeaux text-cream-light border-bordeaux'
                : 'border-ink/20 hover:bg-ink hover:text-cream-light'
            }`}
          >
            <Bookmark size={15} strokeWidth={1.5} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => setSide(side === 'bookmarks' ? null : 'bookmarks')}
            className="px-2 py-2 border border-ink/20 text-[11px] uppercase tracking-wider hover:bg-ink hover:text-cream-light transition-colors"
            title="Lista de marcadores"
          >
            {bookmarks?.length ?? 0}
          </button>

          <div className="w-px h-5 bg-ink/15 mx-1" />

          <button
            onClick={() => setSide(side === 'annotations' ? null : 'annotations')}
            className={`p-2 border transition-colors ${
              side === 'annotations'
                ? 'bg-ink text-cream-light border-ink'
                : 'border-ink/20 hover:bg-ink hover:text-cream-light'
            }`}
            aria-label="Anotações"
            title="Anotações"
          >
            <PenLine size={15} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex items-center gap-1 border border-ink/20">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 hover:bg-ink hover:text-cream-light disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink transition-colors"
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
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-1 border border-ink/20">
          <button onClick={() => setZoom(zoom - 0.1)} className="p-2 hover:bg-ink hover:text-cream-light transition-colors">
            <ZoomOut size={15} />
          </button>
          <span className="text-[11px] tabular-nums w-10 text-center text-ink-soft">
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => setZoom(zoom + 0.1)} className="p-2 hover:bg-ink hover:text-cream-light transition-colors">
            <ZoomIn size={15} />
          </button>
          <button
            onClick={() => setFitMode(fitMode === 'width' ? 'page' : 'width')}
            className={`p-2 transition-colors ${
              fitMode === 'page' ? 'bg-ink text-cream-light' : 'hover:bg-ink hover:text-cream-light'
            }`}
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

      <div className="flex flex-1 min-h-0">
        {side && (
          <aside className="w-[280px] flex-shrink-0 border-r border-ink/15 bg-cream-light overflow-auto">
            <div className="sticky top-0 bg-cream-light border-b border-ink/10 px-4 py-3 flex items-center justify-between">
              <p className="eyebrow">
                {side === 'bookmarks' ? 'Marcadores' : 'Anotações'}
              </p>
              <button
                onClick={() => setSide(null)}
                className="text-ink-mute hover:text-ink"
              >
                <X size={15} />
              </button>
            </div>

            {side === 'bookmarks' && (
              <div className="p-3">
                {(bookmarks ?? []).length === 0 ? (
                  <p className="text-[13px] italic font-serif text-ink-mute py-4 text-center">
                    Nenhum marcador. Aperte <kbd className="font-mono">B</kbd> em qualquer página.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {(bookmarks ?? []).map((bm) => (
                      <li key={bm.id} className="group flex items-center gap-2">
                        <button
                          onClick={() => setPage(bm.page)}
                          className="flex-1 text-left px-3 py-2 hover:bg-cream-dark/40 transition-colors flex items-center justify-between"
                        >
                          <span className="font-serif text-[14px]">
                            Página {bm.page}
                          </span>
                          <Bookmark size={11} className="text-bordeaux" fill="currentColor" />
                        </button>
                        <button
                          onClick={() => delBookmark.mutate(bm)}
                          className="opacity-0 group-hover:opacity-100 text-ink-mute hover:text-bordeaux p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {side === 'annotations' && (
              <div className="p-4 space-y-4">
                <div className="border border-ink/20 p-3">
                  <p className="eyebrow mb-2">
                    Anotar página {page}
                  </p>
                  <textarea
                    value={annotInput}
                    onChange={(e) => setAnnotInput(e.target.value)}
                    rows={3}
                    placeholder="O que esta página te disse?"
                    className="w-full bg-transparent text-[14px] outline-none resize-none placeholder:italic placeholder:text-ink-mute"
                  />
                  <button
                    onClick={handleAddAnnotation}
                    disabled={!annotInput.trim() || addAnnot.isPending}
                    className="text-[11px] uppercase tracking-widest font-semibold text-bordeaux hover:text-bordeaux-deep disabled:opacity-30"
                  >
                    {addAnnot.isPending ? 'Salvando…' : 'Salvar'}
                  </button>
                </div>

                {annotationsHere.length > 0 && (
                  <div>
                    <p className="eyebrow mb-2">Nesta página</p>
                    <ul className="space-y-2">
                      {annotationsHere.map((a) => (
                        <li
                          key={a.id}
                          className="group bg-gold/10 border-l-[3px] border-gold p-3"
                        >
                          <p className="font-serif text-[14px] leading-snug">
                            {a.content}
                          </p>
                          <button
                            onClick={() => delAnnot.mutate(a)}
                            className="opacity-0 group-hover:opacity-100 mt-2 text-[10px] uppercase tracking-wider text-bordeaux hover:underline"
                          >
                            Excluir
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(annotations ?? []).length > 0 && (
                  <div>
                    <p className="eyebrow mb-2">Todas ({annotations?.length})</p>
                    <ul className="space-y-2">
                      {(annotations ?? []).map((a) => (
                        <li
                          key={a.id}
                          className="border border-ink/15 p-3 group"
                        >
                          <button
                            onClick={() => setPage(a.page)}
                            className="text-[10px] uppercase tracking-widest text-bordeaux mb-1 font-semibold hover:underline"
                          >
                            Página {a.page}
                          </button>
                          <p className="font-serif text-[13px] leading-snug">
                            {a.content}
                          </p>
                          <button
                            onClick={() => delAnnot.mutate(a)}
                            className="opacity-0 group-hover:opacity-100 mt-2 text-[10px] uppercase tracking-wider text-ink-mute hover:text-bordeaux"
                          >
                            Excluir
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </aside>
        )}

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
      </div>

      <div className="hidden sm:flex border-t border-ink/15 px-8 py-3 items-center justify-between text-[10px] uppercase tracking-widest text-ink-mute">
        <span>
          ← → navegar · + − zoom · 0 reset · espaço avança · B marcar
        </span>
        <span>{progressPercent}% lido</span>
      </div>
    </div>
  );
}