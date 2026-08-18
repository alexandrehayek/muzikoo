// /app/[lang]/release/[id]/track/[trackId]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usePlayer, Track } from '@/context/PlayerContext';
import { getSampleMusic } from '@/lib/musicbrainz';
import CoverImage from '@/components/CoverImage';
import { motion } from 'motion/react';

export default function ReleaseTrackDetailPage() {
  const params = useParams();
  const releaseId = params.id as string;
  const trackId = params.trackId as string;
  const { playTrack, currentTrack, isPlaying } = usePlayer();

  const [recording, setRecording] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(releaseId);
  const [albumData, setAlbumData] = useState<any>(null);
  const [loadingAlbum, setLoadingAlbum] = useState(false);

  async function fetchRecordingDetails() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/music?action=recording&id=${trackId}`);
      if (!res.ok) throw new Error('Failed to fetch track details');
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
    if (trackId) {
      Promise.resolve().then(() => {
        if (active) fetchRecordingDetails();
      });
    }
    return () => {
      active = false;
    };
  }, [trackId]);

  useEffect(() => {
    let active = true;
    const relId = selectedReleaseId || releaseId || recording?.releases?.[0]?.id;
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
  }, [recording, selectedReleaseId, releaseId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Unpacking Track Master Metadata...</span>
      </div>
    );
  }

  if (error || !recording) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">
          {error || 'Track not found'}
        </div>
        <Link href={`/album/${releaseId}`} className="inline-block bg-zinc-900 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-xl text-xs font-semibold">
          Return to Album
        </Link>
      </div>
    );
  }

  const artistName = recording['artist-credit']?.[0]?.name || 'Unknown Artist';
  const artistId = recording['artist-credit']?.[0]?.artist?.id || '';
  const albumName = albumData?.title || recording['releases']?.[0]?.title || 'Single';

  const playerTrack: Track = {
    id: recording.id,
    title: recording.title,
    artist: artistName,
    artistId: artistId,
    album: albumName,
    audioUrl: recording.audioUrl,
    coverUrl: recording.coverUrl,
    genre: recording.genre || 'Electronic',
    duration: recording.length ? Math.floor(recording.length / 1000) : 180,
  };

  const isCurrent = currentTrack?.id === recording.id;
  const currentReleaseId = selectedReleaseId || releaseId || recording['releases']?.[0]?.id;

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
    <div className="space-y-8 pb-20 animate-fade-in max-w-5xl mx-auto">
      {/* Back navigation */}
      <Link
        href={`/album/${releaseId}`}
        className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
      >
        <span className="material-icons-round text-sm block">arrow_back</span>
        Back to Album
      </Link>

      {/* Track Hero Card */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-900 p-6 sm:p-10 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Album Cover Art */}
        <div className="w-44 h-44 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border border-zinc-800/80 bg-zinc-950 shadow-2xl relative group shrink-0">
          <CoverImage
            src={playerTrack.coverUrl || recording.coverUrl}
            fallbackSrc={`https://coverartarchive.org/release/${releaseId}/front-500`}
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
                <span className="material-icons-round text-zinc-500 text-sm block">schedule</span>
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

            <Link
              href={`/album/${currentReleaseId}`}
              className="hover:text-blue-400 transition-all flex items-center gap-1.5 font-medium text-zinc-400"
            >
              <span className="material-icons-round text-zinc-500 text-base block">album</span>
              {albumName}
            </Link>
          </div>

          <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-3">
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

      {/* Main Track Details & Sections */}
      <div className="space-y-8 text-left">
        {/* Tracks from This Album section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-900 pb-3 gap-2">
            <h2 className="font-sans font-extrabold text-lg text-white tracking-tight flex items-center gap-2">
              <span className="material-icons-round text-blue-500 text-xl block">library_music</span>
              Tracks from This Album
            </h2>
            {albumData && (
              <Link
                href={`/album/${albumData.id}`}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors truncate"
              >
                <span>{albumData.title}</span>
                <span className="material-icons-round text-sm block">chevron_right</span>
              </Link>
            )}
          </div>

          {recording?.releases && recording.releases.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 py-1">
              <span className="text-[10px] text-zinc-500 font-mono uppercase mr-1">Album Version:</span>
              {recording.releases.map((rel: any) => (
                <button
                  key={rel.id}
                  onClick={() => setSelectedReleaseId(rel.id)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                    currentReleaseId === rel.id
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-bold'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {rel.title} {rel.date ? `(${rel.date.split('-')[0]})` : ''}
                </button>
              ))}
            </div>
          )}

          {loadingAlbum ? (
            <div className="flex items-center gap-3 py-6 text-zinc-500 text-xs font-mono">
              <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              Loading album tracks...
            </div>
          ) : albumTracks.length > 0 ? (
            <div className="bg-zinc-900/20 border border-zinc-900/40 rounded-2xl overflow-hidden divide-y divide-zinc-900/30 shadow animate-fade-in max-h-96 overflow-y-auto custom-scrollbar">
              {albumTracks.map((t: any) => {
                const trackRecordingId = t.recording?.id || t.id;
                const isThisTrack = trackRecordingId === recording.id;
                const isPlayingThisTrack = currentTrack?.id === trackRecordingId && isPlaying;
                const musicMeta = getSampleMusic(trackRecordingId);

                const playerTrackItem: Track = {
                  id: trackRecordingId,
                  title: t.title,
                  artist: t['artist-credit']?.[0]?.name || albumData['artist-credit']?.[0]?.name || artistName,
                  artistId: t['artist-credit']?.[0]?.artist?.id || artistId,
                  album: albumData.title,
                  audioUrl: musicMeta.audioUrl,
                  coverUrl: musicMeta.coverUrl,
                  genre: musicMeta.genre,
                  duration: t.length ? Math.floor(t.length / 1000) : 180,
                };

                return (
                  <div
                    key={t.id || trackRecordingId || t.position}
                    className={`flex items-center justify-between px-4 py-3 transition-colors group ${
                      isThisTrack
                        ? 'bg-blue-500/10 text-white font-medium border-l-2 border-blue-500'
                        : 'hover:bg-zinc-900/40 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate min-w-0">
                      <span className="font-mono text-xs text-zinc-500 w-6 text-center shrink-0">
                        {t.number || t.position}
                      </span>
                      <button
                        onClick={() =>
                          playTrack(
                            playerTrackItem,
                            albumTracks.map((tr: any) => {
                              const trRecId = tr.recording?.id || tr.id;
                              const meta = getSampleMusic(trRecId);
                              return {
                                id: trRecId,
                                title: tr.title,
                                artist:
                                  tr['artist-credit']?.[0]?.name ||
                                  albumData['artist-credit']?.[0]?.name ||
                                  artistName,
                                artistId: tr['artist-credit']?.[0]?.artist?.id || artistId,
                                album: albumData.title,
                                audioUrl: meta.audioUrl,
                                coverUrl: meta.coverUrl,
                                genre: meta.genre,
                                duration: tr.length ? Math.floor(tr.length / 1000) : 180,
                              };
                            })
                          )
                        }
                        className={`w-7 h-7 rounded-full bg-zinc-800 hover:bg-blue-500 hover:text-white flex items-center justify-center text-zinc-300 transition-all cursor-pointer shrink-0 ${
                          isPlayingThisTrack ? 'bg-blue-500 text-white' : ''
                        }`}
                      >
                        {isPlayingThisTrack ? (
                          <span className="material-icons-round text-xs block">pause</span>
                        ) : (
                          <span className="material-icons-round text-xs block pl-0.5">play_arrow</span>
                        )}
                      </button>

                      <div className="truncate text-left min-w-0">
                        <div className="flex items-center gap-2 truncate">
                          <Link
                            href={`/album/${releaseId}/track/${trackRecordingId}`}
                            className={`text-xs font-bold hover:text-blue-400 transition-all truncate ${
                              isThisTrack ? 'text-blue-400' : 'text-white'
                            }`}
                          >
                            {t.title}
                          </Link>
                          {isThisTrack && (
                            <span className="text-[9px] font-mono uppercase bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded shrink-0 font-semibold">
                              Current Track
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {t.length && (
                      <span className="font-mono text-xs text-zinc-500 shrink-0 ml-2">
                        {Math.floor(t.length / 60000)}:{String(Math.floor((t.length % 60000) / 1000)).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-zinc-500 text-xs italic">No album tracklist available</p>
          )}
        </div>

        {/* Releases Featuring This Recording */}
        {recording?.releases && recording.releases.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-sans font-extrabold text-lg text-white tracking-tight flex items-center gap-2 border-b border-zinc-900 pb-3">
              <span className="material-icons-round text-blue-500 text-xl block">album</span>
              Releases Featuring This Recording
            </h2>

            <div className="space-y-3 animate-fade-in">
              {recording.releases.map((rel: any) => (
                <div
                  key={rel.id}
                  className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-zinc-800 transition-all"
                >
                  <div className="flex items-center gap-3.5 truncate">
                    <div className="w-11 h-11 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 shadow shrink-0 flex items-center justify-center">
                      <CoverImage
                        src={`https://coverartarchive.org/release/${rel.id}/front-250`}
                        alt={rel.title}
                        type="album"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="truncate text-left">
                      <Link
                        href={`/album/${rel.id}`}
                        className="font-bold text-sm text-white hover:text-blue-400 block transition-colors truncate"
                      >
                        {rel.title}
                      </Link>
                      {rel.status && (
                        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wide">
                          {rel.status}
                        </span>
                      )}
                    </div>
                  </div>
                  {rel.date && (
                    <span className="font-mono text-xs text-zinc-500 shrink-0">
                      {rel.date.split('-')[0]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical Taxonomy section at the bottom */}
        <div className="space-y-4 text-left">
          <h2 className="font-sans font-extrabold text-lg text-white tracking-tight flex items-center gap-2 border-b border-zinc-900 pb-3">
            <span className="material-icons-round text-blue-500 text-xl block font-bold">tag</span>
            Technical Taxonomy
          </h2>

          <div className="bg-zinc-900/10 border border-zinc-900 rounded-2xl p-5 space-y-4 font-mono text-xs text-zinc-400 leading-normal animate-fade-in">
            <div className="flex justify-between items-center py-1.5 border-b border-zinc-900/60">
              <span className="text-zinc-500">MusicBrainz ID:</span>
              <span className="text-zinc-300 font-mono text-[10px] truncate max-w-[180px]" title={recording.id}>
                {recording.id}
              </span>
            </div>
            {recording.video !== undefined && (
              <div className="flex justify-between items-center py-1.5 border-b border-zinc-900/60">
                <span className="text-zinc-500">Video Format:</span>
                <span className={recording.video ? 'text-emerald-400 font-bold' : 'text-zinc-300'}>
                  {recording.video ? 'Yes' : 'No'}
                </span>
              </div>
            )}
            {recording['artist-credit']?.[0]?.name && (
              <div className="flex justify-between items-center py-1.5 border-b border-zinc-900/60">
                <span className="text-zinc-500">Artist Credit:</span>
                <span className="text-zinc-300">{recording['artist-credit'][0].name}</span>
              </div>
            )}
            {recording.rating?.value && (
              <div className="flex justify-between items-center py-1.5 border-b border-zinc-900/60">
                <span className="text-zinc-500">Community Rating:</span>
                <span className="text-blue-400 font-bold">{recording.rating.value} / 5</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

