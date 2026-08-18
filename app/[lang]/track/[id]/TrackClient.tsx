'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usePlayer, Track } from '@/context/PlayerContext';
import { getSampleMusic } from '@/lib/musicbrainz';
import CoverImage from '@/components/CoverImage';
import TrackMenu from '@/components/TrackMenu';
import ShareModal from '@/components/ShareModal';

export default function TrackClient() {
  const params = useParams();
  const id = params.id as string;
  const { playTrack, currentTrack, isPlaying } = usePlayer();

  const [recording, setRecording] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(null);
  const [albumData, setAlbumData] = useState<any>(null);
  const [loadingAlbum, setLoadingAlbum] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  async function fetchRecordingDetails() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/music?action=recording&id=${id}`);
      if (!res.ok) throw new Error('Failed to fetch recording details');
      const data = await res.json();
      setRecording(data);
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
        if (active) fetchRecordingDetails();
      });
    }
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    const relId = selectedReleaseId || recording?.releases?.[0]?.id;
    if (relId) {
      Promise.resolve().then(() => {
        if (active) setLoadingAlbum(true);
      });
      fetch(`/api/music?action=release&id=${relId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (active) setAlbumData(data);
        })
        .catch(() => {})
        .finally(() => {
          if (active) setLoadingAlbum(false);
        });
    } else {
      Promise.resolve().then(() => {
        if (active) setAlbumData(null);
      });
    }
    return () => {
      active = false;
    };
  }, [recording, selectedReleaseId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4 font-sans">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Unpacking Track Master Metadata...</span>
      </div>
    );
  }

  if (error || !recording) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4 font-sans">
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">
          {error || 'Track not found'}
        </div>
        <Link href="/" className="inline-block bg-zinc-900 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-xl text-xs font-semibold">
          Return Home
        </Link>
      </div>
    );
  }

  const artistName = recording['artist-credit']?.[0]?.name || 'Unknown Artist';
  const artistId = recording['artist-credit']?.[0]?.artist?.id || '';
  const albumName = recording['releases']?.[0]?.title || 'Single';
  const currentReleaseId = selectedReleaseId || recording['releases']?.[0]?.id;

  const playerTrack: Track = {
    id: recording.id,
    title: recording.title,
    artist: artistName,
    artistId: artistId,
    album: albumName,
    albumId: currentReleaseId,
    releaseId: currentReleaseId,
    audioUrl: recording.audioUrl,
    coverUrl: recording.coverUrl,
    genre: recording.genre || 'Electronic',
    duration: recording.length ? Math.floor(recording.length / 1000) : 180,
  };

  const isCurrent = currentTrack?.id === recording.id;

  const albumTracks: any[] = [];
  if (albumData?.media) {
    albumData.media.forEach((m: any) => {
      if (m.tracks) {
        m.tracks.forEach((t: any) => {
          albumTracks.push({
            ...t,
            mediaFormat: m.format || 'Digital',
          });
        });
      }
    });
  }

  return (
    <div className="space-y-10 pb-20 animate-fade-in max-w-5xl mx-auto font-sans">
      {/* Track Hero Card */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-900 p-6 sm:p-10 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Album Cover Art */}
        <div className="w-44 h-44 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border border-zinc-800/80 bg-zinc-955 shadow-2xl relative group shrink-0">
          <CoverImage
            src={playerTrack.coverUrl || recording.coverUrl}
            fallbackSrc={selectedReleaseId ? `https://coverartarchive.org/release/${selectedReleaseId}/front-500` : null}
            alt={playerTrack.title}
            type="track"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/10" />
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="font-mono text-[10px] font-semibold text-blue-400 uppercase bg-blue-500/10 border border-blue-500/10 px-2.5 py-1 rounded-full">
              {playerTrack.genre}
            </span>
            {recording.length && (
              <span className="text-zinc-500 text-xs flex items-center gap-1 font-mono">
                <span className="material-icons-round text-sm text-zinc-500 block">schedule</span>
                {Math.floor(recording.length / 60000)}m {Math.floor((recording.length % 60000) / 1000)}s
              </span>
            )}
          </div>

          <h1 className="font-sans font-extrabold text-3xl sm:text-5xl text-white tracking-tight">
            {recording.title}
          </h1>

          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 text-sm text-zinc-300">
            {artistId ? (
              <Link
                href={`/artist/${artistId}`}
                className="hover:text-blue-400 font-bold transition-all flex items-center gap-1.5"
              >
                <span className="material-icons-round text-zinc-500 text-base block">person</span>
                {artistName}
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 font-bold text-zinc-500">
                <span className="material-icons-round text-zinc-500 text-base block">person</span>
                {artistName}
              </span>
            )}

            {recording['releases']?.[0]?.id && (
              <Link
                href={`/album/${recording['releases'][0].id}`}
                className="hover:text-blue-400 transition-all flex items-center gap-1.5 font-medium text-zinc-400"
              >
                <span className="material-icons-round text-zinc-500 text-base block">album</span>
                {albumName}
              </Link>
            )}
          </div>

          {recording.disambiguation && (
            <p className="text-zinc-500 text-xs italic">
              &ldquo;{recording.disambiguation}&rdquo;
            </p>
          )}

          <div className="pt-2 flex items-center justify-center md:justify-start gap-3">
            <button
              onClick={() => playTrack(playerTrack, [playerTrack])}
              className="bg-white hover:bg-zinc-200 text-zinc-950 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md shadow-white/5 cursor-pointer font-sans"
            >
              {isCurrent && isPlaying ? (
                <>
                  <span className="material-icons-round text-zinc-950 text-base block">pause</span>
                  Pause Track
                </>
              ) : (
                <>
                  <span className="material-icons-round text-zinc-950 text-base block pl-0.5">play_arrow</span>
                  Play Preview
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer shadow-md flex items-center justify-center active:scale-95"
              title="Share track"
            >
              <span className="material-icons-round text-lg">more_vert</span>
            </button>
          </div>
        </div>
      </section>

      {/* Core Tags */}
      {recording.tags && recording.tags.length > 0 && (
        <div className="space-y-2 text-left animate-fade-in">
          <h3 className="font-sans font-semibold text-xs text-zinc-500 uppercase tracking-widest">Tags</h3>
          <div className="flex flex-wrap gap-1.5">
            {recording.tags.map((t: any, idx: number) => {
              const tagName = typeof t === 'string' ? t : (t?.name || t?.title || '');
              if (!tagName) return null;
              return (
                <Link
                  key={tagName + idx}
                  href={`/tag/${encodeURIComponent(tagName)}`}
                  className="text-[10px] font-mono uppercase bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded-lg hover:text-blue-400 hover:border-blue-500/20 transition-all"
                >
                  #{tagName}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Appears On Releases / Versions */}
      {recording.releases && recording.releases.length > 0 && (
        <div className="space-y-4 text-left border-t border-zinc-900 pt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-sans font-extrabold text-lg text-white tracking-tight flex items-center gap-2">
              <span className="material-icons-round text-blue-500 text-xl block">album</span>
              Appears On ({recording.releases.length} Releases)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recording.releases.map((rel: any) => {
              const relCover = `https://coverartarchive.org/release/${rel.id}/front-250`;
              const isSelected = (selectedReleaseId || recording.releases[0].id) === rel.id;
              return (
                <div
                  key={rel.id}
                  onClick={() => setSelectedReleaseId(rel.id)}
                  className={`p-3.5 rounded-2xl border flex items-center gap-3.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-950/20 border-blue-500/50 shadow-md'
                      : 'bg-zinc-900/30 hover:bg-zinc-900 border-zinc-800'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800">
                    <CoverImage src={relCover} alt={rel.title} type="album" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/album/${rel.id}`}
                      className="font-bold text-xs text-white hover:text-blue-400 truncate block"
                    >
                      {rel.title}
                    </Link>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono mt-0.5">
                      {rel.date && <span>{rel.date.split('-')[0]}</span>}
                      {rel.status && <span className="uppercase text-[9px] bg-zinc-800 px-1 rounded">{rel.status}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Tracklist of selected Release */}
      {albumTracks.length > 0 && (
        <div className="space-y-4 text-left border-t border-zinc-900 pt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-sans font-extrabold text-lg text-white tracking-tight flex items-center gap-2">
              <span className="material-icons-round text-blue-500 text-xl block">queue_music</span>
              From Album: {albumData?.title || albumName}
            </h2>
            {loadingAlbum && (
              <span className="text-xs text-zinc-500 font-mono animate-pulse">Loading album tracklist...</span>
            )}
          </div>

          <div className="bg-zinc-900/20 border border-zinc-900/40 rounded-2xl overflow-hidden divide-y divide-zinc-900/30 shadow">
            {albumTracks.map((t: any, idx: number) => {
              const isSelectedRecording = t.recording?.id === recording.id;
              const musicMeta = getSampleMusic(t.recording?.id);
              const playerTrk: Track = {
                id: t.recording?.id || `trk-${idx}`,
                title: t.title,
                artist: t['artist-credit']?.[0]?.name || artistName,
                artistId: t['artist-credit']?.[0]?.artist?.id || artistId,
                album: albumData?.title || albumName,
                albumId: currentReleaseId,
                releaseId: currentReleaseId,
                audioUrl: musicMeta.audioUrl,
                coverUrl: musicMeta.coverUrl,
                genre: musicMeta.genre,
                duration: t.length ? Math.floor(t.length / 1000) : 180,
              };

              return (
                <div
                  key={t.id || idx}
                  className={`flex items-center justify-between px-5 py-3 hover:bg-zinc-900/40 transition-colors ${
                    isSelectedRecording ? 'bg-blue-950/20 text-blue-400 font-semibold' : 'text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5 truncate">
                    <span className="font-mono text-xs text-zinc-500 w-5 text-right shrink-0">
                      {t.number || idx + 1}
                    </span>
                    <button
                      onClick={() => playTrack(playerTrk, albumTracks.map((item: any) => {
                        const m = getSampleMusic(item.recording?.id);
                        return {
                          id: item.recording?.id || `trk-${item.number}`,
                          title: item.title,
                          artist: item['artist-credit']?.[0]?.name || artistName,
                          artistId: item['artist-credit']?.[0]?.artist?.id || artistId,
                          album: albumData?.title || albumName,
                          albumId: currentReleaseId,
                          releaseId: currentReleaseId,
                          audioUrl: m.audioUrl,
                          coverUrl: m.coverUrl,
                          genre: m.genre,
                          duration: item.length ? Math.floor(item.length / 1000) : 180,
                        };
                      }))}
                      className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-blue-500 hover:text-white flex items-center justify-center text-zinc-300 transition-colors cursor-pointer shrink-0"
                    >
                      <span className="material-icons-round text-xs block pl-0.5">play_arrow</span>
                    </button>
                    <Link
                      href={`/track/${t.recording?.id || t.id}`}
                      className="text-xs hover:text-blue-400 transition-colors truncate block text-white"
                    >
                      {t.title}
                    </Link>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 pl-3">
                    <span className="font-mono text-xs text-zinc-500">
                      {t.length ? `${Math.floor(t.length / 60000)}:${String(Math.floor((t.length % 60000) / 1000)).padStart(2, '0')}` : '3:00'}
                    </span>
                    <TrackMenu track={playerTrk} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Track"
        subtitle={`${recording?.title}${artistName ? ` • ${artistName}` : ''}`}
        shareUrl={typeof window !== 'undefined' ? `${window.location.origin}/track/${encodeURIComponent(recording?.id || id)}` : ''}
      />
    </div>
  );
}
