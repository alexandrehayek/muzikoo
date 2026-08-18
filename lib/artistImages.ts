// /lib/artistImages.ts

export interface ArtistImageResult {
  artistImage: string | null;
  backgroundImage: string | null;
}

const DEFAULT_FANART_API_KEY = 'da8a3c909430c87f243680272fbe43a0';
const FANART_API_KEY = process.env.FANART_API_KEY || DEFAULT_FANART_API_KEY;

/**
 * Fetch artist thumbnail image and wide background wallpaper.
 * 1. Checks Fanart.tv API using MusicBrainz ID (mbid).
 *    - artistbackground -> background wallpaper for artist profile hero
 *    - artistthumb -> artist profile image
 * 2. Fallback to Wikimedia/Wikipedia API if fanart.tv fails or lacks images.
 *    - Queries Wikipedia using artist name with `pageimages` property.
 */
export async function fetchArtistImages(
  mbid: string | null | undefined,
  artistName: string
): Promise<ArtistImageResult> {
  let artistImage: string | null = null;
  let backgroundImage: string | null = null;

  // Step 1: Try Fanart.tv API if valid MBID is available
  const isUuid = mbid && /^[0-9a-f-]{36}$/i.test(mbid);
  if (isUuid) {
    try {
      const fanartUrl = `https://webservice.fanart.tv/v3/music/${mbid}?api_key=${FANART_API_KEY}`;
      const res = await fetch(fanartUrl, {
        next: { revalidate: 86400 }, // Cache for 24h
      });

      if (res.ok) {
        const data = await res.json();

        // Check for artistbackground (wide wallpapers)
        if (Array.isArray(data.artistbackground) && data.artistbackground.length > 0) {
          const sortedBgs = [...data.artistbackground].sort(
            (a, b) => Number(b.likes || 0) - Number(a.likes || 0)
          );
          backgroundImage = sortedBgs[0]?.url || null;
        }

        // Check for artistthumb (general thumbnails)
        if (Array.isArray(data.artistthumb) && data.artistthumb.length > 0) {
          const sortedThumbs = [...data.artistthumb].sort(
            (a, b) => Number(b.likes || 0) - Number(a.likes || 0)
          );
          artistImage = sortedThumbs[0]?.url || null;
        }
      }
    } catch (err) {
      console.warn(`[Fanart.tv] Error fetching images for MBID "${mbid}":`, err);
    }
  }

  // Step 2: Fallback to Wikipedia pageimages if fanart.tv thumbnail or background is missing
  if (!artistImage || !backgroundImage) {
    try {
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
        artistName
      )}&prop=pageimages&format=json&pithumbsize=1200&redirects=1`;

      const wikiRes = await fetch(wikiUrl, {
        headers: {
          'User-Agent': 'MusicApp/1.0 (https://ais.dev)',
        },
        next: { revalidate: 86400 },
      });

      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        const pages = wikiData.query?.pages || {};
        const firstPage = Object.values(pages)[0] as any;
        const wikiThumbUrl = firstPage?.thumbnail?.source || null;

        if (wikiThumbUrl) {
          if (!artistImage) {
            artistImage = wikiThumbUrl;
          }
          if (!backgroundImage) {
            backgroundImage = wikiThumbUrl;
          }
        }
      }
    } catch (err) {
      console.warn(`[Wikipedia] Error fetching pageimages for "${artistName}":`, err);
    }
  }

  return { artistImage, backgroundImage };
}
