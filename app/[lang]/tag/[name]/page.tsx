// /app/[lang]/tag/[name]/page.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usePlayer, Track } from '@/context/PlayerContext';
import CoverImage from '@/components/CoverImage';
import TrackMenu from '@/components/TrackMenu';
import { formatCount } from '@/lib/utils';

type ActiveTab = 'tracks' | 'albums' | 'artists';

export default function TagDetailPage() {
  const params = useParams();
  const name = (params?.name as string) || '';
  const decodedName = decodeURIComponent(name);
  const { playTrack, currentTrack, isPlaying } = usePlayer();

  const [activeTab, setActiveTab] = useState<ActiveTab>('tracks');
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const observerRef = useRef<HTMLDivElement | null>(null);

  // Fetch initial data when tag name or activeTab changes
  useEffect(() => {
    let active = true;

    async function fetchTagData() {
      if (!name) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/music?action=tag&name=${encodeURIComponent(decodedName)}&type=${activeTab}&page=1&limit=50`
        );
        if (!res.ok) throw new Error(`Failed to fetch top ${activeTab} for tag`);
        const data = await res.json();
        
        let newItems: any[] = [];
        if (activeTab === 'tracks') {
          newItems = data.recordings || data.tracks || data.items || [];
        } else if (activeTab === 'albums') {
          newItems = data.albums || data.items || [];
        } else if (activeTab === 'artists') {
          newItems = data.artists || data.items || [];
        }

        if (active) {
          setItems(newItems);
          setPage(1);
          setHasMore(newItems.length >= 50);
        }
      } catch (err: any) {
        if (!active) return;
        const msg = String(err.message || '');
        if (msg.includes('Rate') || msg.includes('exceeded') || msg.includes('29')) {
          setError('Music service rate limit reached. Please try again shortly.');
        } else {
          setError(err.message || 'Something went wrong');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchTagData();

    return () => {
      active = false;
    };
  }, [name, decodedName, activeTab]);

  // Load next page function for infinite scroll
  const loadNextPage = useCallback(async () => {
    if (loading || loadingMore || !hasMore || !name) return;
    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const res = await fetch(
        `/api/music?action=tag&name=${encodeURIComponent(decodedName)}&type=${activeTab}&page=${nextPage}&limit=50`
      );

      if (res.ok) {
        const data = await res.json();
        let newItems: any[] = [];
        if (activeTab === 'tracks') {
          newItems = data.recordings || data.tracks || data.items || [];
        } else if (activeTab === 'albums') {
          newItems = data.albums || data.items || [];
        } else if (activeTab === 'artists') {
          newItems = data.artists || data.items || [];
        }

        if (newItems.length > 0) {
          setItems((prev) => {
            if (activeTab === 'tracks') {
              const existingKeys = new Set(prev.map((t: any) => t.id || `${t.title || t.name}-${t.artist}`));
              const filteredNew = newItems.filter(
                (t: any) => !existingKeys.has(t.id || `${t.title || t.name}-${t.artist}`)
              );
              return [...prev, ...filteredNew];
            } else if (activeTab === 'albums') {
              const existingKeys = new Set(prev.map((a: any) => a.id || `${a.name}-${a.artist}`));
              const filteredNew = newItems.filter(
                (a: any) => !existingKeys.has(a.id || `${a.name}-${a.artist}`)
              );
              return [...prev, ...filteredNew];
            } else {
              const existingKeys = new Set(prev.map((ar: any) => ar.id || ar.name));
              const filteredNew = newItems.filter(
                (ar: any) => !existingKeys.has(ar.id || ar.name)
              );
              return [...prev, ...filteredNew];
            }
          });
          setPage(nextPage);
        }

        if (newItems.length < 50) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error(`Failed to load more ${activeTab} for tag:`, err);
    } finally {
      setLoadingMore(false);
    }
  }, [name, decodedName, page, loading, loadingMore, hasMore, activeTab]);

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    const sentinel = observerRef.current;
    if (!sentinel || loadingMore || !hasMore || loading) return;

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
  }, [loadingMore, hasMore, loading, loadNextPage]);

  const formatDuration = (ms?: number) => {
    if (!ms) return '3:00';
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const getPlaylistTracks = (): Track[] => {
    return items.map((rec: any) => ({
      id: rec.id,
      title: rec.title || rec.name,
      artist: rec['artist-credit']?.[0]?.name || rec.artist || 'Unknown Artist',
      artistId: rec['artist-credit']?.[0]?.artist?.id || rec.artistId || '',
      album: rec['releases']?.[0]?.title || 'Single',
      audioUrl: rec.audioUrl,
      coverUrl: rec.coverUrl || rec.image,
      genre: decodedName,
      duration: rec.duration
        ? Math.floor(rec.duration / 1000)
        : rec.length
        ? Math.floor(rec.length / 1000)
        : 180,
    }));
  };

  return (
    <div className="space-y-8 pb-20 animate-fade-in max-w-6xl mx-auto font-sans">
      {/* Tag Hero Header */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-900 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-3 flex-1 text-center sm:text-left z-10">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-blue-500">
            <span className="material-icons-round text-blue-500 text-lg block">local_offer</span>
            <span className="font-mono text-[10px] uppercase font-bold tracking-widest">
              Core Genre &bull; Last.fm Taxonomy
            </span>
          </div>
          <h1 className="font-sans font-extrabold text-3xl sm:text-5xl text-white tracking-tight capitalize leading-none">
            #{decodedName}
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-xl">
            Discover top tracks, albums, and artists categorized under the <span className="text-zinc-200 font-semibold">#{decodedName}</span> genre tag.
          </p>
        </div>

        {activeTab === 'tracks' && items.length > 0 && (
          <button
            onClick={() => {
              const playlistTracks = getPlaylistTracks();
              if (playlistTracks.length > 0) {
                playTrack(playlistTracks[0], playlistTracks);
              }
            }}
            className="bg-white hover:bg-zinc-200 text-zinc-950 px-6 py-3.5 rounded-xl font-bold text-xs shrink-0 flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer font-sans z-10"
          >
            <span className="material-icons-round text-zinc-950 text-base block">play_arrow</span>
            Play All Tagged
          </button>
        )}
      </section>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setActiveTab('tracks')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'tracks'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <span className="material-icons-round text-lg">music_note</span>
            Top Tracks
          </button>

          <button
            onClick={() => setActiveTab('albums')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'albums'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <span className="material-icons-round text-lg">album</span>
            Top Albums
          </button>

          <button
            onClick={() => setActiveTab('artists')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'artists'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <span className="material-icons-round text-lg">groups</span>
            Top Artists
          </button>
        </div>

        <div className="font-mono text-xs text-zinc-500">
          Showing {items.length} {activeTab} for <span className="text-zinc-300 font-bold">#{decodedName}</span>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm flex items-center gap-3">
          <span className="material-icons-round text-base">error_outline</span>
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        activeTab === 'tracks' ? (
          <div className="space-y-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-16 bg-zinc-900/30 border border-zinc-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : activeTab === 'albums' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-4 animate-pulse flex flex-col gap-3">
                <div className="aspect-square w-full rounded-xl bg-zinc-800" />
                <div className="w-3/4 h-4 bg-zinc-800 rounded" />
                <div className="w-1/2 h-3 bg-zinc-850 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-4 animate-pulse flex flex-col items-center gap-3">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-zinc-800" />
                <div className="w-3/4 h-4 bg-zinc-800 rounded" />
                <div className="w-1/2 h-3 bg-zinc-850 rounded" />
              </div>
            ))}
          </div>
        )
      ) : items.length === 0 && !error ? (
        <div className="text-center py-20 bg-zinc-900/15 border border-zinc-900/60 rounded-2xl p-8 space-y-2 animate-fade-in">
          <span className="material-icons-round text-5xl text-zinc-600 block">
            {activeTab === 'tracks' ? 'music_off' : activeTab === 'albums' ? 'album' : 'person_off'}
          </span>
          <p className="text-zinc-400 text-sm">
            No top {activeTab} tagged under &quot;#{decodedName}&quot; found
          </p>
        </div>
      ) : activeTab === 'tracks' ? (
        /* Top Tracks List */
        <div className="bg-zinc-900/20 border border-zinc-900/40 rounded-2xl overflow-hidden divide-y divide-zinc-900/40 shadow-lg animate-fade-in">
          {items.map((rec, idx) => {
            const isCurrent = currentTrack?.id === rec.id;
            const playerTrack: Track = {
              id: rec.id,
              title: rec.title || rec.name,
              artist: rec['artist-credit']?.[0]?.name || rec.artist || 'Unknown Artist',
              artistId: rec['artist-credit']?.[0]?.artist?.id || rec.artistId || '',
              album: rec['releases']?.[0]?.title || 'Single',
              audioUrl: rec.audioUrl,
              coverUrl: rec.coverUrl || rec.image,
              genre: decodedName,
              duration: rec.duration
                ? Math.floor(rec.duration / 1000)
                : rec.length
                ? Math.floor(rec.length / 1000)
                : 180,
            };

            return (
              <div
                key={(rec.id || rec.title || rec.name) + idx}
                className={`flex items-center justify-between px-5 py-3.5 hover:bg-zinc-900/40 transition-colors group ${
                  isCurrent ? 'bg-zinc-900/50 text-blue-400' : 'text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-4 truncate">
                  <span className="font-mono text-xs text-zinc-500 w-6 text-center shrink-0">
                    #{idx + 1}
                  </span>

                  <button
                    onClick={() => playTrack(playerTrack, getPlaylistTracks())}
                    className={`w-9 h-9 rounded-lg overflow-hidden relative border border-zinc-800 shrink-0 group-hover:border-blue-500/50 transition-colors bg-zinc-950 cursor-pointer ${
                      isCurrent ? 'border-blue-500' : ''
                    }`}
                  >
                    <CoverImage
                      src={playerTrack.coverUrl}
                      alt={playerTrack.title}
                      type="track"
                      className="w-full h-full object-cover"
                    />
                    <div
                      className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                        isCurrent && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isCurrent && isPlaying ? (
                        <span className="material-icons-round text-base text-blue-400">pause</span>
                      ) : (
                        <span className="material-icons-round text-base text-white pl-0.5">play_arrow</span>
                      )}
                    </div>
                  </button>

                  <div className="truncate text-left">
                    <Link
                      href={`/track/${encodeURIComponent(rec.id)}`}
                      className="font-bold text-sm block hover:text-blue-400 transition-colors truncate text-white"
                    >
                      {rec.title || rec.name}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                      {rec['artist-credit']?.[0]?.artist?.id || rec.artistId ? (
                        <Link
                          href={`/artist/${encodeURIComponent(rec['artist-credit']?.[0]?.artist?.id || rec.artistId || rec.artist)}`}
                          className="hover:text-white transition-colors truncate"
                        >
                          {rec['artist-credit']?.[0]?.name || rec.artist}
                        </Link>
                      ) : (
                        <span className="truncate">{playerTrack.artist}</span>
                      )}
                      {rec['releases']?.[0]?.title && (
                        <>
                          <span>&bull;</span>
                          <span className="truncate text-zinc-500 text-[11px]">
                            {rec['releases'][0].title}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 pl-3">
                  {rec.listeners && (
                    <span className="font-mono text-xs text-zinc-500 hidden md:inline">
                      {formatCount(rec.listeners)} listeners
                    </span>
                  )}
                  <span className="font-mono text-xs text-zinc-500">
                    {formatDuration(rec.duration || rec.length)}
                  </span>
                  <TrackMenu track={playerTrack} />
                </div>
              </div>
            );
          })}
        </div>
      ) : activeTab === 'albums' ? (
        /* Top Albums Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-fade-in">
          {items.map((album, idx) => (
            <div
              key={album.id || `${album.name}-${idx}`}
              className="bg-zinc-900/20 hover:bg-zinc-900/80 border border-zinc-900/60 hover:border-zinc-800 rounded-2xl p-4 flex flex-col gap-3 transition-all group shadow hover:shadow-lg relative"
            >
              <span className="absolute top-3 left-3 z-10 font-mono text-xs font-bold text-zinc-400 bg-zinc-950/80 px-2 py-0.5 rounded-full border border-zinc-800/80 backdrop-blur-sm">
                #{idx + 1}
              </span>

              <div className="aspect-square w-full rounded-xl overflow-hidden relative border border-zinc-800 shadow bg-zinc-950 mt-1">
                <CoverImage
                  src={album.image}
                  alt={album.name || album.title}
                  type="album"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="w-full truncate text-left space-y-0.5">
                <Link
                  href={`/album/${encodeURIComponent(album.id || album.mbid || album.name)}`}
                  className="block font-bold text-sm text-white group-hover:text-blue-400 transition-colors truncate"
                  title={album.name || album.title}
                >
                  {album.name || album.title}
                </Link>
                <Link
                  href={`/artist/${encodeURIComponent(album.artistId || album.artist)}`}
                  className="block text-xs text-zinc-400 hover:text-white transition-colors truncate"
                  title={album.artist}
                >
                  {album.artist}
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Top Artists Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-fade-in">
          {items.map((artist, idx) => (
            <Link
              key={artist.id || `${artist.name}-${idx}`}
              href={`/artist/${encodeURIComponent(artist.id || artist.name)}`}
              className="bg-zinc-900/20 hover:bg-zinc-900/80 border border-zinc-900/60 hover:border-zinc-800 rounded-2xl p-4 flex flex-col items-center text-center gap-3 transition-all group shadow hover:shadow-lg relative"
            >
              <span className="absolute top-3 left-3 font-mono text-xs font-bold text-zinc-400 bg-zinc-950/80 px-2 py-0.5 rounded-full border border-zinc-800/80 backdrop-blur-sm">
                #{idx + 1}
              </span>

              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border border-zinc-800 shadow bg-zinc-950 mt-2">
                <CoverImage
                  src={artist.image}
                  alt={artist.name}
                  type="artist"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="w-full truncate">
                <span className="block font-bold text-sm text-white group-hover:text-blue-400 transition-colors truncate">
                  {artist.name}
                </span>
                <span className="block text-[10px] text-zinc-500 font-mono mt-0.5 uppercase tracking-wider">
                  Artist
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Infinite Scroll Sentinel / Loading Indicator */}
      {!loading && items.length > 0 && (
        <div ref={observerRef} className="pt-8 flex flex-col items-center justify-center min-h-[80px]">
          {loadingMore && (
            <div className="flex items-center space-x-3 text-xs font-mono text-zinc-400 uppercase tracking-wider">
              <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <span>Loading next 50 {activeTab}...</span>
            </div>
          )}
          {!hasMore && items.length > 0 && (
            <span className="text-xs font-mono text-zinc-600 uppercase tracking-wider">
              End of {activeTab} list
            </span>
          )}
        </div>
      )}
    </div>
  );
}
