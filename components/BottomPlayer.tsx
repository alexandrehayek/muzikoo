// /components/BottomPlayer.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePlayer, Track } from '@/context/PlayerContext';
import CoverImage from '@/components/CoverImage';
import CreatePlaylistModal from '@/components/CreatePlaylistModal';
import ShareModal from '@/components/ShareModal';
import { motion, AnimatePresence } from 'motion/react';

interface LrcLine {
  time: number;
  text: string;
}

function parseLrc(lrcText: string): LrcLine[] {
  if (!lrcText) return [];
  const lines = lrcText.split('\n');
  const result: LrcLine[] = [];
  const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
  for (const line of lines) {
    const match = timeReg.exec(line);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const millis = parseInt(match[3].padEnd(3, '0').slice(0, 3), 10);
      const timeInSec = minutes * 60 + seconds + millis / 1000;
      const text = line.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim();
      result.push({ time: timeInSec, text });
    } else {
      const text = line.trim();
      if (text && !text.startsWith('[')) {
        result.push({ time: -1, text });
      }
    }
  }
  return result;
}

export default function BottomPlayer() {
  const {
    currentTrack,
    isPlaying,
    volume,
    progress,
    duration,
    customPlaylists,
    showAssistant,
    togglePlay,
    nextTrack,
    prevTrack,
    setVolume,
    seek,
    addTrackToPlaylist,
    createPlaylist,
    setShowAssistant,
  } = usePlayer();

  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.8);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showArtworkOverlay, setShowArtworkOverlay] = useState(false);
  const [successPlaylistId, setSuccessPlaylistId] = useState<string | null>(null);

  // Lyrics & Info Tab state
  const [activeOverlayTab, setActiveOverlayTab] = useState<'lyrics' | 'info'>('lyrics');
  const [lyricsData, setLyricsData] = useState<any>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [lyricsError, setLyricsError] = useState<string | null>(null);

  const activeLineRef = useRef<HTMLParagraphElement | null>(null);

  // Fetch lyrics from LRCLIB when overlay opens or currentTrack changes
  useEffect(() => {
    if (!showArtworkOverlay || !currentTrack) return;

    let isMounted = true;

    async function fetchLyrics() {
      if (isMounted) {
        setIsLoadingLyrics(true);
        setLyricsError(null);
        setLyricsData(null);
      }
      try {
        const params = new URLSearchParams();
        if (currentTrack?.artist) params.set('artist_name', currentTrack.artist);
        if (currentTrack?.title) params.set('track_name', currentTrack.title);
        if (currentTrack?.album) params.set('album_name', currentTrack.album);

        const res = await fetch(`/api/lyrics?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch lyrics');
        const data = await res.json();
        if (isMounted) {
          setLyricsData(data.lyrics);
        }
      } catch (err: any) {
        if (isMounted) {
          setLyricsError(err.message || 'Error loading lyrics');
        }
      } finally {
        if (isMounted) {
          setIsLoadingLyrics(false);
        }
      }
    }

    Promise.resolve().then(() => {
      if (isMounted) fetchLyrics();
    });

    return () => {
      isMounted = false;
    };
  }, [
    showArtworkOverlay,
    currentTrack,
  ]);

  // Auto-scroll active synced lyric line into view
  useEffect(() => {
    if (activeOverlayTab === 'lyrics' && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [progress, activeOverlayTab]);

  if (!currentTrack) {
    return (
      <div id="persistent-player" className="h-20 bg-zinc-950 border-t border-zinc-900 px-6 flex items-center justify-center text-zinc-500 text-xs font-mono select-none">
        Select a track to start listening to live MusicBrainz streams.
      </div>
    );
  }

  // Format seconds to mm:ss
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      setVolume(prevVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleAddToPlaylist = (playlistId: string) => {
    addTrackToPlaylist(playlistId, currentTrack);
    setSuccessPlaylistId(playlistId);
    setTimeout(() => {
      setSuccessPlaylistId(null);
      setShowPlaylistModal(false);
    }, 1000);
  };

  const handleCreateAndAddPlaylist = (name: string, isPublic: boolean, canContribute?: boolean) => {
    const newPlaylist = createPlaylist(name, '', isPublic, canContribute);
    if (newPlaylist && currentTrack) {
      addTrackToPlaylist(newPlaylist.id, currentTrack);
      setSuccessPlaylistId(newPlaylist.id);
      setTimeout(() => {
        setSuccessPlaylistId(null);
        setShowPlaylistModal(false);
      }, 1000);
    }
  };

  // Synced lyrics calculation
  const parsedSyncedLyrics = lyricsData?.syncedLyrics ? parseLrc(lyricsData.syncedLyrics) : [];
  let activeLyricIndex = -1;
  if (parsedSyncedLyrics.length > 0) {
    for (let i = 0; i < parsedSyncedLyrics.length; i++) {
      if (parsedSyncedLyrics[i].time !== -1 && progress >= parsedSyncedLyrics[i].time) {
        activeLyricIndex = i;
      } else if (parsedSyncedLyrics[i].time > progress) {
        break;
      }
    }
  }

  return (
    <div id="persistent-player" className="min-h-[88px] sm:h-24 py-2 sm:py-0 bg-zinc-950 border-t border-zinc-900/80 light:border-zinc-700 px-3 sm:px-6 flex items-center justify-between select-none relative z-[200] text-white gap-2 sm:gap-4">
      {/* Left: Track Information */}
      <div className="hidden sm:flex items-center gap-2 sm:gap-4 sm:w-1/4 sm:min-w-[240px] shrink-0">
        <CoverImage
          src={currentTrack.coverUrl}
          alt={currentTrack.title}
          type="track"
          className="hidden sm:block w-14 h-14 rounded-lg object-cover border border-zinc-800 shadow-md animate-fade-in shrink-0"
        />
        <div className="hidden sm:block flex-1 min-w-0 pr-3">
          <Link
            href={`/track/${currentTrack.id}`}
            className="block text-sm font-semibold hover:text-blue-400 transition-colors truncate"
          >
            {currentTrack.title}
          </Link>
          <Link
            href={currentTrack.artistId ? `/artist/${currentTrack.artistId}` : `/search?q=${encodeURIComponent(currentTrack.artist)}`}
            className="block text-xs text-zinc-400 hover:text-white transition-colors truncate"
          >
            {currentTrack.artist}
          </Link>
        </div>

        {/* Action: Add to Playlist Modal Trigger */}
        <div className="hidden sm:block relative">
          <button
            onClick={() => setShowPlaylistModal(true)}
            className="p-2 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-full transition-colors flex items-center justify-center cursor-pointer"
            title="Add to Playlist"
          >
            <span className="material-icons-round text-base leading-none">library_add</span>
          </button>
        </div>
      </div>

      {/* Center: Playback Controls */}
      <div className="flex flex-col items-center justify-center gap-1.5 sm:gap-2.5 w-full sm:w-2/5 sm:max-w-lg min-w-0 px-8 sm:px-1 mx-auto">
        {/* Track Title & Artist (Mobile display: centered above player controls) */}
        <div className="sm:hidden flex flex-col items-center justify-center w-full min-w-0 text-center">
          <Link
            href={`/track/${currentTrack.id}`}
            className="block text-xs font-semibold hover:text-blue-400 transition-colors truncate max-w-[260px] text-center"
          >
            {currentTrack.title}
          </Link>
          <Link
            href={currentTrack.artistId ? `/artist/${currentTrack.artistId}` : `/search?q=${encodeURIComponent(currentTrack.artist)}`}
            className="block text-[11px] text-zinc-400 hover:text-white transition-colors truncate max-w-[260px] text-center"
          >
            {currentTrack.artist}
          </Link>
        </div>

        {/* Row 1: Buttons */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button className="text-zinc-500 hover:text-white transition-colors flex items-center justify-center cursor-pointer" title="Shuffle (Visual only)">
            <span className="material-icons-round text-lg leading-none">shuffle</span>
          </button>

          <button
            onClick={prevTrack}
            className="text-zinc-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
            title="Previous track"
          >
            <span className="material-icons-round text-xl leading-none">skip_previous</span>
          </button>

          <button
            onClick={togglePlay}
            className="w-10 h-10 bg-white text-zinc-950 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shadow-white/5 cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <span className="material-icons-round text-2xl leading-none">pause</span>
            ) : (
              <span className="material-icons-round text-2xl leading-none ml-0.5">play_arrow</span>
            )}
          </button>

          <button
            onClick={nextTrack}
            className="text-zinc-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
            title="Next track"
          >
            <span className="material-icons-round text-xl leading-none">skip_next</span>
          </button>

          <button className="text-zinc-500 hover:text-white transition-colors flex items-center justify-center cursor-pointer" title="Repeat (Visual only)">
            <span className="material-icons-round text-lg leading-none">repeat</span>
          </button>
        </div>

        {/* Row 2: Progress Slider */}
        <div className="flex items-center gap-2 sm:gap-3 w-full text-xs font-mono text-zinc-400">
          <span className="w-8 sm:w-10 text-right text-[11px] sm:text-xs">{formatTime(progress)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={progress}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
            title="Playback slider"
          />
          <span className="w-8 sm:w-10 text-left text-[11px] sm:text-xs">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: Volume, More Menu (AI Guide), Arrow Dropdown Toggle */}
      <div className={`absolute right-3 top-1/2 -translate-y-1/2 sm:static sm:translate-y-0 flex items-center justify-end gap-2 sm:gap-3.5 w-auto sm:w-1/4 sm:min-w-[200px] shrink-0 ${showMoreMenu ? 'z-[360]' : ''}`}>
        {/* Volume controls */}
        <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleMuteToggle}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full transition-all flex items-center justify-center cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <span className="material-icons-round text-lg leading-none text-rose-400">volume_off</span>
            ) : (
              <span className="material-icons-round text-lg leading-none">volume_up</span>
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (parseFloat(e.target.value) > 0) setIsMuted(false);
            }}
            className="hidden sm:block w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-300 focus:outline-none"
            title="Volume slider"
          />
        </div>

        {/* Three Dots Menu */}
        <div className={`relative ${showMoreMenu ? 'z-[360]' : ''}`}>
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`p-2 rounded-full transition-colors flex items-center justify-center cursor-pointer ${
              showMoreMenu
                ? 'bg-zinc-850 text-white'
                : 'hover:bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
            title="More options"
          >
            <span className="material-icons-round text-base leading-none">more_vert</span>
          </button>

          {showMoreMenu && (
            <>
              <div
                className="fixed inset-0 z-[350]"
                onClick={() => setShowMoreMenu(false)}
              />
              <div className="absolute bottom-full right-0 mb-2 bg-zinc-900 border border-zinc-800 rounded-xl p-1.5 w-52 shadow-2xl z-[360] text-left space-y-0.5">
              {/* Lyrics link */}
              <button
                onClick={() => {
                  if (showArtworkOverlay && activeOverlayTab === 'lyrics') {
                    setShowArtworkOverlay(false);
                  } else {
                    setShowArtworkOverlay(true);
                    setActiveOverlayTab('lyrics');
                  }
                  setShowMoreMenu(false);
                }}
                className="w-full text-xs text-left px-3 py-2 hover:bg-zinc-800/90 rounded-lg transition-colors flex items-center gap-2.5 text-zinc-200 hover:text-white font-medium cursor-pointer"
              >
                <span className="material-icons-round text-base text-blue-400">subtitles</span>
                <span>Lyrics</span>
              </button>

              {/* Add to playlist link */}
              <button
                onClick={() => {
                  setShowPlaylistModal(true);
                  setShowMoreMenu(false);
                }}
                className="w-full text-xs text-left px-3 py-2 hover:bg-zinc-800/90 rounded-lg transition-colors flex items-center gap-2.5 text-zinc-200 hover:text-white font-medium cursor-pointer"
              >
                <span className="material-icons-round text-base text-zinc-400">playlist_add</span>
                <span>Add to playlist</span>
              </button>

              {/* Go to artist link */}
              {(currentTrack.artistId || currentTrack.artist) && (
                <Link
                  href={
                    currentTrack.artistId
                      ? `/artist/${currentTrack.artistId}`
                      : `/artist/${encodeURIComponent(currentTrack.artist)}`
                  }
                  onClick={() => setShowMoreMenu(false)}
                  className="w-full text-xs text-left px-3 py-2 hover:bg-zinc-800/90 rounded-lg transition-colors flex items-center gap-2.5 text-zinc-200 hover:text-white font-medium cursor-pointer"
                >
                  <span className="material-icons-round text-base text-zinc-400">person</span>
                  <span>Go to artist</span>
                </Link>
              )}

              {/* Go to album link (when available) */}
              {(currentTrack.releaseId || currentTrack.albumId || currentTrack.album) && (
                <Link
                  href={
                    currentTrack.releaseId
                      ? `/album/${currentTrack.releaseId}`
                      : currentTrack.albumId
                      ? `/album/${currentTrack.albumId}`
                      : `/search?q=${encodeURIComponent(currentTrack.album!)}`
                  }
                  onClick={() => setShowMoreMenu(false)}
                  className="w-full text-xs text-left px-3 py-2 hover:bg-zinc-800/90 rounded-lg transition-colors flex items-center gap-2.5 text-zinc-200 hover:text-white font-medium cursor-pointer"
                >
                  <span className="material-icons-round text-base text-zinc-400">album</span>
                  <span className="truncate">Go to album</span>
                </Link>
              )}

              {/* Share link */}
              <button
                type="button"
                onClick={() => {
                  setShowShareModal(true);
                  setShowMoreMenu(false);
                }}
                className="w-full text-xs text-left px-3 py-2 hover:bg-zinc-800/90 rounded-lg transition-colors flex items-center gap-2.5 text-zinc-200 hover:text-white font-medium cursor-pointer"
              >
                <span className="material-icons-round text-base text-zinc-400">share</span>
                <span className="truncate">Share track</span>
              </button>

              <div className="my-1 border-t border-zinc-800/80" />

              {/* AI Guide */}
              <button
                onClick={() => {
                  setShowAssistant(!showAssistant);
                  setShowMoreMenu(false);
                }}
                className="w-full text-xs text-left px-3 py-2 hover:bg-zinc-800/90 rounded-lg transition-colors flex items-center gap-2.5 text-zinc-200 hover:text-white font-medium cursor-pointer"
              >
                <span className="material-icons-round text-base text-blue-400">auto_awesome</span>
                <span>AI Guide</span>
                {showAssistant && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                )}
              </button>
            </div>
          </>
        )}
        </div>

        {/* Arrow Drop Down / Drop Up Button */}
        <button
          onClick={() => setShowArtworkOverlay(!showArtworkOverlay)}
          className={`hidden sm:flex p-2 rounded-full transition-colors items-center justify-center cursor-pointer ${
            showArtworkOverlay
              ? 'bg-zinc-850 text-white'
              : 'hover:bg-zinc-900 text-zinc-400 hover:text-white'
          }`}
          title={showArtworkOverlay ? 'Collapse overlay' : 'Expand lyrics & track overlay'}
        >
          <span className="material-icons-round text-xl leading-none">
            {showArtworkOverlay ? 'arrow_drop_down' : 'arrow_drop_up'}
          </span>
        </button>
      </div>

      {/* Expanded Overlay Panel: Tab 1 Lyrics, Tab 2 Info */}
      {showArtworkOverlay && (
        <div className="fixed bottom-28 top-[72px] sm:top-20 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 z-[250] bg-zinc-950/95 light:bg-zinc-900/98 border border-zinc-800/90 light:border-zinc-700 rounded-3xl p-5 shadow-2xl backdrop-blur-xl w-[calc(100vw-32px)] max-w-sm sm:w-96 max-h-[calc(100vh-188px)] flex flex-col animate-fade-in text-white space-y-3">
          {/* Header with Tabs and Close Button */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 shrink-0">
            {/* Tab Buttons */}
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
              <button
                onClick={() => setActiveOverlayTab('lyrics')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeOverlayTab === 'lyrics'
                    ? 'bg-blue-500 text-white shadow-md font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <span className="material-icons-round text-sm">subtitles</span>
                <span>Lyrics</span>
              </button>
              <button
                onClick={() => setActiveOverlayTab('info')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeOverlayTab === 'info'
                    ? 'bg-blue-500 text-white shadow-md font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <span className="material-icons-round text-sm">info</span>
                <span>Info</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowArtworkOverlay(false)}
              className="p-1 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-full transition-colors flex items-center justify-center cursor-pointer"
              title="Close overlay"
            >
              <span className="material-icons-round text-xl leading-none">arrow_drop_down</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto pr-1 text-left scrollbar-thin">
            {/* TAB 1: LYRICS */}
            {activeOverlayTab === 'lyrics' && (
              <div className="h-full flex flex-col space-y-3">
                {/* Track Title Summary Header */}
                <div className="border-b border-zinc-900 pb-2">
                  <p className="text-xs font-bold text-white truncate">{currentTrack.title}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{currentTrack.artist}</p>
                </div>

                {isLoadingLyrics ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2.5 text-zinc-500 my-auto">
                    <span className="material-icons-round text-3xl animate-spin text-blue-400">sync</span>
                    <span className="text-xs font-mono">Fetching lyrics from LRCLIB...</span>
                  </div>
                ) : lyricsError ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-zinc-400 my-auto space-y-2">
                    <span className="material-icons-round text-2xl text-rose-400">error_outline</span>
                    <p className="text-xs font-medium text-zinc-300">Could not fetch lyrics</p>
                    <p className="text-[11px] text-zinc-500">{lyricsError}</p>
                  </div>
                ) : lyricsData ? (
                  <div className="space-y-3 pt-1">
                    {/* Instrumental Badge */}
                    {lyricsData.instrumental ? (
                      <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex items-center gap-2.5 text-blue-300">
                        <span className="material-icons-round text-lg text-blue-400">graphic_eq</span>
                        <div className="text-xs">
                          <p className="font-bold">Instrumental Track</p>
                          <p className="text-[10px] text-zinc-400">This song contains no vocal lyrics.</p>
                        </div>
                      </div>
                    ) : parsedSyncedLyrics.length > 0 ? (
                      /* Synced Lyrics Display */
                      <div className="space-y-2 py-1">
                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/15 border border-blue-500/30 text-blue-400 uppercase tracking-wider mb-1">
                          Synced Lyrics
                        </span>
                        {parsedSyncedLyrics.map((line, idx) => {
                          const isActive = idx === activeLyricIndex;
                          return (
                            <p
                              key={idx}
                              ref={isActive ? activeLineRef : null}
                              className={`text-sm transition-all duration-300 leading-relaxed font-medium ${
                                isActive
                                  ? 'text-blue-400 font-extrabold scale-105 origin-left pl-2 border-l-2 border-blue-500'
                                  : 'text-zinc-400 hover:text-zinc-200'
                              }`}
                            >
                              {line.text || '• • •'}
                            </p>
                          );
                        })}
                      </div>
                    ) : lyricsData.plainLyrics ? (
                      /* Plain Lyrics Display */
                      <div className="space-y-2 py-1">
                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-800 border border-zinc-700 text-zinc-400 uppercase tracking-wider mb-1">
                          Plain Lyrics
                        </span>
                        <div className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
                          {lyricsData.plainLyrics}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-zinc-400 my-auto space-y-2">
                        <span className="material-icons-round text-3xl text-zinc-600">subtitles_off</span>
                        <p className="text-xs text-zinc-400">No lyrics available for this track.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-zinc-400 my-auto space-y-2">
                    <span className="material-icons-round text-3xl text-zinc-600">subtitles_off</span>
                    <p className="text-xs text-zinc-400 font-medium">No lyrics found on LRCLIB.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ACTUAL INFO */}
            {activeOverlayTab === 'info' && (
              <div className="space-y-4">
                {/* Artwork */}
                <div className="relative group rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 aspect-square shadow-xl">
                  <CoverImage
                    src={currentTrack.coverUrl}
                    alt={currentTrack.title}
                    type="track"
                    className={`w-full h-full object-cover transition-transform duration-500 ${
                      isPlaying ? 'scale-105' : 'scale-100'
                    }`}
                  />
                  {isPlaying && (
                    <div className="absolute top-3 right-3 bg-zinc-950/80 border border-zinc-800 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono text-blue-400 flex items-center gap-1.5 shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                      Playing
                    </div>
                  )}
                </div>

                {/* Track Details */}
                <div className="space-y-2 text-left">
                  <div>
                    <h4 className="font-extrabold text-base text-white truncate">{currentTrack.title}</h4>
                    <p className="text-xs text-zinc-400 truncate">{currentTrack.artist}</p>
                    {currentTrack.album && (
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                        Album: <span className="text-zinc-400">{currentTrack.album}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {currentTrack.genre && (
                      <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md uppercase">
                        {currentTrack.genre}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md">
                      {formatTime(duration)}
                    </span>
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-xs font-mono text-zinc-400">
                  <Link
                    href={`/track/${currentTrack.id}`}
                    onClick={() => setShowArtworkOverlay(false)}
                    className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 text-[11px] font-semibold"
                  >
                    <span>View Track Details</span>
                    <span className="material-icons-round text-xs">arrow_forward</span>
                  </Link>
                  {currentTrack.artistId && (
                    <Link
                      href={`/artist/${currentTrack.artistId}`}
                      onClick={() => setShowArtworkOverlay(false)}
                      className="text-zinc-400 hover:text-white hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <span>Artist Page</span>
                      <span className="material-icons-round text-xs">person</span>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Centered Modal: Add to Playlist */}
      <AnimatePresence>
        {showPlaylistModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setShowPlaylistModal(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
              aria-hidden="true"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl z-10 text-zinc-100 font-sans space-y-5"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <span className="material-icons-round text-xl">library_add</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">Add to Playlist</h3>
                    <p className="text-xs text-zinc-400 truncate max-w-[240px]">
                      {currentTrack.title} • <span className="text-zinc-500">{currentTrack.artist}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPlaylistModal(false)}
                  className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                  title="Close"
                >
                  <span className="material-icons-round text-xl leading-none">close</span>
                </button>
              </div>

              {/* Playlist Selection List */}
              <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                {customPlaylists.map((p) => {
                  const alreadyHasTrack = p.tracks.some((t) => t.id === currentTrack.id);
                  const isSuccess = successPlaylistId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleAddToPlaylist(p.id)}
                      disabled={alreadyHasTrack || isSuccess}
                      className={`w-full text-xs text-left px-3.5 py-3 rounded-xl transition-all flex items-center justify-between group cursor-pointer border ${
                        alreadyHasTrack
                          ? 'bg-zinc-900/40 border-zinc-800 opacity-60'
                          : isSuccess
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-zinc-900/80 hover:bg-zinc-850 border-zinc-800/80 text-zinc-200 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="material-icons-round text-lg text-zinc-500 group-hover:text-blue-400 transition-colors shrink-0">
                          queue_music
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{p.name}</p>
                          <p className="text-[11px] text-zinc-500">
                            {p.tracks.length} {p.tracks.length === 1 ? 'track' : 'tracks'}
                          </p>
                        </div>
                      </div>

                      {isSuccess ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs shrink-0">
                          <span className="material-icons-round text-base">check_circle</span>
                          <span>Added!</span>
                        </div>
                      ) : alreadyHasTrack ? (
                        <span className="text-[11px] text-zinc-500 font-mono shrink-0 px-2 py-0.5 rounded bg-zinc-800/60">
                          In playlist
                        </span>
                      ) : (
                        <span className="material-icons-round text-base text-zinc-500 group-hover:text-blue-400 transition-colors shrink-0">
                          add_circle_outline
                        </span>
                      )}
                    </button>
                  );
                })}

                {customPlaylists.length === 0 && (
                  <div className="text-center py-6 px-4 bg-zinc-900/40 rounded-xl border border-dashed border-zinc-800 text-zinc-400 space-y-1">
                    <span className="material-icons-round text-2xl text-zinc-600 block">playlist_play</span>
                    <p className="text-xs font-medium">No playlists created yet.</p>
                    <p className="text-[11px] text-zinc-500">Create your first playlist below to add this track.</p>
                  </div>
                )}
              </div>

              {/* Action Button: Create New Playlist */}
              <div className="pt-2 border-t border-zinc-800">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-blue-500/40 text-blue-400 hover:text-blue-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <span className="material-icons-round text-base">add</span>
                  <span>New playlist</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Linked Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={(name, isPublic, canContribute) => {
          setShowCreateModal(false);
          handleCreateAndAddPlaylist(name, isPublic, canContribute);
        }}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Track"
        subtitle={`${currentTrack?.title}${currentTrack?.artist ? ` • ${currentTrack.artist}` : ''}`}
        shareUrl={typeof window !== 'undefined' ? `${window.location.origin}/track/${encodeURIComponent(currentTrack?.id || '')}` : ''}
      />
    </div>
  );
}

