'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePlayer, Track } from '@/context/PlayerContext';
import CoverImage from '@/components/CoverImage';
import TrackMenu from '@/components/TrackMenu';
import { formatCount } from '@/lib/utils';

export default function TopTracksPage() {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Initial fetch for Page 1
  useEffect(() => {
    async function fetchInitialTopTracks() {
      try {
        setLoading(true);
        const res = await fetch('/api/music?action=toptracks&limit=50&page=1');
        if (res.ok) {
          const data = await res.json();
          const items = data.topTracks || [];
          setTracks(items);
          if (items.length < 50) setHasMore(false);
        }
      } catch (err) {
        console.error('Failed to load top tracks:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchInitialTopTracks();
  }, []);

  // Function to load the next page
  const loadNextPage = useCallback(async () => {
    if (loading || loadingMore || !hasMore || searchFilter) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const res = await fetch(`/api/music?action=toptracks&limit=50&page=${nextPage}`);
      if (res.ok) {
        const data = await res.json();
        const newItems = data.topTracks || [];
        if (newItems.length < 50) setHasMore(false);

        if (newItems.length > 0) {
          setTracks((prev) => {
            const existingKeys = new Set(
              prev.map((t) => `${t.title || t.name}-${t.artist}`)
            );
            const filteredNew = newItems.filter(
              (t: any) => !existingKeys.has(`${t.title || t.name}-${t.artist}`)
            );
            return [...prev, ...filteredNew];
          });
          setPage(nextPage);
        }
      }
    } catch (err) {
      console.error('Failed to load more top tracks:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, page, searchFilter]);

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadNextPage();
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadNextPage]);

  const filteredTracks = tracks.filter(
    (t) =>
      t.title?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.artist?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20 animate-fade-in max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <span className="font-mono text-xs font-semibold text-blue-500 tracking-wider uppercase bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/10">
            Last.fm Charts
          </span>
          <h1 className="font-sans font-extrabold text-3xl sm:text-4xl text-white tracking-tight mt-2 flex items-center gap-3">
            <span className="material-icons-round text-3xl text-blue-500">music_note</span>
            Top Tracks
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Top global trending recordings and singles ranked by plays and listeners. ({tracks.length} loaded)
          </p>
        </div>

        {/* Filter Input */}
        <div className="relative w-full md:w-72">
          <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-lg pointer-events-none">search</span>
          <input
            type="text"
            placeholder="Filter tracks or artists..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-[14.4px] text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Content Table / List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="h-16 bg-zinc-900/30 border border-zinc-900 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredTracks.length === 0 ? (
        <div className="p-12 text-center text-zinc-500 bg-zinc-900/20 rounded-2xl border border-zinc-900">
          No tracks found matching your filter.
        </div>
      ) : (
        <>
          <div className="bg-zinc-900/20 border border-zinc-900/40 rounded-2xl overflow-hidden shadow-md divide-y divide-zinc-900/40">
            {filteredTracks.map((tr, idx) => {
              const isCurrent = currentTrack?.id === tr.id;
              const playerTrack: Track = {
                id: tr.id,
                title: tr.title || tr.name,
                artist: tr.artist,
                artistId: tr.artistId || tr.artist,
                album: 'Last.fm Chart Single',
                audioUrl: tr.audioUrl,
                coverUrl: tr.coverUrl || tr.image,
                genre: tr.genre || 'Top Chart',
                duration: tr.duration || 180,
              };

              return (
                <div
                  key={tr.id || `${tr.title}-${idx}`}
                  className={`flex items-center justify-between px-5 py-3.5 hover:bg-zinc-900/40 transition-colors group ${
                    isCurrent ? 'bg-zinc-900/60 text-blue-400' : 'text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="font-mono text-xs font-bold text-zinc-500 w-7 text-center shrink-0">
                      #{idx + 1}
                    </span>

                    <button
                      onClick={() =>
                        playTrack(
                          playerTrack,
                          filteredTracks.map((item) => ({
                            id: item.id,
                            title: item.title || item.name,
                            artist: item.artist,
                            artistId: item.artistId || item.artist,
                            album: 'Last.fm Chart Single',
                            audioUrl: item.audioUrl,
                            coverUrl: item.coverUrl || item.image,
                            genre: item.genre || 'Top Chart',
                            duration: item.duration || 180,
                          }))
                        )
                      }
                      className="w-10 h-10 rounded-lg overflow-hidden relative border border-zinc-800 shrink-0 group-hover:border-blue-500/50 transition-colors bg-zinc-950"
                    >
                      <CoverImage src={tr.coverUrl || tr.image} alt={tr.title} type="track" className="w-full h-full object-cover" />
                      <div
                        className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                          isCurrent && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {isCurrent && isPlaying ? (
                          <span className="material-icons-round text-lg text-blue-400">pause</span>
                        ) : (
                          <span className="material-icons-round text-lg text-white">play_arrow</span>
                        )}
                      </div>
                    </button>

                    <div className="truncate text-left">
                      <Link
                        href={`/track/${encodeURIComponent(tr.id)}`}
                        className="font-bold text-sm block hover:text-blue-400 transition-colors truncate text-white"
                      >
                        {tr.title || tr.name}
                      </Link>
                      <Link
                        href={`/artist/${encodeURIComponent(tr.artistId || tr.artist)}`}
                        className="text-xs text-zinc-400 hover:text-white transition-colors block mt-0.5 truncate"
                      >
                        {tr.artist}
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 pl-4">
                    {formatCount(tr.listeners) && (
                      <span className="font-mono text-xs text-zinc-500 hidden sm:inline">
                        {formatCount(tr.listeners)} listeners
                      </span>
                    )}
                    {formatCount(tr.playcount) && (
                      <span className="font-mono text-xs text-zinc-500 hidden md:inline">
                        {formatCount(tr.playcount)} plays
                      </span>
                    )}
                    <span className="font-mono text-xs text-zinc-500">
                      {Math.floor((tr.duration || 180) / 60)}:{String((tr.duration || 180) % 60).padStart(2, '0')}
                    </span>
                    <TrackMenu track={playerTrack} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Infinite Scroll Sentinel / Loading Indicator */}
          <div ref={sentinelRef} className="pt-8 flex flex-col items-center justify-center min-h-[80px]">
            {loadingMore && (
              <div className="flex items-center gap-3 text-zinc-400 text-sm font-mono bg-zinc-900/80 px-4 py-2.5 rounded-full border border-zinc-800 shadow">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Loading next 50 tracks...
              </div>
            )}
            {!hasMore && tracks.length > 0 && (
              <p className="text-zinc-600 font-mono text-xs uppercase tracking-wider">
                End of top tracks chart
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
