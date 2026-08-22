// /lib/supabaseService.ts
import { supabase } from '@/lib/supabase';
import { Playlist, Track } from '@/context/PlayerContext';
import { generateUUID } from '@/lib/userValidation';

export const isUUID = (str?: string): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str.trim());
};

export interface UserProfileData {
  id: string;
  username: string;
  display_name?: string;
  email?: string;
  bio?: string;
  website?: string;
  avatar_url?: string;
  language?: string;
  region?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FavoriteArtist {
  id: string; // artist_id
  name: string;
  image?: string;
}

export interface FavoriteAlbum {
  id: string; // album_id
  title: string;
  artist: string;
  artistId?: string;
  coverUrl?: string;
  releaseDate?: string;
}

// ----------------------------------------------------------------------------
// 1. PROFILES & PREFERENCES
// ----------------------------------------------------------------------------

export async function fetchUserProfile(userId: string): Promise<UserProfileData | null> {
  if (supabase) {
    try {
      // 1. Try querying the profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // 2. Also check if the current auth session has user_metadata (which always persists in Supabase Auth)
      const { data: sessionData } = await supabase.auth.getSession();
      const authUser = sessionData?.session?.user;
      const meta = authUser?.id === userId ? authUser.user_metadata : undefined;

      if (!error && data) {
        // Merge with auth metadata if table fields are blank
        const mergedFromAuth: UserProfileData = {
          ...data,
          username: data.username || meta?.username || '',
          display_name: data.display_name || meta?.display_name || meta?.full_name || data.username,
          language: data.language || meta?.language || undefined,
          region: data.region || meta?.region || undefined,
          avatar_url: data.avatar_url || meta?.avatar_url || undefined,
        };
        return mergedFromAuth;
      }

      if (meta) {
        return {
          id: userId,
          username: meta.username || authUser?.email?.split('@')[0] || 'User',
          display_name: meta.display_name || meta.full_name || meta.username,
          email: authUser?.email,
          language: meta.language,
          region: meta.region,
          avatar_url: meta.avatar_url,
        };
      }
    } catch (err) {
      console.warn('Supabase fetchUserProfile failed:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`mb_user_profile_${userId}`);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
  }
  return null;
}

export async function fetchUserProfileByUsername(username: string): Promise<UserProfileData | null> {
  const trimmed = username.trim();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', trimmed)
        .maybeSingle();

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('Supabase fetchUserProfileByUsername failed:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`mb_user_profile_name_${trimmed.toLowerCase()}`);
      if (stored) return JSON.parse(stored);

      // Check registered users
      const rawReg = localStorage.getItem('mb_registered_users');
      if (rawReg) {
        const list = JSON.parse(rawReg);
        const match = list.find((u: any) => u.username?.toLowerCase() === trimmed.toLowerCase());
        if (match && match.id) {
          const uProfile = localStorage.getItem(`mb_user_profile_${match.id}`);
          if (uProfile) return JSON.parse(uProfile);
        }
      }
    } catch {
      // ignore
    }
  }
  return null;
}

export async function upsertUserProfile(
  userId: string,
  profile: Partial<UserProfileData>
): Promise<UserProfileData | null> {
  console.groupCollapsed(`[Supabase Service] upsertUserProfile: ${userId}`);
  console.log('Incoming profile parameters:', profile);

  // Resolve active authenticated user ID if userId passed is not a UUID or if auth user exists
  let effectiveUserId = userId;
  if (supabase) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id) {
        effectiveUserId = authData.user.id;
        console.log('Resolved active authenticated user ID:', effectiveUserId);
      }
    } catch (e) {
      console.warn('Could not check current auth user in upsertUserProfile:', e);
    }
  }

  // If effectiveUserId is still not a valid UUID (e.g., guest user or username string), generate or recover stored UUID
  if (!isUUID(effectiveUserId) && typeof window !== 'undefined') {
    const cachedId = localStorage.getItem('mb_user_id');
    if (cachedId && isUUID(cachedId)) {
      effectiveUserId = cachedId;
    } else {
      effectiveUserId = generateUUID();
      localStorage.setItem('mb_user_id', effectiveUserId);
    }
    console.log('Assigned synthetic UUID for profile persistence:', effectiveUserId);
  }

  const payload: Record<string, any> = {
    id: effectiveUserId,
    updated_at: new Date().toISOString(),
  };

  if (profile.username !== undefined) payload.username = profile.username.trim();
  if (profile.display_name !== undefined) payload.display_name = profile.display_name.trim();
  if (profile.email !== undefined) payload.email = profile.email.trim();
  if (profile.bio !== undefined) payload.bio = profile.bio;
  if (profile.website !== undefined) payload.website = profile.website;
  if (profile.avatar_url !== undefined) payload.avatar_url = profile.avatar_url;
  if (profile.language !== undefined) payload.language = profile.language;
  if (profile.region !== undefined) payload.region = profile.region;

  console.log('Upsert payload:', payload);

  // Always update registered users directory
  if (payload.username || payload.email) {
    recordRegisteredUser({
      id: effectiveUserId,
      username: payload.username || profile.username || '',
      email: payload.email || profile.email || '',
    });
  }

  // Always update local storage key for offline/guest/fast local fallback
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`mb_user_profile_${effectiveUserId}`);
      const existing = stored ? JSON.parse(stored) : {};
      const merged = { ...existing, ...payload };
      localStorage.setItem(`mb_user_profile_${effectiveUserId}`, JSON.stringify(merged));
      
      // Also cache under legacy/original userId key if different
      if (userId !== effectiveUserId) {
        localStorage.setItem(`mb_user_profile_${userId}`, JSON.stringify(merged));
      }

      if (payload.username) {
        localStorage.setItem(`mb_user_profile_name_${payload.username.toLowerCase()}`, JSON.stringify(merged));
        localStorage.setItem(`mb_user_bio_${payload.username}`, payload.bio || '');
        localStorage.setItem(`mb_user_displayname_${payload.username}`, payload.display_name || '');
        localStorage.setItem(`mb_user_website_${payload.username}`, payload.website || '');
      }
      console.log('Updated local profile caches successfully');
    } catch (e) {
      console.warn('Failed to update local profile cache:', e);
    }
  }

  if (supabase) {
    try {
      // 1. Check if we have an active authenticated Supabase session
      const { data: sessionData } = await supabase.auth.getSession();
      const currentAuthUser = sessionData?.session?.user;

      if (currentAuthUser) {
        // Populate fallback fields if missing to prevent NOT NULL constraint issues on insert
        if (!payload.username) {
          payload.username = currentAuthUser.user_metadata?.username || currentAuthUser.email?.split('@')[0] || 'User';
        }
        if (!payload.email && currentAuthUser.email) {
          payload.email = currentAuthUser.email;
        }

        // Update Auth metadata in Supabase Auth if user is authenticated (including language and region preferences)
        const userMetadataUpdates: Record<string, any> = {};
        if (payload.username !== undefined) userMetadataUpdates.username = payload.username;
        if (payload.display_name !== undefined) {
          userMetadataUpdates.display_name = payload.display_name;
          userMetadataUpdates.full_name = payload.display_name;
        }
        if (payload.avatar_url !== undefined) userMetadataUpdates.avatar_url = payload.avatar_url;
        if (payload.language !== undefined) userMetadataUpdates.language = payload.language;
        if (payload.region !== undefined) userMetadataUpdates.region = payload.region;

        if (Object.keys(userMetadataUpdates).length > 0) {
          try {
            const res = await supabase.auth.updateUser({
              data: userMetadataUpdates,
            });
            if (res.error) {
              console.warn('Supabase auth.updateUser returned warning:', res.error.message);
            } else {
              console.log('Supabase auth.updateUser metadata successfully updated with preferences:', userMetadataUpdates);
            }
          } catch (e) {
            console.warn('Supabase updateUser metadata update non-blocking warning:', e);
          }
        }

        // Execute table upsert for the authenticated user
        console.log('Executing Supabase profiles table upsert for authenticated user:', currentAuthUser.id);
        const { data, error } = await supabase
          .from('profiles')
          .upsert(payload, { onConflict: 'id' })
          .select()
          .maybeSingle();

        if (error) {
          console.warn('[Supabase profiles table] Upsert note / RLS policy constraint:', error.message);
          if (error.message?.includes('row-level security policy') || error.message?.includes('violates row-level security')) {
            console.info(
              'Supabase RLS Note: The "profiles" table has Row-Level Security enabled requiring (auth.uid() = id). ' +
              'Ensure the Supabase policy allows authenticated users to INSERT & UPDATE their own row:\n' +
              'CREATE POLICY "Allow users to update own profile" ON profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);'
            );
          }
          console.groupEnd();
          return payload as UserProfileData;
        }

        console.log('Supabase profiles table upsert succeeded! Returned data:', data);
        console.groupEnd();
        if (data) {
          return data;
        }
      } else {
        console.info(
          '[Supabase Service] User is currently not signed into Supabase Auth (Guest mode). ' +
          'Profile changes are safely stored in local state and client cache. ' +
          'Sign in to sync with remote Supabase profiles table.'
        );
        console.groupEnd();
        return payload as UserProfileData;
      }
    } catch (err) {
      console.warn('Supabase upsertUserProfile non-blocking warning:', err);
      console.groupEnd();
    }
  } else {
    console.log('Supabase client is not connected; persisted to local storage directory');
    console.groupEnd();
  }

  return payload as UserProfileData;
}

