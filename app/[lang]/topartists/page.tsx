'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import CoverImage from '@/components/CoverImage';
import { formatCount } from '@/lib/utils';

export default function TopArtistsPage() {
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Initial fetch for Page 1
  useEffect(() => {
    async function fetchInitialTopArtists() {
      try {
        setLoading(true);
        const res = await fetch('/api/music?action=topartists&limit=50&page=1');
        if (res.ok) {
          const data = await res.json();
          const items = data.topArtists || [];
          setArtists(items);
          if (items.length < 50) setHasMore(false);
        }
      } catch (err) {
        console.error('Failed to load top artists:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchInitialTopArtists();
  }, []);

  // Function to load the next page
  const loadNextPage = useCallback(async () => {
    if (loading || loadingMore || !hasMore || searchFilter) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const res = await fetch(`/api/music?action=topartists&limit=50&page=${nextPage}`);
      if (res.ok) {
        const data = await res.json();
        const newItems = data.topArtists || [];
        if (newItems.length < 50) setHasMore(false);

        if (newItems.length > 0) {
          setArtists((prev) => {
            const existingIds = new Set(prev.map((a) => a.id || a.name));
            const filteredNew = newItems.filter((a: any) => !existingIds.has(a.id || a.name));
            return [...prev, ...filteredNew];
          });
          setPage(nextPage);
        }
      }
    } catch (err) {
      console.error('Failed to load more top artists:', err);
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

  const filteredArtists = artists.filter((a) =>
    a.name?.toLowerCase().includes(searchFilter.toLowerCase())
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
            <span className="material-icons-round text-3xl text-blue-500">group</span>
            Top Artists
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Top trending artists ranked by global Last.fm listeners and plays. ({artists.length} loaded)
          </p>
        </div>

        {/* Filter Input */}
        <div className="relative w-full md:w-72">
          <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-lg pointer-events-none">search</span>
          <input
            type="text"
            placeholder="Filter artists..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-[14.4px] text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Content Grid */}
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
      ) : filteredArtists.length === 0 ? (
        <div className="p-12 text-center text-zinc-500 bg-zinc-900/20 rounded-2xl border border-zinc-900">
          No artists found matching your filter.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredArtists.map((artist, idx) => (
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

          {/* Infinite Scroll Sentinel / Loading Indicator */}
          <div ref={sentinelRef} className="pt-8 flex flex-col items-center justify-center min-h-[80px]">
            {loadingMore && (
              <div className="flex items-center gap-3 text-zinc-400 text-sm font-mono bg-zinc-900/80 px-4 py-2.5 rounded-full border border-zinc-800 shadow">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Loading next 50 artists...
              </div>
            )}
            {!hasMore && artists.length > 0 && (
              <p className="text-zinc-600 font-mono text-xs uppercase tracking-wider">
                End of top artists chart
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
