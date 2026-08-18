// /app/[lang]/tag/[name]/page.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usePlayer, Track } from '@/context/PlayerContext';
import CoverImage from '@/components/CoverImage';
import TrackMenu from '@/components/TrackMenu';

export default function TagDetailPage() {
  const params = useParams();
  const name = params.name as string;
  const { playTrack, currentTrack, isPlaying } = usePlayer();

  const [recordingsList, setRecordingsList] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const observerRef = useRef<HTMLDivElement | null>(null);

  async function fetchTagDetails() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/music?action=tag&name=${encodeURIComponent(name)}&page=1&limit=50`);
      if (!res.ok) throw new Error('Failed to fetch tag recordings');
      const data = await res.json();
      const initialTracks = data.recordings || [];
      setRecordingsList(initialTracks);
      setPage(1);
      setHasMore(initialTracks.length >= 50);
    } catch (err: any) {
      const msg = String(err.message || '');
      if (msg.includes('Rate') || msg.includes('exceeded') || msg.includes('29')) {
        setError('Music service rate limit reached. Please try again shortly.');
      } else {
        setError(err.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  }

  const loadNextPage = useCallback(async () => {
    if (loadingMore || !hasMore || !name) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await fetch(`/api/music?action=tag&name=${encodeURIComponent(name)}&page=${nextPage}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        const newTracks = data.recordings || [];
        if (newTracks.length > 0) {
          setRecordingsList((prev) => {
            const existingKeys = new Set(prev.map((r: any) => r.id || r.title || r.name));
            const filteredNew = newTracks.filter((r: any) => {
              const key = r.id || r.title || r.name;
              return !existingKeys.has(key);
            });
            return [...prev, ...filteredNew];
          });
          setPage(nextPage);
        }
        if (newTracks.length < 50) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load more tracks for tag:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [name, page, loadingMore, hasMore]);

  useEffect(() => {
    let active = true;
    if (name) {
      Promise.resolve().then(() => {
        if (active) fetchTagDetails();
      });
    }
    return () => {
      active = false;
    };
  }, [name]);

  useEffect(() => {
    const element = observerRef.current;
    if (!element || loadingMore || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [loadingMore, hasMore, loading, loadNextPage]);

  const formatDuration = (ms?: number) => {
    if (!ms) return '3:00';
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Gathering Tagged Taxonomies...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-fade-in max-w-5xl mx-auto">
      {/* Tag Hero Header */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-900 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-3 flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-blue-500">
            <span className="material-icons-round text-blue-500 text-lg block">local_offer</span>
            <span className="font-mono text-[10px] uppercase font-bold tracking-widest">Core Genre / Taxonomy</span>
          </div>
          <h1 className="font-sans font-extrabold text-3xl sm:text-5xl text-white tracking-tight capitalize leading-none">
            #{name}
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm">
            Top tracks registered in the global community with the #{name} tag &bull; {recordingsList.length} tracks loaded
          </p>
        </div>

        <button
          onClick={() => {
            if (recordingsList.length > 0) {
              const playlistTracks = recordingsList.map((rec: any) => ({
                id: rec.id,
                title: rec.title || rec.name,
                artist: rec['artist-credit']?.[0]?.name || rec.artist || 'Unknown Artist',
                artistId: rec['artist-credit']?.[0]?.artist?.id || rec.artistId || '',
                album: rec['releases']?.[0]?.title || 'Single',
                audioUrl: rec.audioUrl,
                coverUrl: rec.coverUrl,
                genre: name,
                duration: rec.duration ? Math.floor(rec.duration / 1000) : rec.length ? Math.floor(rec.length / 1000) : 180,
              }));
              playTrack(playlistTracks[0], playlistTracks);
            }
          }}
          disabled={recordingsList.length === 0}
          className="bg-white hover:bg-zinc-200 text-zinc-950 px-6 py-3 rounded-xl font-bold text-xs shrink-0 flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer font-sans"
        >
          <span className="material-icons-round text-zinc-950 text-base block">play_arrow</span>
          Play All Tagged
        </button>
      </section>

      {/* Recordings Table */}
      <section className="space-y-4">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        {!error && recordingsList.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/15 border border-zinc-900/60 rounded-2xl p-8 space-y-2 animate-fade-in">
            <span className="material-icons-round text-5xl text-zinc-650 block">music_off</span>
            <p className="text-zinc-400 text-sm">No recordings tagged under &quot;{name}&quot; found</p>
          </div>
        ) : (
          <div className="bg-zinc-900/20 border border-zinc-900/40 rounded-2xl overflow-hidden divide-y divide-zinc-900/40 shadow shadow-lg animate-fade-in">
            {recordingsList.map((rec, idx) => {
              const isCurrent = currentTrack?.id === rec.id;
              const playerTrack: Track = {
                id: rec.id,
                title: rec.title || rec.name,
                artist: rec['artist-credit']?.[0]?.name || rec.artist || 'Unknown Artist',
                artistId: rec['artist-credit']?.[0]?.artist?.id || rec.artistId || '',
                album: rec['releases']?.[0]?.title || 'Single',
                audioUrl: rec.audioUrl,
                coverUrl: rec.coverUrl,
                genre: name,
                duration: rec.duration ? Math.floor(rec.duration / 1000) : rec.length ? Math.floor(rec.length / 1000) : 180,
              };

              return (
                <div
                  key={(rec.id || rec.title || rec.name) + idx}
                  className={`flex items-center justify-between px-6 py-4.5 hover:bg-zinc-900/40 transition-colors group ${
                    isCurrent ? 'bg-zinc-900/20 text-blue-400' : 'text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-4 truncate">
                    <span className="font-mono text-xs text-zinc-500 w-5 text-center shrink-0">
                      {idx + 1}
                    </span>
                    <button
                      onClick={() => playTrack(playerTrack, recordingsList.map((r: any) => ({
                        id: r.id,
                        title: r.title || r.name,
                        artist: r['artist-credit']?.[0]?.name || r.artist || 'Unknown Artist',
                        artistId: r['artist-credit']?.[0]?.artist?.id || r.artistId || '',
                        album: r['releases']?.[0]?.title || 'Single',
                        audioUrl: r.audioUrl,
                        coverUrl: r.coverUrl,
                        genre: name,
                        duration: r.duration ? Math.floor(r.duration / 1000) : r.length ? Math.floor(r.length / 1000) : 180,
                      })))}
                      className={`w-8.5 h-8.5 rounded-full bg-zinc-800 hover:bg-blue-500 hover:text-white flex items-center justify-center text-zinc-300 transition-all cursor-pointer shrink-0 ${
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
                      src={playerTrack.coverUrl}
                      alt={playerTrack.title}
                      type="track"
                      className="w-10 h-10 object-cover rounded-lg bg-zinc-950 border border-zinc-800 shadow shrink-0"
                    />

                    <div className="truncate text-left">
                      <Link
                        href={`/track/${encodeURIComponent(rec.id)}`}
                        className="font-bold text-sm block hover:text-blue-400 hover:underline transition-all truncate text-white"
                      >
                        {rec.title || rec.name}
                      </Link>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                        {rec['artist-credit']?.[0]?.artist?.id ? (
                          <Link href={`/artist/${rec['artist-credit'][0].artist.id}`} className="hover:text-white hover:underline truncate">
                            {rec['artist-credit'][0].name}
                          </Link>
                        ) : (
                          <span className="truncate">{playerTrack.artist}</span>
                        )}
                        {rec['releases']?.[0]?.id && (
                          <>
                            <span>&bull;</span>
                            <Link href={`/album/${rec['releases'][0].id}`} className="hover:text-white hover:underline truncate max-w-[120px] text-zinc-500">
                              {rec['releases'][0].title}
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 pl-3">
                    <span className="font-mono text-xs text-zinc-500">
                      {formatDuration(rec.duration || rec.length)}
                    </span>
                    <TrackMenu track={playerTrack} />
                  </div>
                </div>
              );
            })}

            {/* Bottom loader sentinel */}
            <div ref={observerRef} className="py-6 flex justify-center items-center">
              {loadingMore && (
                <div className="flex items-center space-x-2 text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  <span>Loading next 50 tracks...</span>
                </div>
              )}
              {!hasMore && recordingsList.length > 0 && (
                <span className="text-xs font-mono text-zinc-600 uppercase tracking-wider">
                  End of tracklist
                </span>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
