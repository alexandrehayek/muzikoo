// /app/api/music/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  searchRecordings,
  searchArtists,
  searchReleases,
  getRecordingDetails,
  getArtistDetails,
  getArtistReleaseGroups,
  getReleaseDetails,
  getReleaseGroupDetails,
  getTagDetails,
  getListenBrainzUser,
  getSampleMusic
} from '@/lib/musicbrainz';
import {
  searchLastFmArtists,
  searchLastFmAlbums,
  searchLastFmTracks,
  getLastFmArtistInfo,
  getLastFmAlbumImage,
  getLastFmSimilarArtists,
  getLastFmTopTracks,
  getLastFmTopAlbums,
  getLastFmTagTopTracks,
  getChartTopTags,
  getChartTopArtists,
  getChartTopTracks,
  getGeoTopArtists,
  getGeoTopTracks,
} from '@/lib/lastfm';
import { fetchArtistImages } from '@/lib/artistImages';

function isUUID(str: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (!action) {
    return NextResponse.json({ error: 'Action parameter is required' }, { status: 400 });
  }

  try {
    switch (action) {
      case 'search': {
        const query = searchParams.get('q') || '';
        if (!query) {
          return NextResponse.json({ recordings: [], artists: [], releases: [] });
        }

        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '50', 10)));
        const type = searchParams.get('type') || '';
        
        let recordings: any[] = [];
        let artists: any[] = [];
        let releases: any[] = [];

        if (type === 'track' || type === 'tracks') {
          let lastFmTracks = await searchLastFmTracks(query, limit, page);
          if (!lastFmTracks || lastFmTracks.length === 0) {
            lastFmTracks = await searchRecordings(query, limit, (page - 1) * limit);
          }
          recordings = lastFmTracks || [];
        } else if (type === 'artist' || type === 'artists') {
          let lastFmArtists = await searchLastFmArtists(query, limit, page);
          if (!lastFmArtists || lastFmArtists.length === 0) {
            lastFmArtists = await searchArtists(query, limit, (page - 1) * limit);
          }
          artists = lastFmArtists || [];
        } else if (type === 'album' || type === 'albums' || type === 'releases') {
          let lastFmAlbums = await searchLastFmAlbums(query, limit, page);
          if (!lastFmAlbums || lastFmAlbums.length === 0) {
            lastFmAlbums = await searchReleases(query, limit, (page - 1) * limit);
          }
          releases = lastFmAlbums || [];
        } else {
          // 1. Primary: Use ONLY Last.fm API (track.search, artist.search, album.search)
          let [lastFmTracks, lastFmArtists, lastFmAlbums] = await Promise.all([
            searchLastFmTracks(query, limit, page),
            searchLastFmArtists(query, limit, page),
            searchLastFmAlbums(query, limit, page),
          ]);

          recordings = lastFmTracks || [];
          artists = lastFmArtists || [];
          releases = lastFmAlbums || [];

          // 2. Fallback: If recordings, artists, AND releases are all empty, use MusicBrainz API
          if (recordings.length === 0 && artists.length === 0 && releases.length === 0) {
            const [mbRecordings, mbArtists, mbReleases] = await Promise.all([
              searchRecordings(query, limit, (page - 1) * limit),
              searchArtists(query, limit, (page - 1) * limit),
              searchReleases(query, limit, (page - 1) * limit),
            ]);
            recordings = mbRecordings || [];
            artists = mbArtists || [];
            releases = mbReleases || [];
          }
        }

        // 3. Format items and links
        // If mbid is empty, make links using /track/[track_name], /artist/[artist_name] and /release/[release_name]
        const mappedRecordings = recordings.map((rec: any) => {
          const mbid = rec.mbid && isUUID(rec.mbid) ? rec.mbid : (isUUID(rec.id) ? rec.id : null);
          const id = mbid || rec.name || rec.title || rec.id;
          const relId = rec.releases?.[0]?.id;
          const relGroupId = rec.releases?.[0]?.['release-group']?.id;
          const sample = getSampleMusic(id, relId, relGroupId, rec.image);

          let albumCover: string | null = null;
          if (relId && isUUID(relId)) {
            albumCover = `https://coverartarchive.org/release/${relId}/front-500`;
          } else if (relGroupId && isUUID(relGroupId)) {
            albumCover = `https://coverartarchive.org/release-group/${relGroupId}/front-500`;
          }

          return {
            ...rec,
            id,
            mbid,
            ...sample,
            coverUrl: albumCover || rec.image || sample.coverUrl,
          };
        });

        const mappedArtists = artists.map((art: any) => {
          const mbid = art.mbid && isUUID(art.mbid) ? art.mbid : (isUUID(art.id) ? art.id : null);
          const id = mbid || art.name || art.id;
          return {
            ...art,
            id,
            mbid,
          };
        });

        const mappedReleases = releases.map((rel: any) => {
          const mbid = rel.mbid && isUUID(rel.mbid) ? rel.mbid : (isUUID(rel.id) ? rel.id : null);
          const id = mbid || rel.name || rel.title || rel.id;
          return {
            ...rel,
            id,
            mbid,
          };
        });

        return NextResponse.json({
          recordings: mappedRecordings,
          artists: mappedArtists,
          releases: mappedReleases,
        });
      }

      case 'recording': {
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });

        let rawId = decodeURIComponent(id);
        if (rawId.startsWith('track-')) {
          rawId = rawId.replace(/^track-/, '').replaceAll('-', ' ');
        }
        const isMbid = isUUID(rawId);

        let recordingMbid: string | null = null;

        if (isMbid) {
          // CASE 1: MBID is provided
          recordingMbid = rawId;
        } else {
          // CASE 2: Non-MBID search term (/track/[track_name])
          // Use MusicBrainz API to resolve MBID: https://musicbrainz.org/ws/2/recording?query=[cleanQuery]&limit=10&fmt=json
          const searchRes = await searchRecordings(rawId, 10);
          if (searchRes && searchRes.length > 0) {
            recordingMbid = searchRes[0].id;
          }
        }

        let recording: any = null;
        if (recordingMbid) {
          // Use ONLY MusicBrainz API:
          // 1. Get releases featuring this recording from: https://musicbrainz.org/ws/2/recording/[mbid]?inc=artists+releases+tags+ratings&fmt=json
          recording = await getRecordingDetails(recordingMbid);
        }

        if (!recording) {
          recording = {
            id: rawId,
            title: rawId,
            'artist-credit': [{ name: 'Artist', artist: { id: '', name: 'Artist' } }],
            releases: [],
          };
        }

        // 2. Get tracks from each release featuring this recording: https://musicbrainz.org/ws/2/release/[releaseId]?inc=artists+recordings+release-groups+labels&fmt=json
        let enrichedReleases: any[] = [];
        if (recording.releases && Array.isArray(recording.releases) && recording.releases.length > 0) {
          const topReleases = recording.releases.slice(0, 5);
          enrichedReleases = await Promise.all(
            topReleases.map(async (rel: any) => {
              if (rel.id && isUUID(rel.id)) {
                const details = await getReleaseDetails(rel.id);
                if (details) return details;
              }
              return rel;
            })
          );
        }

        const primaryRelId = recording.releases?.[0]?.id;
        const primaryRelGroupId = recording.releases?.[0]?.['release-group']?.id;
        const coverUrl = primaryRelId && isUUID(primaryRelId)
          ? `https://coverartarchive.org/release/${primaryRelId}/front-500`
          : (primaryRelGroupId && isUUID(primaryRelGroupId)
            ? `https://coverartarchive.org/release-group/${primaryRelGroupId}/front-500`
            : null);

        const sample = getSampleMusic(recording.id || id, primaryRelId, primaryRelGroupId, coverUrl || undefined);

        return NextResponse.json({
          ...recording,
          releases: enrichedReleases.length > 0 ? enrichedReleases : recording.releases,
          ...sample,
          coverUrl: coverUrl || sample.coverUrl,
        });
      }

      case 'artist': {
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });

        const rawId = decodeURIComponent(id);
        const isMbid = isUUID(rawId);

        let artistMbid: string | null = null;
        let artistName: string = rawId;

        if (isMbid) {
          // CASE 1: MBID is provided
          artistMbid = rawId;
        } else {
          // CASE 2: Non-MBID search term (/artist/[artist_name])
          // Use MusicBrainz API to resolve MBID: https://musicbrainz.org/ws/2/artist?query=[cleanQuery]&limit=10&fmt=json
          const searchRes = await searchArtists(artistName);
          if (searchRes && searchRes.length > 0) {
            artistMbid = searchRes[0].id;
            artistName = searchRes[0].name || artistName;
          }
        }

        // Use ONLY Last.fm API for details:
        // - artist.getinfo to get similar artists / bio
        // - artist.gettoptracks to get top tracks
        // - artist.gettopalbums to get top albums
        // For artist images, keep fanart.tv API with wikimedia as fallback
        const targetQuery = artistMbid || artistName;
        const [lastFmInfo, similarArtists, rawTopTracks, rawTopAlbums, fanartImages] = await Promise.all([
          getLastFmArtistInfo(targetQuery),
          getLastFmSimilarArtists(targetQuery),
          getLastFmTopTracks(targetQuery),
          getLastFmTopAlbums(targetQuery),
          fetchArtistImages(artistMbid, artistName || targetQuery),
        ]);

        const finalName = lastFmInfo.name || artistName;

        const mappedRecordings = (rawTopTracks || []).map((rec: any) => {
          const trackMbid = rec.mbid && isUUID(rec.mbid) ? rec.mbid : null;
          const trackId = trackMbid || rec.name || rec.title;
          const sample = getSampleMusic(trackId, undefined, undefined, rec.image);

          return {
            ...rec,
            id: trackId,
            mbid: trackMbid,
            ...sample,
            coverUrl: rec.image || sample.coverUrl,
            'artist-credit': [
              {
                name: finalName,
                artist: {
                  id: artistMbid || finalName,
                  name: finalName,
                },
              },
            ],
          };
        });

        const mappedReleases = (rawTopAlbums || []).map((alb: any) => {
          const albMbid = alb.mbid && isUUID(alb.mbid) ? alb.mbid : null;
          const albId = albMbid || alb.name || alb.title;
          return {
            ...alb,
            id: albId,
            mbid: albMbid,
            image: alb.image || `https://picsum.photos/seed/${encodeURIComponent(alb.name)}/400/400`,
            'artist-credit': [
              {
                name: finalName,
                artist: {
                  id: artistMbid || finalName,
                  name: finalName,
                },
              },
            ],
          };
        });

        const rawTagsList = lastFmInfo.tags || [];
        let formattedTags = rawTagsList.map((t: any) => {
          if (typeof t === 'string') return { name: t };
          if (t && typeof t === 'object') return { name: t.name || t.title || String(t) };
          return { name: String(t) };
        }).filter((t: any) => Boolean(t.name));

        if (formattedTags.length === 0 && artistMbid) {
          try {
            const mbArtist = await getArtistDetails(artistMbid);
            if (mbArtist && mbArtist.tags && Array.isArray(mbArtist.tags)) {
              formattedTags = mbArtist.tags
                .map((t: any) => ({ name: typeof t === 'string' ? t : t.name }))
                .filter((t: any) => Boolean(t.name));
            }
          } catch (e) {
            // Ignore fallback error
          }
        }

        return NextResponse.json({
          id: artistMbid || finalName,
          mbid: artistMbid,
          name: finalName,
          type: 'Artist',
          image: fanartImages.artistImage || lastFmInfo.image || null,
          backgroundImage: fanartImages.backgroundImage || null,
          bio: lastFmInfo.bio || null,
          bioSummary: lastFmInfo.bioSummary || null,
          bioContent: lastFmInfo.bioContent || null,
          bioPublished: lastFmInfo.bioPublished || null,
          tags: formattedTags,
          recordings: mappedRecordings,
          releases: mappedReleases,
          'release-groups': mappedReleases,
          similarArtists: similarArtists || [],
        });
      }

      case 'artist-tracks': {
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });
        const page = Math.max(1, Number(searchParams.get('page')) || 1);
        const limit = Number(searchParams.get('limit')) || 50;

        const rawId = decodeURIComponent(id);
        const isMbid = isUUID(rawId);

        let artistMbid: string | null = null;
        let artistName: string = rawId;

        if (isMbid) {
          artistMbid = rawId;
        } else {
          const searchRes = await searchArtists(artistName);
          if (searchRes && searchRes.length > 0) {
            artistMbid = searchRes[0].id;
            artistName = searchRes[0].name || artistName;
          }
        }

        const targetQuery = artistMbid || artistName;
        const rawTopTracks = await getLastFmTopTracks(targetQuery, limit, page);

        const mappedRecordings = (rawTopTracks || []).map((rec: any) => {
          const trackMbid = rec.mbid && isUUID(rec.mbid) ? rec.mbid : null;
          const trackId = trackMbid || rec.name || rec.title;
          const sample = getSampleMusic(trackId, undefined, undefined, rec.image);

          return {
            ...rec,
            id: trackId,
            mbid: trackMbid,
            ...sample,
            coverUrl: rec.image || sample.coverUrl,
            'artist-credit': [
              {
                name: artistName,
                artist: {
                  id: artistMbid || artistName,
                  name: artistName,
                },
              },
            ],
          };
        });

        return NextResponse.json({ recordings: mappedRecordings, page });
      }

      case 'release': {
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });

        const rawId = decodeURIComponent(id);
        const isMbid = isUUID(rawId);

        let releaseId: string | null = null;

        if (isMbid) {
          // CASE 1: MBID is provided
          releaseId = rawId;
        } else {
          // CASE 2: Non-MBID search term (/release/[release_name])
          // Use MusicBrainz API to resolve MBID: https://musicbrainz.org/ws/2/release?query=[cleanQuery]&limit=10&fmt=json
          const searchRes = await searchReleases(rawId);
          if (searchRes && searchRes.length > 0) {
            releaseId = searchRes[0].id;
          }
        }

        if (!releaseId) {
          return NextResponse.json({ error: 'Release not found' }, { status: 404 });
        }

        // Use ONLY MusicBrainz API:
        // 1. Get tracks and release group id: https://musicbrainz.org/ws/2/release/[releaseId]?inc=artists+recordings+release-groups+labels&fmt=json
        const release = await getReleaseDetails(releaseId);
        if (!release) return NextResponse.json({ error: 'Release details not found' }, { status: 404 });

        // 2. Get available release editions: https://musicbrainz.org/ws/2/release-group/[releaseGroupId]?inc=artists+releases+tags&fmt=json
        const releaseGroupId = release['release-group']?.id;
        let releaseGroupReleases: any[] = [];

        if (releaseGroupId) {
          try {
            const groupDetails = await getReleaseGroupDetails(releaseGroupId);
            if (groupDetails && groupDetails.releases) {
              releaseGroupReleases = groupDetails.releases.map((rel: any) => ({
                ...rel,
                image: `https://coverartarchive.org/release/${rel.id}/front-250`,
              }));
            }
          } catch (e) {
            console.warn('Failed to fetch release group releases:', e);
          }
        }

        // 3. Cover art: https://coverartarchive.org/release/{id}/front-500
        const primaryCover = `https://coverartarchive.org/release/${releaseId}/front-500`;
        const releaseGroupCover = releaseGroupId ? `https://coverartarchive.org/release-group/${releaseGroupId}/front-500` : null;

        return NextResponse.json({
          ...release,
          image: primaryCover,
          fallbackImage: releaseGroupCover,
          releaseGroupReleases,
        });
      }

      case 'release-group': {
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });
        const group = await getReleaseGroupDetails(id);
        if (!group) return NextResponse.json({ error: 'Release group not found' }, { status: 404 });

        const artistName = group['artist-credit']?.[0]?.name || '';
        const lastFmImage = artistName ? await getLastFmAlbumImage(artistName, group.title) : null;

        if (group.releases) {
          group.releases = group.releases.map((rel: any) => ({
            ...rel,
            image: `https://coverartarchive.org/release/${rel.id}/front-250`,
          }));
        }

        return NextResponse.json({
          ...group,
          image: `https://coverartarchive.org/release-group/${id}/front-500`,
          fallbackImage: lastFmImage || null,
        });
      }

      case 'tag': {
        const name = searchParams.get('name');
        if (!name) return NextResponse.json({ error: 'Name parameter is required' }, { status: 400 });
        const page = Math.max(1, Number(searchParams.get('page')) || 1);
        const limit = Number(searchParams.get('limit')) || 50;

        let rawTracks = await getLastFmTagTopTracks(name, limit, page);

        let recordings = rawTracks;
        if ((!recordings || recordings.length === 0) && page === 1) {
          const mbRecordings = await getTagDetails(name);
          recordings = (mbRecordings || []).map((rec: any) => ({
            ...rec,
            ...getSampleMusic(rec.id),
          }));
        } else {
          recordings = recordings.map((rec: any) => {
            const sample = getSampleMusic(rec.id || rec.name, undefined, undefined, rec.image);
            return {
              ...rec,
              ...sample,
              coverUrl: rec.image || sample.coverUrl,
            };
          });
        }

        return NextResponse.json({ recordings, page });
      }

      case 'user': {
        const username = searchParams.get('username');
        if (!username) return NextResponse.json({ error: 'Username parameter is required' }, { status: 400 });
        const payload = await getListenBrainzUser(username);
        return NextResponse.json({ username, payload });
      }

      case 'charts': {
        const [topTags, topArtists, rawTracks] = await Promise.all([
          getChartTopTags(20),
          getChartTopArtists(20),
          getChartTopTracks(50),
        ]);

        const topTracks = rawTracks.map((tr: any) => {
          const sample = getSampleMusic(tr.id || tr.name, undefined, undefined, tr.image);
          return {
            ...tr,
            ...sample,
            coverUrl: tr.image || sample.coverUrl,
          };
        });

        return NextResponse.json({ topTags, topArtists, topTracks });
      }

      case 'topartists': {
        const limit = Number(searchParams.get('limit')) || 50;
        const page = Number(searchParams.get('page')) || 1;
        const topArtists = await getChartTopArtists(limit, page);
        return NextResponse.json({ topArtists, page });
      }

      case 'toptracks': {
        const limit = Number(searchParams.get('limit')) || 50;
        const page = Number(searchParams.get('page')) || 1;
        const rawTracks = await getChartTopTracks(limit, page);
        const topTracks = rawTracks.map((tr: any) => {
          const sample = getSampleMusic(tr.id || tr.name, undefined, undefined, tr.image);
          return {
            ...tr,
            ...sample,
            coverUrl: tr.image || sample.coverUrl,
          };
        });
        return NextResponse.json({ topTracks, page });
      }

      case 'geotopartists': {
        const country = searchParams.get('country') || 'United States';
        const limit = Number(searchParams.get('limit')) || 50;
        const page = Number(searchParams.get('page')) || 1;
        const topArtists = await getGeoTopArtists(country, limit, page);
        return NextResponse.json({ topArtists, page, country });
      }

      case 'geotoptracks': {
        const country = searchParams.get('country') || 'United States';
        const limit = Number(searchParams.get('limit')) || 50;
        const page = Number(searchParams.get('page')) || 1;
        const rawTracks = await getGeoTopTracks(country, limit, page);
        const topTracks = rawTracks.map((tr: any) => {
          const sample = getSampleMusic(tr.id || tr.name, undefined, undefined, tr.image);
          return {
            ...tr,
            ...sample,
            coverUrl: tr.image || sample.coverUrl,
          };
        });
        return NextResponse.json({ topTracks, page, country });
      }

      default:
        return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    const msg = String(error?.message || '');
    if (msg.includes('Rate') || msg.includes('exceeded') || msg.includes('29') || msg.includes('limit')) {
      return NextResponse.json({
        recordings: [],
        artists: [],
        releases: [],
        topTracks: [],
        topArtists: [],
        topTags: [],
        rateLimited: true,
      }, { status: 200 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
