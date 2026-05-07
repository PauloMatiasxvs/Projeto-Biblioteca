'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import {
  formatBytes,
  hueFromString,
  sanitizeFilename,
  titleFromFilename,
} from '@/lib/utils';

const MAX_SIZE = 50 * 1024 * 1024;

type UploadDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function UploadDialog({ open, onClose }: UploadDialogProps) {
  const supabase = createClient();
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const reset = useCallback(() => {
    setFile(null);
    setTitle('');
    setAuthor('');
    setDescription('');
    setProgress(0);
    setUploading(false);
  }, []);

  const handleClose = () => {
    if (uploading) return;
    reset();
    onClose();
  };

  const onDrop = useCallback((accepted: File[], rejected: any[]) => {
    if (rejected.length > 0) {
      const rej = rejected[0];
      if (rej.errors[0]?.code === 'file-too-large') {
        toast.error('Arquivo muito grande. Máximo 50MB.');
      } else if (rej.errors[0]?.code === 'file-invalid-type') {
        toast.error('Apenas arquivos PDF são aceitos.');
      } else {
        toast.error('Arquivo inválido.');
      }
      return;
    }
    const f = accepted[0];
    if (f) {
      setFile(f);
      setTitle(titleFromFilename(f.name));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: MAX_SIZE,
    multiple: false,
    disabled: uploading,
  });

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) return;

    setUploading(true);
    setProgress(5);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Sessão expirada — faça login novamente.');

      const safeName = sanitizeFilename(file.name);
      const filePath = `${user.id}/${Date.now()}_${safeName}`;

      setProgress(15);
      const pageCount = await countPages(file);
      setProgress(35);

      const { error: uploadError } = await supabase.storage
        .from('books')
        .upload(filePath, file, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;
      setProgress(80);

const { error: insertError } = await (supabase.from('books') as any).insert({
        user_id: user.id,
        title: title.trim(),
        author: author.trim() || null,
        description: description.trim() || null,
        file_path: filePath,
        file_size: file.size,
        page_count: pageCount,
        cover_hue: hueFromString(title.trim()),
      });

      if (insertError) {
        await supabase.storage.from('books').remove([filePath]);
        throw insertError;
      }

      setProgress(100);
      toast.success('Livro adicionado à sua biblioteca');
      qc.invalidateQueries({ queryKey: ['books'] });
      setTimeout(() => {
        reset();
        onClose();
      }, 400);
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao enviar arquivo');
      setUploading(false);
      setProgress(0);
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
                  <p className="eyebrow mb-1.5">Novo registro</p>
                  <h2 className="display text-[28px] leading-tight font-normal">
                    Adicionar <span className="display-italic text-bordeaux">livro</span>
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  disabled={uploading}
                  className="text-ink-mute hover:text-ink disabled:opacity-30"
                  aria-label="Fechar"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-7 space-y-5">
                {!file ? (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed cursor-pointer transition-colors p-10 text-center ${
                      isDragActive
                        ? 'border-bordeaux bg-bordeaux/5'
                        : 'border-ink/30 hover:border-ink/50 hover:bg-cream'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload
                      size={28}
                      className="mx-auto text-ink-mute mb-3"
                      strokeWidth={1.3}
                    />
                    <p className="font-serif italic text-[17px] text-ink">
                      {isDragActive ? 'Solte aqui…' : 'Arraste seu PDF'}
                    </p>
                    <p className="text-[13px] text-ink-mute mt-1">
                      ou clique para escolher · até 50MB
                    </p>
                  </div>
                ) : (
                  <div className="border border-ink/15 bg-cream p-4 flex items-center gap-4">
                    <FileText size={24} className="text-bordeaux flex-shrink-0" strokeWidth={1.3} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[14px] text-ink truncate">{file.name}</p>
                      <p className="text-[12px] text-ink-mute">{formatBytes(file.size)}</p>
                    </div>
                    {!uploading && (
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          setTitle('');
                        }}
                        className="text-ink-mute hover:text-bordeaux text-[11px] uppercase tracking-wider font-semibold"
                      >
                        Trocar
                      </button>
                    )}
                  </div>
                )}

                {file && (
                  <>
                    <div>
                      <label htmlFor="upload-title" className="eyebrow block mb-2">
                        Título
                      </label>
                      <input
                        id="upload-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        disabled={uploading}
                        className="field-input"
                      />
                    </div>

                    <div>
                      <label htmlFor="upload-author" className="eyebrow block mb-2">
                        Autor (opcional)
                      </label>
                      <input
                        id="upload-author"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        disabled={uploading}
                        placeholder="ex.: Clarice Lispector"
                        className="field-input"
                      />
                    </div>

                    <div>
                      <label htmlFor="upload-desc" className="eyebrow block mb-2">
                        Anotação (opcional)
                      </label>
                      <textarea
                        id="upload-desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={uploading}
                        rows={2}
                        placeholder="Por que este livro?"
                        className="field-input resize-none"
                      />
                    </div>
                  </>
                )}

                {uploading && (
                  <div>
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-ink-mute mb-1.5">
                      <span>Enviando</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-[3px] bg-cream-dark overflow-hidden">
                      <motion.div
                        className="h-full bg-bordeaux"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: 'easeOut' }}
                      />
                    </div>
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
                    disabled={!file || !title.trim() || uploading}
                    className="btn-primary"
                  >
                    {uploading ? 'Enviando…' : 'Adicionar livro'}
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