'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePlayer } from '@/context/PlayerContext';
import CreatePlaylistModal from '@/components/CreatePlaylistModal';

export default function LibraryClient() {
  const { customPlaylists, createPlaylist, t } = usePlayer();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="space-y-8 pb-20 animate-fade-in max-w-5xl mx-auto">
      {/* Library Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div className="space-y-1.5">
          <h1 className="font-sans font-extrabold text-2xl sm:text-3xl text-white tracking-tight flex items-center gap-2.5">
            <span className="material-icons-round text-blue-500 text-3xl">album</span>
            {t.navigation.library}
          </h1>
          <p className="text-zinc-400 text-sm">
            Manage your custom playlist collections and saved music.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20"
          >
            <span className="material-icons-round text-base">add</span>
            <span>New Playlist</span>
          </button>
          
          <Link
            href="/history"
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <span className="material-icons-round text-base">history</span>
            <span>History</span>
          </Link>
        </div>
      </div>

      {/* Playlists Grid */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-sans font-extrabold text-xl text-white flex items-center gap-2">
            <span className="material-icons-round text-blue-500 text-xl block">queue_music</span>
            Your Playlists ({customPlaylists.length})
          </h2>
        </div>

        {customPlaylists.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/20 border border-zinc-900/60 light:border-zinc-700 rounded-3xl p-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 light:border-zinc-700 text-zinc-600 flex items-center justify-center mx-auto">
              <span className="material-icons-round text-3xl">queue_music</span>
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <p className="text-white font-bold text-base">No custom playlists yet</p>
              <p className="text-zinc-500 text-xs">
                Create your first playlist to collect your favorite tracks and recordings.
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl text-xs transition-colors inline-flex items-center gap-2 cursor-pointer shadow"
            >
              <span className="material-icons-round text-sm">add</span>
              <span>Create Playlist</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {customPlaylists.map((p) => (
              <Link
                key={p.id}
                href={`/playlist/${p.id}`}
                className="bg-zinc-900/30 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 light:border-zinc-700 p-4 rounded-2xl flex items-center justify-between gap-4 transition-all group shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3.5 truncate">
                  <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 light:border-zinc-700 flex items-center justify-center text-blue-400 group-hover:text-blue-300 shrink-0 shadow-inner">
                    <span className="material-icons-round text-2xl block">queue_music</span>
                  </div>
                  <div className="truncate">
                    <h3 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors truncate">
                      {p.name}
                    </h3>
                    <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">
                      {p.tracks.length} {p.tracks.length === 1 ? 'track' : 'tracks'}
                    </span>
                  </div>
                </div>
                <span className="material-icons-round text-zinc-600 group-hover:text-blue-400 transition-colors">
                  arrow_forward_ios
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreatePlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={(name, isPublic, canContribute) => {
          createPlaylist(name, '', isPublic, canContribute);
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}
