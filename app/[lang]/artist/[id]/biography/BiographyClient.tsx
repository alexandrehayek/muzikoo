'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import CoverImage from '@/components/CoverImage';
import { cleanBioHtml } from '@/lib/lastfm';

export default function BiographyClient() {
  const params = useParams();
  const id = params.id as string;

  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <span className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Loading Biography...</span>
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

  const bioText = artist.bioContent || artist.bioSummary || artist.bio || 'No biography available for this artist.';
  const cleanedBio = cleanBioHtml(bioText);

  return (
    <div className="space-y-6 pb-20 animate-fade-in max-w-4xl mx-auto font-sans">
      {/* Navigation & Header */}
      <div className="flex flex-col gap-4">
        <Link
          href={`/artist/${artist.id}`}
          className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <span className="material-icons-round text-sm block">arrow_back</span>
          Back to {artist.name} Profile
        </Link>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
          <div className="flex items-center gap-4">
            {artist.image && (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-zinc-800 shadow bg-zinc-950 shrink-0">
                <CoverImage
                  src={artist.image}
                  alt={artist.name}
                  type="artist"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="font-sans font-extrabold text-2xl sm:text-3xl text-white tracking-tight flex items-center gap-3">
                <span className="material-icons-round text-blue-500 text-3xl">menu_book</span>
                {artist.name} Biography
              </h1>
              {artist.bioPublished && (
                <p className="text-xs text-zinc-500 mt-1 font-mono uppercase tracking-wider">
                  Published: {artist.bioPublished}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Biography Content Card */}
      <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-6 sm:p-10 space-y-6 shadow">
        <div
          className="text-zinc-200 text-sm sm:text-base leading-relaxed font-sans space-y-4 [&>p]:mb-4"
          dangerouslySetInnerHTML={{ __html: cleanedBio }}
        />
        
        {artist.tags && artist.tags.length > 0 && (
          <div className="pt-6 border-t border-zinc-800/80">
            <h3 className="text-xs font-mono uppercase text-zinc-500 tracking-wider mb-2">Genres & Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {artist.tags.map((tag: any, idx: number) => {
                const tagName = typeof tag === 'string' ? tag : tag.name;
                return (
                  <Link
                    key={idx}
                    href={`/tag/${encodeURIComponent(tagName)}`}
                    className="text-xs bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white px-2.5 py-1 rounded-full transition-colors"
                  >
                    #{tagName}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
