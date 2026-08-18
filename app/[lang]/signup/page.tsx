// /app/[lang]/signup/page.tsx
'use client';

import React from 'react';
import AuthFormScreen from '@/components/AuthFormScreen';

export default function SignUpPage() {
  return <AuthFormScreen initialMode="signup" />;
}
