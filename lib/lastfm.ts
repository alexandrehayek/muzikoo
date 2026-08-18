// /lib/lastfm.ts
// Integration with the Last.fm API with robust rate-limit (Error 29) handling and rich fallback data

const DEFAULT_LASTFM_API_KEY = 'b25b959554ed76058ac220b7b2e0a026';
const LASTFM_BASE = 'https://ws.audioscrobbler.com/2.0/';

function getApiKey(): string {
  return process.env.LASTFM_API_KEY || DEFAULT_LASTFM_API_KEY;
}

// Fallback curated artists for when Last.fm rate limit (Error 29) is encountered
export const FALLBACK_TOP_ARTISTS = [
  { id: 'The Weeknd', name: 'The Weeknd', type: 'Artist', listeners: '3,850,210', disambiguation: '3.8M listeners', image: 'https://picsum.photos/seed/The%20Weeknd/400/400' },
  { id: 'Taylor Swift', name: 'Taylor Swift', type: 'Artist', listeners: '4,120,500', disambiguation: '4.1M listeners', image: 'https://picsum.photos/seed/Taylor%20Swift/400/400' },
  { id: 'Ed Sheeran', name: 'Ed Sheeran', type: 'Artist', listeners: '3,210,000', disambiguation: '3.2M listeners', image: 'https://picsum.photos/seed/Ed%20Sheeran/400/400' },
  { id: 'Drake', name: 'Drake', type: 'Artist', listeners: '3,680,100', disambiguation: '3.6M listeners', image: 'https://picsum.photos/seed/Drake/400/400' },
  { id: 'Dua Lipa', name: 'Dua Lipa', type: 'Artist', listeners: '2,940,300', disambiguation: '2.9M listeners', image: 'https://picsum.photos/seed/Dua%20Lipa/400/400' },
  { id: 'Billie Eilish', name: 'Billie Eilish', type: 'Artist', listeners: '3,100,200', disambiguation: '3.1M listeners', image: 'https://picsum.photos/seed/Billie%20Eilish/400/400' },
  { id: 'Coldplay', name: 'Coldplay', type: 'Artist', listeners: '4,500,800', disambiguation: '4.5M listeners', image: 'https://picsum.photos/seed/Coldplay/400/400' },
  { id: 'Queen', name: 'Queen', type: 'Artist', listeners: '4,200,600', disambiguation: '4.2M listeners', image: 'https://picsum.photos/seed/Queen/400/400' },
  { id: 'Radiohead', name: 'Radiohead', type: 'Artist', listeners: '3,950,400', disambiguation: '3.9M listeners', image: 'https://picsum.photos/seed/Radiohead/400/400' },
  { id: 'Daft Punk', name: 'Daft Punk', type: 'Artist', listeners: '3,400,000', disambiguation: '3.4M listeners', image: 'https://picsum.photos/seed/Daft%20Punk/400/400' },
  { id: 'Kendrick Lamar', name: 'Kendrick Lamar', type: 'Artist', listeners: '2,800,900', disambiguation: '2.8M listeners', image: 'https://picsum.photos/seed/Kendrick%20Lamar/400/400' },
  { id: 'Beyoncé', name: 'Beyoncé', type: 'Artist', listeners: '3,150,000', disambiguation: '3.1M listeners', image: 'https://picsum.photos/seed/Beyonce/400/400' },
  { id: 'Arctic Monkeys', name: 'Arctic Monkeys', type: 'Artist', listeners: '3,600,000', disambiguation: '3.6M listeners', image: 'https://picsum.photos/seed/Arctic%20Monkeys/400/400' },
  { id: 'Fleetwood Mac', name: 'Fleetwood Mac', type: 'Artist', listeners: '3,300,500', disambiguation: '3.3M listeners', image: 'https://picsum.photos/seed/Fleetwood%20Mac/400/400' },
  { id: 'Pink Floyd', name: 'Pink Floyd', type: 'Artist', listeners: '3,800,200', disambiguation: '3.8M listeners', image: 'https://picsum.photos/seed/Pink%20Floyd/400/400' },
  { id: 'Bruno Mars', name: 'Bruno Mars', type: 'Artist', listeners: '2,750,000', disambiguation: '2.7M listeners', image: 'https://picsum.photos/seed/Bruno%20Mars/400/400' },
  { id: 'Post Malone', name: 'Post Malone', type: 'Artist', listeners: '2,900,000', disambiguation: '2.9M listeners', image: 'https://picsum.photos/seed/Post%20Malone/400/400' },
  { id: 'Rihanna', name: 'Rihanna', type: 'Artist', listeners: '3,800,000', disambiguation: '3.8M listeners', image: 'https://picsum.photos/seed/Rihanna/400/400' },
  { id: 'Eminem', name: 'Eminem', type: 'Artist', listeners: '4,100,000', disambiguation: '4.1M listeners', image: 'https://picsum.photos/seed/Eminem/400/400' },
  { id: 'Harry Styles', name: 'Harry Styles', type: 'Artist', listeners: '2,850,000', disambiguation: '2.8M listeners', image: 'https://picsum.photos/seed/Harry%20Styles/400/400' },
];

