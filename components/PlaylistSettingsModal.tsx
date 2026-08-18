// /components/PlaylistSettingsModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Playlist, usePlayer } from '@/context/PlayerContext';

interface PlaylistSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: Playlist;
  onSave: (updates: { name: string; isPublic: boolean; canContribute: boolean }) => void;
}

function PlaylistSettingsDialogContent({
  playlist,
  onSave,
  onClose,
}: {
  playlist: Playlist;
  onSave: (updates: { name: string; isPublic: boolean; canContribute: boolean }) => void;
  onClose: () => void;
}) {
  const { userSession } = usePlayer();
  const [name, setName] = useState(playlist.name || '');
  const [isPublic, setIsPublic] = useState(Boolean(playlist.isPublic));
  const [canContribute, setCanContribute] = useState(Boolean(playlist.isPublic && playlist.canContribute));
  const [copiedInvite, setCopiedInvite] = useState(false);

  const handleTogglePublic = () => {
    const nextPublic = !isPublic;
    setIsPublic(nextPublic);
    if (!nextPublic) {
      setCanContribute(false);
    }
  };

  const inviteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/playlist/${playlist.id}?invite=${playlist.inviteToken || 'collab'}`
      : `/playlist/${playlist.id}`;

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    } catch {
      const input = document.getElementById('invite-link-input') as HTMLInputElement;
      if (input) {
        input.select();
        document.execCommand('copy');
        setCopiedInvite(true);
        setTimeout(() => setCopiedInvite(false), 2000);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({
      name: trimmed,
      isPublic,
      canContribute: isPublic ? canContribute : false,
    });
    onClose();
  };

  const ownerDisplay =
    playlist.owner ||
    userSession.displayName ||
    userSession.username ||
    'You';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl z-10 text-zinc-100 font-sans space-y-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="playlist-settings-title"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-zinc-850 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <span className="material-icons-round text-xl block">tune</span>
          </div>
          <div>
            <h3 id="playlist-settings-title" className="font-sans font-extrabold text-base sm:text-lg text-white tracking-tight">
              Playlist Settings
            </h3>
            <p className="text-zinc-400 text-xs">
              Update playlist details, visibility, and contributor permissions.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <span className="material-icons-round text-base block">close</span>
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Playlist Name */}
        <div className="space-y-1.5">
          <label htmlFor="edit-playlist-name" className="block text-xs font-semibold text-zinc-300">
            Playlist Name
          </label>
          <input
            id="edit-playlist-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Playlist name..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/60 transition-all"
            autoFocus
          />
        </div>

        {/* Playlist Visibility */}
        <div className="flex items-center justify-between py-2.5 px-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
          <div className="space-y-0.5 pr-2">
            <span id="edit-playlist-visibility-label" className="block text-xs font-semibold text-zinc-200">
              Playlist Visibility
            </span>
            <span className={`text-[11px] block transition-colors ${isPublic ? 'text-blue-400 font-medium' : 'text-zinc-400'}`}>
              {isPublic ? 'Public — visible on your profile and discoverable' : 'Private — only visible to you'}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isPublic}
            aria-labelledby="edit-playlist-visibility-label"
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

        {/* Contribute Option */}
        <div className={`py-2.5 px-3 rounded-xl border transition-all ${
          isPublic ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-zinc-900/20 border-zinc-850 opacity-60'
        }`}>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 pr-2">
              <div className="flex items-center gap-1.5">
                <span className={`material-icons-round text-sm ${isPublic ? 'text-blue-400' : 'text-zinc-500'}`}>group_add</span>
                <span id="edit-playlist-contribute-label" className="block text-xs font-semibold text-zinc-200">
                  Contribute
                </span>
              </div>
              <span className="text-[11px] block text-zinc-400">
                {isPublic
                  ? 'Allows anyone to add tracks to the playlist (if they have the invite link)'
                  : 'Requires public visibility to enable collaboration'}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              disabled={!isPublic}
              aria-checked={canContribute}
              aria-labelledby="edit-playlist-contribute-label"
              onClick={() => setCanContribute(!canContribute)}
              className={`group relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-950 ${
                !isPublic
                  ? 'bg-zinc-800 cursor-not-allowed'
                  : canContribute
                  ? 'bg-blue-600 cursor-pointer'
                  : 'bg-zinc-700 cursor-pointer'
              }`}
            >
              <span className="sr-only">Toggle playlist contribute option</span>
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  canContribute ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* If Contribute is active: show Playlist Owner and Copy Invite Link */}
          {isPublic && canContribute && (
            <div className="mt-3 pt-3 border-t border-zinc-800 space-y-3 animate-fade-in">
              {/* Playlist Owner */}
              <div className="flex items-center justify-between bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <span className="material-icons-round text-sm text-amber-400">verified_user</span>
                  <span className="text-xs text-zinc-400 font-medium">Playlist Owner:</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                  <span className="w-5 h-5 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center text-[10px]">
                    {ownerDisplay.charAt(0).toUpperCase()}
                  </span>
                  <span>{ownerDisplay}</span>
                </div>
              </div>

              {/* Invite Link & Copy Button */}
              <div className="space-y-1.5">
                <label htmlFor="invite-link-input" className="block text-[11px] font-semibold text-zinc-300">
                  Collaboration Invite Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="invite-link-input"
                    type="text"
                    readOnly
                    value={inviteUrl}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-blue-500 selection:bg-blue-500/20"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    type="button"
                    onClick={handleCopyInvite}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      copiedInvite
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-blue-500 hover:bg-blue-400 text-white shadow-sm'
                    }`}
                  >
                    <span className="material-icons-round text-sm">
                      {copiedInvite ? 'check' : 'link'}
                    </span>
                    <span>{copiedInvite ? 'Copied!' : 'Copy invite link'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500">
                  Users who open this link can add their favorite tracks directly to this playlist.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-850">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 transition-all cursor-pointer font-sans"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-500 hover:bg-blue-400 active:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-950/50 cursor-pointer font-sans flex items-center gap-1.5"
          >
            <span className="material-icons-round text-sm block">save</span>
            Save Changes
          </button>
        </div>
      </form>
    </motion.div>
  );
}

export default function PlaylistSettingsModal({
  isOpen,
  onClose,
  playlist,
  onSave,
}: PlaylistSettingsModalProps) {
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

  // Prevent background scroll
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
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
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

          {/* Modal Content */}
          <PlaylistSettingsDialogContent
            key={`${playlist.id}-${playlist.name}-${playlist.isPublic}-${playlist.canContribute}`}
            playlist={playlist}
            onSave={onSave}
            onClose={onClose}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
