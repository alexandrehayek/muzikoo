'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import CoverImage from '@/components/CoverImage';

export default function AlbumsClient() {
  const params = useParams();
  const id = params.id as string;

  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'album' | 'single'>('all');

  async function fetchArtistDetails() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/music?action=artist&id=${id}`);
      if (!res.ok) throw new Error('Failed to fetch artist details');
      const data = await res.json();
      setArtist(data);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Loading Full Discography...</span>
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

  const releaseGroups = artist['release-groups'] || artist.releases || [];

  const isSingleOrEPGroup = (g: any) => {
    const pType = (g['primary-type'] || g.type || '').toLowerCase();
    const sTypes = (g['secondary-types'] || []).map((s: string) => String(s).toLowerCase());
    if (pType === 'single' || pType === 'ep' || pType === 'other' || pType === 'broadcast') return true;
    if (sTypes.includes('single') || sTypes.includes('ep') || sTypes.includes('remix')) return true;
    if (g.title && /\b(single|ep|remix|mix|feat|instrumental)\b/i.test(g.title)) return true;
    return false;
  };

  const isAlbumGroup = (g: any) => {
    const pType = (g['primary-type'] || g.type || '').toLowerCase();
    if (isSingleOrEPGroup(g)) return false;
    if (pType === 'album') return true;
    return !pType;
  };

  const albumCount = releaseGroups.filter((g: any) => isAlbumGroup(g)).length;
  const singleCount = releaseGroups.filter((g: any) => isSingleOrEPGroup(g)).length;

  const filteredGroups = releaseGroups.filter((g: any) => {
    if (activeTab === 'album') return isAlbumGroup(g);
    if (activeTab === 'single') return isSingleOrEPGroup(g);
    return true;
  });

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

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-900 pb-4">
          <div>
            <h1 className="font-sans font-extrabold text-2xl sm:text-3xl text-white tracking-tight flex items-center gap-3">
              <span className="material-icons-round text-blue-500 text-3xl">album</span>
              All Albums & Discography
            </h1>
            <p className="text-xs text-zinc-500 mt-1 font-mono uppercase tracking-wider">
              {artist.name} &bull; {releaseGroups.length} releases in total
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800/80 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-blue-500 text-white font-bold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All ({releaseGroups.length})
            </button>
            <button
              onClick={() => setActiveTab('album')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'album'
                  ? 'bg-blue-500 text-white font-bold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Albums ({albumCount})
            </button>
            <button
              onClick={() => setActiveTab('single')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'single'
                  ? 'bg-blue-500 text-white font-bold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Singles & EPs ({singleCount})
            </button>
          </div>
        </div>
      </div>

      {/* Grid List */}
      {filteredGroups.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/15 border border-zinc-900/60 rounded-2xl p-8 space-y-2 animate-fade-in">
          <span className="material-icons-round text-5xl text-zinc-650 block">album</span>
          <p className="text-zinc-400 text-sm">No albums matching the selected filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-fade-in">
          {filteredGroups.map((group: any) => {
            const coverUrl = group.image || `https://coverartarchive.org/release-group/${group.id}/front-250`;
            const releaseYear = group['first-release-date']?.split('-')[0];
            const primaryType = group['primary-type'] || group.type || 'Album';

            return (
              <div
                key={group.id}
                className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-4 flex flex-col gap-3 group hover:bg-zinc-900 hover:border-zinc-800 transition-all shadow"
              >
                <div className="aspect-square w-full rounded-xl overflow-hidden relative border border-zinc-800 shadow bg-zinc-950">
                  <CoverImage
                    src={coverUrl}
                    alt={group.title}
                    type="album"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/10" />
                </div>
                <div className="truncate text-left space-y-0.5">
                  <Link
                    href={`/album/${encodeURIComponent(group.id)}`}
                    className="block text-xs font-bold text-white hover:text-blue-400 transition-colors truncate"
                  >
                    {group.title}
                  </Link>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                    {releaseYear && <span>{releaseYear}</span>}
                    {primaryType && (
                      <span className="uppercase text-[9px] bg-zinc-850 px-1.5 py-0.2 rounded text-zinc-400">
                        {primaryType}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
