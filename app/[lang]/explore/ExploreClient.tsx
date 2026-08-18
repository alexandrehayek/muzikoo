'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePlayer, Track } from '@/context/PlayerContext';
import CoverImage from '@/components/CoverImage';
import { formatCount } from '@/lib/utils';
import countryData from '@/lib/country-codes.json';

type ActiveTab = 'tracks' | 'artists';

export default function ExploreClient() {
  const { playTrack, currentTrack, isPlaying } = usePlayer();

  // Selected country (default to United States of America)
  const [selectedCountry, setSelectedCountry] = useState('United States of America');
  const [activeTab, setActiveTab] = useState<ActiveTab>('tracks');

  // List states
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Initial load or tab/country change
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      try {
        const action = activeTab === 'tracks' ? 'geotoptracks' : 'geotopartists';
        const res = await fetch(
          `/api/music?action=${action}&country=${encodeURIComponent(selectedCountry)}&limit=50&page=1`
        );

        if (res.ok && isMounted) {
          const data = await res.json();
          const newItems = activeTab === 'tracks' ? data.topTracks || [] : data.topArtists || [];
          setHasMore(newItems.length >= 50);
          setItems(newItems);
          setPage(1);
        }
      } catch (err) {
        console.error(`Failed to fetch geo ${activeTab}:`, err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedCountry, activeTab]);

  // Load next page function for infinite scroll
  const loadNextPage = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const nextPage = page + 1;
      const action = activeTab === 'tracks' ? 'geotoptracks' : 'geotopartists';
      const res = await fetch(
        `/api/music?action=${action}&country=${encodeURIComponent(selectedCountry)}&limit=50&page=${nextPage}`
      );

      if (res.ok) {
        const data = await res.json();
        const newItems = activeTab === 'tracks' ? data.topTracks || [] : data.topArtists || [];

        setHasMore(newItems.length >= 50);

        setItems((prev) => {
          if (activeTab === 'tracks') {
            const existingKeys = new Set(prev.map((t) => `${t.title || t.name}-${t.artist}`));
            const filteredNew = newItems.filter(
              (t: any) => !existingKeys.has(`${t.title || t.name}-${t.artist}`)
            );
            return [...prev, ...filteredNew];
          } else {
            const existingIds = new Set(prev.map((a) => a.id || a.name));
            const filteredNew = newItems.filter((a: any) => !existingIds.has(a.id || a.name));
            return [...prev, ...filteredNew];
          }
        });

        setPage(nextPage);
      }
    } catch (err) {
      console.error(`Failed to fetch more geo ${activeTab}:`, err);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, page, activeTab, selectedCountry]);

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

  return (
    <div className="space-y-8 pb-20 animate-fade-in max-w-7xl mx-auto font-sans">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-900 pb-6">
        <div>
          <span className="font-mono text-xs font-semibold text-blue-500 tracking-wider uppercase bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/10">
            Global Music Explorer
          </span>
          <h1 className="font-sans font-extrabold text-3xl sm:text-4xl text-white tracking-tight mt-2 flex items-center gap-3">
            <span className="material-icons-round text-3xl text-blue-500">public</span>
            Explore Charts
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Discover trending tracks and top artists around the world powered by Last.fm Geo data.
          </p>
        </div>

        {/* Country Selector */}
        <div className="w-full md:w-80 flex flex-col gap-1.5">
          <label htmlFor="country-select" className="text-xs font-mono uppercase text-zinc-400 font-medium">
            Select Country
          </label>
          <div className="relative">
            <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-lg pointer-events-none">
              location_on
            </span>
            <select
              id="country-select"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 focus:border-blue-500/50 rounded-xl pl-9 pr-8 py-2.5 text-sm font-semibold text-white focus:outline-none transition-colors appearance-none cursor-pointer"
            >
              {countryData.map((c) => (
                <option key={c['alpha-2'] || c.name} value={c.name} className="bg-zinc-950 text-white">
                  {c.name}
                </option>
              ))}
            </select>
            <span className="material-icons-round absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-lg pointer-events-none">
              expand_more
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
        <button
          onClick={() => setActiveTab('tracks')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'tracks'
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
              : 'bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <span className="material-icons-round text-lg">music_note</span>
          Top Tracks
        </button>

        <button
          onClick={() => setActiveTab('artists')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'artists'
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
              : 'bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <span className="material-icons-round text-lg">groups</span>
          Top Artists
        </button>

        <div className="ml-auto font-mono text-xs text-zinc-500">
          Showing {items.length} {activeTab} for <span className="text-zinc-300 font-bold">{selectedCountry}</span>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        activeTab === 'tracks' ? (
          <div className="space-y-3">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="h-16 bg-zinc-900/30 border border-zinc-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-4 animate-pulse flex flex-col items-center gap-3">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-zinc-800" />
                <div className="w-3/4 h-4 bg-zinc-800 rounded" />
                <div className="w-1/2 h-3 bg-zinc-850 rounded" />
              </div>
            ))}
          </div>
        )
      ) : items.length === 0 ? (
        <div className="p-12 text-center text-zinc-500 bg-zinc-900/20 rounded-2xl border border-zinc-900">
          No top {activeTab} data available for {selectedCountry}.
        </div>
      ) : activeTab === 'tracks' ? (
        /* Tracks List */
        <div className="bg-zinc-900/20 border border-zinc-900/40 rounded-2xl overflow-hidden shadow-md divide-y divide-zinc-900/40">
          {items.map((tr, idx) => {
            const isCurrent = currentTrack?.id === tr.id;
            const playerTrack: Track = {
              id: tr.id,
              title: tr.title || tr.name,
              artist: tr.artist,
              artistId: tr.artistId || tr.artist,
              album: `${selectedCountry} Top Track`,
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
                        items.map((item) => ({
                          id: item.id,
                          title: item.title || item.name,
                          artist: item.artist,
                          artistId: item.artistId || item.artist,
                          album: `${selectedCountry} Top Track`,
                          audioUrl: item.audioUrl,
                          coverUrl: item.coverUrl || item.image,
                          genre: item.genre || 'Top Chart',
                          duration: item.duration || 180,
                        }))
                      )
                    }
                    className="w-10 h-10 rounded-lg overflow-hidden relative border border-zinc-800 shrink-0 group-hover:border-blue-500/50 transition-colors bg-zinc-950 cursor-pointer"
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

                <div className="flex items-center gap-6 shrink-0 pl-4">
                  {formatCount(tr.listeners) && (
                    <span className="font-mono text-xs text-zinc-500 hidden sm:inline">
                      {formatCount(tr.listeners)} listeners
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Artists Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((artist, idx) => (
            <Link
              key={artist.id || `${artist.name}-${idx}`}
              href={`/artist/${encodeURIComponent(artist.id || artist.name)}`}
              className="bg-zinc-900/20 hover:bg-zinc-900/80 border border-zinc-900/60 hover:border-zinc-800 rounded-2xl p-4 flex flex-col items-center text-center gap-3 transition-all group shadow hover:shadow-lg relative"
            >
              <span className="absolute top-3 left-3 font-mono text-xs font-bold text-zinc-500 bg-zinc-950/80 px-2 py-0.5 rounded-full border border-zinc-800/80">
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

      {/* Infinite Scroll Sentinel / Loading Indicator */}
      {!loading && items.length > 0 && (
        <div ref={sentinelRef} className="pt-8 flex flex-col items-center justify-center min-h-[80px]">
          {loadingMore && (
            <div className="flex items-center gap-3 text-zinc-400 text-sm font-mono bg-zinc-900/80 px-4 py-2.5 rounded-full border border-zinc-800 shadow">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Loading next 50 {activeTab}...
            </div>
          )}
          {!hasMore && (
            <p className="text-zinc-600 font-mono text-xs uppercase tracking-wider">
              End of top {activeTab} for {selectedCountry}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