// Fallback curated top tracks
export const FALLBACK_TOP_TRACKS = [
  { id: 'track-The%20Weeknd-Blinding%20Lights', title: 'Blinding Lights', name: 'Blinding Lights', artist: 'The Weeknd', 'artist-credit': [{ name: 'The Weeknd', artist: { name: 'The Weeknd', id: 'The Weeknd' } }], listeners: '3,100,500', image: 'https://picsum.photos/seed/Blinding%20Lights/400/400' },
  { id: 'track-Harry%20Styles-As%20It%20Was', title: 'As It Was', name: 'As It Was', artist: 'Harry Styles', 'artist-credit': [{ name: 'Harry Styles', artist: { name: 'Harry Styles', id: 'Harry Styles' } }], listeners: '2,800,400', image: 'https://picsum.photos/seed/As%20It%20Was/400/400' },
  { id: 'track-The%20Weeknd-Starboy', title: 'Starboy', name: 'Starboy', artist: 'The Weeknd', 'artist-credit': [{ name: 'The Weeknd', artist: { name: 'The Weeknd', id: 'The Weeknd' } }], listeners: '2,950,100', image: 'https://picsum.photos/seed/Starboy/400/400' },
  { id: 'track-Dua%20Lipa-Levitating', title: 'Levitating', name: 'Levitating', artist: 'Dua Lipa', 'artist-credit': [{ name: 'Dua Lipa', artist: { name: 'Dua Lipa', id: 'Dua Lipa' } }], listeners: '2,600,800', image: 'https://picsum.photos/seed/Levitating/400/400' },
  { id: 'track-Taylor%20Swift-Cruel%20Summer', title: 'Cruel Summer', name: 'Cruel Summer', artist: 'Taylor Swift', 'artist-credit': [{ name: 'Taylor Swift', artist: { name: 'Taylor Swift', id: 'Taylor Swift' } }], listeners: '2,900,200', image: 'https://picsum.photos/seed/Cruel%20Summer/400/400' },
  { id: 'track-Ed%20Sheeran-Shape%20of%20You', title: 'Shape of You', name: 'Shape of You', artist: 'Ed Sheeran', 'artist-credit': [{ name: 'Ed Sheeran', artist: { name: 'Ed Sheeran', id: 'Ed Sheeran' } }], listeners: '3,200,000', image: 'https://picsum.photos/seed/Shape%20of%20You/400/400' },
  { id: 'track-Miley%20Cyrus-Flowers', title: 'Flowers', name: 'Flowers', artist: 'Miley Cyrus', 'artist-credit': [{ name: 'Miley Cyrus', artist: { name: 'Miley Cyrus', id: 'Miley Cyrus' } }], listeners: '2,400,900', image: 'https://picsum.photos/seed/Flowers/400/400' },
  { id: 'track-Post%20Malone-Sunflower', title: 'Sunflower', name: 'Sunflower', artist: 'Post Malone', 'artist-credit': [{ name: 'Post Malone', artist: { name: 'Post Malone', id: 'Post Malone' } }], listeners: '2,700,500', image: 'https://picsum.photos/seed/Sunflower/400/400' },
  { id: 'track-Queen-Bohemian%20Rhapsody', title: 'Bohemian Rhapsody', name: 'Bohemian Rhapsody', artist: 'Queen', 'artist-credit': [{ name: 'Queen', artist: { name: 'Queen', id: 'Queen' } }], listeners: '3,500,000', image: 'https://picsum.photos/seed/Bohemian%20Rhapsody/400/400' },
  { id: 'track-Eagles-Hotel%20California', title: 'Hotel California', name: 'Hotel California', artist: 'Eagles', 'artist-credit': [{ name: 'Eagles', artist: { name: 'Eagles', id: 'Eagles' } }], listeners: '3,100,000', image: 'https://picsum.photos/seed/Hotel%20California/400/400' },
  { id: 'track-Fleetwood%20Mac-Dreams', title: 'Dreams', name: 'Dreams', artist: 'Fleetwood Mac', 'artist-credit': [{ name: 'Fleetwood Mac', artist: { name: 'Fleetwood Mac', id: 'Fleetwood Mac' } }], listeners: '2,800,000', image: 'https://picsum.photos/seed/Dreams/400/400' },
  { id: 'track-a-ha-Take%20On%20Me', title: 'Take On Me', name: 'Take On Me', artist: 'a-ha', 'artist-credit': [{ name: 'a-ha', artist: { name: 'a-ha', id: 'a-ha' } }], listeners: '2,650,000', image: 'https://picsum.photos/seed/Take%20On%20Me/400/400' },
  { id: 'track-Nirvana-Smells%20Like%20Teen%20Spirit', title: 'Smells Like Teen Spirit', name: 'Smells Like Teen Spirit', artist: 'Nirvana', 'artist-credit': [{ name: 'Nirvana', artist: { name: 'Nirvana', id: 'Nirvana' } }], listeners: '3,300,000', image: 'https://picsum.photos/seed/Smells%20Like%20Teen%20Spirit/400/400' },
  { id: 'track-Billie%20Eilish-bad%20guy', title: 'bad guy', name: 'bad guy', artist: 'Billie Eilish', 'artist-credit': [{ name: 'Billie Eilish', artist: { name: 'Billie Eilish', id: 'Billie Eilish' } }], listeners: '2,900,000', image: 'https://picsum.photos/seed/bad%20guy/400/400' },
  { id: 'track-Adele-Rolling%20in%20the%20Deep', title: 'Rolling in the Deep', name: 'Rolling in the Deep', artist: 'Adele', 'artist-credit': [{ name: 'Adele', artist: { name: 'Adele', id: 'Adele' } }], listeners: '3,000,000', image: 'https://picsum.photos/seed/Rolling%20in%20the%20Deep/400/400' },
];

