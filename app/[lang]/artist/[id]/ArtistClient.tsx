'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usePlayer, Track } from '@/context/PlayerContext';
import { getSampleMusic } from '@/lib/musicbrainz';
import CoverImage from '@/components/CoverImage';
import TrackMenu from '@/components/TrackMenu';
import ShareModal from '@/components/ShareModal';
import { cleanBioHtml } from '@/lib/lastfm';
import { formatCount } from '@/lib/utils';

export default function ArtistClient() {
  const params = useParams();
  const id = params.id as string;
  const { playTrack, currentTrack, isPlaying } = usePlayer();

  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

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
        <span className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Retrieving Artist Biography...</span>
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

  // Filter release-groups into Albums vs Singles if available
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

  const albums = releaseGroups.filter((g: any) => isAlbumGroup(g));
  const others = releaseGroups.filter((g: any) => isSingleOrEPGroup(g));

  // Take the first 10 recordings for a "Top Tracks" section
  const recordings = artist['recordings'] || [];

  return (
    <div className="space-y-10 pb-20 animate-fade-in max-w-6xl mx-auto font-sans">
      {/* Artist Profile Header */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-900 p-8 sm:p-10 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
        {artist.backgroundImage ? (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <img
              src={artist.backgroundImage}
              alt={artist.name}
              className="w-full h-full object-cover opacity-35 filter blur-[1px] scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/40" />
          </div>
        ) : (
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        )}
        
        {/* Artist Circle Photo */}
        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border border-zinc-800/80 bg-zinc-950 flex items-center justify-center shrink-0 relative group shadow-lg z-10">
          <CoverImage
            src={artist.image}
            fallbackSrc={albums[0] ? `https://coverartarchive.org/release-group/${albums[0].id}/front-500` : null}
            alt={artist.name}
            type="artist"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/10" />
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4 text-center md:text-left relative z-10">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            <span className="font-mono text-[10px] font-semibold text-blue-400 uppercase bg-blue-500/10 border border-blue-500/10 px-2.5 py-1 rounded-full">
              {artist.type || 'Artist'}
            </span>
            {artist.area && (
              <span className="text-zinc-400 text-xs flex items-center gap-1 font-mono">
                <span className="material-icons-round text-sm text-zinc-500 block">public</span>
                {artist.area.name}
              </span>
            )}
            {artist['life-span']?.begin && (
              <span className="text-zinc-400 text-xs flex items-center gap-1 font-mono">
                <span className="material-icons-round text-sm text-zinc-500 block">calendar_today</span>
                {artist['life-span'].begin.split('-')[0]}
                {artist['life-span'].ended ? ` - ${artist['life-span'].end?.split('-')[0] || 'Ended'}` : ' - Present'}
              </span>
            )}
          </div>

          <h1 className="font-sans font-extrabold text-3xl sm:text-5xl text-white tracking-tight">
            {artist.name}
          </h1>

          {artist.disambiguation && (
            <p className="text-zinc-400 text-sm max-w-xl italic">
              &ldquo;{artist.disambiguation}&rdquo;
            </p>
          )}

          {/* Artist Tags */}
          {artist.tags && artist.tags.length > 0 && (
            <div className="flex flex-wrap justify-center md:justify-start gap-1.5 pt-1 animate-fade-in">
              {artist.tags.slice(0, 8).map((t: any, idx: number) => {
                const tagName = typeof t === 'string' ? t : (t?.name || t?.title || '');
                if (!tagName) return null;
                return (
                  <Link
                    key={tagName + idx}
                    href={`/tag/${encodeURIComponent(tagName)}`}
                    className="text-[10px] font-mono uppercase bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded-full hover:text-blue-400 hover:border-blue-500/20 transition-all"
                  >
                    #{tagName}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Action Buttons: Play & Share */}
          <div className="flex items-center justify-center md:justify-start gap-3 pt-3">
            {recordings.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const firstRec = recordings[0];
                  if (firstRec) {
                    const trackTitle = firstRec.title || 'Unknown Title';
                    const playerTrack: Track = {
                      id: firstRec.id,
                      title: trackTitle,
                      artist: artist.name,
                      artistId: artist.id,
                      album: 'Top Recording',
                      audioUrl: firstRec.audioUrl,
                      coverUrl: artist.image,
                      genre: firstRec.genre || 'Music',
                      duration: Math.floor((firstRec.length || 180000) / 1000),
                    };
                    playTrack(
                      playerTrack,
                      recordings.map((r: any) => ({
                        id: r.id,
                        title: r.title || 'Unknown Title',
                        artist: artist.name,
                        artistId: artist.id,
                        album: 'Top Recording',
                        audioUrl: r.audioUrl,
                        coverUrl: artist.image,
                        genre: r.genre || 'Music',
                        duration: Math.floor((r.length || 180000) / 1000),
                      }))
                    );
                  }
                }}
                className="bg-blue-500 hover:bg-blue-400 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20 active:scale-95"
              >
                <span className="material-icons-round text-xl">play_arrow</span>
                <span>Play</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="p-2.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer shadow-md flex items-center justify-center active:scale-95"
              title="Share artist"
            >
              <span className="material-icons-round text-xl">more_vert</span>
            </button>
          </div>
        </div>
      </section>

      {/* Top Tracks */}
      {recordings.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-sans font-extrabold text-xl text-white tracking-tight flex items-center gap-2">
              <span className="material-icons-round text-blue-500 text-2xl block">audiotrack</span>
              Popular Tracks
            </h2>
            <Link
              href={`/artist/${artist.id}/tracks`}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors font-mono"
            >
              See All Tracks
            </Link>
          </div>

          <div className="bg-zinc-900/20 border border-zinc-900/40 rounded-2xl overflow-hidden shadow-md divide-y divide-zinc-900/40 animate-fade-in">
            {recordings.slice(0, 10).map((rec: any) => {
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
                albumId: relId,
                releaseId: relId,
                audioUrl: rec.audioUrl || musicMeta.audioUrl,
                coverUrl: rec.coverUrl || musicMeta.coverUrl,
                genre: rec.genre || musicMeta.genre,
                duration: rec.length ? Math.floor(rec.length / 1000) : 180,
              };

              return (
                <div
                  key={rec.id}
                  className={`flex items-center justify-between px-6 py-4 hover:bg-zinc-900/40 transition-colors group ${
                    isCurrent ? 'bg-zinc-900/30 text-blue-400' : 'text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-4 truncate">
                    <button
                      onClick={() => playTrack(playerTrack, recordings.slice(0, 10).map((r: any) => {
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
                          albumId: rRelId,
                          releaseId: rRelId,
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

                  <div className="flex items-center gap-3 shrink-0 pl-4">
                    {formatCount(rec.playcount || rec.listeners || rec.userplaycount || rec.plays) && (
                      <span className="font-mono text-xs text-zinc-500">
                        {formatCount(rec.playcount || rec.listeners || rec.userplaycount || rec.plays)} plays
                      </span>
                    )}
                    {rec.length ? (
                      <span className="font-mono text-xs text-zinc-500 hidden sm:inline">
                        {Math.floor(rec.length / 60000)}:
                        {String(Math.floor((rec.length % 60000) / 1000)).padStart(2, '0')}
                      </span>
                    ) : !formatCount(rec.playcount || rec.listeners || rec.userplaycount || rec.plays) ? (
                      <span className="font-mono text-xs text-zinc-500">3:00</span>
                    ) : null}
                    <TrackMenu track={playerTrack} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Releases & Albums */}
      {albums.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-sans font-extrabold text-xl text-white tracking-tight flex items-center gap-2">
              <span className="material-icons-round text-blue-500 text-2xl block">album</span>
              Albums
            </h2>
            <Link
              href={`/artist/${artist.id}/albums`}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors font-mono"
            >
              See All
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-fade-in">
            {albums.slice(0, 12).map((group: any) => {
              const coverUrl = group.image || `https://coverartarchive.org/release-group/${group.id}/front-250`;
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
                  <div className="truncate text-left">
                    <Link
                      href={`/album/${encodeURIComponent(group.id)}`}
                      className="block text-xs font-bold text-white hover:text-blue-400 transition-colors truncate"
                    >
                      {group.title}
                    </Link>
                    {group['first-release-date'] && (
                      <span className="block text-[10px] text-zinc-500 mt-0.5 font-mono">
                        {group['first-release-date'].split('-')[0]}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Singles & EP */}
      {others.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-sans font-extrabold text-xl text-white tracking-tight flex items-center gap-2">
              <span className="material-icons-round text-blue-500 text-2xl block font-bold">album</span>
              Singles, EP & Collections
            </h2>
            <Link
              href={`/artist/${artist.id}/albums`}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors font-mono"
            >
              See All
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-fade-in">
            {others.slice(0, 12).map((group: any) => {
              const coverUrl = group.image || `https://coverartarchive.org/release-group/${group.id}/front-250`;
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
                  <div className="truncate text-left">
                    <Link
                      href={`/album/${encodeURIComponent(group.id)}`}
                      className="block text-xs font-bold text-white hover:text-blue-400 transition-colors truncate"
                    >
                      {group.title}
                    </Link>
                    {group['first-release-date'] && (
                      <span className="block text-[10px] text-zinc-500 mt-0.5 font-mono">
                        {group['first-release-date'].split('-')[0]}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Biography */}
      {(artist.bioSummary || artist.bioContent || artist.bio) && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-sans font-extrabold text-xl text-white tracking-tight flex items-center gap-2">
              <span className="material-icons-round text-blue-500 text-2xl block">menu_book</span>
              Biography
            </h2>
          </div>
          <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-5 sm:p-6 space-y-3 shadow">
            <div
              className="text-sm text-zinc-300 leading-relaxed font-sans"
              dangerouslySetInnerHTML={{
                __html: cleanBioHtml(artist.bioSummary || artist.bio || artist.bioContent)
              }}
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-zinc-800/80 text-xs">
              {artist.bioPublished ? (
                <span className="text-zinc-500 font-mono text-[11px]">
                  Published: {artist.bioPublished}
                </span>
              ) : <div />}
              <Link
                href={`/artist/${artist.id}/biography`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors font-mono"
              >
                See biography
                <span className="material-icons-round text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Similar Artists */}
      {artist.similarArtists && artist.similarArtists.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-sans font-extrabold text-xl text-white tracking-tight flex items-center gap-2">
              <span className="material-icons-round text-blue-500 text-2xl block">people</span>
              Similar Artists
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-fade-in">
            {artist.similarArtists.slice(0, 12).map((art: any) => (
              <div
                key={art.id}
                className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-4 flex flex-col items-center text-center gap-3 group hover:bg-zinc-900 hover:border-zinc-800 transition-all shadow"
              >
                <div className="w-24 h-24 rounded-full overflow-hidden relative border border-zinc-800/80 shadow bg-zinc-950 shrink-0">
                  <CoverImage
                    src={art.image}
                    alt={art.name}
                    type="artist"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/10" />
                </div>
                <div className="w-full truncate">
                  <Link
                    href={`/artist/${encodeURIComponent(art.id)}`}
                    className="block text-xs font-bold text-white hover:text-blue-400 transition-colors truncate"
                  >
                    {art.name}
                  </Link>
                  {art.disambiguation && (
                    <span className="block text-[10px] text-zinc-500 font-mono mt-0.5 truncate">
                      {art.disambiguation}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Artist"
        subtitle={artist?.name}
        shareUrl={typeof window !== 'undefined' ? `${window.location.origin}/artist/${encodeURIComponent(artist?.id || id)}` : ''}
      />
    </div>
  );
}