export async function checkIsUsernameTaken(username: string, excludeUserId?: string): Promise<boolean> {
  const trimmed = username.trim();
  if (!trimmed) return false;

  if (supabase) {
    try {
      let query = supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', trimmed);

      if (excludeUserId) {
        query = query.neq('id', excludeUserId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return true;
      }
    } catch (err) {
      console.warn('Supabase checkIsUsernameTaken error:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('mb_registered_users');
      if (stored) {
        const users: Array<{ id?: string; username: string; email: string }> = JSON.parse(stored);
        const match = users.some(
          (u) =>
            u.username?.toLowerCase() === trimmed.toLowerCase() &&
            (!excludeUserId || (u.id && u.id !== excludeUserId))
        );
        if (match) return true;
      }
    } catch {
      // ignore
    }
  }

  return false;
}

export async function checkIsEmailRegistered(email: string, excludeUserId?: string): Promise<boolean> {
  const trimmed = email.trim();
  if (!trimmed) return false;

  if (supabase) {
    try {
      let query = supabase
        .from('profiles')
        .select('id, email')
        .ilike('email', trimmed);

      if (excludeUserId) {
        query = query.neq('id', excludeUserId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return true;
      }
    } catch (err) {
      console.warn('Supabase checkIsEmailRegistered error:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('mb_registered_users');
      if (stored) {
        const users: Array<{ id?: string; username: string; email: string }> = JSON.parse(stored);
        const match = users.some(
          (u) =>
            u.email?.toLowerCase() === trimmed.toLowerCase() &&
            (!excludeUserId || (u.id && u.id !== excludeUserId))
        );
        if (match) return true;
      }
    } catch {
      // ignore
    }
  }

  return false;
}

export function recordRegisteredUser(user: { id?: string; username: string; email: string }) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('mb_registered_users');
    let list: Array<{ id?: string; username: string; email: string }> = raw ? JSON.parse(raw) : [];
    const existingIndex = list.findIndex(
      (u) => (user.id && u.id === user.id) || u.email.toLowerCase() === user.email.toLowerCase()
    );
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...user };
    } else {
      list.push(user);
    }
    localStorage.setItem('mb_registered_users', JSON.stringify(list));
  } catch {
    // ignore
  }
}

