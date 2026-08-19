'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { formatCount } from '@/lib/utils';

export interface TagItem {
  rank: number;
  name: string;
  count: number;
  reach: number;
  url?: string;
}

type SortOption = 'rank' | 'reach' | 'name';
type ViewMode = 'grid' | 'cloud' | 'compact';

export default function TopTagsPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('rank');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');

  useEffect(() => {
    let active = true;

    async function fetchTopTags() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/music?action=toptags&num_res=1000');
        if (!res.ok) throw new Error('Failed to fetch top tags');
        const data = await res.json();
        if (active) {
          setTags(data.topTags || []);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Failed to load top tags');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchTopTags();

    return () => {
      active = false;
    };
  }, []);

  // Compute alphabet list present in tags
  const alphabet = useMemo(() => {
    return ['ALL', '#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
  }, []);

  // Filter and sort tags
  const filteredTags = useMemo(() => {
    let list = [...tags];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }

    // Filter by letter
    if (selectedLetter !== 'ALL') {
      if (selectedLetter === '#') {
        list = list.filter((t) => !/^[a-zA-Z]/.test(t.name));
      } else {
        list = list.filter((t) => t.name.toUpperCase().startsWith(selectedLetter));
      }
    }

    // Sort list
    if (sortBy === 'rank') {
      list.sort((a, b) => (b.count || 0) - (a.count || 0) || a.rank - b.rank);
    } else if (sortBy === 'reach') {
      list.sort((a, b) => (b.reach || 0) - (a.reach || 0));
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [tags, searchQuery, selectedLetter, sortBy]);

  // Max count for tag cloud scaling
  const maxCount = useMemo(() => {
    if (tags.length === 0) return 1;
    return Math.max(...tags.map((t) => t.count || 1), 1);
  }, [tags]);

  return (
    <div className="space-y-8 pb-24 animate-fade-in max-w-7xl mx-auto font-sans">
      {/* Hero Header */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-900 p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-3 z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-blue-400">
            <span className="material-icons-round text-blue-400 text-lg">label</span>
            <span className="font-mono text-xs uppercase font-bold tracking-widest">
              Last.fm Taxonomy &bull; Global Music Charts
            </span>
          </div>
          <h1 className="font-sans font-extrabold text-3xl sm:text-5xl text-white tracking-tight leading-none">
            Top Tags & Genres
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
            Explore 1,000 top tags categorized by music lovers worldwide. Click any genre to discover its top tracks, albums, and artists.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 z-10 shrink-0">
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl px-5 py-3 text-center shadow-inner">
            <span className="block font-mono text-xl sm:text-2xl font-extrabold text-white">
              {tags.length ? tags.length.toLocaleString() : '1,000'}
            </span>
            <span className="block font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
              Total Tags
            </span>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-zinc-900/40 border border-zinc-900 rounded-2xl p-4 shadow-sm">
          {/* Search Input */}
          <div className="relative flex-1">
            <span className="material-icons-round absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-lg">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across 1,000 tags (e.g. rock, indie, electronic, synthwave)..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-1"
              >
                <span className="material-icons-round text-base">close</span>
              </button>
            )}
          </div>

          {/* Sort and View Controls */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Sort Selector */}
            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setSortBy('rank')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  sortBy === 'rank'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Most Tagged
              </button>
              <button
                onClick={() => setSortBy('reach')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  sortBy === 'reach'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Highest Reach
              </button>
              <button
                onClick={() => setSortBy('name')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  sortBy === 'name'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                A &ndash; Z
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1 text-zinc-400">
              <button
                onClick={() => setViewMode('grid')}
                title="Grid View"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'hover:text-zinc-200'
                }`}
              >
                <span className="material-icons-round text-lg">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode('cloud')}
                title="Tag Cloud View"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'cloud' ? 'bg-zinc-800 text-white' : 'hover:text-zinc-200'
                }`}
              >
                <span className="material-icons-round text-lg">bubble_chart</span>
              </button>
              <button
                onClick={() => setViewMode('compact')}
                title="Compact Badges View"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'compact' ? 'bg-zinc-800 text-white' : 'hover:text-zinc-200'
                }`}
              >
                <span className="material-icons-round text-lg">view_list</span>
              </button>
            </div>
          </div>
        </div>

        {/* Alphabet Quick Filter */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-xs font-mono">
          {alphabet.map((letter) => (
            <button
              key={letter}
              onClick={() => setSelectedLetter(letter)}
              className={`px-2.5 py-1 rounded-lg shrink-0 transition-all font-bold cursor-pointer ${
                selectedLetter === letter
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </section>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
        <span>
          Showing <strong className="text-white">{filteredTags.length}</strong> of {tags.length} tags
          {searchQuery && <span> matching &ldquo;{searchQuery}&rdquo;</span>}
          {selectedLetter !== 'ALL' && <span> starting with &ldquo;{selectedLetter}&rdquo;</span>}
        </span>
        {filteredTags.length < tags.length && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedLetter('ALL');
            }}
            className="text-blue-400 hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm flex items-center gap-3">
          <span className="material-icons-round text-base">error_outline</span>
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className="h-20 bg-zinc-900/30 border border-zinc-900 rounded-2xl p-3.5 flex flex-col justify-between animate-pulse"
            >
              <div className="w-2/3 h-4 bg-zinc-800 rounded" />
              <div className="w-1/3 h-3 bg-zinc-850 rounded" />
            </div>
          ))}
        </div>
      ) : filteredTags.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/15 border border-zinc-900/60 rounded-3xl p-8 space-y-3 animate-fade-in">
          <span className="material-icons-round text-5xl text-zinc-600">label_off</span>
          <h3 className="text-base font-bold text-white">No tags found</h3>
          <p className="text-zinc-400 text-xs max-w-sm mx-auto">
            No tags matched your current search &ldquo;{searchQuery}&rdquo; or letter filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedLetter('ALL');
            }}
            className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* 1. Grid Cards View */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 animate-fade-in">
          {filteredTags.map((tag) => (
            <Link
              key={tag.name}
              href={`/tag/${encodeURIComponent(tag.name)}`}
              className="bg-zinc-900/30 hover:bg-zinc-900 border border-zinc-800 hover:border-blue-500/40 rounded-2xl p-4 flex flex-col justify-between transition-all group shadow-sm hover:shadow-md hover:scale-[1.02] relative"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span className="font-bold text-blue-400/80 group-hover:text-blue-400">
                    #{tag.rank}
                  </span>
                  {tag.reach > 0 && (
                    <span title={`${tag.reach.toLocaleString()} listeners reach`}>
                      {formatCount(tag.reach)} reach
                    </span>
                  )}
                </div>

                <div className="font-bold text-sm text-zinc-200 group-hover:text-white transition-colors truncate">
                  #{tag.name}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span className="text-zinc-500">
                  {tag.count ? `${formatCount(tag.count)} tagged` : 'Popular tag'}
                </span>
                <span className="material-icons-round text-sm text-zinc-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all">
                  arrow_forward
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : viewMode === 'cloud' ? (
        /* 2. Tag Cloud View */
        <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-3xl p-6 sm:p-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4 animate-fade-in">
          {filteredTags.map((tag) => {
            const ratio = tag.count ? Math.max(0.2, tag.count / maxCount) : 0.2;
            const isTop = tag.rank <= 50;

            return (
              <Link
                key={tag.name}
                href={`/tag/${encodeURIComponent(tag.name)}`}
                style={{
                  fontSize: `${Math.max(12, Math.min(22, 12 + ratio * 14))}px`,
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border transition-all hover:scale-105 cursor-pointer font-mono uppercase tracking-wider ${
                  isTop
                    ? 'bg-blue-500/15 hover:bg-blue-500 text-blue-300 hover:text-white border-blue-500/30 font-bold'
                    : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800 font-semibold'
                }`}
                title={`Rank #${tag.rank} • ${tag.count ? tag.count.toLocaleString() + ' taggings' : ''}`}
              >
                <span className="text-blue-400/80">#</span>
                {tag.name}
              </Link>
            );
          })}
        </div>
      ) : (
        /* 3. Compact Badges List View */
        <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-3xl overflow-hidden divide-y divide-zinc-900/60 shadow-lg animate-fade-in">
          {filteredTags.map((tag) => (
            <Link
              key={tag.name}
              href={`/tag/${encodeURIComponent(tag.name)}`}
              className="flex items-center justify-between px-6 py-3.5 hover:bg-zinc-900/50 transition-colors group"
            >
              <div className="flex items-center gap-4 truncate">
                <span className="font-mono text-xs text-zinc-500 w-10 text-center shrink-0">
                  #{tag.rank}
                </span>
                <span className="font-bold text-sm text-zinc-200 group-hover:text-blue-400 transition-colors truncate">
                  #{tag.name}
                </span>
              </div>

              <div className="flex items-center gap-6 text-xs font-mono text-zinc-400 shrink-0">
                {tag.reach > 0 && (
                  <span className="hidden sm:inline text-zinc-500">
                    {tag.reach.toLocaleString()} reach
                  </span>
                )}
                <span className="text-zinc-300 font-semibold">
                  {tag.count ? `${tag.count.toLocaleString()} tags` : ''}
                </span>
                <span className="material-icons-round text-sm text-zinc-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all">
                  chevron_right
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
