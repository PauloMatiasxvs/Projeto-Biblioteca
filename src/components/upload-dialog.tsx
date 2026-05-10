'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import {
  formatBytes,
  hueFromString,
  sanitizeFilename,
  titleFromFilename,
} from '@/lib/utils';

const MAX_SIZE = 50 * 1024 * 1024;

type Status = 'pending' | 'uploading' | 'done' | 'error';

type Item = {
  file: File;
  title: string;
  status: Status;
  progress: number;
  error?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

async function countPages(file: File): Promise<number | null> {
  try {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
    const buf = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    return doc.numPages;
  } catch {
    return null;
  }
}

export function UploadDialog({ open, onClose }: Props) {
  const supabase = createClient();
  const qc = useQueryClient();
  const [items, setItems] = useState<Item[]>([]);
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setItems([]);
    setUploading(false);
  };

  const handleClose = () => {
    if (uploading) return;
    reset();
    onClose();
  };

  const onDrop = useCallback((accepted: File[], rejected: any[]) => {
    if (rejected.length > 0) {
      const rej = rejected[0];
      if (rej.errors[0]?.code === 'file-too-large') {
        toast.error('Algum arquivo passa de 50MB');
      } else if (rej.errors[0]?.code === 'file-invalid-type') {
        toast.error('Apenas PDFs são aceitos');
      } else {
        toast.error('Arquivos inválidos');
      }
    }
    const newItems: Item[] = accepted.map((f) => ({
      file: f,
      title: titleFromFilename(f.name),
      status: 'pending',
      progress: 0,
    }));
    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: MAX_SIZE,
    multiple: true,
    disabled: uploading,
  });

  const updateItem = (idx: number, patch: Partial<Item>) =>
    setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const removeItem = (idx: number) => {
    if (uploading) return;
    setItems((arr) => arr.filter((_, i) => i !== idx));
  };

  async function uploadOne(idx: number, item: Item) {
    updateItem(idx, { status: 'uploading', progress: 10 });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Sessão expirada');

      const safeName = sanitizeFilename(item.file.name);
      const filePath = `${user.id}/${Date.now()}_${safeName}`;

      updateItem(idx, { progress: 25 });
      const pageCount = await countPages(item.file);
      updateItem(idx, { progress: 50 });

      const { error: uploadError } = await supabase.storage
        .from('books')
        .upload(filePath, item.file, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false,
        });
      if (uploadError) throw uploadError;
      updateItem(idx, { progress: 85 });

      const { error: insertError } = await supabase.from('books').insert({
        user_id: user.id,
        title: item.title.trim(),
        author: null,
        description: null,
        file_path: filePath,
        file_size: item.file.size,
        page_count: pageCount,
        cover_hue: hueFromString(item.title.trim()),
      });
      if (insertError) {
        await supabase.storage.from('books').remove([filePath]);
        throw insertError;
      }

      updateItem(idx, { status: 'done', progress: 100 });
    } catch (err: any) {
      updateItem(idx, { status: 'error', error: err.message ?? 'Erro' });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;

    setUploading(true);
    for (let i = 0; i < items.length; i++) {
      const cur = items[i];
      if (cur.status === 'done') continue;
      await uploadOne(i, cur);
    }

    qc.invalidateQueries({ queryKey: ['books'] });
    const total = items.length;
    const sucesso = items.filter((i) => i.status === 'done').length;

    if (sucesso === total) {
      toast.success(
        total === 1 ? 'Livro adicionado' : `${total} livros adicionados`
      );
      setTimeout(() => {
        reset();
        onClose();
      }, 600);
    } else {
      toast(`${sucesso}/${total} concluídos`);
      setUploading(false);
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
            <div className="bg-cream-light w-full max-w-xl max-h-[90vh] overflow-auto pointer-events-auto border border-ink/15 shadow-[0_30px_60px_-20px_rgba(28,22,17,0.4)]">
              <div className="flex items-start justify-between px-7 pt-7 pb-3 border-b border-ink/10">
                <div>
                  <p className="eyebrow mb-1.5">Novos livros</p>
                  <h2 className="display text-[28px] leading-tight font-normal">
                    Adicionar <span className="display-italic text-bordeaux">livros</span>
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  disabled={uploading}
                  className="text-ink-mute hover:text-ink disabled:opacity-30"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-7 space-y-5">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed cursor-pointer transition-colors p-8 text-center ${
                    isDragActive
                      ? 'border-bordeaux bg-bordeaux/5'
                      : 'border-ink/30 hover:border-ink/50 hover:bg-cream'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload size={26} className="mx-auto text-ink-mute mb-3" strokeWidth={1.3} />
                  <p className="font-serif italic text-[16px] text-ink">
                    {isDragActive ? 'Solte aqui…' : 'Arraste 1 ou vários PDFs'}
                  </p>
                  <p className="text-[12px] text-ink-mute mt-1">
                    ou clique para escolher · até 50MB cada
                  </p>
                </div>

                {items.length > 0 && (
                  <div className="space-y-2 max-h-[280px] overflow-auto pr-1">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="border border-ink/15 bg-cream p-3 flex items-center gap-3"
                      >
                        <div className="flex-shrink-0">
                          {item.status === 'done' ? (
                            <Check size={18} className="text-moss" />
                          ) : item.status === 'error' ? (
                            <AlertCircle size={18} className="text-bordeaux" />
                          ) : item.status === 'uploading' ? (
                            <Loader2 size={18} className="animate-spin text-bordeaux" />
                          ) : (
                            <FileText size={18} className="text-ink-mute" strokeWidth={1.3} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {item.status === 'pending' && !uploading ? (
                            <input
                              value={item.title}
                              onChange={(e) => updateItem(idx, { title: e.target.value })}
                              className="w-full bg-transparent border-b border-ink/30 text-[14px] outline-none focus:border-ink"
                            />
                          ) : (
                            <p className="font-medium text-[13px] text-ink truncate">
                              {item.title}
                            </p>
                          )}
                          <p className="text-[11px] text-ink-mute truncate">
                            {item.error
                              ? item.error
                              : `${item.file.name} · ${formatBytes(item.file.size)}`}
                          </p>
                          {item.status === 'uploading' && (
                            <div className="mt-1.5 h-[2px] bg-cream-dark">
                              <motion.div
                                className="h-full bg-bordeaux"
                                initial={{ width: 0 }}
                                animate={{ width: `${item.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                        {!uploading && item.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-ink-mute hover:text-bordeaux text-[10px] uppercase tracking-wider"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-ink/10">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={uploading}
                    className="text-[12px] uppercase tracking-wider text-ink-mute hover:text-ink font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={items.length === 0 || uploading}
                    className="btn-primary"
                  >
                    {uploading
                      ? 'Enviando…'
                      : items.length === 0
                      ? 'Adicionar livros'
                      : `Enviar ${items.length} ${items.length === 1 ? 'livro' : 'livros'}`}
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