// /context/PlayerContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase as globalSupabase } from '@/lib/supabase';
import { Dictionary, defaultDictionary } from '@/lib/dictionary';
import Cookies from 'js-cookie';
import {
  fetchUserProfile,
  upsertUserProfile,
  fetchUserPlaylists,
  createPlaylistInSupabase,
  updatePlaylistInSupabase,
  deletePlaylistInSupabase,
  addTrackToSupabasePlaylist,
  removeTrackFromSupabasePlaylist,
  fetchUserFavorites,
  syncFavoriteArtistInSupabase,
  syncFavoriteAlbumInSupabase,
  syncFavoriteTrackInSupabase,
  FavoriteArtist,
  FavoriteAlbum,
} from '@/lib/supabaseService';
import { generateUUID } from '@/lib/userValidation';

export type { FavoriteArtist, FavoriteAlbum };

export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  album?: string;
  albumId?: string;
  releaseId?: string;
  audioUrl: string;
  coverUrl?: string | null;
  duration?: number; // in seconds
  genre?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  tracks: Track[];
  createdAt: string;
  isPublic?: boolean;
  canContribute?: boolean;
  owner?: string;
  inviteToken?: string;
}

export interface UserSession {
  username: string;
  email: string;
  isLoggedIn: boolean;
  avatarUrl?: string;
  displayName?: string;
  bio?: string;
  website?: string;
  language?: string;
  region?: string;
  supabaseUser?: any;
}

