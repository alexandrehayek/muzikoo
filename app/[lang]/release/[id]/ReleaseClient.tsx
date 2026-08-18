'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usePlayer, Track } from '@/context/PlayerContext';
import { getSampleMusic } from '@/lib/musicbrainz';
import CoverImage from '@/components/CoverImage';
import TrackMenu from '@/components/TrackMenu';
import ShareModal from '@/components/ShareModal';

export default function ReleaseClient() {
  const params = useParams();
  const id = params.id as string;
  const { playTrack, currentTrack, isPlaying } = usePlayer();

  const [release, setRelease] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [otherAlbums, setOtherAlbums] = useState<any[]>([]);
  const [loadingOtherAlbums, setLoadingOtherAlbums] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  async function fetchReleaseDetails() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/music?action=release&id=${id}`);
      if (!res.ok) throw new Error('Failed to fetch release details');
      const data = await res.json();
      setRelease(data);

      const artistId = data['artist-credit']?.[0]?.artist?.id;
      const currentGroupId = data['release-group']?.id;
      if (artistId) {
        setLoadingOtherAlbums(true);
        fetch(`/api/music?action=artist&id=${artistId}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((artistData) => {
            if (artistData && artistData['release-groups']) {
              const filtered = artistData['release-groups'].filter(
                (g: any) =>
                  g.id !== currentGroupId &&
                  g.title?.toLowerCase() !== data.title?.toLowerCase()
              );
              setOtherAlbums(filtered);
            } else if (artistData && artistData.releases) {
              const filtered = artistData.releases.filter(
                (r: any) =>
                  r.id !== data.id &&
                  r.title?.toLowerCase() !== data.title?.toLowerCase()
              );
              setOtherAlbums(filtered);
            }
          })
          .catch((err) => console.warn('Could not fetch other albums:', err))
          .finally(() => setLoadingOtherAlbums(false));
      }
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
        if (active) fetchReleaseDetails();
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
        <span className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Unlocking Release Tracklists...</span>
      </div>
    );
  }

  if (error || !release) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">
          {error || 'Release not found'}
        </div>
        <Link href="/" className="inline-block bg-zinc-900 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-xl text-xs font-semibold">
          Return Home
        </Link>
      </div>
    );
  }

  const artistName = release['artist-credit']?.[0]?.name || 'Various Artists';
  const artistId = release['artist-credit']?.[0]?.artist?.id || '';
  const media = release.media || [];
  
  // Extract all tracks from all media components (CDs, Vinyls, etc.)
  const tracks: any[] = [];
  media.forEach((m: any) => {
    if (m.tracks) {
      m.tracks.forEach((t: any) => {
        tracks.push({
          ...t,
          mediaFormat: m.format || 'Digital',
        });
      });
    }
  });

  const handlePlayEntireRelease = () => {
    if (tracks.length === 0) return;
    const playlistTracks = tracks.map((t: any) => {
      const meta = getSampleMusic(t.recording.id);
      return {
        id: t.recording.id,
        title: t.title,
        artist: t['artist-credit']?.[0]?.name || artistName,
        artistId: t['artist-credit']?.[0]?.artist?.id || artistId,
        album: release.title,
        albumId: release.id,
        releaseId: release.id,
        audioUrl: meta.audioUrl,
        coverUrl: meta.coverUrl,
        genre: meta.genre,
        duration: t.length ? Math.floor(t.length / 1000) : 180,
      };
    });
    playTrack(playlistTracks[0], playlistTracks);
  };

  const coverUrl = release.image || `https://coverartarchive.org/release/${release.id}/front-500`;

  return (
    <div className="space-y-10 pb-20 animate-fade-in max-w-6xl mx-auto">
      {/* Release Profile Banner */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-900 p-8 sm:p-10 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Album Cover Art */}
        <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 relative group shrink-0 shadow-lg">
          <CoverImage
            src={coverUrl}
            fallbackSrc={release.fallbackImage}
            alt={release.title}
            type="album"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/15" />
        </div>

        {/* Details */}
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            <span className="font-mono text-[10px] font-semibold text-blue-400 uppercase bg-blue-500/10 border border-blue-500/10 px-2.5 py-1 rounded-full">
              Release Catalog
            </span>
            {release.status && (
              <span className="text-zinc-400 text-xs bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                {release.status}
              </span>
            )}
            {release.date && (
              <span className="text-zinc-400 text-xs flex items-center gap-1">
                <span className="material-icons-round text-zinc-500 text-sm block">calendar_today</span>
                {release.date}
              </span>
            )}
            {release.country && (
              <span className="text-zinc-400 text-xs font-mono">
                [{release.country}]
              </span>
            )}
          </div>

          <h1 className="font-sans font-extrabold text-2xl sm:text-4xl text-white tracking-tight leading-tight">
            {release.title}
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

          <div className="pt-2 flex items-center justify-center md:justify-start gap-3">
            <button
              onClick={handlePlayEntireRelease}
              disabled={tracks.length === 0}
              className="bg-white hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer font-sans"
            >
              <span className="material-icons-round text-zinc-950 text-base block">play_arrow</span>
              Play Album
            </button>

            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer shadow-md flex items-center justify-center active:scale-95"
              title="Share release"
            >
              <span className="material-icons-round text-lg">more_vert</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Tracklist & Label Metadata */}
      <div className="space-y-8 text-left">
        {/* Tracklist section */}
        <div className="space-y-4">
          <h2 className="font-sans font-extrabold text-lg text-white tracking-tight flex items-center gap-2 border-b border-zinc-900 pb-3">
            <span className="material-icons-round text-blue-500 text-xl block">album</span>
            Tracklist ({tracks.length} Tracks)
          </h2>

          {tracks.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/10 border border-zinc-900/60 rounded-2xl p-6">
              <p className="text-zinc-500 text-sm">No tracks indexed for this release version</p>
            </div>
          ) : (
            <div className="bg-zinc-900/20 border border-zinc-900/40 rounded-2xl overflow-hidden divide-y divide-zinc-900/30 shadow animate-fade-in">
              {tracks.map((track: any, idx: number) => {
                const isCurrent = currentTrack?.id === track.recording?.id;
                const musicMeta = getSampleMusic(track.recording?.id);
                const playerTrack: Track = {
                  id: track.recording?.id || `track-${idx}`,
                  title: track.title,
                  artist: track['artist-credit']?.[0]?.name || artistName,
                  artistId: track['artist-credit']?.[0]?.artist?.id || artistId,
                  album: release.title,
                  albumId: release.id,
                  releaseId: release.id,
                  audioUrl: musicMeta.audioUrl,
                  coverUrl: musicMeta.coverUrl,
                  genre: musicMeta.genre,
                  duration: track.length ? Math.floor(track.length / 1000) : 180,
                };

                return (
                  <div
                    key={track.id || idx}
                    className={`flex items-center justify-between px-6 py-4 hover:bg-zinc-900/40 transition-colors group ${
                      isCurrent ? 'bg-zinc-900/30 text-blue-400' : 'text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-4 truncate">
                      <span className="font-mono text-xs text-zinc-500 w-6 text-right shrink-0">
                        {track.number || idx + 1}
                      </span>

                      <button
                        onClick={() => playTrack(playerTrack, tracks.map((t: any) => {
                          const meta = getSampleMusic(t.recording?.id);
                          return {
                            id: t.recording?.id || `track-${t.number}`,
                            title: t.title,
                            artist: t['artist-credit']?.[0]?.name || artistName,
                            artistId: t['artist-credit']?.[0]?.artist?.id || artistId,
                            album: release.title,
                            albumId: release.id,
                            releaseId: release.id,
                            audioUrl: meta.audioUrl,
                            coverUrl: meta.coverUrl,
                            genre: meta.genre,
                            duration: t.length ? Math.floor(t.length / 1000) : 180,
                          };
                        }))}
                        className={`w-8 h-8 rounded-full bg-zinc-800 hover:bg-blue-500 hover:text-white flex items-center justify-center text-zinc-300 transition-all cursor-pointer ${
                          isCurrent ? 'bg-blue-500 text-white' : ''
                        }`}
                      >
                        {isCurrent && isPlaying ? (
                          <span className="material-icons-round text-sm block">pause</span>
                        ) : (
                          <span className="material-icons-round text-sm block pl-0.5">play_arrow</span>
                        )}
                      </button>

                      <div className="truncate text-left">
                        <Link
                          href={`/track/${track.recording?.id || track.id}`}
                          className="font-bold text-sm block hover:text-blue-400 hover:underline transition-all truncate text-white"
                        >
                          {track.title}
                        </Link>
                        {track['artist-credit']?.[0]?.name && track['artist-credit'][0].name !== artistName && (
                          <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                            Feat. {track['artist-credit'][0].name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 pl-4">
                      {track.length ? (
                        <span className="font-mono text-xs text-zinc-500">
                          {Math.floor(track.length / 60000)}:
                          {String(Math.floor((track.length % 60000) / 1000)).padStart(2, '0')}
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-zinc-500">3:00</span>
                      )}
                      <TrackMenu track={playerTrack} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Other Albums by Artist */}
        {otherAlbums.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-zinc-900">
            <h2 className="font-sans font-extrabold text-lg text-white tracking-tight flex items-center gap-2">
              <span className="material-icons-round text-blue-500 text-xl block">album</span>
              More Albums from {artistName}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-fade-in">
              {otherAlbums.slice(0, 6).map((album: any) => {
                const albCoverUrl = album.image || `https://coverartarchive.org/release-group/${album.id}/front-250`;
                return (
                  <div
                    key={album.id}
                    className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-4 flex flex-col gap-3 group hover:bg-zinc-900 hover:border-zinc-800 transition-all shadow"
                  >
                    <div className="aspect-square w-full rounded-xl overflow-hidden relative border border-zinc-800 shadow bg-zinc-950">
                      <CoverImage
                        src={albCoverUrl}
                        alt={album.title}
                        type="album"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="truncate text-left">
                      <Link
                        href={`/album/${encodeURIComponent(album.id)}`}
                        className="block text-xs font-bold text-white hover:text-blue-400 transition-colors truncate"
                      >
                        {album.title}
                      </Link>
                      {album['first-release-date'] && (
                        <span className="block text-[10px] text-zinc-500 mt-0.5 font-mono">
                          {album['first-release-date'].split('-')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Album"
        subtitle={`${release?.title}${artistName ? ` • ${artistName}` : ''}`}
        shareUrl={typeof window !== 'undefined' ? `${window.location.origin}/album/${encodeURIComponent(release?.id || id)}` : ''}
      />
    </div>
  );
}
