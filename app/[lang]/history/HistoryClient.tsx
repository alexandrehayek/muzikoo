'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePlayer, Track } from '@/context/PlayerContext';
import CoverImage from '@/components/CoverImage';
import TrackMenu from '@/components/TrackMenu';

function formatTimeAgo(dateString: string) {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateString;
  }
}

export default function HistoryClient() {
  const router = useRouter();
  const {
    searchHistory,
    playbackHistory,
    removeFromSearchHistory,
    clearSearchHistory,
    removeFromPlaybackHistory,
    clearPlaybackHistory,
    playTrack,
    currentTrack,
    isPlaying,
    togglePlay,
  } = usePlayer();

  const [activeTab, setActiveTab] = useState<'all' | 'search' | 'playback'>('all');
  const [filterQuery, setFilterQuery] = useState('');
  const [confirmClearModal, setConfirmClearModal] = useState<'search' | 'playback' | 'all' | null>(null);

  // Filtered search items
  const filteredSearchItems = searchHistory.filter((item) =>
    item.query.toLowerCase().includes(filterQuery.trim().toLowerCase())
  );

  // Filtered playback items
  const filteredPlaybackItems = playbackHistory.filter((item) => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      item.track.title.toLowerCase().includes(q) ||
      item.track.artist.toLowerCase().includes(q) ||
      (item.track.album && item.track.album.toLowerCase().includes(q))
    );
  });

  const handleSearchClick = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handlePlayTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track, filteredPlaybackItems.map((item) => item.track));
    }
  };

  const executeClear = () => {
    if (confirmClearModal === 'search') {
      clearSearchHistory();
    } else if (confirmClearModal === 'playback') {
      clearPlaybackHistory();
    } else if (confirmClearModal === 'all') {
      clearSearchHistory();
      clearPlaybackHistory();
    }
    setConfirmClearModal(null);
  };

  const totalHistoryCount = searchHistory.length + playbackHistory.length;

  return (
    <div className="space-y-8 pb-24 animate-fade-in max-w-6xl mx-auto px-1 sm:px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <span className="material-icons-round text-2xl">history</span>
            </div>
            <div>
              <h1 className="font-sans font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                Activity History
              </h1>
              <p className="text-zinc-400 text-sm">
                View and manage your recent search queries and music playback activity.
              </p>
            </div>
          </div>
        </div>

        {totalHistoryCount > 0 && (
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setConfirmClearModal('all')}
              className="px-3.5 py-1.5 bg-zinc-900 hover:bg-rose-950/40 text-zinc-300 hover:text-rose-400 border border-zinc-800 hover:border-rose-900/50 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-icons-round text-sm">delete_sweep</span>
              <span>Clear All History</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tabs & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 bg-zinc-900/60 p-1 rounded-2xl border border-zinc-800/80 self-start">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <span>All Activity</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {totalHistoryCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'search'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <span className="material-icons-round text-sm">search</span>
            <span>Search History</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'search' ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {searchHistory.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('playback')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'playback'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <span className="material-icons-round text-sm">play_circle</span>
            <span>Playback History</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'playback' ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {playbackHistory.length}
            </span>
          </button>
        </div>

        {/* Filter input */}
        {totalHistoryCount > 0 && (
          <div className="relative w-full sm:w-64">
            <span className="material-icons-round text-base text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              filter_list
            </span>
            <input
              type="text"
              placeholder="Filter history..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <span className="material-icons-round text-sm">close</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="space-y-10">
        {/* SEARCH HISTORY SECTION */}
        {(activeTab === 'all' || activeTab === 'search') && (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900/80 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="material-icons-round text-blue-400 text-xl">search</span>
                <h2 className="font-sans font-bold text-lg text-white">Search History</h2>
                <span className="text-xs text-zinc-500 font-mono">({filteredSearchItems.length})</span>
              </div>

              {searchHistory.length > 0 && (
                <button
                  onClick={() => setConfirmClearModal('search')}
                  className="text-xs text-zinc-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-icons-round text-sm">delete_outline</span>
                  <span>Clear Search History</span>
                </button>
              )}
            </div>

            {filteredSearchItems.length === 0 ? (
              <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-2xl p-8 text-center space-y-2">
                <span className="material-icons-round text-3xl text-zinc-600">manage_search</span>
                <p className="text-zinc-400 text-sm font-medium">
                  {filterQuery ? 'No search queries match your filter.' : 'Your search history is empty.'}
                </p>
                <p className="text-zinc-600 text-xs">
                  Searches you perform using the top bar search box will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredSearchItems.map((item) => (
                  <div
                    key={item.id}
                    className="group bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-all"
                  >
                    <button
                      onClick={() => handleSearchClick(item.query)}
                      className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                      title={`Search for "${item.query}"`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-center shrink-0 group-hover:border-blue-500/40 text-zinc-400 group-hover:text-blue-400 transition-colors">
                        <span className="material-icons-round text-sm">search</span>
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-sm text-zinc-200 group-hover:text-white truncate block">
                          {item.query}
                        </span>
                        <span className="text-[11px] text-zinc-500 font-mono block">
                          {formatTimeAgo(item.searchedAt)}
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => removeFromSearchHistory(item.id)}
                      className="p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-950/30 transition-colors opacity-80 group-hover:opacity-100 cursor-pointer shrink-0"
                      title="Remove from history"
                    >
                      <span className="material-icons-round text-sm">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* PLAYBACK HISTORY SECTION */}
        {(activeTab === 'all' || activeTab === 'playback') && (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900/80 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="material-icons-round text-blue-400 text-xl">play_circle</span>
                <h2 className="font-sans font-bold text-lg text-white">Playback History</h2>
                <span className="text-xs text-zinc-500 font-mono">({filteredPlaybackItems.length})</span>
              </div>

              {playbackHistory.length > 0 && (
                <button
                  onClick={() => setConfirmClearModal('playback')}
                  className="text-xs text-zinc-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-icons-round text-sm">delete_outline</span>
                  <span>Clear Playback History</span>
                </button>
              )}
            </div>

            {filteredPlaybackItems.length === 0 ? (
              <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-2xl p-8 text-center space-y-2">
                <span className="material-icons-round text-3xl text-zinc-600">graphic_eq</span>
                <p className="text-zinc-400 text-sm font-medium">
                  {filterQuery ? 'No tracks match your filter.' : 'Your playback history is empty.'}
                </p>
                <p className="text-zinc-600 text-xs">
                  Tracks you listen to will automatically be recorded here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPlaybackItems.map((item) => {
                  const isCurrent = currentTrack?.id === item.track.id;
                  return (
                    <div
                      key={item.id}
                      className={`group border rounded-2xl p-3 flex items-center justify-between gap-3 sm:gap-4 transition-all ${
                        isCurrent
                          ? 'bg-blue-950/20 border-blue-500/40'
                          : 'bg-zinc-900/30 hover:bg-zinc-900/70 border-zinc-900 hover:border-zinc-800'
                      }`}
                    >
                      {/* Play button & Cover image */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 group/cover">
                          <CoverImage
                            src={item.track.coverUrl}
                            alt={item.track.title}
                            type="album"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => handlePlayTrack(item.track)}
                            className={`absolute inset-0 flex items-center justify-center bg-black/60 transition-opacity cursor-pointer ${
                              isCurrent ? 'opacity-100 text-blue-400' : 'opacity-0 group-hover/cover:opacity-100 text-white'
                            }`}
                            title={isCurrent && isPlaying ? 'Pause' : 'Play'}
                          >
                            <span className="material-icons-round text-2xl">
                              {isCurrent && isPlaying ? 'pause_circle' : 'play_circle'}
                            </span>
                          </button>
                        </div>

                        {/* Track Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/track/${item.track.id}`}
                              className="font-bold text-sm text-white hover:text-blue-400 transition-colors truncate block"
                            >
                              {item.track.title}
                            </Link>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-medium border border-blue-500/30 shrink-0">
                                {isPlaying ? 'Playing' : 'Paused'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-zinc-400 truncate mt-0.5">
                            {item.track.artistId ? (
                              <Link
                                href={`/artist/${item.track.artistId}`}
                                className="hover:text-zinc-200 transition-colors truncate"
                              >
                                {item.track.artist}
                              </Link>
                            ) : (
                              <span className="truncate">{item.track.artist}</span>
                            )}

                            {item.track.album && (
                              <>
                                <span className="text-zinc-600">•</span>
                                <span className="text-zinc-500 truncate">{item.track.album}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Played timestamp & Actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-zinc-500 font-mono hidden sm:inline">
                          {formatTimeAgo(item.playedAt)}
                        </span>

                        <TrackMenu track={item.track} />

                        <button
                          onClick={() => handlePlayTrack(item.track)}
                          className="p-2 rounded-xl bg-zinc-800/60 hover:bg-blue-500 text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                          title="Play Track"
                        >
                          <span className="material-icons-round text-base">
                            {isCurrent && isPlaying ? 'pause' : 'play_arrow'}
                          </span>
                        </button>

                        <button
                          onClick={() => removeFromPlaybackHistory(item.id)}
                          className="p-2 rounded-xl text-zinc-600 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer flex items-center justify-center"
                          title="Remove from history"
                        >
                          <span className="material-icons-round text-base">close</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Clear Confirmation Modal */}
      {confirmClearModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <span className="material-icons-round text-2xl">delete_forever</span>
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-extrabold text-lg text-white">
                Clear {confirmClearModal === 'all' ? 'All' : confirmClearModal === 'search' ? 'Search' : 'Playback'} History?
              </h3>
              <p className="text-xs text-zinc-400">
                This action will permanently delete your recorded {confirmClearModal} history entries.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setConfirmClearModal(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeClear}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