export interface PlaybackHistoryItem {
  id: string;
  track: Track;
  playedAt: string;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  searchedAt: string;
}

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  progress: number; // current time in seconds
  duration: number; // total duration in seconds
  queue: Track[];
  currentIndex: number;
  customPlaylists: Playlist[];
  userSession: UserSession;
  showAssistant: boolean;
  isVisualizerActive: boolean;
  supabase: SupabaseClient | null;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  activeDialog: 'settings' | 'help' | null;
  setActiveDialog: (dialog: 'settings' | 'help' | null) => void;
  locale: string;
  setLocale: (lang: string) => void;
  region: string;
  setRegion: (region: string) => void;
  t: Dictionary;

  // Favorites
  favoriteArtists: FavoriteArtist[];
  favoriteAlbums: FavoriteAlbum[];
  favoriteTracks: Track[];
  isFavoriteArtist: (artistId: string) => boolean;
  toggleFavoriteArtist: (artist: FavoriteArtist) => void;
  isFavoriteAlbum: (albumId: string) => boolean;
  toggleFavoriteAlbum: (album: FavoriteAlbum) => void;
  isFavoriteTrack: (trackId: string) => boolean;
  toggleFavoriteTrack: (track: Track) => void;
  refreshSupabaseData: () => Promise<void>;

  searchHistory: SearchHistoryItem[];
  playbackHistory: PlaybackHistoryItem[];
  addToSearchHistory: (query: string) => void;
  removeFromSearchHistory: (id: string) => void;
  clearSearchHistory: () => void;
  addToPlaybackHistory: (track: Track) => void;
  removeFromPlaybackHistory: (id: string) => void;
  clearPlaybackHistory: () => void;

  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (volume: number) => void;
  seek: (seconds: number) => void;
  addToQueue: (track: Track) => void;
  createPlaylist: (name: string, description?: string, isPublic?: boolean, canContribute?: boolean) => Playlist;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void;
  deletePlaylist: (id: string) => void;
  togglePlaylistVisibility: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  loginUser: (username: string, email: string) => void;
  logoutUser: () => void;
  updateUserSession: (sessionData: Partial<UserSession>) => void;
  setShowAssistant: (show: boolean) => void;
  setIsVisualizerActive: (active: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({
  children,
  initialLocale = 'en',
  initialDictionary = defaultDictionary,
}: {
  children: React.ReactNode;
  initialLocale?: string;
  initialDictionary?: Dictionary;
}) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, _setVolumeState] = useState<number>(0.8);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [showAssistant, setShowAssistant] = useState<boolean>(false);
  const [isVisualizerActive, setIsVisualizerActive] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [supabaseClient] = useState<SupabaseClient | null>(() => globalSupabase);
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('dark');
  const [activeDialog, setActiveDialog] = useState<'settings' | 'help' | null>(null);
  const [locale, setLocaleState] = useState<string>(initialLocale);
  const [region, setRegionState] = useState<string>(() => Cookies.get('USER_COUNTRY') || 'US');
  const t = initialDictionary;

  // Favorites state
  const [favoriteArtists, setFavoriteArtists] = useState<FavoriteArtist[]>([]);
  const [favoriteAlbums, setFavoriteAlbums] = useState<FavoriteAlbum[]>([]);
  const [favoriteTracks, setFavoriteTracks] = useState<Track[]>([]);

  // Playlists state
  const [customPlaylists, setCustomPlaylists] = useState<Playlist[]>([
    {
      id: 'playlist-chill',
      name: 'Midnight Chill',
      description: 'Soothing electronic ambient landscapes',
      tracks: [],
      createdAt: '2026-07-10T12:00:00.000Z',
    },
    {
      id: 'playlist-vibes',
      name: 'Electronic Beats',
      description: 'Selected futuristic synth tracks',
      tracks: [],
      createdAt: '2026-07-10T12:00:00.000Z',
    },
  ]);

  // User session state
  const [userSession, setUserSession] = useState<UserSession>({
    username: 'GuestListener',
    email: 'guest@example.com',
    isLoggedIn: false,
    avatarUrl: 'https://picsum.photos/seed/guest/150/150',
  });

  // Reference to the Audio element
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // History states
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [playbackHistory, setPlaybackHistory] = useState<PlaybackHistoryItem[]>([]);

  const setLocale = useCallback((lang: string) => {
    setLocaleState(lang);
    Cookies.set('NEXT_LOCALE', lang, { expires: 365, path: '/', sameSite: 'Lax' });
    
    // Update active userSession
    setUserSession((prev) => {
      const updated = { ...prev, language: lang };
      if (typeof window !== 'undefined') {
        localStorage.setItem('mb_user_session', JSON.stringify(updated));
      }
      return updated;
    });

    // Persist to Supabase profiles and user_metadata
    const targetUserId = userSession?.supabaseUser?.id || (typeof window !== 'undefined' ? localStorage.getItem('mb_user_id') : null) || userSession?.username;
    if (targetUserId) {
      upsertUserProfile(targetUserId, { language: lang });
    }
  }, [userSession]);

  const setRegion = useCallback((reg: string) => {
    setRegionState(reg);
    Cookies.set('USER_COUNTRY', reg, { expires: 365, path: '/', sameSite: 'Lax' });
    
    // Update active userSession
    setUserSession((prev) => {
      const updated = { ...prev, region: reg };
      if (typeof window !== 'undefined') {
        localStorage.setItem('mb_user_session', JSON.stringify(updated));
      }
      return updated;
    });

    // Persist to Supabase profiles and user_metadata
    const targetUserId = userSession?.supabaseUser?.id || (typeof window !== 'undefined' ? localStorage.getItem('mb_user_id') : null) || userSession?.username;
    if (targetUserId) {
      upsertUserProfile(targetUserId, { region: reg });
    }
  }, [userSession]);

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mb_theme', newTheme);
    }
  };

  // Sync Supabase full data
  const refreshSupabaseData = useCallback(async () => {
    const client = supabaseClient || globalSupabase;
    if (!client) return;

    try {
      const { data: { session } } = await client.auth.getSession();
      if (!session?.user) return;

      const userId = session.user.id;
      const [profile, playlists, favorites] = await Promise.all([
        fetchUserProfile(userId),
        fetchUserPlaylists(userId),
        fetchUserFavorites(userId),
      ]);

      if (profile) {
        setUserSession((prev) => {
          const updated: UserSession = {
            ...prev,
            username: profile.username || prev.username,
            displayName: profile.display_name || profile.username || prev.displayName,
            email: profile.email || session.user.email || prev.email,
            bio: profile.bio || prev.bio,
            website: profile.website || prev.website,
            avatarUrl: profile.avatar_url || prev.avatarUrl,
            language: profile.language || prev.language,
            region: profile.region || prev.region,
            isLoggedIn: true,
            supabaseUser: session.user,
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem('mb_user_session', JSON.stringify(updated));
          }
          return updated;
        });

        if (profile.language && profile.language !== locale) {
          setLocaleState(profile.language);
          Cookies.set('NEXT_LOCALE', profile.language, { expires: 365, path: '/', sameSite: 'Lax' });
        }
        if (profile.region && profile.region !== region) {
          setRegionState(profile.region);
          Cookies.set('USER_COUNTRY', profile.region, { expires: 365, path: '/', sameSite: 'Lax' });
        }
      }

      if (playlists && playlists.length > 0) {
        setCustomPlaylists(playlists);
        if (typeof window !== 'undefined') {
          localStorage.setItem('mb_playlists', JSON.stringify(playlists));
        }
      }

      if (favorites) {
        if (favorites.artists) {
          setFavoriteArtists(favorites.artists);
          if (typeof window !== 'undefined') {
            localStorage.setItem('mb_favorite_artists', JSON.stringify(favorites.artists));
          }
        }
        if (favorites.albums) {
          setFavoriteAlbums(favorites.albums);
          if (typeof window !== 'undefined') {
            localStorage.setItem('mb_favorite_albums', JSON.stringify(favorites.albums));
          }
        }
        if (favorites.tracks) {
          setFavoriteTracks(favorites.tracks);
          if (typeof window !== 'undefined') {
            localStorage.setItem('mb_favorite_tracks', JSON.stringify(favorites.tracks));
          }
        }
      }
    } catch (err) {
      console.warn('Error refreshing Supabase data in PlayerContext:', err);
    }
  }, [supabaseClient, locale, region]);

  // Favorites Helpers
  const isFavoriteArtist = useCallback(
    (artistId: string) => favoriteArtists.some((a) => a.id === artistId),
    [favoriteArtists]
  );

  const toggleFavoriteArtist = useCallback(
    (artist: FavoriteArtist) => {
      setFavoriteArtists((prev) => {
        const exists = prev.some((a) => a.id === artist.id);
        const updated = exists ? prev.filter((a) => a.id !== artist.id) : [artist, ...prev];
        if (typeof window !== 'undefined') {
          localStorage.setItem('mb_favorite_artists', JSON.stringify(updated));
        }
        if (userSession?.isLoggedIn && userSession?.supabaseUser?.id) {
          syncFavoriteArtistInSupabase(userSession.supabaseUser.id, artist, !exists);
        }
        return updated;
      });
    },
    [userSession]
  );

  const isFavoriteAlbum = useCallback(
    (albumId: string) => favoriteAlbums.some((a) => a.id === albumId),
    [favoriteAlbums]
  );

  const toggleFavoriteAlbum = useCallback(
    (album: FavoriteAlbum) => {
      setFavoriteAlbums((prev) => {
        const exists = prev.some((a) => a.id === album.id);
        const updated = exists ? prev.filter((a) => a.id !== album.id) : [album, ...prev];
        if (typeof window !== 'undefined') {
          localStorage.setItem('mb_favorite_albums', JSON.stringify(updated));
        }
        if (userSession?.isLoggedIn && userSession?.supabaseUser?.id) {
          syncFavoriteAlbumInSupabase(userSession.supabaseUser.id, album, !exists);
        }
        return updated;
      });
    },
    [userSession]
  );

  const isFavoriteTrack = useCallback(
    (trackId: string) => favoriteTracks.some((t) => t.id === trackId),
    [favoriteTracks]
  );

  const toggleFavoriteTrack = useCallback(
    (track: Track) => {
      setFavoriteTracks((prev) => {
        const exists = prev.some((t) => t.id === track.id);
        const updated = exists ? prev.filter((t) => t.id !== track.id) : [track, ...prev];
        if (typeof window !== 'undefined') {
          localStorage.setItem('mb_favorite_tracks', JSON.stringify(updated));
        }
        if (userSession?.isLoggedIn && userSession?.supabaseUser?.id) {
          syncFavoriteTrackInSupabase(userSession.supabaseUser.id, track, !exists);
        }
        return updated;
      });
    },
    [userSession]
  );

  const addToSearchHistory = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item.query.toLowerCase() !== trimmed.toLowerCase());
      const newItem: SearchHistoryItem = {
        id: `sh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        query: trimmed,
        searchedAt: new Date().toISOString(),
      };
      const updated = [newItem, ...filtered].slice(0, 100);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mb_search_history', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const removeFromSearchHistory = (id: string) => {
    setSearchHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mb_search_history', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mb_search_history');
    }
  };

  const addToPlaybackHistory = (track: Track) => {
    setPlaybackHistory((prev) => {
      const filtered = prev.filter((item) => item.track?.id !== track.id);
      const newItem: PlaybackHistoryItem = {
        id: `ph-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        track,
        playedAt: new Date().toISOString(),
      };
      const updated = [newItem, ...filtered].slice(0, 100);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mb_playback_history', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const removeFromPlaybackHistory = (id: string) => {
    setPlaybackHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mb_playback_history', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const clearPlaybackHistory = () => {
    setPlaybackHistory([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mb_playback_history');
    }
  };

  const nextTrack = () => {
    if (queue.length === 0) return;
    const nextIndex = (currentIndex + 1) % queue.length;
    setCurrentIndex(nextIndex);
    const track = queue[nextIndex];
    setCurrentTrack(track);
    if (track) addToPlaybackHistory(track);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    if (queue.length === 0) return;
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    setCurrentIndex(prevIndex);
    const track = queue[prevIndex];
    setCurrentTrack(track);
    if (track) addToPlaybackHistory(track);
    setIsPlaying(true);
  };

  const playTrack = (track: Track, newQueue?: Track[]) => {
    addToPlaybackHistory(track);
    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
      const index = newQueue.findIndex((t) => t.id === track.id);
      setCurrentIndex(index >= 0 ? index : 0);
    } else {
      const index = queue.findIndex((t) => t.id === track.id);
      if (index >= 0) {
        setCurrentIndex(index);
      } else {
        const updatedQueue = [...queue, track];
        setQueue(updatedQueue);
        setCurrentIndex(updatedQueue.length - 1);
      }
    }
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPlaylists = localStorage.getItem('mb_playlists');
      if (savedPlaylists) {
        try {
          const parsedPlaylists = JSON.parse(savedPlaylists);
          setTimeout(() => setCustomPlaylists(parsedPlaylists), 0);
        } catch (e) {
          console.error('Error loading playlists:', e);
        }
      }

      const savedUser = localStorage.getItem('mb_user_session');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setTimeout(() => setUserSession(parsedUser), 0);
        } catch (e) {
          console.error('Error loading session:', e);
        }
      }

      const savedTheme = localStorage.getItem('mb_theme') as 'light' | 'dark' | 'system' | null;
      if (savedTheme) {
        setTimeout(() => setThemeState(savedTheme), 0);
      }

      const savedSearch = localStorage.getItem('mb_search_history');
      if (savedSearch) {
        try {
          const parsed = JSON.parse(savedSearch);
          if (Array.isArray(parsed)) setTimeout(() => setSearchHistory(parsed), 0);
        } catch (e) {
          console.error('Error loading search history:', e);
        }
      }

      const savedPlayback = localStorage.getItem('mb_playback_history');
      if (savedPlayback) {
        try {
          const parsed = JSON.parse(savedPlayback);
          if (Array.isArray(parsed)) setTimeout(() => setPlaybackHistory(parsed), 0);
        } catch (e) {
          console.error('Error loading playback history:', e);
        }
      }

      const savedFavArtists = localStorage.getItem('mb_favorite_artists');
      if (savedFavArtists) {
        try {
          const parsed = JSON.parse(savedFavArtists);
          if (Array.isArray(parsed)) setTimeout(() => setFavoriteArtists(parsed), 0);
        } catch (e) {
          console.error('Error loading favorite artists:', e);
        }
      }

      const savedFavAlbums = localStorage.getItem('mb_favorite_albums');
      if (savedFavAlbums) {
        try {
          const parsed = JSON.parse(savedFavAlbums);
          if (Array.isArray(parsed)) setTimeout(() => setFavoriteAlbums(parsed), 0);
        } catch (e) {
          console.error('Error loading favorite albums:', e);
        }
      }

      const savedFavTracks = localStorage.getItem('mb_favorite_tracks');
      if (savedFavTracks) {
        try {
          const parsed = JSON.parse(savedFavTracks);
          if (Array.isArray(parsed)) setTimeout(() => setFavoriteTracks(parsed), 0);
        } catch (e) {
          console.error('Error loading favorite tracks:', e);
        }
      }
    }

    // Setup Audio element
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    const handleTimeUpdate = () => {
      if (audioRef.current) {
        setProgress(audioRef.current.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration || 180);
      }
    };

    const handleEnded = () => {
      nextTrack();
    };

    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioRef.current.addEventListener('ended', handleEnded);

    // Check for recovery URL redirect on mount
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;
      const pathname = window.location.pathname;
      if (
        (hash.includes('type=recovery') || search.includes('type=recovery')) &&
        !pathname.includes('/update-password') &&
        !pathname.includes('/reset-password')
      ) {
        window.location.href = `/update-password${search}${hash}`;
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.pause();
      }
    };
  }, []);

  // Supabase Auth & Cloud Data synchronization
  useEffect(() => {
    const client = supabaseClient || globalSupabase;
    if (!client) return;

    // Check existing active session immediately & trigger data sync
    client.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        const uname =
          u.user_metadata?.username ||
          u.user_metadata?.name ||
          u.user_metadata?.full_name ||
          u.email?.split('@')[0] ||
          'User';

        const userObj: UserSession = {
          username: uname,
          email: u.email || '',
          isLoggedIn: true,
          avatarUrl:
            u.user_metadata?.avatar_url ||
            u.user_metadata?.picture ||
            `https://picsum.photos/seed/${u.id}/150/150`,
          displayName: u.user_metadata?.full_name || u.user_metadata?.name || uname,
          supabaseUser: u,
        };
        setUserSession(userObj);
        if (typeof window !== 'undefined') {
          localStorage.setItem('mb_user_session', JSON.stringify(userObj));
        }

        // Pull full profile, playlists & favorites from Supabase
        refreshSupabaseData();
      }
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.includes('/update-password') &&
          !window.location.pathname.includes('/reset-password')
        ) {
          window.location.href = '/update-password' + window.location.hash;
        }
      }

      if (session?.user) {
        const u = session.user;
        const uname =
          u.user_metadata?.username ||
          u.user_metadata?.name ||
          u.user_metadata?.full_name ||
          u.email?.split('@')[0] ||
          'User';

        const userObj: UserSession = {
          username: uname,
          email: u.email || '',
          isLoggedIn: true,
          avatarUrl:
            u.user_metadata?.avatar_url ||
            u.user_metadata?.picture ||
            `https://picsum.photos/seed/${u.id}/150/150`,
          displayName: u.user_metadata?.full_name || u.user_metadata?.name || uname,
          supabaseUser: u,
        };
        setUserSession(userObj);
        if (typeof window !== 'undefined') {
          localStorage.setItem('mb_user_session', JSON.stringify(userObj));
        }

        // Automatically fetch and synchronize cloud data
        refreshSupabaseData();
      } else if (event === 'SIGNED_OUT') {
        const guestObj: UserSession = {
          username: 'GuestListener',
          email: 'guest@example.com',
          isLoggedIn: false,
          avatarUrl: 'https://picsum.photos/seed/guest/150/150',
        };
        setUserSession(guestObj);
        if (typeof window !== 'undefined') {
          localStorage.setItem('mb_user_session', JSON.stringify(guestObj));
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabaseClient, refreshSupabaseData]);

  // Update HTML element classes when theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    let resolvedTheme: 'light' | 'dark' = 'dark';
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      resolvedTheme = systemTheme;
    } else {
      resolvedTheme = theme;
    }

    if (resolvedTheme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.add('dark');
    }
  }, [theme]);

  // Update audio source when currentTrack changes
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    audioRef.current.src = currentTrack.audioUrl;
    audioRef.current.load();
    setProgress(0);

    if (isPlaying) {
      audioRef.current.play().catch((e) => {
        console.warn('Audio playback delayed or blocked by browser rules:', e);
        setIsPlaying(false);
      });
    }
  }, [currentTrack]);

  // Handle Play/Pause side effects
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.play().catch((e) => {
        console.warn('Failed to resume audio:', e);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const togglePlay = () => {
    if (!currentTrack && queue.length > 0) {
      playTrack(queue[0]);
    } else if (currentTrack) {
      setIsPlaying(!isPlaying);
    }
  };

  const setVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    _setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  };

  const seek = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setProgress(seconds);
    }
  };

  const addToQueue = (track: Track) => {
    if (queue.some((t) => t.id === track.id)) return;
    setQueue((prev) => [...prev, track]);
    if (queue.length === 0) {
      setCurrentTrack(track);
      setCurrentIndex(0);
    }
  };

  const createPlaylist = (name: string, description = '', isPublic = false, canContribute = false) => {
    const ownerName = userSession.displayName || userSession.username || 'User';
    const inviteToken = Math.random().toString(36).substring(2, 10);
    const newId = generateUUID();
    const newPlaylist: Playlist = {
      id: newId,
      name,
      description,
      tracks: [],
      createdAt: new Date().toISOString(),
      isPublic,
      canContribute: isPublic ? canContribute : false,
      owner: ownerName,
      inviteToken,
    };

    setCustomPlaylists((prev) => {
      const updated = [...prev, newPlaylist];
      if (typeof window !== 'undefined') {
        localStorage.setItem('mb_playlists', JSON.stringify(updated));
      }
      return updated;
    });

    if (userSession?.isLoggedIn && userSession?.supabaseUser?.id) {
      createPlaylistInSupabase(userSession.supabaseUser.id, {
        id: newId,
        name,
        description,
        isPublic,
        canContribute,
      });
    }

    return newPlaylist;
  };

  const updatePlaylist = (id: string, updates: Partial<Playlist>) => {
    setCustomPlaylists((prev) => {
      const updated = prev.map((p) => {
        if (p.id === id) {
          const isPub = updates.isPublic !== undefined ? updates.isPublic : p.isPublic;
          const canContrib =
            updates.canContribute !== undefined
              ? isPub
                ? updates.canContribute
                : false
              : isPub
              ? p.canContribute
              : false;
          return {
            ...p,
            ...updates,
            isPublic: isPub,
            canContribute: canContrib,
            owner: p.owner || userSession.displayName || userSession.username || 'User',
            inviteToken: p.inviteToken || Math.random().toString(36).substring(2, 10),
          };
        }
        return p;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('mb_playlists', JSON.stringify(updated));
      }
      return updated;
    });

    if (userSession?.isLoggedIn && userSession?.supabaseUser?.id) {
      updatePlaylistInSupabase(id, updates);
    }
  };

  const deletePlaylist = (id: string) => {
    setCustomPlaylists((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mb_playlists', JSON.stringify(updated));
      }
      return updated;
    });

    if (userSession?.isLoggedIn && userSession?.supabaseUser?.id) {
      deletePlaylistInSupabase(id);
    }
  };

  const togglePlaylistVisibility = (id: string) => {
    setCustomPlaylists((prev) => {
      let toggledIsPublic = false;
      const updated = prev.map((p) => {
        if (p.id === id) {
          toggledIsPublic = p.isPublic === true ? false : true;
          return { ...p, isPublic: toggledIsPublic };
        }
        return p;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('mb_playlists', JSON.stringify(updated));
      }
      if (userSession?.isLoggedIn && userSession?.supabaseUser?.id) {
        updatePlaylistInSupabase(id, { isPublic: toggledIsPublic });
      }
      return updated;
    });
  };

  const addTrackToPlaylist = (playlistId: string, track: Track) => {
    let position = 0;
    setCustomPlaylists((prev) => {
      const updated = prev.map((p) => {
        if (p.id === playlistId) {
          if (p.tracks.some((t) => t.id === track.id)) return p;
          position = p.tracks.length;
          return { ...p, tracks: [...p.tracks, track] };
        }
        return p;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('mb_playlists', JSON.stringify(updated));
      }
      return updated;
    });

    if (userSession?.isLoggedIn && userSession?.supabaseUser?.id) {
      addTrackToSupabasePlaylist(playlistId, track, userSession.supabaseUser.id, position);
    }
  };

  const removeTrackFromPlaylist = (playlistId: string, trackId: string) => {
    setCustomPlaylists((prev) => {
      const updated = prev.map((p) => {
        if (p.id === playlistId) {
          return { ...p, tracks: p.tracks.filter((t) => t.id !== trackId) };
        }
        return p;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('mb_playlists', JSON.stringify(updated));
      }
      return updated;
    });

    if (userSession?.isLoggedIn && userSession?.supabaseUser?.id) {
      removeTrackFromSupabasePlaylist(playlistId, trackId);
    }
  };

  const loginUser = (username: string, email: string) => {
    const userObj = {
      username,
      email,
      isLoggedIn: true,
      avatarUrl: `https://picsum.photos/seed/${username}/150/150`,
    };
    setUserSession(userObj);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mb_user_session', JSON.stringify(userObj));
    }
  };

  const logoutUser = () => {
    if (supabaseClient) {
      supabaseClient.auth.signOut();
    }
    const guestObj = {
      username: 'GuestListener',
      email: 'guest@example.com',
      isLoggedIn: false,
      avatarUrl: 'https://picsum.photos/seed/guest/150/150',
    };
    setUserSession(guestObj);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mb_user_session', JSON.stringify(guestObj));
    }
  };

  const updateUserSession = (sessionData: Partial<UserSession>) => {
    setUserSession((prev) => {
      const updated = { ...prev, ...sessionData };
      if (sessionData.username && sessionData.username !== prev.username) {
        updated.avatarUrl = `https://picsum.photos/seed/${sessionData.username}/150/150`;
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('mb_user_session', JSON.stringify(updated));
        if (updated.username) {
          if (sessionData.bio !== undefined) {
            localStorage.setItem(`mb_user_bio_${updated.username}`, sessionData.bio);
          } else if (prev.username && prev.username !== updated.username) {
            const oldBio = localStorage.getItem(`mb_user_bio_${prev.username}`);
            if (oldBio) localStorage.setItem(`mb_user_bio_${updated.username}`, oldBio);
          }
          if (sessionData.displayName !== undefined) {
            localStorage.setItem(`mb_user_displayname_${updated.username}`, sessionData.displayName);
          } else if (prev.username && prev.username !== updated.username) {
            const oldDn = localStorage.getItem(`mb_user_displayname_${prev.username}`);
            if (oldDn) localStorage.setItem(`mb_user_displayname_${updated.username}`, oldDn);
          }
          if (sessionData.website !== undefined) {
            localStorage.setItem(`mb_user_website_${updated.username}`, sessionData.website);
          } else if (prev.username && prev.username !== updated.username) {
            const oldWeb = localStorage.getItem(`mb_user_website_${prev.username}`);
            if (oldWeb) localStorage.setItem(`mb_user_website_${updated.username}`, oldWeb);
          }
        }
      }

      // Sync directly with Supabase profiles table
      if (prev.isLoggedIn && prev.supabaseUser?.id) {
        upsertUserProfile(prev.supabaseUser.id, {
          username: updated.username,
          display_name: updated.displayName,
          email: updated.email,
          bio: updated.bio,
          website: updated.website,
          avatar_url: updated.avatarUrl,
          language: updated.language || locale,
          region: updated.region || region,
        });
      }

      return updated;
    });
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        volume,
        progress,
        duration,
        queue,
        currentIndex,
        customPlaylists,
        userSession,
        showAssistant,
        isVisualizerActive,
        supabase: supabaseClient,
        sidebarOpen,
        setSidebarOpen,
        theme,
        setTheme,
        activeDialog,
        setActiveDialog,
        locale,
        setLocale,
        region,
        setRegion,
        t,
        favoriteArtists,
        favoriteAlbums,
        favoriteTracks,
        isFavoriteArtist,
        toggleFavoriteArtist,
        isFavoriteAlbum,
        toggleFavoriteAlbum,
        isFavoriteTrack,
        toggleFavoriteTrack,
        refreshSupabaseData,
        searchHistory,
        playbackHistory,
        addToSearchHistory,
        removeFromSearchHistory,
        clearSearchHistory,
        addToPlaybackHistory,
        removeFromPlaybackHistory,
        clearPlaybackHistory,
        playTrack,
        togglePlay,
        nextTrack,
        prevTrack,
        setVolume,
        seek,
        addToQueue,
        createPlaylist,
        updatePlaylist,
        deletePlaylist,
        togglePlaylistVisibility,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        loginUser,
        logoutUser,
        updateUserSession,
        setShowAssistant,
        setIsVisualizerActive,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
