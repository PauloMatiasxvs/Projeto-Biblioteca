import type { Metadata } from 'next';
import { Fraunces, Manrope } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { Providers } from './providers';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['SOFT', 'WONK', 'opsz'],
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Biblioteca Pessoal',
  description: 'Sua estante de livros digital, em qualquer lugar.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${manrope.variable}`}>
      <body>
        <Providers>{children}</Providers>
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#1c1611',
              color: '#faf6ec',
              fontFamily: 'var(--font-manrope), sans-serif',
              fontSize: '14px',
              borderRadius: 0,
              padding: '14px 20px',
              border: '1px solid #c9a961',
            },
            success: { iconTheme: { primary: '#c9a961', secondary: '#1c1611' } },
            error: { iconTheme: { primary: '#8d4242', secondary: '#faf6ec' } },
          }}
        />
      </body>
    </html>
  );
}
