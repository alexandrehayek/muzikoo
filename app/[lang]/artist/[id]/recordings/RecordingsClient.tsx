'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usePlayer, Track } from '@/context/PlayerContext';
import { getSampleMusic } from '@/lib/musicbrainz';
import CoverImage from '@/components/CoverImage';
import TrackMenu from '@/components/TrackMenu';

export default function RecordingsClient() {
  const params = useParams();
  const id = params.id as string;
  const { playTrack, currentTrack, isPlaying } = usePlayer();

  const [artist, setArtist] = useState<any>(null);
  const [recordingsList, setRecordingsList] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const observerRef = useRef<HTMLDivElement | null>(null);

  async function fetchArtistDetails() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/music?action=artist&id=${id}`);
      if (!res.ok) throw new Error('Failed to fetch artist details');
      const data = await res.json();
      setArtist(data);
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
    if (loadingMore || !hasMore || !artist) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await fetch(`/api/music?action=artist-tracks&id=${encodeURIComponent(id)}&page=${nextPage}&limit=50`);
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
      console.error('Failed to load more tracks:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [id, page, loadingMore, hasMore, artist]);

  useEffect(() => {
    let active = true;
    if (id) {
      Promise.resolve().then(() => {
        if (active) fetchArtistDetails();
      });
    }
    return () => {
      active = false;
    };
  }, [id]);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Compiling Full Discography...</span>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">
          {error || 'Artist not found'}
        </div>
        <Link href="/" className="inline-block bg-zinc-900 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-xl text-xs font-semibold">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-fade-in max-w-6xl mx-auto font-sans">
      {/* Navigation & Header */}
      <div className="flex flex-col gap-4">
        <Link
          href={`/artist/${artist.id}`}
          className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <span className="material-icons-round text-sm block">arrow_back</span>
          Back to {artist.name} Profile
        </Link>
        <div>
          <h1 className="font-sans font-extrabold text-2xl sm:text-3xl text-white tracking-tight flex items-center gap-3">
            <span className="material-icons-round text-blue-500 text-3xl">music_note</span>
            All Tracks
          </h1>
          <p className="text-xs text-zinc-500 mt-1 font-mono uppercase tracking-wider">
            {artist.name} &bull; {recordingsList.length} tracks loaded
          </p>
        </div>
      </div>

      {recordingsList.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/15 border border-zinc-900/60 rounded-2xl p-8 space-y-2 animate-fade-in">
          <span className="material-icons-round text-5xl text-zinc-650 block">music_off</span>
          <p className="text-zinc-400 text-sm">No tracks indexed for this artist</p>
        </div>
      ) : (
        <div className="bg-zinc-900/20 border border-zinc-900/40 rounded-2xl overflow-hidden shadow-lg animate-fade-in">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-zinc-800/40 text-xs font-mono text-zinc-500 uppercase tracking-wider items-center">
            <span className="col-span-1 text-center">#</span>
            <span className="col-span-6">Title</span>
            <span className="col-span-4">Associated Album/Single</span>
            <span className="col-span-1 text-right flex items-center justify-end">
              <span className="material-icons-round text-base block text-zinc-500">schedule</span>
            </span>
          </div>

          <div className="divide-y divide-zinc-900/30">
            {recordingsList.map((rec: any, idx: number) => {
              const isCurrent = currentTrack?.id === rec.id;
              const trackTitle = rec.title || rec.name;
              const relId = rec.releases?.[0]?.id;
              const relGroupId = rec.releases?.[0]?.['release-group']?.id;
              const musicMeta = getSampleMusic(rec.id, relId, relGroupId, rec.coverUrl);
              const playerTrack: Track = {
                id: rec.id,
                title: trackTitle,
                artist: artist.name,
                artistId: artist.id,
                album: rec.releases?.[0]?.title || 'Single / Collection',
                audioUrl: rec.audioUrl || musicMeta.audioUrl,
                coverUrl: rec.coverUrl || musicMeta.coverUrl,
                genre: rec.genre || musicMeta.genre,
                duration: rec.length ? Math.floor(rec.length / 1000) : 180,
              };

              return (
                <div
                  key={(rec.id || trackTitle) + idx}
                  className={`grid grid-cols-12 gap-4 px-6 py-4.5 items-center hover:bg-zinc-900/30 transition-colors group ${
                    isCurrent ? 'bg-zinc-900/20 text-blue-400' : 'text-zinc-300'
                  }`}
                >
                  <div className="col-span-1 flex justify-center">
                    <button
                      onClick={() => playTrack(playerTrack, recordingsList.map((r: any) => {
                        const rTitle = r.title || r.name;
                        const rRelId = r.releases?.[0]?.id;
                        const rRelGroupId = r.releases?.[0]?.['release-group']?.id;
                        const meta = getSampleMusic(r.id, rRelId, rRelGroupId, r.coverUrl);
                        return {
                          id: r.id,
                          title: rTitle,
                          artist: artist.name,
                          artistId: artist.id,
                          album: r.releases?.[0]?.title || 'Single / Collection',
                          audioUrl: r.audioUrl || meta.audioUrl,
                          coverUrl: r.coverUrl || meta.coverUrl,
                          genre: r.genre || meta.genre,
                          duration: r.length ? Math.floor(r.length / 1000) : 180,
                        };
                      }))}
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
                  </div>

                  <div className="col-span-6 flex items-center gap-3.5 truncate">
                    <CoverImage
                      src={playerTrack.coverUrl}
                      alt={playerTrack.title}
                      type="track"
                      className="w-10 h-10 object-cover rounded-lg bg-zinc-950 border border-zinc-800 shadow shrink-0"
                    />
                    <div className="truncate text-left">
                      <Link
                        href={`/track/${rec.id}`}
                        className="font-bold text-sm block hover:text-blue-400 hover:underline transition-all truncate text-white"
                      >
                        {trackTitle}
                      </Link>
                      <span className="text-[10px] text-zinc-500 font-mono block mt-0.5 uppercase tracking-wide">
                        {playerTrack.genre}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-4 text-xs text-zinc-400 truncate">
                    {relId ? (
                      <Link href={`/album/${relId}`} className="hover:text-white transition-colors truncate block">
                        {rec.releases?.[0]?.title || 'Single / Collection'}
                      </Link>
                    ) : (
                      <span className="truncate block">{rec.releases?.[0]?.title || 'Single / Collection'}</span>
                    )}
                  </div>

                  <div className="col-span-1 text-right font-mono text-xs text-zinc-500 flex items-center justify-end gap-2">
                    <span>
                      {rec.length ? (
                        `${Math.floor(rec.length / 60000)}:${String(Math.floor((rec.length % 60000) / 1000)).padStart(2, '0')}`
                      ) : (
                        '3:00'
                      )}
                    </span>
                    <TrackMenu track={playerTrack} />
                  </div>
                </div>
              );
            })}
          </div>

          <div ref={observerRef} className="py-6 text-center text-xs font-mono text-zinc-500">
            {loadingMore && (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading more tracks...</span>
              </div>
            )}
            {!hasMore && recordingsList.length > 0 && <span>End of discography</span>}
          </div>
        </div>
      )}
    </div>
  );
}
