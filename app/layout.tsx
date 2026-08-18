import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { Roboto_Flex, Roboto, Roboto_Mono } from 'next/font/google';
import 'material-icons/iconfont/round.css';
import './globals.css';
import { PlayerProvider } from '@/context/PlayerContext';
import AppLayout from '@/components/AppLayout';
import { getDictionary } from '@/lib/dictionary';

const robotoFlex = Roboto_Flex({
  weight: ['300', '400', '700'],
  style: ['normal'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-flex',
});

const roboto = Roboto({
  weight: ['300', '400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

const robotoMono = Roboto_Mono({
  weight: ['300', '400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Muzikoo Player',
  description: 'Muzikoo Player to search for music, discover songs & create beautiful playlists.',
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang?: string }>;
}) {
  const { lang } = await params;
  const locale = lang || 'en';
  const dictionary = await getDictionary(locale);

  return (
    <html lang={locale} className={`${robotoFlex.variable} ${roboto.variable} ${robotoMono.variable} h-full`} suppressHydrationWarning>
      <body className="h-full bg-zinc-950 font-sans text-zinc-100 flex flex-col overflow-hidden" suppressHydrationWarning>
        <PlayerProvider initialLocale={locale} initialDictionary={dictionary}>
          <AppLayout>{children}</AppLayout>
        </PlayerProvider>
      </body>
    </html>
  );
}
