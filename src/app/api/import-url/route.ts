import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_SIZE = 50 * 1024 * 1024;

function sanitize(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

function hueFromString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, title, author, description } = body as {
      url?: string;
      title?: string;
      author?: string;
      description?: string;
    };

    if (!url || !title) {
      return NextResponse.json({ error: 'URL e título são obrigatórios' }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: 'Protocolo não suportado' }, { status: 400 });
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const res = await fetch(url, {
      headers: { 'User-Agent': 'BibliotecaPessoal/1.0' },
      redirect: 'follow',
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Falha ao baixar (${res.status})` }, { status: 400 });
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('pdf') && !url.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'O arquivo não parece ser um PDF' }, { status: 400 });
    }

    const contentLength = parseInt(res.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_SIZE) {
      return NextResponse.json({ error: 'Arquivo maior que 50MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength > MAX_SIZE) {
      return NextResponse.json({ error: 'Arquivo maior que 50MB' }, { status: 400 });
    }

    const head = buffer.subarray(0, 5).toString('ascii');
    if (head !== '%PDF-') {
      return NextResponse.json({ error: 'Conteúdo baixado não é um PDF válido' }, { status: 400 });
    }

    const lastSeg = parsed.pathname.split('/').pop() || 'livro.pdf';
    const safeName = sanitize(lastSeg.endsWith('.pdf') ? lastSeg : `${lastSeg}.pdf`);
    const filePath = `${user.id}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('books')
      .upload(filePath, buffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false,
      });
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { error: insertError } = await supabase.from('books').insert({
      user_id: user.id,
      title: title.trim(),
      author: author?.trim() || null,
      description: description?.trim() || null,
      file_path: filePath,
      file_size: buffer.byteLength,
      page_count: null,
      cover_hue: hueFromString(title.trim()),
    });

    if (insertError) {
      await supabase.storage.from('books').remove([filePath]);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro inesperado' }, { status: 500 });
  }
}