// Fallback curated top tags
export const FALLBACK_TOP_TAGS = [
  { name: 'rock', count: 4200000, reach: 500000, url: 'https://www.last.fm/tag/rock' },
  { name: 'pop', count: 3900000, reach: 480000, url: 'https://www.last.fm/tag/pop' },
  { name: 'indie', count: 3500000, reach: 430000, url: 'https://www.last.fm/tag/indie' },
  { name: 'electronic', count: 3200000, reach: 410000, url: 'https://www.last.fm/tag/electronic' },
  { name: 'hip-hop', count: 3100000, reach: 390000, url: 'https://www.last.fm/tag/hip-hop' },
  { name: 'alternative', count: 2900000, reach: 370000, url: 'https://www.last.fm/tag/alternative' },
  { name: 'jazz', count: 2400000, reach: 310000, url: 'https://www.last.fm/tag/jazz' },
  { name: 'ambient', count: 2100000, reach: 280000, url: 'https://www.last.fm/tag/ambient' },
  { name: 'synthwave', count: 1900000, reach: 250000, url: 'https://www.last.fm/tag/synthwave' },
  { name: 'metal', count: 1800000, reach: 240000, url: 'https://www.last.fm/tag/metal' },
  { name: 'classical', count: 1600000, reach: 210000, url: 'https://www.last.fm/tag/classical' },
  { name: 'soul', count: 1500000, reach: 200000, url: 'https://www.last.fm/tag/soul' },
  { name: 'rnb', count: 1400000, reach: 190000, url: 'https://www.last.fm/tag/rnb' },
  { name: 'folk', count: 1300000, reach: 180000, url: 'https://www.last.fm/tag/folk' },
  { name: 'dance', count: 1200000, reach: 170000, url: 'https://www.last.fm/tag/dance' },
];

// Helper to inspect if data is an Error 29 or Last.fm rate limit error
function isRateLimitError(data: any): boolean {
  if (!data) return false;
  if (data.error === 29 || data.error === '29') return true;
  if (data.error || data.message) {
    const msg = String(data.message || data.error || '').toLowerCase();
    if (msg.includes('rate') || msg.includes('exceeded') || msg.includes('limit')) return true;
  }
  return false;
}

// Helper to extract best quality image from Last.fm image array
export function getLastFmImageUrl(images?: Array<{ '#text': string; size: string }>): string | null {
  if (!images || !Array.isArray(images) || images.length === 0) return null;

  const sizes = ['extralarge', 'mega', 'large', 'medium', 'small'];
  for (const s of sizes) {
    const found = images.find((img) => img.size === s && img['#text']);
    if (found && found['#text'] && found['#text'].trim() !== '') {
      return found['#text'];
    }
  }

  const anyImg = images.find((img) => img['#text'] && img['#text'].trim() !== '');
  return anyImg ? anyImg['#text'] : null;
}

