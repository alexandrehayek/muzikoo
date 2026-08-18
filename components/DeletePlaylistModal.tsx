// /components/DeletePlaylistModal.tsx
'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface DeletePlaylistModalProps {
  isOpen: boolean;
  playlistName: string;
  trackCount: number;
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeletePlaylistModal({
  isOpen,
  playlistName,
  trackCount,
  onConfirm,
  onClose,
}: DeletePlaylistModalProps) {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
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
            aria-labelledby="delete-playlist-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Icon */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0 shadow-inner">
                <span className="material-icons-round text-2xl block">delete_forever</span>
              </div>
              <div className="space-y-1 pt-0.5">
                <h3 id="delete-playlist-title" className="font-sans font-extrabold text-lg text-white tracking-tight">
                  Delete Playlist?
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-white">&quot;{playlistName}&quot;</span>? This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Track Info Callout */}
            <div className="bg-zinc-900/60 border border-zinc-900 rounded-xl px-4 py-3 text-xs text-zinc-400 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="material-icons-round text-zinc-500 text-base">queue_music</span>
                Included Tracks
              </span>
              <span className="font-mono text-zinc-300 font-semibold uppercase">
                {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
              </span>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 transition-all cursor-pointer font-sans"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 transition-all shadow-lg shadow-rose-950/50 cursor-pointer font-sans flex items-center gap-1.5"
              >
                <span className="material-icons-round text-sm block">delete</span>
                Delete Playlist
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
