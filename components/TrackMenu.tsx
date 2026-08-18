// /components/TrackMenu.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePlayer, Track } from '@/context/PlayerContext';
import CoverImage from '@/components/CoverImage';
import ShareModal from '@/components/ShareModal';

interface TrackMenuProps {
  track: Track;
  className?: string;
  iconClassName?: string;
  buttonClassName?: string;
}

export default function TrackMenu({
  track,
  className = '',
  iconClassName = 'text-base',
  buttonClassName = '',
}: TrackMenuProps) {
  const { customPlaylists, addTrackToPlaylist, createPlaylist, isFavoriteTrack, toggleFavoriteTrack } = usePlayer();
  const isFav = isFavoriteTrack(track.id);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  // Modals
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showLyricsModal, setShowLyricsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Lyrics state
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsData, setLyricsData] = useState<{ plainLyrics?: string; syncedLyrics?: string; instrumental?: boolean; isInstrumental?: boolean; trackName?: string; artistName?: string } | null>(null);
  const [lyricsError, setLyricsError] = useState<string | null>(null);

  // Playlist creation state inside modal
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Toggle menu and calculate fixed position
  const handleToggleMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (showMenu) {
      setShowMenu(false);
      return;
    }

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 192; // 12rem / w-48
      const menuHeight = 200;

      let top = rect.bottom + 4;
      let left = rect.right - menuWidth;

      // Ensure menu fits within viewport
      if (top + menuHeight > window.innerHeight) {
        top = Math.max(10, rect.top - menuHeight - 4);
      }
      if (left < 10) {
        left = 10;
      }
      if (left + menuWidth > window.innerWidth - 10) {
        left = window.innerWidth - menuWidth - 10;
      }

      setMenuPos({ top, left });
      setShowMenu(true);
    }
  };

  // Close menu on resize or scroll
  useEffect(() => {
    if (!showMenu) return;

    const handleScrollOrResize = () => {
      setShowMenu(false);
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [showMenu]);

  // Fetch lyrics when lyrics modal is opened
  useEffect(() => {
    if (!showLyricsModal) return;

    async function fetchTrackLyrics() {
      setLyricsLoading(true);
      setLyricsError(null);
      setLyricsData(null);

      try {
        const queryParams = new URLSearchParams({
          artist_name: track.artist || '',
          track_name: track.title || '',
        });
        if (track.album) {
          queryParams.set('album_name', track.album);
        }
        if (track.duration) {
          queryParams.set('duration', String(track.duration));
        }

        const res = await fetch(`/api/lyrics?${queryParams.toString()}`);
        if (!res.ok) {
          throw new Error('Lyrics not found');
        }

        const data = await res.json();
        const lyricsObj = data.lyrics;

        if (lyricsObj && (lyricsObj.plainLyrics || lyricsObj.syncedLyrics || lyricsObj.instrumental || lyricsObj.isInstrumental)) {
          setLyricsData(lyricsObj);
        } else {
          setLyricsError('No lyrics available for this track.');
        }
      } catch {
        setLyricsError('Lyrics not found for this track.');
      } finally {
        setLyricsLoading(false);
      }
    }

    fetchTrackLyrics();
  }, [showLyricsModal, track]);

  // Handle adding track to playlist
  const handleAddToPlaylist = (playlistId: string, playlistName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addTrackToPlaylist(playlistId, track);
    setAddedToast(`Added to "${playlistName}"!`);
    setTimeout(() => setAddedToast(null), 2500);
  };

  // Handle creating new playlist and adding track
  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!newPlaylistName.trim()) return;

    const created = createPlaylist(newPlaylistName.trim(), 'Custom playlist');
    if (created) {
      addTrackToPlaylist(created.id, track);
      setAddedToast(`Created "${created.name}" and added track!`);
      setNewPlaylistName('');
      setShowCreateForm(false);
      setTimeout(() => setAddedToast(null), 2500);
    }
  };

  const artistHref = track.artistId
    ? `/artist/${track.artistId}`
    : `/artist/${encodeURIComponent(track.artist || '')}`;

  const albumHref = track.releaseId
    ? `/album/${track.releaseId}`
    : track.albumId
    ? `/album/${track.albumId}`
    : track.album
    ? `/search?q=${encodeURIComponent(track.album)}`
    : null;

  return (
    <div className={`relative inline-block ${className}`} onClick={(e) => e.stopPropagation()}>
      {/* Three Dots Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggleMenu}
        className={`p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer flex items-center justify-center ${buttonClassName}`}
        title="More track options"
        aria-label="Track options menu"
      >
        <span className={`material-icons-round ${iconClassName} leading-none block`}>more_vert</span>
      </button>

      {/* Dropdown Menu (Fixed Positioning to prevent overflow clipping) */}
      {showMenu && menuPos && (
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMenu(false);
            }}
          />

          <div
            className="fixed z-[9999] w-48 bg-zinc-900 border border-zinc-800 rounded-xl p-1.5 shadow-2xl space-y-0.5 text-left text-xs font-sans text-white animate-fade-in"
            style={{
              top: `${menuPos.top}px`,
              left: `${menuPos.left}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Favorite Track Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowMenu(false);
                toggleFavoriteTrack(track);
              }}
              className="w-full text-xs text-left px-3 py-2 hover:bg-zinc-800/90 rounded-lg transition-colors flex items-center gap-2.5 text-zinc-200 hover:text-white font-medium cursor-pointer"
            >
              <span className={`material-icons-round text-base ${isFav ? 'text-rose-500' : 'text-zinc-400'}`}>
                {isFav ? 'favorite' : 'favorite_border'}
              </span>
              <span>{isFav ? 'Remove from favorites' : 'Add to favorites'}</span>
            </button>

            {/* Lyrics Link */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowMenu(false);
                setShowLyricsModal(true);
              }}
              className="w-full text-xs text-left px-3 py-2 hover:bg-zinc-800/90 rounded-lg transition-colors flex items-center gap-2.5 text-zinc-200 hover:text-white font-medium cursor-pointer"
            >
              <span className="material-icons-round text-base text-blue-400">subtitles</span>
              <span>Lyrics</span>
            </button>

            {/* Add to playlist Link */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowMenu(false);
                setShowPlaylistModal(true);
              }}
              className="w-full text-xs text-left px-3 py-2 hover:bg-zinc-800/90 rounded-lg transition-colors flex items-center gap-2.5 text-zinc-200 hover:text-white font-medium cursor-pointer"
            >
              <span className="material-icons-round text-base text-zinc-400">playlist_add</span>
              <span>Add to playlist</span>
            </button>

            {/* Go to artist Link */}
            {track.artist && (
              <Link
                href={artistHref}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
                className="w-full text-xs text-left px-3 py-2 hover:bg-zinc-800/90 rounded-lg transition-colors flex items-center gap-2.5 text-zinc-200 hover:text-white font-medium cursor-pointer"
              >
                <span className="material-icons-round text-base text-zinc-400">person</span>
                <span className="truncate">Go to artist</span>
              </Link>
            )}

            {/* Go to album Link */}
            {albumHref && (
              <Link
                href={albumHref}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
                className="w-full text-xs text-left px-3 py-2 hover:bg-zinc-800/90 rounded-lg transition-colors flex items-center gap-2.5 text-zinc-200 hover:text-white font-medium cursor-pointer"
              >
                <span className="material-icons-round text-base text-zinc-400">album</span>
                <span className="truncate">Go to album</span>
              </Link>
            )}

            {/* Share Link */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowMenu(false);
                setShowShareModal(true);
              }}
              className="w-full text-xs text-left px-3 py-2 hover:bg-zinc-800/90 rounded-lg transition-colors flex items-center gap-2.5 text-zinc-200 hover:text-white font-medium cursor-pointer border-t border-zinc-800/80 mt-1 pt-1.5"
            >
              <span className="material-icons-round text-base text-zinc-400">share</span>
              <span className="truncate">Share track</span>
            </button>
          </div>
        </>
      )}

      {/* Add to Playlist Modal */}
      {showPlaylistModal && (
        <div
          className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => {
            e.stopPropagation();
            setShowPlaylistModal(false);
          }}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="material-icons-round text-blue-400 text-xl">playlist_add</span>
                <h3 className="font-sans font-bold text-base text-white">Add to Playlist</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPlaylistModal(false)}
                className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg"
              >
                <span className="material-icons-round text-lg">close</span>
              </button>
            </div>

            {/* Track Info Preview */}
            <div className="flex items-center gap-3 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
              <CoverImage
                src={track.coverUrl}
                alt={track.title}
                type="track"
                className="w-12 h-12 rounded-lg object-cover border border-zinc-800 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-white truncate">{track.title}</p>
                <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
              </div>
            </div>

            {/* Toast Feedback */}
            {addedToast && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 font-medium">
                <span className="material-icons-round text-base">check_circle</span>
                <span>{addedToast}</span>
              </div>
            )}

            {/* Playlist List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {customPlaylists.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">No playlists created yet.</p>
              ) : (
                customPlaylists.map((pl) => {
                  const alreadyIn = pl.tracks.some((t) => t.id === track.id);
                  return (
                    <div
                      key={pl.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/40 hover:bg-zinc-850/60 border border-zinc-800/80 transition-colors"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="font-semibold text-xs text-white truncate">{pl.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">{pl.tracks.length} tracks</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleAddToPlaylist(pl.id, pl.name, e)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                          alreadyIn
                            ? 'bg-zinc-800 text-zinc-400 hover:text-white'
                            : 'bg-blue-500 hover:bg-blue-400 text-white shadow-sm'
                        }`}
                      >
                        <span className="material-icons-round text-sm">
                          {alreadyIn ? 'check' : 'add'}
                        </span>
                        <span>{alreadyIn ? 'Added' : 'Add'}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Create New Playlist Option */}
            <div className="border-t border-zinc-800 pt-3">
              {!showCreateForm ? (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="w-full py-2.5 px-3 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-icons-round text-base text-blue-400">add</span>
                  <span>Create New Playlist</span>
                </button>
              ) : (
                <form onSubmit={handleCreateAndAdd} className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="New playlist name..."
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    autoFocus
                    className="w-full bg-zinc-950 border border-zinc-750 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newPlaylistName.trim()}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-500 hover:bg-blue-400 disabled:opacity-50"
                    >
                      Create & Add
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lyrics Modal */}
      {showLyricsModal && (
        <div
          className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => {
            e.stopPropagation();
            setShowLyricsModal(false);
          }}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl text-left max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <span className="material-icons-round text-blue-400 text-xl">subtitles</span>
                <div>
                  <h3 className="font-sans font-bold text-base text-white">Track Lyrics</h3>
                  <p className="text-xs text-zinc-400 truncate">{track.title} &bull; {track.artist}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLyricsModal(false)}
                className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg"
              >
                <span className="material-icons-round text-lg">close</span>
              </button>
            </div>

            {/* Lyrics Content */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-sm font-sans text-zinc-300 leading-relaxed">
              {lyricsLoading && (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <div className="w-7 h-7 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Searching LRCLIB database...</span>
                </div>
              )}

              {lyricsError && !lyricsLoading && (
                <div className="text-center py-12 space-y-3">
                  <span className="material-icons-round text-4xl text-zinc-600 block">subtitles_off</span>
                  <p className="text-zinc-400 text-sm font-medium">{lyricsError}</p>
                </div>
              )}

              {lyricsData && !lyricsLoading && (
                <div className="space-y-4">
                  {(lyricsData.instrumental || lyricsData.isInstrumental) ? (
                    <div className="text-center py-10 space-y-2">
                      <span className="material-icons-round text-4xl text-blue-400 block">graphic_eq</span>
                      <p className="text-white font-bold text-base">Instrumental Recording</p>
                      <p className="text-zinc-400 text-xs">This song contains no vocal lyrics.</p>
                    </div>
                  ) : lyricsData.plainLyrics ? (
                    <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-200 leading-relaxed bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
                      {lyricsData.plainLyrics}
                    </pre>
                  ) : lyricsData.syncedLyrics ? (
                    <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-200 leading-relaxed bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
                      {lyricsData.syncedLyrics.replace(/\[\d+:\d+\.\d+\]/g, '')}
                    </pre>
                  ) : (
                    <p className="text-zinc-400 text-center py-8">No lyrics found.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Track"
        subtitle={`${track.title}${track.artist ? ` • ${track.artist}` : ''}`}
        shareUrl={typeof window !== 'undefined' ? `${window.location.origin}/track/${encodeURIComponent(track.id)}` : ''}
      />
    </div>
  );
}