export function cleanBioHtml(htmlStr?: string | null): string {
  if (!htmlStr) return '';
  return htmlStr.replace(/<a\b[^>]*>(.*?)<\/a>/gi, '').trim();
}

// Fetch artist info (image and bio) from Last.fm
export async function getLastFmArtistInfo(artistNameOrMbid: string): Promise<{
  name: string | null;
  image: string | null;
  bio: string | null;
  bioSummary: string | null;
  bioContent: string | null;
  bioPublished: string | null;
  tags: string[];
}> {
  try {
    const apiKey = getApiKey();
    const isMbid = /^[0-9a-f-]{36}$/i.test(artistNameOrMbid);
    const param = isMbid ? `mbid=${artistNameOrMbid}` : `artist=${encodeURIComponent(artistNameOrMbid)}`;
    const url = `${LASTFM_BASE}?method=artist.getinfo&${param}&api_key=${apiKey}&format=json`;
    const res = await fetch(url);
    if (!res.ok) return { name: null, image: null, bio: null, bioSummary: null, bioContent: null, bioPublished: null, tags: [] };
    const data = await res.json();
    if (isRateLimitError(data) || !data.artist) {
      return { name: null, image: null, bio: null, bioSummary: null, bioContent: null, bioPublished: null, tags: [] };
    }
    const name = data.artist?.name || null;
    const img = getLastFmImageUrl(data.artist?.image);
    const bioSummary = data.artist?.bio?.summary || null;
    const bioContent = data.artist?.bio?.content || null;
    const bioPublished = data.artist?.bio?.published || null;
    const bio = bioSummary || bioContent || null;
    const rawTags = data.artist?.tags?.tag || [];
    let tags: string[] = [];
    if (Array.isArray(rawTags)) {
      tags = rawTags.map((t: any) => (typeof t === 'string' ? t : t?.name)).filter(Boolean);
    } else if (rawTags && typeof rawTags === 'object') {
      const tagName = rawTags.name || (rawTags as any)['#text'];
      if (tagName) tags = [tagName];
    }
    return { name, image: img, bio, bioSummary, bioContent, bioPublished, tags };
  } catch {
    return { name: null, image: null, bio: null, bioSummary: null, bioContent: null, bioPublished: null, tags: [] };
  }
}

// Fetch album info (image) from Last.fm
export async function getLastFmAlbumImage(artistName: string, albumName: string): Promise<string | null> {
  try {
    const apiKey = getApiKey();
    const url = `${LASTFM_BASE}?method=album.getinfo&artist=${encodeURIComponent(artistName)}&album=${encodeURIComponent(albumName)}&api_key=${apiKey}&format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (isRateLimitError(data)) return null;
    return getLastFmImageUrl(data.album?.image);
  } catch {
    return null;
  }
}

// Fetch similar artists from Last.fm
export async function getLastFmSimilarArtists(artistNameOrMbid: string, limit = 12) {
  try {
    const apiKey = getApiKey();
    const isMbid = /^[0-9a-f-]{36}$/i.test(artistNameOrMbid);
    const param = isMbid ? `mbid=${artistNameOrMbid}` : `artist=${encodeURIComponent(artistNameOrMbid)}`;
    const url = `${LASTFM_BASE}?method=artist.getsimilar&${param}&api_key=${apiKey}&format=json&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) return FALLBACK_TOP_ARTISTS.slice(0, limit);
    const data = await res.json();
    if (isRateLimitError(data)) {
      console.warn(`[Last.fm] Rate limit (Error 29) for similar artists "${artistNameOrMbid}". Using fallbacks.`);
      return FALLBACK_TOP_ARTISTS.slice(0, limit);
    }

    const similarList = data.similarartists?.artist;
    if (!similarList || !Array.isArray(similarList)) return FALLBACK_TOP_ARTISTS.slice(0, limit);

    return similarList.map((artist: any) => {
      const img = getLastFmImageUrl(artist.image);
      const matchScore = artist.match ? Math.round(parseFloat(artist.match) * 100) : null;
      return {
        id: artist.mbid || artist.name,
        mbid: artist.mbid || null,
        name: artist.name,
        type: 'Artist',
        match: artist.match,
        disambiguation: matchScore ? `${matchScore}% match` : 'Similar Artist',
        url: artist.url,
        image: img || `https://picsum.photos/seed/${encodeURIComponent(artist.name)}/400/400`,
      };
    });
  } catch (error) {
    console.warn(`Last.fm similar artists error for "${artistNameOrMbid}":`, error instanceof Error ? error.message : error);
    return FALLBACK_TOP_ARTISTS.slice(0, limit);
  }
}

