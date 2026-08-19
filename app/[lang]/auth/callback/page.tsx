// /app/[lang]/auth/callback/page.tsx
import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import AuthCallbackClient from '@/components/AuthCallbackClient';

export const metadata: Metadata = {
  title: 'Signing in - Muzikoo Player',
  description: 'Authenticating with OAuth provider and redirecting to your Muzikoo library.',
};

export default function LocalizedAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[75vh] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
