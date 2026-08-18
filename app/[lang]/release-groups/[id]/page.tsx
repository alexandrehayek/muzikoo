// /app/[lang]/release-groups/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import CoverImage from '@/components/CoverImage';
import { motion } from 'motion/react';

export default function ReleaseGroupDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchGroupDetails() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/music?action=release-group&id=${id}`);
      if (!res.ok) throw new Error('Failed to fetch release group details');
      const data = await res.json();
      setGroup(data);
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
        if (active) fetchGroupDetails();
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
        <span className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Resolving Master Release Group...</span>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">
          {error || 'Release Group not found'}
        </div>
        <Link href="/" className="inline-block bg-zinc-900 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-xl text-xs font-semibold">
          Return Home
        </Link>
      </div>
    );
  }

  const artistName = group['artist-credit']?.[0]?.name || 'Unknown Artist';
  const artistId = group['artist-credit']?.[0]?.artist?.id || '';
  const releases = group.releases || [];

  const coverUrl = group.image || `https://coverartarchive.org/release-group/${group.id}/front-500`;

  return (
    <div className="space-y-10 pb-20 animate-fade-in max-w-5xl mx-auto font-sans">
      {/* Header Profile Banner */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-900 p-8 sm:p-10 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Album Cover Art */}
        <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 relative group shrink-0 shadow-lg">
          <CoverImage
            src={coverUrl}
            fallbackSrc={group.fallbackImage}
            alt={group.title}
            type="album"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/15" />
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            <span className="font-mono text-[10px] font-semibold text-blue-400 uppercase bg-blue-500/10 border border-blue-500/10 px-2.5 py-1 rounded-full">
              {group['primary-type'] || 'Album / Release Group'}
            </span>
            {group['first-release-date'] && (
              <span className="text-zinc-400 text-xs flex items-center gap-1 font-mono">
                <span className="material-icons-round text-sm text-zinc-500 block">calendar_today</span>
                Released {group['first-release-date']}
              </span>
            )}
          </div>

          <h1 className="font-sans font-extrabold text-2xl sm:text-4xl text-white tracking-tight leading-tight">
            {group.title}
          </h1>

          <div className="flex items-center justify-center md:justify-start gap-2 text-sm">
            <span className="text-zinc-500">By</span>
            {artistId ? (
              <Link
                href={`/artist/${artistId}`}
                className="hover:text-blue-400 font-bold text-white transition-colors flex items-center gap-1"
              >
                <span className="material-icons-round text-zinc-500 text-base block">person</span>
                {artistName}
              </Link>
            ) : (
              <span className="text-zinc-400 font-bold">{artistName}</span>
            )}
          </div>

          {group.disambiguation && (
            <p className="text-zinc-500 text-xs italic">
              &ldquo;{group.disambiguation}&rdquo;
            </p>
          )}

          {/* Tags */}
          {group.tags && group.tags.length > 0 && (
            <div className="flex flex-wrap justify-center md:justify-start gap-1.5 pt-1">
              {group.tags.slice(0, 8).map((t: any, idx: number) => {
                const tagName = typeof t === 'string' ? t : (t?.name || t?.title || '');
                if (!tagName) return null;
                return (
                  <Link
                    key={tagName + idx}
                    href={`/tag/${encodeURIComponent(tagName)}`}
                    className="text-[10px] font-mono uppercase bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded-full hover:text-blue-400 hover:border-blue-500/20 transition-all animate-fade-in"
                  >
                    #{tagName}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Available Release Editions / Pressings */}
      <section className="space-y-4">
        <h2 className="font-sans font-extrabold text-lg text-white tracking-tight flex items-center gap-2 border-b border-zinc-900 pb-3">
          <span className="material-icons-round text-blue-500 text-xl block font-bold">layers</span>
          Available Release Editions ({releases.length} versions)
        </h2>

        {releases.length === 0 ? (
          <p className="text-zinc-500 text-sm">No release editions found under this catalog entry.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            {releases.map((rel: any) => (
              <div
                key={rel.id}
                className="bg-zinc-900/15 hover:bg-zinc-900/30 border border-zinc-900/60 hover:border-zinc-800 p-5 rounded-2xl flex items-center justify-between gap-4 transition-all group"
              >
                <div className="flex items-center gap-4 truncate">
                  <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 shadow overflow-hidden flex items-center justify-center shrink-0">
                    <CoverImage
                      src={rel.image || `https://coverartarchive.org/release/${rel.id}/front-250`}
                      fallbackSrc={coverUrl}
                      alt={rel.title}
                      type="album"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="truncate">
                    <h3 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors truncate">
                      {rel.title || group.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-zinc-500 mt-1">
                      {rel.status && <span>{rel.status}</span>}
                      {rel.country && <span>&bull; {rel.country}</span>}
                      {rel.date && <span>&bull; {rel.date.split('-')[0]}</span>}
                    </div>
                  </div>
                </div>

                <Link
                  href={`/album/${rel.id}`}
                  className="p-2.5 rounded-xl bg-zinc-850 hover:bg-blue-500 text-zinc-300 hover:text-white transition-all flex items-center justify-center shrink-0 shadow cursor-pointer group-hover:scale-105"
                  title="Inspect Release Tracklist"
                >
                  <span className="material-icons-round text-base block">arrow_forward</span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
