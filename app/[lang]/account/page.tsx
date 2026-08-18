// /app/[lang]/account/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/library');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      <span className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Redirecting to Library...</span>
    </div>
  );
}