// Fetch top tracks for an artist using Last.fm artist.gettoptracks API
export async function getLastFmTopTracks(artistNameOrMbid: string, limit = 50, page = 1) {
  try {
    const apiKey = getApiKey();
    const isMbid = /^[0-9a-f-]{36}$/i.test(artistNameOrMbid);
    const param = isMbid ? `mbid=${artistNameOrMbid}` : `artist=${encodeURIComponent(artistNameOrMbid)}`;
    const url = `${LASTFM_BASE}?method=artist.gettoptracks&${param}&api_key=${apiKey}&format=json&limit=${limit}&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (isRateLimitError(data)) {
      console.warn(`[Last.fm] Rate limit (Error 29) for top tracks of "${artistNameOrMbid}".`);
      return [];
    }

    const trackList = data.toptracks?.track;
    if (!trackList || !Array.isArray(trackList)) return [];

    return trackList.map((track: any) => {
      const img = getLastFmImageUrl(track.image);
      const trackArtist = typeof track.artist === 'string' ? track.artist : (track.artist?.name || artistNameOrMbid);
      return {
        id: track.mbid || track.name,
        mbid: track.mbid || null,
        title: track.name,
        name: track.name,
        'artist-credit': [
          {
            name: trackArtist,
            artist: {
              name: trackArtist,
              id: typeof track.artist === 'object' ? track.artist?.mbid || trackArtist : trackArtist,
            },
          },
        ],
        artist: trackArtist,
        listeners: track.listeners,
        playcount: track.playcount,
        url: track.url,
        image: img || `https://picsum.photos/seed/${encodeURIComponent(track.name)}/400/400`,
      };
    });
  } catch (error) {
    console.warn(`Last.fm top tracks error for "${artistNameOrMbid}":`, error instanceof Error ? error.message : error);
    return [];
  }
}

// Fetch top albums for an artist using Last.fm artist.gettopalbums API
export async function getLastFmTopAlbums(artistNameOrMbid: string, limit = 50) {
  try {
    const apiKey = getApiKey();
    const isMbid = /^[0-9a-f-]{36}$/i.test(artistNameOrMbid);
    const param = isMbid ? `mbid=${artistNameOrMbid}` : `artist=${encodeURIComponent(artistNameOrMbid)}`;
    const url = `${LASTFM_BASE}?method=artist.gettopalbums&${param}&api_key=${apiKey}&format=json&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (isRateLimitError(data)) {
      console.warn(`[Last.fm] Rate limit (Error 29) for top albums of "${artistNameOrMbid}".`);
      return [];
    }

    const albumList = data.topalbums?.album;
    if (!albumList || !Array.isArray(albumList)) return [];

    return albumList.map((album: any) => {
      const img = getLastFmImageUrl(album.image);
      const albumArtist = typeof album.artist === 'string' ? album.artist : (album.artist?.name || artistNameOrMbid);
      return {
        id: album.mbid || album.name,
        mbid: album.mbid || null,
        title: album.name,
        name: album.name,
        'primary-type': 'Album',
        'artist-credit': [
          {
            name: albumArtist,
            artist: {
              name: albumArtist,
              id: typeof album.artist === 'object' ? album.artist?.mbid || albumArtist : albumArtist,
            },
          },
        ],
        artist: albumArtist,
        playcount: album.playcount,
        url: album.url,
        image: img || `https://picsum.photos/seed/${encodeURIComponent(album.name)}/400/400`,
      };
    });
  } catch (error) {
    console.warn(`Last.fm top albums error for "${artistNameOrMbid}":`, error instanceof Error ? error.message : error);
    return [];
  }
}