// ----------------------------------------------------------------------------
// 2. PLAYLISTS & PLAYLIST TRACKS
// ----------------------------------------------------------------------------

export async function fetchUserPlaylists(userId: string): Promise<Playlist[]> {
  if (!supabase) return [];
  try {
    const { data: playlistsData, error } = await supabase
      .from('playlists')
      .select(`
        id,
        name,
        description,
        is_public,
        can_contribute,
        invite_token,
        created_at,
        playlist_tracks (
          id,
          track_id,
          title,
          artist_name,
          artist_id,
          album_title,
          album_id,
          duration_ms,
          cover_url,
          position
        )
      `)
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching playlists from Supabase:', error.message);
      return [];
    }

    if (!playlistsData) return [];

    return playlistsData.map((p: any) => {
      const sortedTracks = (p.playlist_tracks || []).sort(
        (a: any, b: any) => (a.position || 0) - (b.position || 0)
      );

      return {
        id: p.id,
        name: p.name,
        description: p.description || '',
        isPublic: Boolean(p.is_public),
        canContribute: Boolean(p.can_contribute),
        inviteToken: p.invite_token,
        createdAt: p.created_at,
        tracks: sortedTracks.map((t: any) => ({
          id: t.track_id,
          title: t.title,
          artist: t.artist_name,
          artistId: t.artist_id,
          album: t.album_title,
          albumId: t.album_id,
          duration: t.duration_ms ? Math.round(t.duration_ms / 1000) : 180,
          coverUrl: t.cover_url || null,
          audioUrl: '',
        })),
      };
    });
  } catch (err) {
    console.warn('Supabase fetchUserPlaylists failed:', err);
    return [];
  }
}

