// /components/Sidebar.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { usePlayer, Playlist } from '@/context/PlayerContext';
import DeletePlaylistModal from '@/components/DeletePlaylistModal';
import CreatePlaylistModal from '@/components/CreatePlaylistModal';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { customPlaylists, createPlaylist, deletePlaylist, userSession, t } = usePlayer();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);

  const handleCreatePlaylist = (name: string, isPublic: boolean, canContribute?: boolean) => {
    createPlaylist(name, '', isPublic, canContribute);
  };

  const handleConfirmDelete = () => {
    if (playlistToDelete) {
      deletePlaylist(playlistToDelete.id);
      if (pathname === `/playlist/${playlistToDelete.id}`) {
        router.push('/');
      }
      setPlaylistToDelete(null);
    }
  };

  const navItems = [
    { label: t.navigation.home, href: '/', iconName: 'home' },
    { label: (t.navigation as any).explore || 'Explore', href: '/explore', iconName: 'explore' },
    { label: t.navigation.library, href: '/library', iconName: 'album' },
    { label: t.navigation.history || 'History', href: '/history', iconName: 'history' },
  ];

  return (
    <aside id="app-sidebar" className="w-full bg-zinc-950 flex flex-col h-full select-none text-zinc-300">
      {/* Navigation */}
      <div className="px-4 py-6 flex-1 overflow-y-auto space-y-7">
        <div className="space-y-1.5">
          <span className="px-3 font-mono text-[10px] text-zinc-500 tracking-widest uppercase">Navigation</span>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-900 text-blue-400'
                    : 'hover:bg-zinc-900/60 hover:text-white'
                }`}
              >
                <span className={`material-icons-round text-lg leading-none ${isActive ? 'text-blue-400' : 'text-zinc-400'}`}>{item.iconName}</span>
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Custom Playlists */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-3">
            <span className="font-mono text-[10px] text-zinc-500 tracking-widest uppercase">{t.navigation.playlists}</span>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="p-1 hover:bg-zinc-900 rounded text-zinc-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
              title="Create Playlist"
            >
              <span className="material-icons-round text-base leading-none">add</span>
            </button>
          </div>

          <div className="space-y-0.5">
            {customPlaylists.map((p) => {
              const isPlaylistActive = pathname === `/playlist/${p.id}`;
              return (
                <div
                  key={p.id}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                    isPlaylistActive
                      ? 'bg-zinc-900 text-blue-400 font-medium'
                      : 'hover:bg-zinc-900/40 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Link href={`/playlist/${p.id}`} className="flex-1 truncate block pr-2">
                    {p.name}
                  </Link>
                  <button
                    onClick={() => setPlaylistToDelete(p)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 rounded transition-opacity flex items-center justify-center cursor-pointer"
                    title="Delete Playlist"
                  >
                    <span className="material-icons-round text-base leading-none">delete_outline</span>
                  </button>
                </div>
              );
            })}

            {customPlaylists.length === 0 && (
              <span className="block px-3 py-2 text-xs text-zinc-600 italic">No playlists created</span>
            )}
          </div>
        </div>
      </div>

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreatePlaylist}
      />

      {/* Delete Confirmation Modal */}
      <DeletePlaylistModal
        isOpen={Boolean(playlistToDelete)}
        playlistName={playlistToDelete?.name || ''}
        trackCount={playlistToDelete?.tracks?.length || 0}
        onConfirm={handleConfirmDelete}
        onClose={() => setPlaylistToDelete(null)}
      />
    </aside>
  );
}