export async function searchLastFmArtists(query: string, limit = 50, page = 1) {
  try {
    const apiKey = getApiKey();
    const url = `${LASTFM_BASE}?method=artist.search&artist=${encodeURIComponent(query)}&limit=${limit}&page=${page}&api_key=${apiKey}&format=json`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (isRateLimitError(data)) {
      console.warn(`[Last.fm] Rate limit (Error 29) for search artist "${query}".`);
      return [];
    }

    const artistMatches = data.results?.artistmatches?.artist;
    if (!artistMatches || !Array.isArray(artistMatches)) return [];

    return artistMatches.map((artist: any) => {
      const img = getLastFmImageUrl(artist.image);
      return {
        id: artist.mbid || artist.name,
        mbid: artist.mbid || null,
        name: artist.name,
        type: 'Artist',
        disambiguation: artist.listeners ? `${Number(artist.listeners).toLocaleString()} Last.fm listeners` : '',
        listeners: artist.listeners,
        url: artist.url,
        image: img || `https://picsum.photos/seed/${encodeURIComponent(artist.name)}/400/400`,
      };
    });
  } catch (error) {
    console.warn(`Last.fm artist search error for "${query}":`, error instanceof Error ? error.message : error);
    return [];
  }
}

// Search for albums (release-groups / releases) using Last.fm album.search API
export async function searchLastFmAlbums(query: string, limit = 50, page = 1) {
  try {
    const apiKey = getApiKey();
    const url = `${LASTFM_BASE}?method=album.search&album=${encodeURIComponent(query)}&limit=${limit}&page=${page}&api_key=${apiKey}&format=json`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (isRateLimitError(data)) {
      console.warn(`[Last.fm] Rate limit (Error 29) for album search "${query}".`);
      return [];
    }

    const albumMatches = data.results?.albummatches?.album;
    if (!albumMatches || !Array.isArray(albumMatches)) return [];

    return albumMatches.map((album: any) => {
      const img = getLastFmImageUrl(album.image);
      return {
        id: album.mbid || `${encodeURIComponent(album.artist)}-${encodeURIComponent(album.name)}`,
        mbid: album.mbid || null,
        title: album.name,
        name: album.name,
        'artist-credit': [
          {
            name: album.artist,
            artist: {
              name: album.artist,
              id: album.artist,
            },
          },
        ],
        artist: album.artist,
        url: album.url,
        image: img || `https://picsum.photos/seed/${encodeURIComponent(album.name)}/400/400`,
      };
    });
  } catch (error) {
    console.warn(`Last.fm album search error for "${query}":`, error instanceof Error ? error.message : error);
    return [];
  }
}

// Search for tracks (songs / recordings) using Last.fm track.search API
export async function searchLastFmTracks(query: string, limit = 50, page = 1) {
  try {
    const apiKey = getApiKey();
    const url = `${LASTFM_BASE}?method=track.search&track=${encodeURIComponent(query)}&limit=${limit}&page=${page}&api_key=${apiKey}&format=json`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (isRateLimitError(data)) {
      console.warn(`[Last.fm] Rate limit (Error 29) for track search "${query}".`);
      return [];
    }

    const trackMatches = data.results?.trackmatches?.track;
    if (!trackMatches || !Array.isArray(trackMatches)) return [];

    return trackMatches.map((track: any) => {
      const img = getLastFmImageUrl(track.image);
      return {
        id: track.mbid || `track-${encodeURIComponent(track.artist)}-${encodeURIComponent(track.name)}`,
        mbid: track.mbid || null,
        title: track.name,
        name: track.name,
        'artist-credit': [
          {
            name: track.artist,
            artist: {
              name: track.artist,
              id: track.artist,
            },
          },
        ],
        artist: track.artist,
        listeners: track.listeners,
        playcount: track.playcount || null,
        url: track.url,
        image: img || `https://picsum.photos/seed/${encodeURIComponent(track.name)}/400/400`,
      };
    });
  } catch (error) {
    console.warn(`Last.fm track search error for "${query}":`, error instanceof Error ? error.message : error);
    return [];
  }
}