export async function fetchPublicUserPlaylists(userId: string): Promise<Playlist[]> {
  if (!supabase) return [];
  try {
    const { data: playlistsData, error } = await supabase
      .from('playlists')
      .select(`
        id,
        name,
        description,
        is_public,
        can_contribute,
        invite_token,
        created_at,
        playlist_tracks (
          id,
          track_id,
          title,
          artist_name,
          artist_id,
          album_title,
          album_id,
          duration_ms,
          cover_url,
          position
        )
      `)
      .eq('owner_id', userId)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching public playlists from Supabase:', error.message);
      return [];
    }

    if (!playlistsData) return [];

    return playlistsData.map((p: any) => {
      const sortedTracks = (p.playlist_tracks || []).sort(
        (a: any, b: any) => (a.position || 0) - (b.position || 0)
      );

      return {
        id: p.id,
        name: p.name,
        description: p.description || '',
        isPublic: true,
        canContribute: Boolean(p.can_contribute),
        inviteToken: p.invite_token,
        createdAt: p.created_at,
        tracks: sortedTracks.map((t: any) => ({
          id: t.track_id,
          title: t.title,
          artist: t.artist_name,
          artistId: t.artist_id,
          album: t.album_title,
          albumId: t.album_id,
          duration: t.duration_ms ? Math.round(t.duration_ms / 1000) : 180,
          coverUrl: t.cover_url || null,
          audioUrl: '',
        })),
      };
    });
  } catch (err) {
    console.warn('Supabase fetchPublicUserPlaylists failed:', err);
    return [];
  }
}

export async function createPlaylistInSupabase(
  userId: string,
  playlist: { id?: string; name: string; description?: string; isPublic?: boolean; canContribute?: boolean }
): Promise<string | null> {
  if (!supabase) return null;
  try {
    const playlistId = playlist.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(playlist.id)
      ? playlist.id
      : generateUUID();

    const payload: any = {
      id: playlistId,
      owner_id: userId,
      name: playlist.name,
      description: playlist.description || '',
      is_public: Boolean(playlist.isPublic),
      can_contribute: Boolean(playlist.canContribute),
    };

    const { data, error } = await supabase
      .from('playlists')
      .insert(payload)
      .select('id, invite_token')
      .single();

    if (error) {
      console.warn('Error creating playlist in Supabase:', error.message);
      return null;
    }
    return data?.id || playlistId;
  } catch (err) {
    console.warn('Supabase createPlaylist failed:', err);
    return null;
  }
}

export async function updatePlaylistInSupabase(
  playlistId: string,
  updates: { name?: string; description?: string; isPublic?: boolean; canContribute?: boolean }
): Promise<boolean> {
  if (!supabase) return false;
  try {
    const payload: any = {
      updated_at: new Date().toISOString(),
    };
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.isPublic !== undefined) payload.is_public = updates.isPublic;
    if (updates.canContribute !== undefined) payload.can_contribute = updates.canContribute;

    const { error } = await supabase
      .from('playlists')
      .update(payload)
      .eq('id', playlistId);

    if (error) {
      console.warn('Error updating playlist in Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase updatePlaylist failed:', err);
    return false;
  }
}

export async function deletePlaylistInSupabase(playlistId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    // Delete tracks first then playlist
    await supabase.from('playlist_tracks').delete().eq('playlist_id', playlistId);

    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlistId);

    if (error) {
      console.warn('Error deleting playlist in Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase deletePlaylist failed:', err);
    return false;
  }
}

export async function addTrackToSupabasePlaylist(
  playlistId: string,
  track: Track,
  userId?: string,
  position: number = 0
): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('playlist_tracks').insert({
      id: generateUUID(),
      playlist_id: playlistId,
      added_by: userId || null,
      track_id: track.id,
      title: track.title,
      artist_name: track.artist,
      artist_id: track.artistId || null,
      album_title: track.album || null,
      album_id: track.albumId || track.releaseId || null,
      duration_ms: (track.duration || 180) * 1000,
      cover_url: track.coverUrl || null,
      position,
    });

    if (error) {
      console.warn('Error adding track to Supabase playlist:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase addTrack failed:', err);
    return false;
  }
}

export async function removeTrackFromSupabasePlaylist(
  playlistId: string,
  trackId: string
): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('track_id', trackId);

    if (error) {
      console.warn('Error removing track from Supabase playlist:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase removeTrack failed:', err);
    return false;
  }
}

// ----------------------------------------------------------------------------
// 3. FAVORITES: ARTISTS, ALBUMS, TRACKS
// ----------------------------------------------------------------------------

