// /components/CreatePlaylistModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, isPublic: boolean, canContribute?: boolean) => void;
}

export default function CreatePlaylistModal({
  isOpen,
  onClose,
  onCreate,
}: CreatePlaylistModalProps) {
  const [playlistName, setPlaylistName] = useState('');
  const [isPublic, setIsPublic] = useState(false); // private by default
  const [canContribute, setCanContribute] = useState(false);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    setPlaylistName('');
    setIsPublic(false);
    setCanContribute(false);
    onClose();
  };

  const handleTogglePublic = () => {
    const nextPublic = !isPublic;
    setIsPublic(nextPublic);
    if (!nextPublic) {
      setCanContribute(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = playlistName.trim();
    if (!trimmed) return;
    onCreate(trimmed, isPublic, isPublic ? canContribute : false);
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl z-10 text-zinc-100 font-sans space-y-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-playlist-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Icon */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 shadow-inner">
                <span className="material-icons-round text-2xl block">playlist_add</span>
              </div>
              <div className="space-y-1 pt-0.5">
                <h3 id="create-playlist-title" className="font-sans font-extrabold text-lg text-white tracking-tight">
                  Create Playlist
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Give your new playlist a title to start adding your favorite tracks.
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label htmlFor="playlist-name-input" className="block text-xs font-semibold text-zinc-300">
                  Playlist Name
                </label>
                <input
                  id="playlist-name-input"
                  type="text"
                  placeholder="e.g. Late Night Vibes, Workout Mix..."
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/60 transition-all"
                  autoFocus
                />
              </div>

              {/* Visibility Toggle */}
              <div className="flex items-center justify-between py-2 border-t border-zinc-800/80 mt-2">
                <div className="space-y-0.5 pr-2">
                  <span id="playlist-visibility-label" className="block text-xs font-semibold text-zinc-300">
                    Playlist Visibility
                  </span>
                  <span className={`text-[11px] block transition-colors ${isPublic ? 'text-blue-400 font-medium' : 'text-zinc-500'}`}>
                    {isPublic ? 'Public — visible on your profile page' : 'Private — only visible to you'}
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isPublic}
                  aria-labelledby="playlist-visibility-label"
                  onClick={handleTogglePublic}
                  className={`group relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-950 ${
                    isPublic ? 'bg-blue-600' : 'bg-zinc-700'
                  }`}
                >
                  <span className="sr-only">Toggle playlist visibility</span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isPublic ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Contribute Toggle (Available when playlist is visible) */}
              {isPublic && (
                <div className="flex items-center justify-between py-2.5 px-3 bg-blue-500/5 border border-blue-500/15 rounded-xl animate-fade-in">
                  <div className="space-y-0.5 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="material-icons-round text-sm text-blue-400">group_add</span>
                      <span id="playlist-contribute-label" className="block text-xs font-semibold text-zinc-200">
                        Contribute
                      </span>
                    </div>
                    <span className="text-[11px] block text-zinc-400">
                      Allows anyone to add tracks to the playlist (if they have the invite link)
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={canContribute}
                    aria-labelledby="playlist-contribute-label"
                    onClick={() => setCanContribute(!canContribute)}
                    className={`group relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-950 ${
                      canContribute ? 'bg-blue-600' : 'bg-zinc-700'
                    }`}
                  >
                    <span className="sr-only">Toggle playlist contribute permission</span>
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        canContribute ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 transition-all cursor-pointer font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!playlistName.trim()}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-500 hover:bg-blue-400 active:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-950/50 cursor-pointer font-sans flex items-center gap-1.5"
                >
                  <span className="material-icons-round text-sm block">add</span>
                  Create Playlist
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