// Fetch top tags using Last.fm chart.getTopTags API
export async function getChartTopTags(limit = 20) {
  try {
    const apiKey = getApiKey();
    const url = `${LASTFM_BASE}?method=chart.gettoptags&api_key=${apiKey}&format=json&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) return FALLBACK_TOP_TAGS.slice(0, limit);
    const data = await res.json();
    if (isRateLimitError(data)) {
      console.warn(`[Last.fm] Rate limit (Error 29) for chart.getTopTags.`);
      return FALLBACK_TOP_TAGS.slice(0, limit);
    }

    const tagList = data.tags?.tag || data.toptags?.tag;
    if (!tagList || !Array.isArray(tagList)) return FALLBACK_TOP_TAGS.slice(0, limit);

    return tagList.slice(0, limit).map((tag: any) => ({
      name: tag.name,
      count: tag.count || tag.taggings || null,
      reach: tag.reach || null,
      url: tag.url,
    }));
  } catch (error) {
    console.warn(`Last.fm chart.getTopTags error:`, error instanceof Error ? error.message : error);
    return FALLBACK_TOP_TAGS.slice(0, limit);
  }
}

// Fetch top artists using Last.fm chart.getTopArtists API
export async function getChartTopArtists(limit = 20, page = 1) {
  try {
    const apiKey = getApiKey();
    const url = `${LASTFM_BASE}?method=chart.gettopartists&api_key=${apiKey}&format=json&limit=${limit}&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) return FALLBACK_TOP_ARTISTS.slice(0, limit);
    const data = await res.json();
    if (isRateLimitError(data)) {
      console.warn(`[Last.fm] Rate limit (Error 29) for chart.getTopArtists.`);
      return FALLBACK_TOP_ARTISTS.slice(0, limit);
    }

    const artistList = data.artists?.artist;
    if (!artistList || !Array.isArray(artistList)) return FALLBACK_TOP_ARTISTS.slice(0, limit);

    return artistList.slice(0, limit).map((artist: any) => {
      const img = getLastFmImageUrl(artist.image);
      return {
        id: artist.mbid || artist.name,
        mbid: artist.mbid || null,
        name: artist.name,
        type: 'Artist',
        listeners: artist.listeners,
        playcount: artist.playcount,
        url: artist.url,
        image: img || `https://picsum.photos/seed/${encodeURIComponent(artist.name)}/400/400`,
        disambiguation: artist.listeners ? `${Number(artist.listeners).toLocaleString()} listeners` : '',
      };
    });
  } catch (error) {
    console.warn(`Last.fm chart.getTopArtists error:`, error instanceof Error ? error.message : error);
    return FALLBACK_TOP_ARTISTS.slice(0, limit);
  }
}

// Fetch top tracks using Last.fm chart.getTopTracks API
export async function getChartTopTracks(limit = 50, page = 1) {
  try {
    const apiKey = getApiKey();
    const url = `${LASTFM_BASE}?method=chart.gettoptracks&api_key=${apiKey}&format=json&limit=${limit}&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) return FALLBACK_TOP_TRACKS.slice(0, limit);
    const data = await res.json();
    if (isRateLimitError(data)) {
      console.warn(`[Last.fm] Rate limit (Error 29) for chart.getTopTracks.`);
      return FALLBACK_TOP_TRACKS.slice(0, limit);
    }

    const trackList = data.tracks?.track;
    if (!trackList || !Array.isArray(trackList)) return FALLBACK_TOP_TRACKS.slice(0, limit);

    return trackList.slice(0, limit).map((track: any) => {
      const img = getLastFmImageUrl(track.image);
      const trackArtist = typeof track.artist === 'string' ? track.artist : (track.artist?.name || 'Unknown Artist');
      const artistMbid = typeof track.artist === 'object' ? track.artist?.mbid || trackArtist : trackArtist;
      return {
        id: track.mbid || `track-${encodeURIComponent(trackArtist)}-${encodeURIComponent(track.name)}`,
        mbid: track.mbid || null,
        title: track.name,
        name: track.name,
        'artist-credit': [
          {
            name: trackArtist,
            artist: {
              name: trackArtist,
              id: artistMbid,
            },
          },
        ],
        artist: trackArtist,
        artistId: artistMbid,
        listeners: track.listeners,
        playcount: track.playcount || null,
        url: track.url,
        image: img || `https://picsum.photos/seed/${encodeURIComponent(track.name)}/400/400`,
      };
    });
  } catch (error) {
    console.warn(`Last.fm chart.getTopTracks error:`, error instanceof Error ? error.message : error);
    return FALLBACK_TOP_TRACKS.slice(0, limit);
  }
}

// Fetch top artists by country using Last.fm geo.getTopArtists API
export async function getGeoTopArtists(country: string, limit = 50, page = 1) {
  try {
    const apiKey = getApiKey();
    const url = `${LASTFM_BASE}?method=geo.gettopartists&country=${encodeURIComponent(country)}&api_key=${apiKey}&format=json&limit=${limit}&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) return FALLBACK_TOP_ARTISTS.slice(0, limit);
    const data = await res.json();
    if (isRateLimitError(data)) {
      console.warn(`[Last.fm] Rate limit (Error 29) for geo.getTopArtists (${country}).`);
      return FALLBACK_TOP_ARTISTS.slice(0, limit);
    }

    const artistList = data.topartists?.artist || data.artists?.artist;
    if (!artistList || !Array.isArray(artistList)) return FALLBACK_TOP_ARTISTS.slice(0, limit);

    return artistList.map((artist: any) => {
      const img = getLastFmImageUrl(artist.image);
      return {
        id: artist.mbid || artist.name,
        mbid: artist.mbid || null,
        name: artist.name,
        type: 'Artist',
        listeners: artist.listeners,
        url: artist.url,
        image: img || `https://picsum.photos/seed/${encodeURIComponent(artist.name)}/400/400`,
        disambiguation: artist.listeners ? `${Number(artist.listeners).toLocaleString()} listeners` : '',
      };
    });
  } catch (error) {
    console.warn(`Last.fm geo.getTopArtists error:`, error instanceof Error ? error.message : error);
    return FALLBACK_TOP_ARTISTS.slice(0, limit);
  }
}