export async function fetchUserFavorites(userId: string): Promise<{
  artists: FavoriteArtist[];
  albums: FavoriteAlbum[];
  tracks: Track[];
}> {
  if (!supabase) return { artists: [], albums: [], tracks: [] };
  try {
    const [artistsRes, albumsRes, tracksRes] = await Promise.all([
      supabase
        .from('user_favorite_artists')
        .select('artist_id, artist_name, image_url')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('user_favorite_albums')
        .select('album_id, title, artist_name, artist_id, cover_url, release_date')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('user_favorite_tracks')
        .select('track_id, title, artist_name, artist_id, album_title, album_id, duration_ms, cover_url')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
    ]);

    const artists: FavoriteArtist[] = (artistsRes.data || []).map((a: any) => ({
      id: a.artist_id,
      name: a.artist_name,
      image: a.image_url || '',
    }));

    const albums: FavoriteAlbum[] = (albumsRes.data || []).map((a: any) => ({
      id: a.album_id,
      title: a.title,
      artist: a.artist_name,
      artistId: a.artist_id,
      coverUrl: a.cover_url || '',
      releaseDate: a.release_date || '',
    }));

    const tracks: Track[] = (tracksRes.data || []).map((t: any) => ({
      id: t.track_id,
      title: t.title,
      artist: t.artist_name,
      artistId: t.artist_id,
      album: t.album_title,
      albumId: t.album_id,
      duration: t.duration_ms ? Math.round(t.duration_ms / 1000) : 180,
      coverUrl: t.cover_url || null,
      audioUrl: '',
    }));

    return { artists, albums, tracks };
  } catch (err) {
    console.warn('Supabase fetchUserFavorites failed:', err);
    return { artists: [], albums: [], tracks: [] };
  }
}

export async function syncFavoriteArtistInSupabase(
  userId: string,
  artist: FavoriteArtist,
  isFavorite: boolean
): Promise<boolean> {
  if (!supabase) return false;
  try {
    if (isFavorite) {
      const { error } = await supabase.from('user_favorite_artists').upsert({
        user_id: userId,
        artist_id: artist.id,
        artist_name: artist.name,
        image_url: artist.image || null,
      }, { onConflict: 'user_id,artist_id' });
      if (error) console.warn('Favorite artist sync error:', error.message);
      return !error;
    } else {
      const { error } = await supabase
        .from('user_favorite_artists')
        .delete()
        .eq('user_id', userId)
        .eq('artist_id', artist.id);
      if (error) console.warn('Unfavorite artist sync error:', error.message);
      return !error;
    }
  } catch (err) {
    console.warn('Supabase syncFavoriteArtist failed:', err);
    return false;
  }
}

export async function syncFavoriteAlbumInSupabase(
  userId: string,
  album: FavoriteAlbum,
  isFavorite: boolean
): Promise<boolean> {
  if (!supabase) return false;
  try {
    if (isFavorite) {
      const { error } = await supabase.from('user_favorite_albums').upsert({
        user_id: userId,
        album_id: album.id,
        title: album.title,
        artist_name: album.artist,
        artist_id: album.artistId || null,
        cover_url: album.coverUrl || null,
        release_date: album.releaseDate || null,
      }, { onConflict: 'user_id,album_id' });
      if (error) console.warn('Favorite album sync error:', error.message);
      return !error;
    } else {
      const { error } = await supabase
        .from('user_favorite_albums')
        .delete()
        .eq('user_id', userId)
        .eq('album_id', album.id);
      if (error) console.warn('Unfavorite album sync error:', error.message);
      return !error;
    }
  } catch (err) {
    console.warn('Supabase syncFavoriteAlbum failed:', err);
    return false;
  }
}

export async function syncFavoriteTrackInSupabase(
  userId: string,
  track: Track,
  isFavorite: boolean
): Promise<boolean> {
  if (!supabase) return false;
  try {
    if (isFavorite) {
      const { error } = await supabase.from('user_favorite_tracks').upsert({
        user_id: userId,
        track_id: track.id,
        title: track.title,
        artist_name: track.artist,
        artist_id: track.artistId || null,
        album_title: track.album || null,
        album_id: track.albumId || track.releaseId || null,
        duration_ms: (track.duration || 180) * 1000,
        cover_url: track.coverUrl || null,
      }, { onConflict: 'user_id,track_id' });
      if (error) console.warn('Favorite track sync error:', error.message);
      return !error;
    } else {
      const { error } = await supabase
        .from('user_favorite_tracks')
        .delete()
        .eq('user_id', userId)
        .eq('track_id', track.id);
      if (error) console.warn('Unfavorite track sync error:', error.message);
      return !error;
    }
  } catch (err) {
    console.warn('Supabase syncFavoriteTrack failed:', err);
    return false;
  }
}
