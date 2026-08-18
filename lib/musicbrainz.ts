// /lib/musicbrainz.ts
// Live integration with the MusicBrainz and ListenBrainz API databases

const MUSICBRAINZ_BASE = 'https://musicbrainz.org/ws/2';
const LISTENBRAINZ_BASE = 'https://api.listenbrainz.org/1';

// Custom User-Agent required by MusicBrainz to prevent 403 / rate-limit blocking
const HEADERS = {
  'User-Agent': 'MusicBrainzPlayer/1.0.0 (hayek.alex@gmail.com)',
  'Accept': 'application/json',
};

// High-quality royalty-free preview tracks to associate with MusicBrainz recording IDs
// dynamically so the user can play actual high-quality music
export const SAMPLE_AUDIO_PREVIEWS = [
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    title: 'Solar Winds',
    genre: 'Ambient Electronic',
  },
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    title: 'Neon Drift',
    genre: 'Synthwave',
  },
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    title: 'Ethereal Eclipse',
    genre: 'Post-Rock',
  },
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    title: 'Midnight Highway',
    genre: 'Retro-Electro',
  },
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    title: 'Aura of Silence',
    genre: 'Chillout Ambient',
  },
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    title: 'Quantum Cascade',
    genre: 'Krautrock',
  },
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    title: 'Vapor Horizon',
    genre: 'Vaporwave',
  },
  {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    title: 'Echoes of the Forest',
    genre: 'Acoustic Folk',
  }
];

// Helper to associate a recording ID with a stable sample audio URL, stable genre, and cover art
export function getSampleMusic(
  recordingId: string,
  releaseId?: string,
  releaseGroupId?: string,
  fallbackCover?: string
) {
  // Use a simple hash function of the UUID to get a stable index
  let hash = 0;
  for (let i = 0; i < recordingId.length; i++) {
    hash = recordingId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SAMPLE_AUDIO_PREVIEWS.length;
  const track = SAMPLE_AUDIO_PREVIEWS[index];

  // Prioritize album (release) cover art if the track is part of an album/release
  let albumCover: string | null = null;
  if (releaseId && /^[0-9a-f-]{36}$/i.test(releaseId)) {
    albumCover = `https://coverartarchive.org/release/${releaseId}/front-500`;
  } else if (releaseGroupId && /^[0-9a-f-]{36}$/i.test(releaseGroupId)) {
    albumCover = `https://coverartarchive.org/release-group/${releaseGroupId}/front-500`;
  } else if (recordingId && /^[0-9a-f-]{36}$/i.test(recordingId)) {
    albumCover = `https://coverartarchive.org/release/${recordingId}/front-500`;
  }

  const finalCover = albumCover || fallbackCover || null;

  return {
    audioUrl: track.url,
    genre: track.genre,
    coverUrl: finalCover,
  };
}

export async function searchRecordings(query: string, limit = 50, offset = 0) {
  try {
    const res = await fetch(`${MUSICBRAINZ_BASE}/recording/?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&fmt=json`, { headers: HEADERS });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return data.recordings || [];
  } catch (error) {
    console.warn(`Could not search recordings for query "${query}":`, error instanceof Error ? error.message : error);
    return [];
  }
}

export async function searchArtists(query: string, limit = 50, offset = 0) {
  try {
    const res = await fetch(`${MUSICBRAINZ_BASE}/artist/?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&fmt=json`, { headers: HEADERS });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return data.artists || [];
  } catch (error) {
    console.warn(`Could not search artists for query "${query}":`, error instanceof Error ? error.message : error);
    return [];
  }
}

export async function searchReleases(query: string, limit = 50, offset = 0) {
  try {
    const res = await fetch(`${MUSICBRAINZ_BASE}/release/?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&fmt=json`, { headers: HEADERS });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return data.releases || [];
  } catch (error) {
    console.warn(`Could not search releases for query "${query}":`, error instanceof Error ? error.message : error);
    return [];
  }
}

export async function getRecordingDetails(id: string) {
  try {
    const res = await fetch(`${MUSICBRAINZ_BASE}/recording/${id}?inc=artists+releases+tags+ratings&fmt=json`, { headers: HEADERS });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn(`Could not fetch recording ${id}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

export async function getArtistDetails(id: string) {
  try {
    const res = await fetch(`${MUSICBRAINZ_BASE}/artist/${id}?inc=recordings+releases+release-groups+tags&fmt=json`, { headers: HEADERS });
    if (!res.ok) {
      const basicRes = await fetch(`${MUSICBRAINZ_BASE}/artist/${id}?fmt=json`, { headers: HEADERS });
      if (basicRes.ok) return await basicRes.json();
      throw new Error(`Status ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.warn(`Could not fetch artist ${id}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

export async function getArtistReleaseGroups(artistId: string) {
  try {
    const isUuid = /^[0-9a-f-]{36}$/i.test(artistId);
    let url = `${MUSICBRAINZ_BASE}/release-group?artist=${artistId}&limit=100&fmt=json`;
    if (!isUuid) {
      url = `${MUSICBRAINZ_BASE}/release-group?query=artist:"${encodeURIComponent(artistId)}"&limit=100&fmt=json`;
    }
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return data['release-groups'] || [];
  } catch (error) {
    console.warn(`Could not fetch release-groups for artist ${artistId}:`, error instanceof Error ? error.message : error);
    return [];
  }
}

export async function getReleaseDetails(id: string) {
  try {
    const res = await fetch(`${MUSICBRAINZ_BASE}/release/${id}?inc=artists+recordings+release-groups+labels&fmt=json`, { headers: HEADERS });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn(`Could not fetch release ${id}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

export async function getReleaseGroupDetails(id: string) {
  try {
    const res = await fetch(`${MUSICBRAINZ_BASE}/release-group/${id}?inc=artists+releases+tags&fmt=json`, { headers: HEADERS });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn(`Could not fetch release-group ${id}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

export async function getTagDetails(tagName: string) {
  try {
    const res = await fetch(`${MUSICBRAINZ_BASE}/recording/?tag=${encodeURIComponent(tagName)}&fmt=json`, { headers: HEADERS });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return data.recordings || [];
  } catch (error) {
    console.warn(`Could not fetch tags for ${tagName}:`, error instanceof Error ? error.message : error);
    return [];
  }
}

export async function getListenBrainzUser(username: string) {
  try {
    const res = await fetch(`${LISTENBRAINZ_BASE}/user/${encodeURIComponent(username)}/listens`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return data.payload || null;
  } catch (error) {
    console.warn(`Could not fetch ListenBrainz profile for ${username}:`, error instanceof Error ? error.message : error);
    return null;
  }
}
