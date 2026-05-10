'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function UrlImportDialog({ open, onClose }: Props) {
  const qc = useQueryClient();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setUrl('');
    setTitle('');
    setAuthor('');
    setLoading(false);
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || !title.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          title: title.trim(),
          author: author.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Falha ao importar');
      toast.success('Livro importado!');
      qc.invalidateQueries({ queryKey: ['books'] });
      reset();
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao importar');
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-cream-light w-full max-w-lg pointer-events-auto border border-ink/15 shadow-[0_30px_60px_-20px_rgba(28,22,17,0.4)]">
              <div className="flex items-start justify-between px-7 pt-7 pb-3 border-b border-ink/10">
                <div>
                  <p className="eyebrow mb-1.5">Importar de URL</p>
                  <h2 className="display text-[28px] leading-tight font-normal">
                    Adicionar via <span className="display-italic text-bordeaux">link</span>
                  </h2>
                </div>
                <button onClick={handleClose} disabled={loading} className="text-ink-mute hover:text-ink disabled:opacity-30">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-7 space-y-5">
                <div>
                  <label htmlFor="import-url" className="eyebrow block mb-2">URL do PDF</label>
                  <div className="flex items-center gap-2 border-b border-ink">
                    <LinkIcon size={14} className="text-ink-mute" />
                    <input
                      id="import-url"
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="https://exemplo.com/livro.pdf"
                      className="flex-1 bg-transparent border-0 py-2.5 text-base outline-none placeholder:text-ink-mute placeholder:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="import-title" className="eyebrow block mb-2">Título</label>
                  <input
                    id="import-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    disabled={loading}
                    className="field-input"
                  />
                </div>

                <div>
                  <label htmlFor="import-author" className="eyebrow block mb-2">Autor (opcional)</label>
                  <input
                    id="import-author"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    disabled={loading}
                    className="field-input"
                  />
                </div>

                <p className="text-[12px] text-ink-mute">
                  O arquivo precisa ser público e não pode passar de 50MB.
                </p>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-ink/10">
                  <button type="button" onClick={handleClose} disabled={loading} className="text-[12px] uppercase tracking-wider text-ink-mute hover:text-ink font-semibold">
                    Cancelar
                  </button>
                  <button type="submit" disabled={!url.trim() || !title.trim() || loading} className="btn-primary">
                    {loading ? 'Importando…' : 'Importar'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}