import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GOPAC - Gouvernance Optimisée des Procédures Administratives',
  description: 'Plateforme de digitalisation des procédures administratives du Centre Informatique de l\'UGANC',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
        >
          {/* <Header /> */}
          <main className="flex-1">{children}</main>
          {/* <Footer /> */}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}