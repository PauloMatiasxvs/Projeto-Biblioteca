'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { login, signup, type AuthResult } from '@/app/(auth)/actions';

type Mode = 'login' | 'signup';

export function AuthForm({ mode }: { mode: Mode }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const action = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result: AuthResult =
        mode === 'login' ? await login(formData) : await signup(formData);
      if ('error' in result) setError(result.error);
    });
  };

  return (
    <div>
      <p className="eyebrow mb-4">
        {mode === 'login' ? 'Entrar · Liber' : 'Criar conta · Liber'}
      </p>
      <h2 className="display text-[44px] leading-[1.05] font-normal">
        {mode === 'login' ? (
          <>
            Bem-vindo
            <br />
            <span className="display-italic text-bordeaux">de volta.</span>
          </>
        ) : (
          <>
            Comece sua
            <br />
            <span className="display-italic text-bordeaux">biblioteca.</span>
          </>
        )}
      </h2>
      <p className="mt-3 mb-9 text-ink-soft text-[15px]">
        {mode === 'login'
          ? 'Acesse sua estante pessoal de livros.'
          : 'Crie uma conta para começar a guardar seus PDFs.'}
      </p>

      {error && (
        <div className="mb-5 border-l-[3px] border-bordeaux bg-bordeaux/10 px-4 py-3 text-[14px] text-bordeaux-deep animate-fade-in">
          {error}
        </div>
      )}

      <form action={action} className="space-y-5">
        {mode === 'signup' && (
          <div>
            <label htmlFor="display_name" className="eyebrow block mb-2">
              Nome de exibição
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              autoComplete="name"
              placeholder="Como devemos te chamar"
              className="field-input"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="eyebrow block mb-2">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="seu@email.com"
            className="field-input"
          />
        </div>

        <div>
          <label htmlFor="password" className="eyebrow block mb-2">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={6}
            placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : '••••••••'}
            className="field-input"
          />
        </div>

        <button type="submit" disabled={isPending} className="btn-primary w-full mt-3">
          {isPending
            ? mode === 'login'
              ? 'Entrando…'
              : 'Criando conta…'
            : mode === 'login'
            ? 'Entrar na biblioteca'
            : 'Criar minha biblioteca'}
        </button>
      </form>

      <p className="mt-7 text-center text-[14px] text-ink-soft">
        {mode === 'login' ? (
          <>
            Não tem conta ainda?{' '}
            <Link
              href="/signup"
              className="text-bordeaux font-semibold underline decoration-[1.5px] underline-offset-[3px]"
            >
              Criar conta
            </Link>
          </>
        ) : (
          <>
            Já tem conta?{' '}
            <Link
              href="/login"
              className="text-bordeaux font-semibold underline decoration-[1.5px] underline-offset-[3px]"
            >
              Entrar
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
