// /app/[lang]/signin/page.tsx
'use client';

import React from 'react';
import AuthFormScreen from '@/components/AuthFormScreen';

export default function SignInPage() {
  return <AuthFormScreen initialMode="signin" />;
}
