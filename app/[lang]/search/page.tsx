// /app/[lang]/search/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePlayer, Track } from '@/context/PlayerContext';
import CoverImage from '@/components/CoverImage';
import TrackMenu from '@/components/TrackMenu';
import { motion } from 'motion/react';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryParam = searchParams.get('q') || '';
  const currentType = searchParams.get('type') || '';
  const pageParam = searchParams.get('page');
  const currentPage = Math.max(1, parseInt(pageParam || '1', 10));
  
  const { playTrack, currentTrack, isPlaying, t } = usePlayer();
  const [recordings, setRecordings] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = queryParam.trim();
    if (!q) {
      const timer = setTimeout(() => {
        setRecordings([]);
        setArtists([]);
        setReleases([]);
        setLoading(false);
        setError(null);
      }, 0);
      return () => clearTimeout(timer);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      const apiType = currentType || '';
      fetch(`/api/music?action=search&q=${encodeURIComponent(q)}&type=${encodeURIComponent(apiType)}&page=${currentPage}&limit=50`, {
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) throw new Error('Search failed');
          return res.json();
        })
        .then((data) => {
          setRecordings(data.recordings || []);
          setArtists(data.artists || []);
          setReleases(data.releases || []);
          setLoading(false);
        })
        .catch((err: any) => {
          if (err.name === 'AbortError') return;
          const msg = String(err.message || '');
          if (msg.includes('Rate') || msg.includes('exceeded') || msg.includes('29')) {
            setError('Music search service rate limit reached. Please try again shortly.');
          } else {
            setError(err.message || 'Something went wrong');
          }
          setLoading(false);
        });
    }, 0);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [queryParam, currentType, currentPage]);

  const formatDuration = (ms?: number) => {
    if (!ms) return '0:00';
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleTypeChange = (typeVal: string) => {
    const params = new URLSearchParams();
    if (queryParam) params.set('q', queryParam);
    if (typeVal) params.set('type', typeVal);
    router.push(`/search?${params.toString()}`);
  };

  const isTrackType = currentType === 'track' || currentType === 'tracks';
  const isArtistType = currentType === 'artist' || currentType === 'artists';
  const isAlbumType = currentType === 'album' || currentType === 'albums' || currentType === 'releases';

  const showTracks = !currentType || isTrackType;
  const showArtists = !currentType || isArtistType;
  const showAlbums = !currentType || isAlbumType;

  const hasAnyResults = recordings.length > 0 || artists.length > 0 || releases.length > 0;
  const hasFilteredResults =
    (!currentType && hasAnyResults) ||
    (isTrackType && recordings.length > 0) ||
    (isArtistType && artists.length > 0) ||
    (isAlbumType && releases.length > 0);

  return (
    <div className="space-y-8 pb-16 animate-fade-in max-w-6xl mx-auto">
      {/* Search Header */}
      <div className="space-y-2">
        <h1 className="font-sans font-extrabold text-2xl sm:text-3xl text-white tracking-tight flex items-center gap-3">
          <span className="material-icons-round text-blue-500 text-3xl">search</span>
          {queryParam ? `Search results for "${queryParam}"` : t.navigation.search}
        </h1>
        <p className="text-zinc-400 text-sm">
          {queryParam ? `Discovered music assets matching your query in real-time.` : `Type your query in the top bar search box to see live results.`}
        </p>
      </div>

      {/* Filter Buttons */}
      {queryParam && !loading && !error && (
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-900 pb-4">
          <button
            onClick={() => handleTypeChange('')}
            className={`px-4 py-2 rounded-full text-xs font-semibold font-mono tracking-wider transition-all cursor-pointer ${
              !currentType
                ? 'bg-blue-500 text-white font-bold shadow-md shadow-blue-500/10'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleTypeChange('track')}
            className={`px-4 py-2 rounded-full text-xs font-semibold font-mono tracking-wider transition-all cursor-pointer ${
              isTrackType
                ? 'bg-blue-500 text-white font-bold shadow-md shadow-blue-500/10'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            Tracks
          </button>
          <button
            onClick={() => handleTypeChange('artist')}
            className={`px-4 py-2 rounded-full text-xs font-semibold font-mono tracking-wider transition-all cursor-pointer ${
              isArtistType
                ? 'bg-blue-500 text-white font-bold shadow-md shadow-blue-500/10'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            Artists
          </button>
          <button
            onClick={() => handleTypeChange('album')}
            className={`px-4 py-2 rounded-full text-xs font-semibold font-mono tracking-wider transition-all cursor-pointer ${
              isAlbumType
                ? 'bg-blue-500 text-white font-bold shadow-md shadow-blue-500/10'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            Albums
          </button>
        </div>
      )}

      {/* Results Container */}
      <div className="space-y-10">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Querying MusicBrainz...</span>
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        {!queryParam && (
          <div className="text-center py-20 bg-zinc-900/10 border border-zinc-900/60 rounded-2xl p-8 space-y-3">
            <span className="material-icons-round text-5xl text-zinc-600 block">search_off</span>
            <p className="text-zinc-400 text-sm font-semibold">No active query</p>
            <p className="text-zinc-600 text-xs">Type your query in the top bar search box and hit enter.</p>
          </div>
        )}

        {!loading && !error && queryParam && !hasFilteredResults && (
          <div className="text-center py-20 bg-zinc-900/10 border border-zinc-900/60 rounded-2xl p-8 space-y-3">
            <span className="material-icons-round text-5xl text-zinc-600 block">music_note</span>
            <p className="text-zinc-400 text-sm font-semibold">
              {isTrackType
                ? `No tracks found for "${queryParam}"`
                : isArtistType
                ? `No artists found for "${queryParam}"`
                : isAlbumType
                ? `No albums found for "${queryParam}"`
                : `No entries found for "${queryParam}"`}
            </p>
            <p className="text-zinc-600 text-xs">Try searching for other active artists or track keywords in the top bar.</p>
          </div>
        )}

        {!loading && !error && hasFilteredResults && (
          <>
            {/* 1. TRACKS SECTION */}
            {recordings.length > 0 && showTracks && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-sans font-extrabold text-lg text-white tracking-tight flex items-center gap-2">
                    <span className="material-icons-round text-blue-500 text-xl block">music_note</span>
                    Tracks {isTrackType && `(Page ${currentPage} • ${recordings.length} results)`}
                  </h2>
                  {!currentType && recordings.length > 12 && (
                    <button
                      onClick={() => handleTypeChange('track')}
                      className="text-xs font-semibold font-mono text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                    >
                      See All
                    </button>
                  )}
                </div>
                <div className="bg-zinc-900/20 border border-zinc-900/40 rounded-2xl overflow-hidden shadow-lg animate-fade-in">
                  <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-zinc-800/40 text-xs font-mono text-zinc-500 uppercase tracking-wider items-center">
                    <span className="col-span-1 text-center">#</span>
                    <span className="col-span-5">Title</span>
                    <span className="col-span-3">Artist</span>
                    <span className="col-span-2">Album</span>
                    <span className="col-span-1 text-right">
                      <span className="material-icons-round text-sm inline-block leading-none align-middle">schedule</span>
                    </span>
                  </div>

                  <div className="divide-y divide-zinc-900/40">
                    {(currentType ? recordings : recordings.slice(0, 12)).map((rec, index) => {
                      const isCurrent = currentTrack?.id === rec.id;
                      const artistName = rec['artist-credit']?.[0]?.name || 'Unknown Artist';
                      const artistMbid = rec['artist-credit']?.[0]?.artist?.id || (artistName !== 'Unknown Artist' ? encodeURIComponent(artistName) : '');
                      const releaseId = rec['releases']?.[0]?.id;
                      const releaseCover = releaseId ? `https://coverartarchive.org/release/${releaseId}/front-250` : null;

                      const playerTrack: Track = {
                        id: rec.id,
                        title: rec.title,
                        artist: artistName,
                        artistId: artistMbid,
                        album: rec['releases']?.[0]?.title || 'Single',
                        albumId: releaseId,
                        releaseId: releaseId,
                        audioUrl: rec.audioUrl,
                        coverUrl: rec.coverUrl || releaseCover,
                        genre: rec.genre || 'Electronic',
                        duration: rec.length ? Math.floor(rec.length / 1000) : 180,
                      };

                      return (
                        <div
                          key={rec.id}
                          className={`grid grid-cols-12 gap-4 px-6 py-3.5 items-center hover:bg-zinc-900/40 transition-colors group ${
                            isCurrent ? 'bg-zinc-900/20 text-blue-400' : 'text-zinc-300'
                          }`}
                        >
                          <div className="col-span-1 flex justify-center">
                            <button
                              onClick={() => playTrack(playerTrack, recordings.map((r: any) => ({
                                id: r.id,
                                title: r.title,
                                artist: r['artist-credit']?.[0]?.name || 'Unknown Artist',
                                artistId: r['artist-credit']?.[0]?.artist?.id || (r['artist-credit']?.[0]?.name ? encodeURIComponent(r['artist-credit'][0].name) : ''),
                                album: r['releases']?.[0]?.title || 'Single',
                                albumId: r['releases']?.[0]?.id,
                                releaseId: r['releases']?.[0]?.id,
                                audioUrl: r.audioUrl,
                                coverUrl: r.coverUrl || (r['releases']?.[0]?.id ? `https://coverartarchive.org/release/${r['releases'][0].id}/front-250` : null),
                                genre: r.genre || 'Electronic',
                                duration: r.length ? Math.floor(r.length / 1000) : 180,
                              })))}
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
                          </div>

                          <div className="col-span-5 flex items-center gap-3">
                            <CoverImage
                              src={playerTrack.coverUrl}
                              fallbackSrc={releaseCover}
                              alt={playerTrack.title}
                              type="track"
                              className="w-10 h-10 object-cover rounded-lg bg-zinc-950 border border-zinc-800 shadow shrink-0"
                            />
                            <div className="truncate text-left">
                              <Link
                                href={`/track/${rec.id}`}
                                className="font-bold text-sm block hover:text-blue-400 hover:underline transition-all truncate text-white"
                              >
                                {rec.title}
                              </Link>
                              {rec['tags'] && rec['tags'].length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1 overflow-hidden">
                                  {rec['tags'].slice(0, 2).map((tag: any, idx: number) => {
                                    const tagName = typeof tag === 'string' ? tag : (tag?.name || tag?.title || '');
                                    if (!tagName) return null;
                                    return (
                                      <Link
                                        key={tagName + idx}
                                        href={`/tag/${encodeURIComponent(tagName)}`}
                                        className="text-[9px] font-mono uppercase bg-zinc-850 text-zinc-400 px-1.5 py-0.2 rounded hover:text-blue-400 transition-colors shrink-0"
                                      >
                                        {tagName}
                                      </Link>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="col-span-3 truncate text-sm text-left">
                            {artistMbid ? (
                              <Link
                                href={`/artist/${artistMbid}`}
                                className="hover:text-blue-400 hover:underline transition-colors text-zinc-400 font-semibold"
                              >
                                {artistName}
                              </Link>
                            ) : (
                              <span className="text-zinc-500 font-semibold">{artistName}</span>
                            )}
                          </div>

                          <div className="col-span-2 truncate text-sm text-zinc-400 text-left">
                            {rec['releases']?.[0]?.id ? (
                              <Link
                                href={`/album/${rec['releases'][0].id}`}
                                className="hover:text-blue-400 hover:underline transition-colors"
                              >
                                {rec['releases'][0].title}
                              </Link>
                            ) : (
                              <span className="text-zinc-500">{playerTrack.album}</span>
                            )}
                          </div>

                          <div className="col-span-1 text-right font-mono text-xs text-zinc-500 flex items-center justify-end gap-2">
                            <span>{formatDuration(rec.length)}</span>
                            <TrackMenu track={playerTrack} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tracks Pagination */}
                {isTrackType && (
                  <div id="tracks-pagination-controls" className="flex items-center justify-between pt-4">
                    {currentPage > 1 ? (
                      <Link
                        id="tracks-prev-link"
                        href={`/search?q=${encodeURIComponent(queryParam)}&type=track&page=${currentPage - 1}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-mono font-semibold text-zinc-300 hover:text-white transition-all shadow cursor-pointer"
                      >
                        <span className="material-icons-round text-base">arrow_back</span>
                        Previous
                      </Link>
                    ) : (
                      <div />
                    )}

                    <span className="text-xs font-mono text-zinc-400 bg-zinc-900/60 px-3 py-1.5 rounded-lg border border-zinc-800/60">
                      Page {currentPage}
                    </span>

                    {recordings.length > 0 && (
                      <Link
                        id="tracks-next-link"
                        href={`/search?q=${encodeURIComponent(queryParam)}&type=track&page=${currentPage + 1}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-mono font-semibold text-white transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                      >
                        Next
                        <span className="material-icons-round text-base">arrow_forward</span>
                      </Link>
                    )}
                  </div>
                )}

                {!currentType && recordings.length > 0 && (
                  <div id="tracks-overview-next-container" className="flex justify-end pt-2">
                    <Link
                      id="tracks-overview-next-link"
                      href={`/search?q=${encodeURIComponent(queryParam)}&type=track&page=2`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-mono font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
                    >
                      Next
                      <span className="material-icons-round text-base">arrow_forward</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* 2. ARTISTS SECTION */}
            {artists.length > 0 && showArtists && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-sans font-extrabold text-lg text-white tracking-tight flex items-center gap-2">
                    <span className="material-icons-round text-blue-500 text-xl block">people</span>
                    Artists {isArtistType && `(Page ${currentPage} • ${artists.length} results)`}
                  </h2>
                  {!currentType && artists.length > 12 && (
                    <button
                      onClick={() => handleTypeChange('artist')}
                      className="text-xs font-semibold font-mono text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                    >
                      See All
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {(currentType ? artists : artists.slice(0, 12)).map((art: any) => {
                    const artistImg = art.image || null;
                    return (
                      <div
                        key={art.id}
                        className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-4 flex flex-col items-center text-center gap-3 group hover:bg-zinc-900 hover:border-zinc-800 transition-all shadow"
                      >
                        <div className="w-24 h-24 rounded-full overflow-hidden border border-zinc-800 bg-zinc-950 relative shadow shrink-0">
                          <CoverImage
                            src={artistImg}
                            alt={art.name}
                            type="artist"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>
                        <div className="w-full truncate">
                          <Link
                            href={`/artist/${art.id || art.mbid || encodeURIComponent(art.name)}`}
                            className="block text-sm font-bold text-white hover:text-blue-400 transition-colors truncate"
                          >
                            {art.name}
                          </Link>
                          <span className="block text-[10px] text-zinc-500 mt-1 font-mono uppercase tracking-wide">
                            {art.type || 'Artist'} {art.country ? `• ${art.country}` : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Artists Pagination */}
                {isArtistType && (
                  <div id="artists-pagination-controls" className="flex items-center justify-between pt-4">
                    {currentPage > 1 ? (
                      <Link
                        id="artists-prev-link"
                        href={`/search?q=${encodeURIComponent(queryParam)}&type=artist&page=${currentPage - 1}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-mono font-semibold text-zinc-300 hover:text-white transition-all shadow cursor-pointer"
                      >
                        <span className="material-icons-round text-base">arrow_back</span>
                        Previous
                      </Link>
                    ) : (
                      <div />
                    )}

                    <span className="text-xs font-mono text-zinc-400 bg-zinc-900/60 px-3 py-1.5 rounded-lg border border-zinc-800/60">
                      Page {currentPage}
                    </span>

                    {artists.length > 0 && (
                      <Link
                        id="artists-next-link"
                        href={`/search?q=${encodeURIComponent(queryParam)}&type=artist&page=${currentPage + 1}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-mono font-semibold text-white transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                      >
                        Next
                        <span className="material-icons-round text-base">arrow_forward</span>
                      </Link>
                    )}
                  </div>
                )}

                {!currentType && artists.length > 0 && (
                  <div id="artists-overview-next-container" className="flex justify-end pt-2">
                    <Link
                      id="artists-overview-next-link"
                      href={`/search?q=${encodeURIComponent(queryParam)}&type=artist&page=2`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-mono font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
                    >
                      Next
                      <span className="material-icons-round text-base">arrow_forward</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* 3. ALBUMS SECTION */}
            {releases.length > 0 && showAlbums && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-sans font-extrabold text-lg text-white tracking-tight flex items-center gap-2">
                    <span className="material-icons-round text-blue-500 text-xl block">album</span>
                    Albums {isAlbumType && `(Page ${currentPage} • ${releases.length} results)`}
                  </h2>
                  {!currentType && releases.length > 20 && (
                    <button
                      onClick={() => handleTypeChange('album')}
                      className="text-xs font-semibold font-mono text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                    >
                      See All
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {(currentType ? releases : releases.slice(0, 20)).map((rel: any) => {
                    const coverImg = rel.image || `https://coverartarchive.org/release/${rel.id}/front-250`;
                    const relArtist = rel['artist-credit']?.[0]?.name || 'Unknown Artist';
                    const relArtistId = rel['artist-credit']?.[0]?.artist?.id || (relArtist !== 'Unknown Artist' ? encodeURIComponent(relArtist) : '');
                    return (
                      <div
                        key={rel.id}
                        className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-4 flex flex-col gap-3 group hover:bg-zinc-900 hover:border-zinc-800 transition-all shadow"
                      >
                        <div className="aspect-square w-full rounded-xl overflow-hidden relative border border-zinc-800 bg-zinc-950 shrink-0 shadow">
                          <CoverImage
                            src={coverImg}
                            alt={rel.title}
                            type="album"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div className="w-full truncate text-left">
                          <Link
                            href={`/album/${rel.id}`}
                            className="block text-xs font-bold text-white hover:text-blue-400 transition-colors truncate"
                          >
                            {rel.title}
                          </Link>
                          <div className="truncate text-[10px] text-zinc-400 mt-0.5">
                            {relArtistId ? (
                              <Link
                                href={`/artist/${relArtistId}`}
                                className="hover:text-blue-400 transition-colors font-medium"
                              >
                                {relArtist}
                              </Link>
                            ) : (
                              <span>{relArtist}</span>
                            )}
                          </div>
                          {rel.date && (
                            <span className="block text-[9px] text-zinc-500 mt-0.5 font-mono">
                              {rel.date.split('-')[0]} {rel.country ? `• ${rel.country}` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Albums Pagination */}
                {isAlbumType && (
                  <div id="albums-pagination-controls" className="flex items-center justify-between pt-4">
                    {currentPage > 1 ? (
                      <Link
                        id="albums-prev-link"
                        href={`/search?q=${encodeURIComponent(queryParam)}&type=album&page=${currentPage - 1}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-mono font-semibold text-zinc-300 hover:text-white transition-all shadow cursor-pointer"
                      >
                        <span className="material-icons-round text-base">arrow_back</span>
                        Previous
                      </Link>
                    ) : (
                      <div />
                    )}

                    <span className="text-xs font-mono text-zinc-400 bg-zinc-900/60 px-3 py-1.5 rounded-lg border border-zinc-800/60">
                      Page {currentPage}
                    </span>

                    {releases.length > 0 && (
                      <Link
                        id="albums-next-link"
                        href={`/search?q=${encodeURIComponent(queryParam)}&type=album&page=${currentPage + 1}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-mono font-semibold text-white transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                      >
                        Next
                        <span className="material-icons-round text-base">arrow_forward</span>
                      </Link>
                    )}
                  </div>
                )}

                {!currentType && releases.length > 0 && (
                  <div id="albums-overview-next-container" className="flex justify-end pt-2">
                    <Link
                      id="albums-overview-next-link"
                      href={`/search?q=${encodeURIComponent(queryParam)}&type=album&page=2`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-mono font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
                    >
                      Next
                      <span className="material-icons-round text-base">arrow_forward</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Loading Search...</span>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
