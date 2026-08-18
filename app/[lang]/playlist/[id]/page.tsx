// /app/[lang]/playlist/[id]/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePlayer, Track } from '@/context/PlayerContext';
import CoverImage from '@/components/CoverImage';
import DeletePlaylistModal from '@/components/DeletePlaylistModal';
import PlaylistSettingsModal from '@/components/PlaylistSettingsModal';
import ShareModal from '@/components/ShareModal';
import TrackMenu from '@/components/TrackMenu';
import { motion } from 'motion/react';

export default function PlaylistDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  
  const {
    customPlaylists,
    deletePlaylist,
    updatePlaylist,
    playTrack,
    currentTrack,
    isPlaying,
    removeTrackFromPlaylist,
  } = usePlayer();

  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const playlist = customPlaylists.find((p) => p.id === id);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  if (!playlist) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-4 animate-fade-in">
        <span className="material-icons-round text-6xl text-zinc-650 block mx-auto">queue_music</span>
        <p className="text-zinc-400 text-sm font-semibold">Playlist not found or has been deleted</p>
        <Link href="/" className="inline-block bg-blue-500 hover:bg-blue-400 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md">
          Explore Music Registry
        </Link>
      </div>
    );
  }

  const handleConfirmDelete = () => {
    deletePlaylist(id);
    setShowDeleteModal(false);
    router.push('/');
  };

  const handleSaveSettings = (updates: { name: string; isPublic: boolean; canContribute: boolean }) => {
    updatePlaylist(id, updates);
  };

  const tracks = playlist.tracks || [];
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/playlist/${id}`
      : `/playlist/${id}`;

  return (
    <div className="space-y-8 pb-20 animate-fade-in max-w-5xl mx-auto">
      {/* Playlist Header Card */}
      <section className="relative rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-900 p-8 flex flex-col sm:flex-row items-center gap-8 shadow-2xl z-20">
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        </div>
        
        {/* Dynamic Cover Art */}
        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden">
          {tracks.length > 0 ? (
            <CoverImage
              src={tracks[0].coverUrl}
              alt={playlist.name}
              type="track"
              className="w-full h-full object-cover blur-[1px] opacity-70"
            />
          ) : null}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="material-icons-round text-5xl text-blue-400">queue_music</span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-4 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="font-mono text-[10px] font-semibold text-blue-500 uppercase bg-blue-500/10 border border-blue-500/10 px-2.5 py-1 rounded-full">
              Custom Playlist
            </span>
            <span className={`font-mono text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full border ${
              playlist.isPublic
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : 'text-zinc-400 bg-zinc-800/60 border-zinc-800'
            }`}>
              {playlist.isPublic ? 'Public' : 'Private'}
            </span>
            {playlist.isPublic && playlist.canContribute && (
              <span className="font-mono text-[10px] font-semibold uppercase text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                <span className="material-icons-round text-xs">group</span>
                Collaborative
              </span>
            )}
          </div>

          <h1 className="font-sans font-extrabold text-2xl sm:text-4xl text-white tracking-tight leading-none">
            {playlist.name}
          </h1>
          <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider">
            {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'} • local offline storage
            {playlist.owner ? ` • by ${playlist.owner}` : ''}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <button
              onClick={() => {
                if (tracks.length > 0) {
                  playTrack(tracks[0], tracks);
                }
              }}
              disabled={tracks.length === 0}
              className="bg-white hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer font-sans"
            >
              <span className="material-icons-round text-zinc-950 text-base block">play_arrow</span>
              Play Queue
            </button>

            {/* Three Dots Playlist Options Menu */}
            <div className="relative z-30" ref={menuRef}>
              <button
                type="button"
                id="playlist-actions-menu-button"
                onClick={() => setShowMenu((prev) => !prev)}
                className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
                aria-label="Playlist options"
                title="Playlist options"
              >
                <span className="material-icons-round text-xl block">more_horiz</span>
              </button>

              {showMenu && (
                <div className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl p-1.5 shadow-2xl space-y-0.5 text-left text-xs font-sans text-white z-50 animate-fade-in ring-1 ring-white/10">
                  {/* Edit link */}
                  <button
                    type="button"
                    id="playlist-menu-edit-link"
                    onClick={() => {
                      setShowMenu(false);
                      setShowEditModal(true);
                    }}
                    className="w-full text-xs text-left px-3 py-2 hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-2.5 text-zinc-200 hover:text-white font-medium cursor-pointer"
                  >
                    <span className="material-icons-round text-base text-blue-400">edit</span>
                    <span>Edit</span>
                  </button>

                  {/* Share link */}
                  <button
                    type="button"
                    id="playlist-menu-share-link"
                    onClick={() => {
                      setShowMenu(false);
                      setShowShareModal(true);
                    }}
                    className="w-full text-xs text-left px-3 py-2 hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-2.5 text-zinc-200 hover:text-white font-medium cursor-pointer"
                  >
                    <span className="material-icons-round text-base text-zinc-400">share</span>
                    <span>Share</span>
                  </button>

                  {/* Delete playlist link */}
                  <button
                    type="button"
                    id="playlist-menu-delete-link"
                    onClick={() => {
                      setShowMenu(false);
                      setShowDeleteModal(true);
                    }}
                    className="w-full text-xs text-left px-3 py-2 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-2.5 text-rose-400 hover:text-rose-300 font-medium cursor-pointer border-t border-zinc-800/80 mt-1 pt-1.5"
                  >
                    <span className="material-icons-round text-base text-rose-400">delete</span>
                    <span>Delete playlist</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Playlist Tracks Table */}
      <section className="space-y-4">
        <h2 className="font-sans font-extrabold text-lg text-white tracking-tight flex items-center gap-2 border-b border-zinc-900 pb-3">
          <span className="material-icons-round text-blue-500 text-xl block">queue_music</span>
          Playlist Tracks
        </h2>

        {tracks.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/15 border border-zinc-900/50 rounded-2xl p-8 space-y-3">
            <span className="material-icons-round text-5xl text-zinc-600 block">music_note</span>
            <p className="text-zinc-400 text-sm font-semibold">Your playlist is currently empty</p>
            <p className="text-zinc-600 text-xs max-w-xs mx-auto">Explore the homepage, perform lookups, and click the &quot;Add to Playlist&quot; options to curate your customized libraries.</p>
          </div>
        ) : (
          <div className="bg-zinc-900/20 border border-zinc-900/40 rounded-2xl overflow-hidden divide-y divide-zinc-900/40 shadow-lg animate-fade-in">
            {tracks.map((track: Track, idx: number) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  className={`flex items-center justify-between px-6 py-4.5 hover:bg-zinc-900/40 transition-colors group ${
                    isCurrent ? 'bg-zinc-900/20 text-blue-400' : 'text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-4 truncate">
                    <button
                      onClick={() => playTrack(track, tracks)}
                      className={`w-8.5 h-8.5 rounded-full bg-zinc-800 hover:bg-blue-500 hover:text-white flex items-center justify-center text-zinc-300 transition-all cursor-pointer ${
                        isCurrent ? 'bg-blue-500 text-white' : ''
                      }`}
                    >
                      {isCurrent && isPlaying ? (
                        <span className="material-icons-round text-sm block">pause</span>
                      ) : (
                        <span className="material-icons-round text-sm block pl-0.5">play_arrow</span>
                      )}
                    </button>
                    
                    <CoverImage
                      src={track.coverUrl}
                      alt={track.title}
                      type="track"
                      className="w-10 h-10 object-cover rounded-lg bg-zinc-950 border border-zinc-800 shadow shrink-0"
                    />

                    <div className="truncate text-left">
                      <Link
                        href={`/track/${track.id}`}
                        className="font-bold text-sm block hover:text-blue-400 hover:underline transition-all truncate text-white"
                      >
                        {track.title}
                      </Link>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                        <Link href={`/artist/${track.artistId}`} className="hover:text-white hover:underline truncate">
                          {track.artist}
                        </Link>
                        <span>&bull;</span>
                        <span className="truncate max-w-[120px] text-zinc-500">{track.album}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-zinc-500">
                      {track.duration ? `${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, '0')}` : '3:00'}
                    </span>
                    <TrackMenu track={track} />
                    <button
                      onClick={() => removeTrackFromPlaylist(id, track.id)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                      title="Remove track from playlist"
                    >
                      <span className="material-icons-round text-base">delete_outline</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Playlist Settings (Edit) Modal */}
      <PlaylistSettingsModal
        isOpen={showEditModal}
        playlist={playlist}
        onSave={handleSaveSettings}
        onClose={() => setShowEditModal(false)}
      />

      {/* Share Playlist Modal */}
      <ShareModal
        isOpen={showShareModal}
        title="Share Playlist"
        subtitle={playlist.name}
        shareUrl={shareUrl}
        onClose={() => setShowShareModal(false)}
      />

      {/* Delete Confirmation Modal */}
      <DeletePlaylistModal
        isOpen={showDeleteModal}
        playlistName={playlist.name}
        trackCount={tracks.length}
        onConfirm={handleConfirmDelete}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