// Fetch top tracks by country using Last.fm geo.getTopTracks API
export async function getGeoTopTracks(country: string, limit = 50, page = 1) {
  try {
    const apiKey = getApiKey();
    const url = `${LASTFM_BASE}?method=geo.gettoptracks&country=${encodeURIComponent(country)}&api_key=${apiKey}&format=json&limit=${limit}&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) return FALLBACK_TOP_TRACKS.slice(0, limit);
    const data = await res.json();
    if (isRateLimitError(data)) {
      console.warn(`[Last.fm] Rate limit (Error 29) for geo.getTopTracks (${country}).`);
      return FALLBACK_TOP_TRACKS.slice(0, limit);
    }

    const trackList = data.tracks?.track;
    if (!trackList || !Array.isArray(trackList)) return FALLBACK_TOP_TRACKS.slice(0, limit);

    return trackList.map((track: any) => {
      const img = getLastFmImageUrl(track.image);
      const trackArtist = typeof track.artist === 'string' ? track.artist : (track.artist?.name || 'Unknown Artist');
      const artistMbid = typeof track.artist === 'object' ? track.artist?.mbid || trackArtist : trackArtist;
      return {
        id: track.mbid || `track-${encodeURIComponent(trackArtist)}-${encodeURIComponent(track.name)}`,
        mbid: track.mbid || null,
        title: track.name,
        name: track.name,
        'artist-credit': [
          {
            name: trackArtist,
            artist: {
              name: trackArtist,
              id: artistMbid,
            },
          },
        ],
        artist: trackArtist,
        artistId: artistMbid,
        listeners: track.listeners,
        playcount: track.playcount || null,
        url: track.url,
        image: img || `https://picsum.photos/seed/${encodeURIComponent(track.name)}/400/400`,
      };
    });
  } catch (error) {
    console.warn(`Last.fm geo.getTopTracks error:`, error instanceof Error ? error.message : error);
    return FALLBACK_TOP_TRACKS.slice(0, limit);
  }
}

// Fetch top tracks for a tag using Last.fm tag.gettoptracks API
export async function getLastFmTagTopTracks(tag: string, limit = 50, page = 1) {
  try {
    const apiKey = getApiKey();
    const url = `${LASTFM_BASE}?method=tag.gettoptracks&tag=${encodeURIComponent(tag)}&api_key=${apiKey}&format=json&limit=${limit}&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (isRateLimitError(data)) {
      console.warn(`[Last.fm] Rate limit (Error 29) for tag.gettoptracks ("${tag}").`);
      return [];
    }

    const trackList = data.tracks?.track || data.toptracks?.track;
    if (!trackList || !Array.isArray(trackList)) return [];

    return trackList.map((track: any) => {
      const img = getLastFmImageUrl(track.image);
      const trackArtist = typeof track.artist === 'string' ? track.artist : (track.artist?.name || 'Unknown Artist');
      const artistMbid = typeof track.artist === 'object' ? track.artist?.mbid || trackArtist : trackArtist;
      const trackMbid = track.mbid || null;
      const trackId = trackMbid || `track-${encodeURIComponent(trackArtist)}-${encodeURIComponent(track.name)}`;

      return {
        id: trackId,
        mbid: trackMbid,
        title: track.name,
        name: track.name,
        'artist-credit': [
          {
            name: trackArtist,
            artist: {
              name: trackArtist,
              id: artistMbid,
            },
          },
        ],
        artist: trackArtist,
        artistId: artistMbid,
        listeners: track.listeners,
        playcount: track.playcount || null,
        duration: track.duration ? Number(track.duration) * 1000 : null,
        url: track.url,
        image: img || `https://picsum.photos/seed/${encodeURIComponent(track.name)}/400/400`,
      };
    });
  } catch (error) {
    console.warn(`Last.fm tag.gettoptracks error for "${tag}":`, error instanceof Error ? error.message : error);
    return [];
  }
}
