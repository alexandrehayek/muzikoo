// /lib/seo.ts
import type { Metadata } from 'next';
import { getArtistDetails, getReleaseDetails, getRecordingDetails, searchArtists, searchRecordings } from '@/lib/musicbrainz';
import { getLastFmArtistInfo } from '@/lib/lastfm';

function isUUID(str: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function cleanSlugName(str: string): string {
  if (!str) return '';
  return decodeURIComponent(str)
    .replace(/^track-/, '')
    .replaceAll('-', ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function getArtistMetadata(
  id: string,
  pageType: 'main' | 'tracks' | 'albums' | 'biography'
): Promise<Metadata> {
  const rawId = decodeURIComponent(id || '');
  let artistName = cleanSlugName(rawId);
  let artistImage: string | undefined = undefined;

  try {
    if (isUUID(rawId)) {
      const mbArtist = await getArtistDetails(rawId);
      if (mbArtist && mbArtist.name) {
        artistName = mbArtist.name;
      }
    } else {
      const info = await getLastFmArtistInfo(artistName);
      if (info && info.name) {
        artistName = info.name;
        if (info.image) artistImage = info.image;
      }
    }
  } catch {
    // Fallback to formatted raw id if network fails
  }

  if (!artistName) artistName = 'Artist';

  let title = `${artistName} music, songs, albums - Muzikoo.com`;
  let description = `Explore music from ${artistName}. Find the latest tracks, albums and data from ${artistName}. - Muzikoo.com`;
  let path = `/artist/${id}`;

  if (pageType === 'tracks') {
    title = `Find ${artistName}'s songs, tracks and other music - Muzikoo.com`;
    description = `Browse songs, tracks and music from ${artistName}. - Muzikoo.com`;
    path = `/artist/${id}/tracks`;
  } else if (pageType === 'albums') {
    title = `${artistName} albums, releases and discography - Muzikoo.com`;
    description = `Browse songs, tracks and music from ${artistName}. - Muzikoo.com`;
    path = `/artist/${id}/albums`;
  } else if (pageType === 'biography') {
    title = `${artistName}'s biography - Muzikoo.com`;
    description = `Read ${artistName}'s biography and find out more about ${artistName}'s songs, albums, and music history. - Muzikoo.com`;
    path = `/artist/${id}/biography`;
  }

  const siteUrl = `https://muzikoo.com${path}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: pageType === 'main' ? 'profile' : 'website',
      siteName: 'Muzikoo.com',
      url: siteUrl,
      images: artistImage ? [{ url: artistImage }] : undefined,
    },
  };
}

export async function getReleaseMetadata(id: string): Promise<Metadata> {
  const rawId = decodeURIComponent(id || '');
  let albumName = cleanSlugName(rawId);
  let artistName = '';
  let coverUrl: string | undefined = undefined;

  try {
    if (isUUID(rawId)) {
      const rel = await getReleaseDetails(rawId);
      if (rel) {
        albumName = rel.title || rel.name || albumName;
        artistName = rel['artist-credit']?.[0]?.name || rel['artist-credit']?.[0]?.artist?.name || '';
        coverUrl = `https://coverartarchive.org/release/${rawId}/front-500`;
      }
    }
  } catch {
    // Fallback
  }

  if (!albumName) albumName = 'Album';
  
  const formattedTitle = artistName
    ? `${artistName} - ${albumName} - Muzikoo.com`
    : `${albumName} - Muzikoo.com`;
  const formattedDescription = formattedTitle;

  const siteUrl = `https://muzikoo.com/album/${id}`;

  return {
    title: formattedTitle,
    description: formattedDescription,
    openGraph: {
      title: formattedTitle,
      description: formattedDescription,
      type: 'music.album',
      siteName: 'Muzikoo.com',
      url: siteUrl,
      images: coverUrl ? [{ url: coverUrl }] : undefined,
    },
  };
}

export async function getTrackMetadata(id: string): Promise<Metadata> {
  const rawId = decodeURIComponent(id || '');
  let trackName = '';
  let artistName = '';
  let albumName = '';
  let coverUrl: string | undefined = undefined;

  if (rawId.startsWith('track-')) {
    const parts = rawId.replace(/^track-/, '').split('-');
    if (parts.length >= 2) {
      artistName = parts[0].trim();
      trackName = parts.slice(1).join(' ').trim();
    } else {
      trackName = cleanSlugName(rawId);
    }
  } else {
    trackName = cleanSlugName(rawId);
  }

  try {
    if (isUUID(rawId)) {
      const rec = await getRecordingDetails(rawId);
      if (rec) {
        trackName = rec.title || rec.name || trackName;
        artistName = rec['artist-credit']?.[0]?.name || rec['artist-credit']?.[0]?.artist?.name || artistName;
        if (rec.releases && rec.releases.length > 0) {
          albumName = rec.releases[0].title || '';
          const relId = rec.releases[0].id;
          if (relId && isUUID(relId)) {
            coverUrl = `https://coverartarchive.org/release/${relId}/front-500`;
          }
        }
      }
    }
  } catch {
    // Fallback
  }

  if (!trackName) trackName = 'Track';

  let formattedText = '';
  if (artistName && albumName) {
    formattedText = `${artistName} - ${albumName} - ${trackName} - Muzikoo.com`;
  } else if (artistName) {
    formattedText = `${artistName} - ${trackName} - Muzikoo.com`;
  } else {
    formattedText = `${trackName} - Muzikoo.com`;
  }

  const siteUrl = `https://muzikoo.com/track/${id}`;

  return {
    title: formattedText,
    description: formattedText,
    openGraph: {
      title: formattedText,
      description: formattedText,
      type: 'music.song',
      siteName: 'Muzikoo.com',
      url: siteUrl,
      images: coverUrl ? [{ url: coverUrl }] : undefined,
    },
  };
}
