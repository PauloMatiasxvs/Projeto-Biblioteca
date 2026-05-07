'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type AuthResult = { error: string } | { success: true };

export async function login(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Preencha email e senha.' };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes('invalid')) {
      return { error: 'Email ou senha incorretos.' };
    }
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/library');
}

export async function signup(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const displayName = String(formData.get('display_name') ?? '').trim();

  if (!email || !password) {
    return { error: 'Preencha email e senha.' };
  }
  if (password.length < 6) {
    return { error: 'A senha precisa ter no mínimo 6 caracteres.' };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName || email.split('@')[0] },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes('already')) {
      return { error: 'Esse email já está cadastrado.' };
    }
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/library');
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
