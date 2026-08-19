'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePlayer, Track } from '@/context/PlayerContext';
import CoverImage from '@/components/CoverImage';
import TrackMenu from '@/components/TrackMenu';
import { formatCount } from '@/lib/utils';

export default function HomeClient() {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const [loading, setLoading] = useState(true);
  const [topTags, setTopTags] = useState<any[]>([]);
  const [topArtists, setTopArtists] = useState<any[]>([]);
  const [topTracks, setTopTracks] = useState<any[]>([]);

  useEffect(() => {
    async function fetchCharts() {
      try {
        setLoading(true);
        const res = await fetch('/api/music?action=charts');
        if (res.ok) {
          const data = await res.json();
          setTopTags(data.topTags || []);
          setTopArtists(data.topArtists || []);
          setTopTracks(data.topTracks || []);
        }
      } catch (err) {
        console.error('Failed to fetch charts:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCharts();
  }, []);

  return (
    <div className="space-y-12 pb-20 animate-fade-in max-w-7xl mx-auto font-sans">
      {/* 1. Top Tags (20) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <h2 className="font-sans font-extrabold text-2xl text-white tracking-tight flex items-center gap-2.5">
            <span className="material-icons-round text-2xl text-blue-500">label</span>
            Top Tags
          </h2>
          <Link
            href="/toptags"
            style={{ color: 'var(--color-blue-400, #60a5fa)' }}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/20"
          >
            <span style={{ color: 'var(--color-blue-400, #60a5fa)' }}>See All</span>
            <span className="material-icons-round text-base" style={{ color: 'var(--color-blue-400, #60a5fa)' }}>chevron_right</span>
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-wrap gap-2.5">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="h-9 w-24 bg-zinc-900/60 border border-zinc-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {topTags.slice(0, 20).map((tag) => (
              <Link
                key={tag.name}
                href={`/tag/${encodeURIComponent(tag.name)}`}
                className="bg-zinc-900/80 hover:bg-zinc-800 hover:text-blue-400 border border-zinc-800/80 hover:border-blue-500/30 px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 transition-all font-mono uppercase tracking-wider shadow-sm flex items-center gap-1.5 group"
              >
                <span className="text-blue-500/70 group-hover:text-blue-400">#</span>
                {tag.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 2. Top Artists (20) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <h2 className="font-sans font-extrabold text-2xl text-white tracking-tight flex items-center gap-2.5">
            <span className="material-icons-round text-2xl text-blue-500">people</span>
            Top Artists
          </h2>
          <Link
            href="/topartists"
            style={{ color: 'var(--color-blue-400, #60a5fa)' }}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/20"
          >
            <span style={{ color: 'var(--color-blue-400, #60a5fa)' }}>See All</span>
            <span className="material-icons-round text-base" style={{ color: 'var(--color-blue-400, #60a5fa)' }}>chevron_right</span>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-4 animate-pulse flex flex-col items-center gap-3">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-zinc-800" />
                <div className="w-3/4 h-4 bg-zinc-800 rounded" />
                <div className="w-1/2 h-3 bg-zinc-850 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {topArtists.slice(0, 20).map((artist, idx) => (
              <Link
                key={artist.id || idx}
                href={`/artist/${encodeURIComponent(artist.id)}`}
                className="bg-zinc-900/20 hover:bg-zinc-900/80 border border-zinc-900/60 hover:border-zinc-800 rounded-2xl p-4 flex flex-col items-center text-center gap-3 transition-all group shadow hover:shadow-lg relative"
              >
                <span className="absolute top-3 left-3 font-mono text-[11px] font-bold text-zinc-500 bg-zinc-950/80 px-2 py-0.5 rounded-full border border-zinc-800">
                  #{idx + 1}
                </span>

                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border border-zinc-800 shadow bg-zinc-950 mt-1">
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
                  {formatCount(artist.listeners) && (
                    <span className="block text-[10px] text-zinc-500 font-mono mt-0.5 truncate">
                      {formatCount(artist.listeners)} listeners
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 3. Top Tracks (50) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <h2 className="font-sans font-extrabold text-2xl text-white tracking-tight flex items-center gap-2.5">
            <span className="material-icons-round text-2xl text-blue-500">graphic_eq</span>
            Top Tracks
          </h2>
          <Link
            href="/toptracks"
            style={{ color: 'var(--color-blue-400, #60a5fa)' }}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/20"
          >
            <span style={{ color: 'var(--color-blue-400, #60a5fa)' }}>See All</span>
            <span className="material-icons-round text-base" style={{ color: 'var(--color-blue-400, #60a5fa)' }}>chevron_right</span>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="h-16 bg-zinc-900/30 border border-zinc-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="bg-zinc-900/20 border border-zinc-900/40 rounded-2xl overflow-hidden shadow-md divide-y divide-zinc-900/40">
            {topTracks.slice(0, 50).map((tr, idx) => {
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
                  key={tr.id || idx}
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
                          topTracks.slice(0, 50).map((item) => ({
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
        )}
      </section>
    </div>
  );
}
