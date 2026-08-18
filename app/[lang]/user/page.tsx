// /app/[lang]/user/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayer } from '@/context/PlayerContext';

export default function UserIndexPage() {
  const router = useRouter();
  const { userSession } = usePlayer();

  useEffect(() => {
    if (userSession?.username) {
      router.replace(`/user/${encodeURIComponent(userSession.username)}`);
    } else {
      router.replace('/signin');
    }
  }, [userSession, router]);

  return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      <span className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Redirecting to User Profile...</span>
    </div>
  );
}
