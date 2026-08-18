// /app/api/lyrics/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const artistName = searchParams.get('artist_name') || '';
  const trackName = searchParams.get('track_name') || '';
  const albumName = searchParams.get('album_name') || '';

  if (!artistName && !trackName) {
    return NextResponse.json({ lyrics: null, error: 'Artist name and track name are required' }, { status: 400 });
  }

  const userAgentHeader = {
    'User-Agent': 'MusicApplet/1.0 (https://ai.studio)',
  };

  try {
    // 1. Exact match attempt with LRCLIB /api/get if album is provided
    if (albumName) {
      const exactParams = new URLSearchParams();
      if (artistName) exactParams.set('artist_name', artistName);
      if (trackName) exactParams.set('track_name', trackName);
      if (albumName) exactParams.set('album_name', albumName);

      const exactUrl = `https://lrclib.net/api/get?${exactParams.toString()}`;
      const exactRes = await fetch(exactUrl, { headers: userAgentHeader, next: { revalidate: 3600 } });

      if (exactRes.ok) {
        const data = await exactRes.json();
        if (data && (data.plainLyrics || data.syncedLyrics || data.instrumental)) {
          return NextResponse.json({ lyrics: data, matchType: 'exact' });
        }
      }
    }

    // 2. Fuzzy search with track_name and artist_name
    const searchParams1 = new URLSearchParams();
    if (trackName) searchParams1.set('track_name', trackName);
    if (artistName) searchParams1.set('artist_name', artistName);

    const searchUrl1 = `https://lrclib.net/api/search?${searchParams1.toString()}`;
    const searchRes1 = await fetch(searchUrl1, { headers: userAgentHeader, next: { revalidate: 3600 } });

    if (searchRes1.ok) {
      const searchData1 = await searchRes1.json();
      if (Array.isArray(searchData1) && searchData1.length > 0) {
        const bestMatch = searchData1.find((item: any) => item.plainLyrics || item.syncedLyrics || item.instrumental) || searchData1[0];
        return NextResponse.json({ lyrics: bestMatch, matchType: 'fuzzy' });
      }
    }

    // 3. Broad query fallback search
    const queryStr = `${artistName} ${trackName}`.trim();
    const searchUrl2 = `https://lrclib.net/api/search?q=${encodeURIComponent(queryStr)}`;
    const searchRes2 = await fetch(searchUrl2, { headers: userAgentHeader, next: { revalidate: 3600 } });

    if (searchRes2.ok) {
      const searchData2 = await searchRes2.json();
      if (Array.isArray(searchData2) && searchData2.length > 0) {
        const bestMatch = searchData2.find((item: any) => item.plainLyrics || item.syncedLyrics || item.instrumental) || searchData2[0];
        return NextResponse.json({ lyrics: bestMatch, matchType: 'fuzzy_q' });
      }
    }

    // 4. Clean query fallback search (stripping parens, remasters, feat., etc)
    const cleanTrack = trackName.replace(/\s*[\(\[\-].*$/g, '').trim();
    const cleanArtist = artistName.split(',')[0].replace(/\s*feat\..*$/i, '').trim();

    if (cleanTrack !== trackName || cleanArtist !== artistName) {
      const cleanQueryStr = `${cleanArtist} ${cleanTrack}`.trim();
      const searchUrl3 = `https://lrclib.net/api/search?q=${encodeURIComponent(cleanQueryStr)}`;
      const searchRes3 = await fetch(searchUrl3, { headers: userAgentHeader, next: { revalidate: 3600 } });

      if (searchRes3.ok) {
        const searchData3 = await searchRes3.json();
        if (Array.isArray(searchData3) && searchData3.length > 0) {
          const bestMatch = searchData3.find((item: any) => item.plainLyrics || item.syncedLyrics || item.instrumental) || searchData3[0];
          return NextResponse.json({ lyrics: bestMatch, matchType: 'fuzzy_clean' });
        }
      }
    }

    return NextResponse.json({ lyrics: null, matchType: 'none' });
  } catch (error) {
    console.error('Error fetching lyrics from LRCLIB:', error);
    return NextResponse.json({ lyrics: null, error: 'Failed to fetch lyrics' }, { status: 500 });
  }
}
