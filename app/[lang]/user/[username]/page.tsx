// /app/[lang]/user/[username]/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePlayer, Track } from '@/context/PlayerContext';
import CoverImage from '@/components/CoverImage';
import TrackMenu from '@/components/TrackMenu';
import { validateUsername } from '@/lib/userValidation';
import {
  fetchUserProfileByUsername,
  fetchUserFavorites,
  upsertUserProfile,
  recordRegisteredUser,
  checkIsUsernameTaken,
} from '@/lib/supabaseService';

interface FavoredArtist {
  id: string;
  name: string;
  image: string;
}

interface FavoredAlbum {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  coverUrl: string;
  releaseGroupId?: string;
  releaseId?: string;
  releaseDate?: string;
}

const ARTIST_IMAGE_MAP: Record<string, string> = {
  'radiohead': 'https://upload.wikimedia.org/wikipedia/commons/2/23/Radiohead_2016.jpg',
  'daft punk': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Daft_Punk_2013.jpg',
  'massive attack': 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Massive_Attack_in_2018.jpg',
  'portishead': 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Portishead.jpg',
  'aphex twin': 'https://coverartarchive.org/release-group/ebf9cb13-8cfb-3a3d-b4b1-9b168a2bf6cb/front-500',
  'boards of canada': 'https://coverartarchive.org/release-group/c0fb0e3b-9a4a-3fbf-93ed-b6bc6b96e62c/front-500',
  'pink floyd': 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Pink_Floyd_-_1973.png',
  'gorillaz': 'https://upload.wikimedia.org/wikipedia/commons/2/27/Gorillaz_London_2017.jpg',
  'kendrick lamar': 'https://upload.wikimedia.org/wikipedia/commons/3/38/Kendrick_Lamar_2018.jpg',
  'billie eilish': 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Billie_Eilish_at_the_2021_Met_Gala.jpg',
  'depeche mode': 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Depeche_Mode_2017_1.jpg',
  'tame impala': 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Tame_Impala_Piknic_%C3%89lectronik_2012.jpg',
  'nine inch nails': 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Nine_Inch_Nails_live_2018.jpg',
  'chemical brothers': 'https://upload.wikimedia.org/wikipedia/commons/b/bf/The_Chemical_Brothers_-_S%C3%B3nar_2015.jpg',
  'arcade fire': 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Arcade_Fire_Festival_de_IEM_2017.jpg',
  'kraftwerk': 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Kraftwerk_3D_2013.jpg',
  'bonobo': 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Bonobo_live_in_2017.jpg',
  'tycho': 'https://upload.wikimedia.org/wikipedia/commons/0/07/Tycho_at_Treasure_Island_2012.jpg',
  'moderat': 'https://upload.wikimedia.org/wikipedia/commons/9/95/Moderat_live_2016.jpg',
  'jon hopkins': 'https://upload.wikimedia.org/wikipedia/commons/9/93/Jon_Hopkins_2018.jpg',
};

const ALBUM_COVER_MAP: Record<string, string> = {
  'ok computer': 'https://coverartarchive.org/release-group/1b132483-e022-3a36-9d33-4f014798e4f1/front-500',
  'discovery': 'https://coverartarchive.org/release-group/102c77d9-2a4c-3574-88aa-eb866d926b4d/front-500',
  'mezzanine': 'https://coverartarchive.org/release-group/b9d2eb05-4c6e-347b-8919-dd595d2c0b02/front-500',
  'dummy': 'https://coverartarchive.org/release-group/b8a2e7c4-06c2-3e2b-a010-e5d3fa96aa91/front-500',
  'selected ambient works 85-92': 'https://coverartarchive.org/release-group/ebf9cb13-8cfb-3a3d-b4b1-9b168a2bf6cb/front-500',
  'music has the right to children': 'https://coverartarchive.org/release-group/c0fb0e3b-9a4a-3fbf-93ed-b6bc6b96e62c/front-500',
  'the dark side of the moon': 'https://coverartarchive.org/release-group/a1a11883-9b2f-3783-828e-5b1cfcc66f10/front-500',
  'demon days': 'https://coverartarchive.org/release-group/3b85f0ef-9f55-3d5f-9e3f-67bb2d97825b/front-500',
  'to pimp a butterfly': 'https://coverartarchive.org/release-group/2a8eb333-f542-4f7f-8d2a-c71b69f6bb12/front-500',
  'when we all fall asleep': 'https://coverartarchive.org/release-group/649d01ed-eeeb-47eb-a83d-3a52c3c6f2d5/front-500',
  'when we all fall asleep, where do we go?': 'https://coverartarchive.org/release-group/649d01ed-eeeb-47eb-a83d-3a52c3c6f2d5/front-500',
  'violator': 'https://coverartarchive.org/release-group/8c7e4fa0-d29a-3286-9a2d-450f38eb319e/front-500',
  'currents': 'https://coverartarchive.org/release-group/5fb53ec0-d983-490c-a96a-0ef66f4f22fa/front-500',
  'the downward spiral': 'https://coverartarchive.org/release-group/794cf343-2cdd-38eb-9d8f-51d8b8392186/front-500',
  'dig your own hole': 'https://coverartarchive.org/release-group/936cfdc5-0d4d-3712-9c31-874dbcd02271/front-500',
  'funeral': 'https://coverartarchive.org/release-group/a93ce9be-0255-3213-9f8a-a43beee9ee21/front-500',
  'computer world': 'https://coverartarchive.org/release-group/51dd43c7-3e1a-3eef-b328-ee18d7fdded9/front-500',
  'black sands': 'https://coverartarchive.org/release-group/4c6fb730-244e-4f05-b778-9572dd893f4e/front-500',
  'the campfire headphase': 'https://coverartarchive.org/release-group/c0fb0e3b-9a4a-3fbf-93ed-b6bc6b96e62c/front-500',
  'windowlicker': 'https://coverartarchive.org/release-group/ebf9cb13-8cfb-3a3d-b4b1-9b168a2bf6cb/front-500',
  'dive': 'https://coverartarchive.org/release-group/efefc8a5-06be-432d-aef3-bd08db499ae7/front-500',
  'ii': 'https://coverartarchive.org/release-group/b2a7bd14-fb5f-40f4-a039-444f9fcd971f/front-500',
  'immunity': 'https://coverartarchive.org/release-group/60d84386-aa60-4927-a065-27a96025170d/front-500',
};

const FALLBACK_ARTISTS: FavoredArtist[] = [
  { id: 'a74b1b7f-71a5-4011-9441-d0b5e4122711', name: 'Radiohead', image: ARTIST_IMAGE_MAP['radiohead'] },
  { id: '056e4f3e-d50e-472e-8413-1172236e4960', name: 'Daft Punk', image: ARTIST_IMAGE_MAP['daft punk'] },
  { id: 'a0e122b5-e6f7-4180-8772-2252c786a344', name: 'Massive Attack', image: ARTIST_IMAGE_MAP['massive attack'] },
  { id: '084308bd-1654-436f-a9da-f822f30f576e', name: 'Portishead', image: ARTIST_IMAGE_MAP['portishead'] },
  { id: 'f22143a7-3320-45c1-a457-3f9f7435f11d', name: 'Aphex Twin', image: ARTIST_IMAGE_MAP['aphex twin'] },
  { id: '6da18018-8f12-4217-9154-8c88e99818b2', name: 'Boards of Canada', image: ARTIST_IMAGE_MAP['boards of canada'] },
  { id: '83d91898-d773-4383-83d0-b7d11c210921', name: 'Pink Floyd', image: ARTIST_IMAGE_MAP['pink floyd'] },
  { id: 'e2173b96-1981-454b-b11b-7f284e1b0820', name: 'Gorillaz', image: ARTIST_IMAGE_MAP['gorillaz'] },
  { id: 'd5080c9b-1249-4777-b86a-73d827f8a706', name: 'Kendrick Lamar', image: ARTIST_IMAGE_MAP['kendrick lamar'] },
  { id: 'f4144239-2e2e-4f8e-82d2-ab8323891408', name: 'Billie Eilish', image: ARTIST_IMAGE_MAP['billie eilish'] },
  { id: '8538e728-3ade-42e9-8140-745b269399d8', name: 'Depeche Mode', image: ARTIST_IMAGE_MAP['depeche mode'] },
  { id: '63aa26c3-d55b-4332-901e-326d953efddf', name: 'Tame Impala', image: ARTIST_IMAGE_MAP['tame impala'] },
  { id: 'b7a2c927-958e-4611-a5b6-452a80f0808b', name: 'Nine Inch Nails', image: ARTIST_IMAGE_MAP['nine inch nails'] },
  { id: '31464303-3486-4a4b-a25e-3ec162c90c74', name: 'Chemical Brothers', image: ARTIST_IMAGE_MAP['chemical brothers'] },
  { id: '52074ba6-e495-453f-a50d-2d3071852500', name: 'Arcade Fire', image: ARTIST_IMAGE_MAP['arcade fire'] },
  { id: '2c315082-841f-4903-875f-3ec22a6df7a0', name: 'Kraftwerk', image: ARTIST_IMAGE_MAP['kraftwerk'] },
  { id: '942e88a0-bb2f-48e0-bb1c-439ff018599a', name: 'Bonobo', image: ARTIST_IMAGE_MAP['bonobo'] },
  { id: 'c2c4d96c-179f-43b8-8092-291ef748935c', name: 'Tycho', image: ARTIST_IMAGE_MAP['tycho'] },
  { id: 'a836ddfb-b9e0-40e8-8d07-28564a974959', name: 'Moderat', image: ARTIST_IMAGE_MAP['moderat'] },
  { id: 'a7e3d162-d278-43d9-a7e1-8f533a005698', name: 'Jon Hopkins', image: ARTIST_IMAGE_MAP['jon hopkins'] },
];

const FALLBACK_ALBUMS: FavoredAlbum[] = [
  { id: '1b132483-e022-3a36-9d33-4f014798e4f1', releaseGroupId: '1b132483-e022-3a36-9d33-4f014798e4f1', title: 'OK Computer', artist: 'Radiohead', artistId: 'a74b1b7f-71a5-4011-9441-d0b5e4122711', coverUrl: 'https://coverartarchive.org/release-group/1b132483-e022-3a36-9d33-4f014798e4f1/front-500' },
  { id: '102c77d9-2a4c-3574-88aa-eb866d926b4d', releaseGroupId: '102c77d9-2a4c-3574-88aa-eb866d926b4d', title: 'Discovery', artist: 'Daft Punk', artistId: '056e4f3e-d50e-472e-8413-1172236e4960', coverUrl: 'https://coverartarchive.org/release-group/102c77d9-2a4c-3574-88aa-eb866d926b4d/front-500' },
  { id: 'b9d2eb05-4c6e-347b-8919-dd595d2c0b02', releaseGroupId: 'b9d2eb05-4c6e-347b-8919-dd595d2c0b02', title: 'Mezzanine', artist: 'Massive Attack', artistId: 'a0e122b5-e6f7-4180-8772-2252c786a344', coverUrl: 'https://coverartarchive.org/release-group/b9d2eb05-4c6e-347b-8919-dd595d2c0b02/front-500' },
  { id: 'b8a2e7c4-06c2-3e2b-a010-e5d3fa96aa91', releaseGroupId: 'b8a2e7c4-06c2-3e2b-a010-e5d3fa96aa91', title: 'Dummy', artist: 'Portishead', artistId: '084308bd-1654-436f-a9da-f822f30f576e', coverUrl: 'https://coverartarchive.org/release-group/b8a2e7c4-06c2-3e2b-a010-e5d3fa96aa91/front-500' },
  { id: 'ebf9cb13-8cfb-3a3d-b4b1-9b168a2bf6cb', releaseGroupId: 'ebf9cb13-8cfb-3a3d-b4b1-9b168a2bf6cb', title: 'Selected Ambient Works 85-92', artist: 'Aphex Twin', artistId: 'f22143a7-3320-45c1-a457-3f9f7435f11d', coverUrl: 'https://coverartarchive.org/release-group/ebf9cb13-8cfb-3a3d-b4b1-9b168a2bf6cb/front-500' },
  { id: 'c0fb0e3b-9a4a-3fbf-93ed-b6bc6b96e62c', releaseGroupId: 'c0fb0e3b-9a4a-3fbf-93ed-b6bc6b96e62c', title: 'Music Has the Right to Children', artist: 'Boards of Canada', artistId: '6da18018-8f12-4217-9154-8c88e99818b2', coverUrl: 'https://coverartarchive.org/release-group/c0fb0e3b-9a4a-3fbf-93ed-b6bc6b96e62c/front-500' },
  { id: 'a1a11883-9b2f-3783-828e-5b1cfcc66f10', releaseGroupId: 'a1a11883-9b2f-3783-828e-5b1cfcc66f10', title: 'The Dark Side of the Moon', artist: 'Pink Floyd', artistId: '83d91898-d773-4383-83d0-b7d11c210921', coverUrl: 'https://coverartarchive.org/release-group/a1a11883-9b2f-3783-828e-5b1cfcc66f10/front-500' },
  { id: '3b85f0ef-9f55-3d5f-9e3f-67bb2d97825b', releaseGroupId: '3b85f0ef-9f55-3d5f-9e3f-67bb2d97825b', title: 'Demon Days', artist: 'Gorillaz', artistId: 'e2173b96-1981-454b-b11b-7f284e1b0820', coverUrl: 'https://coverartarchive.org/release-group/3b85f0ef-9f55-3d5f-9e3f-67bb2d97825b/front-500' },
  { id: '2a8eb333-f542-4f7f-8d2a-c71b69f6bb12', releaseGroupId: '2a8eb333-f542-4f7f-8d2a-c71b69f6bb12', title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar', artistId: 'd5080c9b-1249-4777-b86a-73d827f8a706', coverUrl: 'https://coverartarchive.org/release-group/2a8eb333-f542-4f7f-8d2a-c71b69f6bb12/front-500' },
  { id: '649d01ed-eeeb-47eb-a83d-3a52c3c6f2d5', releaseGroupId: '649d01ed-eeeb-47eb-a83d-3a52c3c6f2d5', title: 'When We All Fall Asleep', artist: 'Billie Eilish', artistId: 'f4144239-2e2e-4f8e-82d2-ab8323891408', coverUrl: 'https://coverartarchive.org/release-group/649d01ed-eeeb-47eb-a83d-3a52c3c6f2d5/front-500' },
  { id: '8c7e4fa0-d29a-3286-9a2d-450f38eb319e', releaseGroupId: '8c7e4fa0-d29a-3286-9a2d-450f38eb319e', title: 'Violator', artist: 'Depeche Mode', artistId: '8538e728-3ade-42e9-8140-745b269399d8', coverUrl: 'https://coverartarchive.org/release-group/8c7e4fa0-d29a-3286-9a2d-450f38eb319e/front-500' },
  { id: '5fb53ec0-d983-490c-a96a-0ef66f4f22fa', releaseGroupId: '5fb53ec0-d983-490c-a96a-0ef66f4f22fa', title: 'Currents', artist: 'Tame Impala', artistId: '63aa26c3-d55b-4332-901e-326d953efddf', coverUrl: 'https://coverartarchive.org/release-group/5fb53ec0-d983-490c-a96a-0ef66f4f22fa/front-500' },
  { id: '794cf343-2cdd-38eb-9d8f-51d8b8392186', releaseGroupId: '794cf343-2cdd-38eb-9d8f-51d8b8392186', title: 'The Downward Spiral', artist: 'Nine Inch Nails', artistId: 'b7a2c927-958e-4611-a5b6-452a80f0808b', coverUrl: 'https://coverartarchive.org/release-group/794cf343-2cdd-38eb-9d8f-51d8b8392186/front-500' },
  { id: '936cfdc5-0d4d-3712-9c31-874dbcd02271', releaseGroupId: '936cfdc5-0d4d-3712-9c31-874dbcd02271', title: 'Dig Your Own Hole', artist: 'Chemical Brothers', artistId: '31464303-3486-4a4b-a25e-3ec162c90c74', coverUrl: 'https://coverartarchive.org/release-group/936cfdc5-0d4d-3712-9c31-874dbcd02271/front-500' },
  { id: 'a93ce9be-0255-3213-9f8a-a43beee9ee21', releaseGroupId: 'a93ce9be-0255-3213-9f8a-a43beee9ee21', title: 'Funeral', artist: 'Arcade Fire', artistId: '52074ba6-e495-453f-a50d-2d3071852500', coverUrl: 'https://coverartarchive.org/release-group/a93ce9be-0255-3213-9f8a-a43beee9ee21/front-500' },
  { id: '51dd43c7-3e1a-3eef-b328-ee18d7fdded9', releaseGroupId: '51dd43c7-3e1a-3eef-b328-ee18d7fdded9', title: 'Computer World', artist: 'Kraftwerk', artistId: '2c315082-841f-4903-875f-3ec22a6df7a0', coverUrl: 'https://coverartarchive.org/release-group/51dd43c7-3e1a-3eef-b328-ee18d7fdded9/front-500' },
  { id: '4c6fb730-244e-4f05-b778-9572dd893f4e', releaseGroupId: '4c6fb730-244e-4f05-b778-9572dd893f4e', title: 'Black Sands', artist: 'Bonobo', artistId: '942e88a0-bb2f-48e0-bb1c-439ff018599a', coverUrl: 'https://coverartarchive.org/release-group/4c6fb730-244e-4f05-b778-9572dd893f4e/front-500' },
  { id: 'efefc8a5-06be-432d-aef3-bd08db499ae7', releaseGroupId: 'efefc8a5-06be-432d-aef3-bd08db499ae7', title: 'Dive', artist: 'Tycho', artistId: 'c2c4d96c-179f-43b8-8092-291ef748935c', coverUrl: 'https://coverartarchive.org/release-group/efefc8a5-06be-432d-aef3-bd08db499ae7/front-500' },
  { id: 'b2a7bd14-fb5f-40f4-a039-444f9fcd971f', releaseGroupId: 'b2a7bd14-fb5f-40f4-a039-444f9fcd971f', title: 'II', artist: 'Moderat', artistId: 'a836ddfb-b9e0-40e8-8d07-28564a974959', coverUrl: 'https://coverartarchive.org/release-group/b2a7bd14-fb5f-40f4-a039-444f9fcd971f/front-500' },
  { id: '60d84386-aa60-4927-a065-27a96025170d', releaseGroupId: '60d84386-aa60-4927-a065-27a96025170d', title: 'Immunity', artist: 'Jon Hopkins', artistId: 'a7e3d162-d278-43d9-a7e1-8f533a005698', coverUrl: 'https://coverartarchive.org/release-group/60d84386-aa60-4927-a065-27a96025170d/front-500' },
];

const FALLBACK_TRACKS: (Track & { releaseGroupId?: string })[] = [
  { id: 'ft-karma-police', title: 'Karma Police', artist: 'Radiohead', artistId: 'a74b1b7f-71a5-4011-9441-d0b5e4122711', album: 'OK Computer', releaseGroupId: '1b132483-e022-3a36-9d33-4f014798e4f1', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', coverUrl: 'https://coverartarchive.org/release-group/1b132483-e022-3a36-9d33-4f014798e4f1/front-500' },
  { id: 'ft-one-more-time', title: 'One More Time', artist: 'Daft Punk', artistId: '056e4f3e-d50e-472e-8413-1172236e4960', album: 'Discovery', releaseGroupId: '102c77d9-2a4c-3574-88aa-eb866d926b4d', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', coverUrl: 'https://coverartarchive.org/release-group/102c77d9-2a4c-3574-88aa-eb866d926b4d/front-500' },
  { id: 'ft-teardrop', title: 'Teardrop', artist: 'Massive Attack', artistId: 'a0e122b5-e6f7-4180-8772-2252c786a344', album: 'Mezzanine', releaseGroupId: 'b9d2eb05-4c6e-347b-8919-dd595d2c0b02', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', coverUrl: 'https://coverartarchive.org/release-group/b9d2eb05-4c6e-347b-8919-dd595d2c0b02/front-500' },
  { id: 'ft-glory-box', title: 'Glory Box', artist: 'Portishead', artistId: '084308bd-1654-436f-a9da-f822f30f576e', album: 'Dummy', releaseGroupId: 'b8a2e7c4-06c2-3e2b-a010-e5d3fa96aa91', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', coverUrl: 'https://coverartarchive.org/release-group/b8a2e7c4-06c2-3e2b-a010-e5d3fa96aa91/front-500' },
  { id: 'ft-windowlicker', title: 'Windowlicker', artist: 'Aphex Twin', artistId: 'f22143a7-3320-45c1-a457-3f9f7435f11d', album: 'Selected Ambient Works 85-92', releaseGroupId: 'ebf9cb13-8cfb-3a3d-b4b1-9b168a2bf6cb', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', coverUrl: 'https://coverartarchive.org/release-group/ebf9cb13-8cfb-3a3d-b4b1-9b168a2bf6cb/front-500' },
  { id: 'ft-dayvan-cowboy', title: 'Dayvan Cowboy', artist: 'Boards of Canada', artistId: '6da18018-8f12-4217-9154-8c88e99818b2', album: 'Music Has the Right to Children', releaseGroupId: 'c0fb0e3b-9a4a-3fbf-93ed-b6bc6b96e62c', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', coverUrl: 'https://coverartarchive.org/release-group/c0fb0e3b-9a4a-3fbf-93ed-b6bc6b96e62c/front-500' },
  { id: 'ft-time', title: 'Time', artist: 'Pink Floyd', artistId: '83d91898-d773-4383-83d0-b7d11c210921', album: 'The Dark Side of the Moon', releaseGroupId: 'a1a11883-9b2f-3783-828e-5b1cfcc66f10', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', coverUrl: 'https://coverartarchive.org/release-group/a1a11883-9b2f-3783-828e-5b1cfcc66f10/front-500' },
  { id: 'ft-feel-good-inc', title: 'Feel Good Inc.', artist: 'Gorillaz', artistId: 'e2173b96-1981-454b-b11b-7f284e1b0820', album: 'Demon Days', releaseGroupId: '3b85f0ef-9f55-3d5f-9e3f-67bb2d97825b', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', coverUrl: 'https://coverartarchive.org/release-group/3b85f0ef-9f55-3d5f-9e3f-67bb2d97825b/front-500' },
  { id: 'ft-alright', title: 'Alright', artist: 'Kendrick Lamar', artistId: 'd5080c9b-1249-4777-b86a-73d827f8a706', album: 'To Pimp a Butterfly', releaseGroupId: '2a8eb333-f542-4f7f-8d2a-c71b69f6bb12', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', coverUrl: 'https://coverartarchive.org/release-group/2a8eb333-f542-4f7f-8d2a-c71b69f6bb12/front-500' },
  { id: 'ft-bad-guy', title: 'Bad Guy', artist: 'Billie Eilish', artistId: 'f4144239-2e2e-4f8e-82d2-ab8323891408', album: 'When We All Fall Asleep', releaseGroupId: '649d01ed-eeeb-47eb-a83d-3a52c3c6f2d5', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', coverUrl: 'https://coverartarchive.org/release-group/649d01ed-eeeb-47eb-a83d-3a52c3c6f2d5/front-500' },
  { id: 'ft-enjoy-the-silence', title: 'Enjoy the Silence', artist: 'Depeche Mode', artistId: '8538e728-3ade-42e9-8140-745b269399d8', album: 'Violator', releaseGroupId: '8c7e4fa0-d29a-3286-9a2d-450f38eb319e', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', coverUrl: 'https://coverartarchive.org/release-group/8c7e4fa0-d29a-3286-9a2d-450f38eb319e/front-500' },
  { id: 'ft-less-i-know', title: 'The Less I Know the Better', artist: 'Tame Impala', artistId: '63aa26c3-d55b-4332-901e-326d953efddf', album: 'Currents', releaseGroupId: '5fb53ec0-d983-490c-a96a-0ef66f4f22fa', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', coverUrl: 'https://coverartarchive.org/release-group/5fb53ec0-d983-490c-a96a-0ef66f4f22fa/front-500' },
  { id: 'ft-closer', title: 'Closer', artist: 'Nine Inch Nails', artistId: 'b7a2c927-958e-4611-a5b6-452a80f0808b', album: 'The Downward Spiral', releaseGroupId: '794cf343-2cdd-38eb-9d8f-51d8b8392186', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', coverUrl: 'https://coverartarchive.org/release-group/794cf343-2cdd-38eb-9d8f-51d8b8392186/front-500' },
  { id: 'ft-block-rockin', title: 'Block Rockin Beats', artist: 'Chemical Brothers', artistId: '31464303-3486-4a4b-a25e-3ec162c90c74', album: 'Dig Your Own Hole', releaseGroupId: '936cfdc5-0d4d-3712-9c31-874dbcd02271', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', coverUrl: 'https://coverartarchive.org/release-group/936cfdc5-0d4d-3712-9c31-874dbcd02271/front-500' },
  { id: 'ft-rebellion', title: 'Rebellion (Lies)', artist: 'Arcade Fire', artistId: '52074ba6-e495-453f-a50d-2d3071852500', album: 'Funeral', releaseGroupId: 'a93ce9be-0255-3213-9f8a-a43beee9ee21', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', coverUrl: 'https://coverartarchive.org/release-group/a93ce9be-0255-3213-9f8a-a43beee9ee21/front-500' },
  { id: 'ft-computer-love', title: 'Computer Love', artist: 'Kraftwerk', artistId: '2c315082-841f-4903-875f-3ec22a6df7a0', album: 'Computer World', releaseGroupId: '51dd43c7-3e1a-3eef-b328-ee18d7fdded9', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', coverUrl: 'https://coverartarchive.org/release-group/51dd43c7-3e1a-3eef-b328-ee18d7fdded9/front-500' },
  { id: 'ft-cirrus', title: 'Cirrus', artist: 'Bonobo', artistId: '942e88a0-bb2f-48e0-bb1c-439ff018599a', album: 'Black Sands', releaseGroupId: '4c6fb730-244e-4f05-b778-9572dd893f4e', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', coverUrl: 'https://coverartarchive.org/release-group/4c6fb730-244e-4f05-b778-9572dd893f4e/front-500' },
  { id: 'ft-a-walk', title: 'A Walk', artist: 'Tycho', artistId: 'c2c4d96c-179f-43b8-8092-291ef748935c', album: 'Dive', releaseGroupId: 'efefc8a5-06be-432d-aef3-bd08db499ae7', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', coverUrl: 'https://coverartarchive.org/release-group/efefc8a5-06be-432d-aef3-bd08db499ae7/front-500' },
  { id: 'ft-bad-kingdom', title: 'Bad Kingdom', artist: 'Moderat', artistId: 'a836ddfb-b9e0-40e8-8d07-28564a974959', album: 'II', releaseGroupId: 'b2a7bd14-fb5f-40f4-a039-444f9fcd971f', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', coverUrl: 'https://coverartarchive.org/release-group/b2a7bd14-fb5f-40f4-a039-444f9fcd971f/front-500' },
  { id: 'ft-open-eye-signal', title: 'Open Eye Signal', artist: 'Jon Hopkins', artistId: 'a7e3d162-d278-43d9-a7e1-8f533a005698', album: 'Immunity', releaseGroupId: '60d84386-aa60-4927-a065-27a96025170d', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', coverUrl: 'https://coverartarchive.org/release-group/60d84386-aa60-4927-a065-27a96025170d/front-500' },
];

function formatJoinedDate(dateString?: string | null): string {
  if (!dateString) return 'August 2026';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'August 2026';
    const month = d.toLocaleString('en-US', { month: 'long' });
    const year = d.getFullYear();
    return `${month} ${year}`;
  } catch {
    return 'August 2026';
  }
}

function cleanWebsiteUrl(url?: string | null): string {
  if (!url) return '';
  return url
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '');
}

function getFullWebsiteUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '#';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export default function UserPage() {
  const params = useParams();
  const router = useRouter();
  const rawUsername = typeof params?.username === 'string'
    ? params.username
    : Array.isArray(params?.username)
    ? params.username[0]
    : '';
  const username = rawUsername ? decodeURIComponent(rawUsername) : '';
  const {
    userSession,
    loginUser,
    playTrack,
    currentTrack,
    isPlaying,
    playbackHistory,
    customPlaylists,
    togglePlaylistVisibility,
    updateUserSession,
    favoriteArtists,
    favoriteAlbums,
    favoriteTracks,
  } = usePlayer();

  const [editUsername, setEditUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(userSession?.username || '');
  const [usernameError, setUsernameError] = useState('');
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  const [editDisplayName, setEditDisplayName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');

  // Bio & metadata state
  const [userBio, setUserBio] = useState('Music enthusiast exploring electronic, ambient, and alt-rock soundscapes.');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [profileDisplayName, setProfileDisplayName] = useState('');
  const [profileWebsite, setProfileWebsite] = useState('');
  const [profileCreatedAt, setProfileCreatedAt] = useState<string | null>(null);

  // Tab filter: 'all' | 'artists' | 'albums' | 'tracks'
  const [activeTab, setActiveTab] = useState<'all' | 'artists' | 'albums' | 'tracks'>('all');

  // Visibility map: category -> (itemId -> isPublic)
  const [visibilityMap, setVisibilityMap] = useState<{
    artists: Record<string, boolean>;
    albums: Record<string, boolean>;
    tracks: Record<string, boolean>;
  }>({
    artists: {},
    albums: {},
    tracks: {},
  });

  const [showPrivatePlaylists, setShowPrivatePlaylists] = useState(false);

  const isCurrentUser = Boolean(userSession?.username && username && userSession.username.toLowerCase() === username.toLowerCase());

  const userPlaylists = customPlaylists || [];
  const publicPlaylists = userPlaylists.filter((p) => p.isPublic === true);
  const privatePlaylists = userPlaylists.filter((p) => !p.isPublic);

  const effectiveDisplayName = isCurrentUser
    ? (userSession?.displayName || profileDisplayName)
    : profileDisplayName;

  const effectiveWebsite = isCurrentUser
    ? (userSession?.website || profileWebsite)
    : profileWebsite;

  const effectiveCreatedAt = isCurrentUser
    ? (userSession?.supabaseUser?.created_at || (userSession as any)?.createdAt || profileCreatedAt)
    : profileCreatedAt;

  const userRoleOrDisplayName = effectiveDisplayName.trim()
    ? effectiveDisplayName.trim()
    : (isCurrentUser ? (userSession?.isLoggedIn ? 'Registered Listener' : 'Guest Account') : 'Listener');

  // Load bio, display name, website, created_at & visibility map on mount or username change
  useEffect(() => {
    if (typeof window !== 'undefined' && username) {
      const isOwner = Boolean(userSession?.username && username && userSession.username.toLowerCase() === username.toLowerCase());
      const sessionBio = isOwner ? userSession?.bio : null;
      const sessionDn = isOwner ? userSession?.displayName : null;
      const sessionWebsite = isOwner ? userSession?.website : null;
      const sessionCreatedAt = isOwner ? (userSession?.supabaseUser?.created_at || (userSession as any)?.createdAt) : null;

      const savedBio = sessionBio || localStorage.getItem(`mb_user_bio_${username}`);
      const savedDn = sessionDn || localStorage.getItem(`mb_user_displayname_${username}`);
      const savedWebsite = sessionWebsite || localStorage.getItem(`mb_user_website_${username}`);
      const savedCreatedAt = sessionCreatedAt || localStorage.getItem(`mb_user_created_at_${username}`);
      const savedVis = localStorage.getItem(`mb_favored_vis_${username}`);

      setTimeout(() => {
        if (savedBio) {
          setUserBio(savedBio);
        } else {
          setUserBio('Music enthusiast exploring electronic, ambient, and alt-rock soundscapes.');
        }

        if (savedDn) {
          setProfileDisplayName(savedDn);
        } else {
          setProfileDisplayName('');
        }

        if (savedWebsite) {
          setProfileWebsite(savedWebsite);
        } else {
          setProfileWebsite('');
        }

        if (savedCreatedAt) {
          setProfileCreatedAt(savedCreatedAt);
        }

        if (savedVis) {
          try {
            setVisibilityMap(JSON.parse(savedVis));
          } catch (e) {
            console.error('Failed to parse visibility map', e);
          }
        }
      }, 0);

      // Also pull directly from Supabase profiles table
      fetchUserProfileByUsername(username).then((dbProfile) => {
        if (dbProfile) {
          if (dbProfile.bio) setUserBio(dbProfile.bio);
          if (dbProfile.display_name) setProfileDisplayName(dbProfile.display_name);
          if (dbProfile.website) setProfileWebsite(dbProfile.website);
          if (dbProfile.created_at) setProfileCreatedAt(dbProfile.created_at);
        }
      }).catch((err) => {
        console.warn('Error fetching user profile by username:', err);
      });
    }
  }, [username, userSession?.bio, userSession?.displayName, userSession?.website, userSession?.supabaseUser?.created_at, userSession?.username]);

  const handleSaveDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisplayNameError('');
    const trimmed = newDisplayName.trim();

    if (trimmed.length > 50) {
      setDisplayNameError('Display name must be 50 characters or fewer.');
      return;
    }

    setProfileDisplayName(trimmed);
    if (isCurrentUser) {
      updateUserSession({ displayName: trimmed });
      const userId = userSession?.supabaseUser?.id || (typeof window !== 'undefined' ? localStorage.getItem('mb_user_id') : null) || userSession?.username;
      if (userId) {
        upsertUserProfile(userId, {
          username: userSession?.username || username,
          display_name: trimmed,
          email: userSession?.email || '',
          bio: userBio,
          website: effectiveWebsite || '',
        });
      }
    } else if (typeof window !== 'undefined' && username) {
      localStorage.setItem(`mb_user_displayname_${username}`, trimmed);
    }
    setEditDisplayName(false);
  };

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError('');
    const trimmed = newUsername.trim();

    if (trimmed.toLowerCase() === (userSession?.username || '').toLowerCase()) {
      setEditUsername(false);
      return;
    }

    const validation = validateUsername(trimmed);
    if (!validation.valid) {
      setUsernameError(validation.error || 'Username may only contain alphanumeric characters or single hyphens, and cannot begin or end with a hyphen.');
      return;
    }

    setIsSavingUsername(true);
    try {
      // Check if taken
      const isTaken = await checkIsUsernameTaken(trimmed, userSession?.supabaseUser?.id || userSession?.username);
      if (isTaken) {
        setUsernameError('This username is already taken. Please choose another one.');
        setIsSavingUsername(false);
        return;
      }

      const userId = userSession?.supabaseUser?.id || (typeof window !== 'undefined' ? localStorage.getItem('mb_user_id') : null) || trimmed;
      if (userId) {
        await upsertUserProfile(userId, {
          username: trimmed,
          display_name: effectiveDisplayName || trimmed,
          email: userSession?.email || '',
          bio: userBio,
          website: effectiveWebsite || '',
        });
        await recordRegisteredUser({
          id: userSession?.supabaseUser?.id || undefined,
          username: trimmed,
          email: userSession?.email || '',
        });
      }

      // Update user session
      updateUserSession({ username: trimmed });
      setEditUsername(false);

      // Redirect URL to /user/[newusername]
      const lang = (typeof params?.lang === 'string' ? params.lang : 'en');
      router.push(`/${lang}/user/${encodeURIComponent(trimmed)}`);
    } catch (err) {
      console.error('Error saving username:', err);
      setUsernameError('An error occurred while updating username. Please try again.');
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleSaveBio = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = bioInput.trim();
    const finalBio = trimmed || 'Music enthusiast exploring electronic, ambient, and alt-rock soundscapes.';
    setUserBio(finalBio);
    if (isCurrentUser) {
      updateUserSession({ bio: finalBio });
      const userId = userSession?.supabaseUser?.id || (typeof window !== 'undefined' ? localStorage.getItem('mb_user_id') : null) || userSession?.username;
      if (userId) {
        upsertUserProfile(userId, {
          username: userSession?.username || username,
          bio: finalBio,
        });
      }
    } else if (typeof window !== 'undefined' && username) {
      localStorage.setItem(`mb_user_bio_${username}`, finalBio);
    }
    setIsEditingBio(false);
  };

  const isItemPublic = (category: 'artists' | 'albums' | 'tracks', id: string) => {
    return visibilityMap[category]?.[id] === true; // default false (private)
  };

  const toggleVisibility = (category: 'artists' | 'albums' | 'tracks', id: string) => {
    if (!isCurrentUser) return;
    const current = isItemPublic(category, id);
    const updated = {
      ...visibilityMap,
      [category]: {
        ...visibilityMap[category],
        [id]: !current,
      },
    };
    setVisibilityMap(updated);
    if (typeof window !== 'undefined' && username) {
      localStorage.setItem(`mb_favored_vis_${username}`, JSON.stringify(updated));
    }
  };

  // Derive last 20 Artists (explicit Supabase favorites first, then playback history)
  const favoredArtists = useMemo(() => {
    const list: FavoredArtist[] = [];
    const seen = new Set<string>();

    if (isCurrentUser && favoriteArtists && favoriteArtists.length > 0) {
      for (const fav of favoriteArtists) {
        const key = fav.name.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: fav.id,
            name: fav.name,
            image: fav.image || ARTIST_IMAGE_MAP[key] || '',
          });
        }
      }
    }

    for (const item of playbackHistory) {
      if (list.length >= 20) break;
      if (!item.track?.artist) continue;
      const name = item.track.artist.trim();
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        const artistId = item.track.artistId || encodeURIComponent(name);
        const image = (item.track as any).artistImage || ARTIST_IMAGE_MAP[key] || item.track.coverUrl || (item.track.releaseId || item.track.albumId ? `https://coverartarchive.org/release-group/${item.track.releaseId || item.track.albumId}/front-500` : '');
        list.push({
          id: artistId,
          name,
          image,
        });
      }
    }

    for (const fb of FALLBACK_ARTISTS) {
      if (list.length >= 20) break;
      const key = fb.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push(fb);
      }
    }

    return list.slice(0, 20);
  }, [playbackHistory, isCurrentUser, favoriteArtists]);

  // Derive last 20 Albums (explicit Supabase favorites first, then playback history)
  const favoredAlbums = useMemo(() => {
    const list: FavoredAlbum[] = [];
    const seen = new Set<string>();

    if (isCurrentUser && favoriteAlbums && favoriteAlbums.length > 0) {
      for (const fav of favoriteAlbums) {
        const key = `${fav.title.toLowerCase()}::${fav.artist.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: fav.id,
            title: fav.title,
            artist: fav.artist,
            artistId: fav.artistId,
            coverUrl: fav.coverUrl || ALBUM_COVER_MAP[fav.title.toLowerCase()] || '',
            releaseDate: fav.releaseDate,
          });
        }
      }
    }

    for (const item of playbackHistory) {
      if (list.length >= 20) break;
      const albumName = item.track?.album;
      if (!albumName || albumName === 'Unknown Album' || albumName.includes('scrobble')) continue;
      const artist = item.track?.artist || 'Unknown Artist';
      const key = `${albumName.toLowerCase()}::${artist.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        const releaseGroupId = (item.track as any).releaseGroupId;
        const releaseId = item.track.releaseId || item.track.albumId;
        
        let cover = '';
        if (releaseGroupId) {
          cover = `https://coverartarchive.org/release-group/${releaseGroupId}/front-500`;
        } else if (releaseId && releaseId.length === 36) {
          cover = `https://coverartarchive.org/release/${releaseId}/front-500`;
        } else if (ALBUM_COVER_MAP[albumName.toLowerCase()]) {
          cover = ALBUM_COVER_MAP[albumName.toLowerCase()];
        } else {
          cover = item.track.coverUrl || '';
        }

        list.push({
          id: releaseGroupId || releaseId || `album-${encodeURIComponent(albumName)}`,
          title: albumName,
          artist,
          artistId: item.track.artistId,
          coverUrl: cover,
          releaseGroupId,
          releaseId,
        });
      }
    }

    for (const fb of FALLBACK_ALBUMS) {
      if (list.length >= 20) break;
      const key = `${fb.title.toLowerCase()}::${fb.artist.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push(fb);
      }
    }

    return list.slice(0, 20);
  }, [playbackHistory, isCurrentUser, favoriteAlbums]);

  // Derive last 20 Tracks (explicit Supabase favorites first, then playback history)
  const favoredTracks = useMemo(() => {
    const list: Track[] = [];
    const seen = new Set<string>();

    if (isCurrentUser && favoriteTracks && favoriteTracks.length > 0) {
      for (const fav of favoriteTracks) {
        const key = fav.id || `${fav.title.toLowerCase()}::${fav.artist.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push(fav);
        }
      }
    }

    for (const item of playbackHistory) {
      if (list.length >= 20) break;
      if (!item.track) continue;
      const key = item.track.id || `${item.track.title.toLowerCase()}::${item.track.artist.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        const releaseGroupId = (item.track as any).releaseGroupId;
        const releaseId = item.track.releaseId;
        const albumName = item.track.album;

        let cover = item.track.coverUrl || '';
        if (!cover || cover.includes('picsum') || cover.includes('placeholder')) {
          if (releaseGroupId) {
            cover = `https://coverartarchive.org/release-group/${releaseGroupId}/front-500`;
          } else if (releaseId) {
            cover = `https://coverartarchive.org/release/${releaseId}/front-500`;
          } else if (albumName && ALBUM_COVER_MAP[albumName.toLowerCase()]) {
            cover = ALBUM_COVER_MAP[albumName.toLowerCase()];
          }
        }

        list.push({
          ...item.track,
          coverUrl: cover,
        });
      }
    }

    for (const fb of FALLBACK_TRACKS) {
      if (list.length >= 20) break;
      const key = fb.id;
      if (!seen.has(key)) {
        seen.add(key);
        list.push(fb);
      }
    }

    return list.slice(0, 20);
  }, [playbackHistory, isCurrentUser, favoriteTracks]);

  // Filtered for visitors vs currentUser
  const displayArtists = isCurrentUser
    ? favoredArtists
    : favoredArtists.filter((a) => isItemPublic('artists', a.id));

  const displayAlbums = isCurrentUser
    ? favoredAlbums
    : favoredAlbums.filter((a) => isItemPublic('albums', a.id));

  const displayTracks = isCurrentUser
    ? favoredTracks
    : favoredTracks.filter((t) => isItemPublic('tracks', t.id));

  return (
    <div className="space-y-8 pb-20 animate-fade-in max-w-6xl mx-auto px-2 sm:px-4">
      {/* PROFILE HEADER CARD */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 light:border-zinc-700 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* User Avatar */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-blue-500/30 bg-zinc-950 shrink-0 relative flex items-center justify-center shadow-2xl">
            <CoverImage
              src={isCurrentUser ? (userSession.avatarUrl || `https://picsum.photos/seed/${userSession.username}/150/150`) : `https://picsum.photos/seed/${username}/150/150`}
              alt={username}
              type="track"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-3 text-center sm:text-left flex-1 min-w-0">
            {/* 1. Display Name First & Edit Form */}
            <div className="flex flex-col items-center sm:items-start gap-1">
              {isCurrentUser && editDisplayName ? (
                <div className="flex flex-col gap-1 w-full max-w-md">
                  <form onSubmit={handleSaveDisplayName} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={newDisplayName}
                      onChange={(e) => {
                        setNewDisplayName(e.target.value);
                        if (displayNameError) setDisplayNameError('');
                      }}
                      placeholder="Enter display name"
                      maxLength={50}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-lg font-bold text-white focus:outline-none focus:border-blue-500/50 flex-1"
                      autoFocus
                    />
                    <button type="submit" className="px-3 py-1.5 bg-blue-500 rounded-lg text-white hover:bg-blue-400 font-semibold text-xs cursor-pointer flex items-center gap-1 shrink-0">
                      <span className="material-icons-round text-sm">save</span>
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditDisplayName(false);
                        setDisplayNameError('');
                      }}
                      className="px-3 py-1.5 text-zinc-400 hover:text-white text-xs cursor-pointer shrink-0"
                    >
                      Cancel
                    </button>
                  </form>
                  {displayNameError && (
                    <span className="text-xs text-rose-400 font-medium">{displayNameError}</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
                  <h1 className="font-sans font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                    {effectiveDisplayName.trim() || (isCurrentUser ? userSession.username : username)}
                  </h1>
                  {isCurrentUser && (
                    <button
                      onClick={() => {
                        setNewDisplayName(effectiveDisplayName.trim() || userSession.displayName || userSession.username);
                        setDisplayNameError('');
                        setEditDisplayName(true);
                      }}
                      className="p-1.5 hover:bg-zinc-800/80 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                      title="Edit Display Name"
                    >
                      <span className="material-icons-round text-base">edit</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 2. Sub-handle (@username) and Edit Handle */}
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap text-sm">
              {isCurrentUser && editUsername ? (
                <div className="flex flex-col gap-1.5 w-full max-w-md">
                  <form onSubmit={handleSaveUsername} className="flex gap-2 items-center">
                    <div className="relative flex-1 flex items-center">
                      <span className="absolute left-3.5 text-zinc-500 font-mono text-sm sm:text-base">@</span>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => {
                          setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                          if (usernameError) setUsernameError('');
                        }}
                        placeholder="handle"
                        disabled={isSavingUsername}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-sm sm:text-base font-mono text-white focus:outline-none focus:border-blue-500/50"
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSavingUsername}
                      className="px-3 py-1.5 bg-blue-500 rounded-lg text-white hover:bg-blue-400 font-semibold text-xs cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50"
                    >
                      <span className="material-icons-round text-sm">save</span>
                      {isSavingUsername ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      disabled={isSavingUsername}
                      onClick={() => {
                        setEditUsername(false);
                        setUsernameError('');
                      }}
                      className="px-3 py-1.5 text-zinc-400 hover:text-white text-xs cursor-pointer shrink-0"
                    >
                      Cancel
                    </button>
                  </form>
                  {usernameError && (
                    <span className="text-xs text-rose-400 font-medium">{usernameError}</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-400 font-mono text-sm sm:text-base font-medium">
                    @{isCurrentUser ? userSession.username : username}
                  </span>
                  {isCurrentUser && (
                    <button
                      onClick={() => {
                        setNewUsername(userSession.username);
                        setUsernameError('');
                        setEditUsername(true);
                      }}
                      className="p-1 hover:bg-zinc-800/80 rounded-md text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer flex items-center justify-center"
                      title="Edit Username Handle"
                    >
                      <span className="material-icons-round text-sm">edit</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Metadata: Exploring music since & Website link */}
            <div className="flex items-center gap-x-4 gap-y-1.5 text-xs text-zinc-400 flex-wrap justify-center sm:justify-start pt-0.5">
              <div className="inline-flex items-center gap-1.5 text-zinc-400">
                <span className="material-icons-round text-sm text-zinc-500">calendar_today</span>
                <span>Exploring music since {formatJoinedDate(effectiveCreatedAt)}</span>
              </div>

              {effectiveWebsite && cleanWebsiteUrl(effectiveWebsite) && (
                <div className="inline-flex items-center gap-1.5">
                  <span className="material-icons-round text-sm text-zinc-500 select-none">link</span>
                  <a
                    href={getFullWebsiteUrl(effectiveWebsite)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                  >
                    {cleanWebsiteUrl(effectiveWebsite)}
                  </a>
                </div>
              )}
            </div>

            {/* Editable Bio Section Below Username */}
            <div className="pt-1">
              {isCurrentUser && isEditingBio ? (
                <form onSubmit={handleSaveBio} className="space-y-2 max-w-xl">
                  <textarea
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    placeholder="Write a short bio about your music taste..."
                    rows={2}
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 resize-none shadow-inner"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-lg text-xs cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <span className="material-icons-round text-sm">save</span>
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingBio(false)}
                      className="px-3 py-1.5 text-zinc-400 hover:text-white text-xs cursor-pointer shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-center sm:justify-start gap-2 group">
                  <p className="text-zinc-300 text-xs sm:text-sm italic leading-relaxed max-w-xl">
                    &ldquo;{userBio}&rdquo;
                  </p>
                  {isCurrentUser && (
                    <button
                      onClick={() => {
                        setBioInput(userBio);
                        setIsEditingBio(true);
                      }}
                      className="p-1 text-zinc-500 hover:text-blue-400 hover:bg-zinc-800/60 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Edit Bio"
                    >
                      <span className="material-icons-round text-sm">edit</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PUBLIC PLAYLISTS SECTION (Below YOUR PROFILE section) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900 light:border-zinc-700 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <span className="material-icons-round text-lg">queue_music</span>
            </div>
            <div>
              <h2 className="font-sans font-extrabold text-lg text-white tracking-tight">
                Public Playlists
              </h2>
              <p className="text-zinc-500 text-xs">
                {isCurrentUser ? 'Playlists visible on your public profile' : `Public playlists created by ${username}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-zinc-500">
              {publicPlaylists.length} {publicPlaylists.length === 1 ? 'Playlist' : 'Playlists'}
            </span>
            {isCurrentUser && privatePlaylists.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPrivatePlaylists(!showPrivatePlaylists)}
                className="text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 light:border-zinc-700 px-3 py-1 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-icons-round text-sm">
                  {showPrivatePlaylists ? 'visibility_off' : 'lock'}
                </span>
                <span>{showPrivatePlaylists ? 'Hide Private' : `Manage Private (${privatePlaylists.length})`}</span>
              </button>
            )}
          </div>
        </div>

        {publicPlaylists.length === 0 && !showPrivatePlaylists ? (
          <div className="bg-zinc-900/20 border border-zinc-900/50 light:border-zinc-700 rounded-2xl p-6 text-center space-y-2">
            <span className="material-icons-round text-3xl text-zinc-600">playlist_add</span>
            <p className="text-zinc-400 text-xs sm:text-sm">No public playlists available.</p>
            {isCurrentUser && (
              <p className="text-zinc-500 text-xs">
                Create a playlist or toggle any private playlist to &quot;Public&quot; to showcase it here.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicPlaylists.map((playlist) => {
              const trackCount = playlist.tracks?.length || 0;
              const coverImages = (playlist.tracks || []).map((t) => t.coverUrl).filter(Boolean).slice(0, 4);

              return (
                <div
                  key={playlist.id}
                  className="group bg-zinc-900/40 hover:bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 light:border-zinc-700 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-3.5">
                      {/* Playlist Art Grid / Cover */}
                      <Link
                        href={`/playlist/${playlist.id}`}
                        className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 light:border-zinc-700 shrink-0 shadow relative group/art flex items-center justify-center"
                      >
                        {coverImages.length >= 4 ? (
                          <div className="grid grid-cols-2 w-full h-full">
                            {coverImages.map((src, idx) => (
                              <CoverImage key={idx} src={src} alt="" type="track" className="w-full h-full object-cover" />
                            ))}
                          </div>
                        ) : coverImages.length > 0 ? (
                          <CoverImage src={coverImages[0]} alt="" type="track" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-icons-round text-2xl text-blue-400">queue_music</span>
                        )}
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/playlist/${playlist.id}`}
                          className="font-bold text-sm text-white hover:text-blue-400 transition-colors truncate block"
                        >
                          {playlist.name}
                        </Link>
                        <p className="text-zinc-400 text-xs line-clamp-1 mt-0.5">
                          {playlist.description || `${trackCount} ${trackCount === 1 ? 'track' : 'tracks'}`}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">
                            {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
                          </span>
                          <span className="text-zinc-700">&bull;</span>
                          <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                            Public
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Toggle switch for current user */}
                  {isCurrentUser && (
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-zinc-800/80 light:border-zinc-700">
                      <span className="text-[11px] font-medium tracking-wide text-zinc-200">
                        Public
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={true}
                        onClick={() => togglePlaylistVisibility(playlist.id)}
                        title={`Toggle visibility for ${playlist.name}`}
                        className="group relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900 bg-blue-600"
                      >
                        <span className="sr-only">Toggle visibility for {playlist.name}</span>
                        <span
                          aria-hidden="true"
                          className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out translate-x-4"
                        />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Private Playlists (only visible to owner when toggled open) */}
        {isCurrentUser && showPrivatePlaylists && privatePlaylists.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-zinc-900/80 light:border-zinc-700">
            <div className="flex items-center gap-2">
              <span className="material-icons-round text-sm text-zinc-500">lock</span>
              <h3 className="font-sans font-bold text-xs text-zinc-400 uppercase tracking-wider">
                Your Private Playlists ({privatePlaylists.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {privatePlaylists.map((playlist) => {
                const trackCount = playlist.tracks?.length || 0;
                const coverImages = (playlist.tracks || []).map((t) => t.coverUrl).filter(Boolean).slice(0, 4);

                return (
                  <div
                    key={playlist.id}
                    className="group bg-zinc-950/60 border border-zinc-800/60 light:border-zinc-700 rounded-2xl p-4 flex flex-col justify-between opacity-80 hover:opacity-100 transition-all shadow-md"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start gap-3.5">
                        <Link
                          href={`/playlist/${playlist.id}`}
                          className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 light:border-zinc-700 shrink-0 shadow relative group/art flex items-center justify-center"
                        >
                          {coverImages.length >= 4 ? (
                            <div className="grid grid-cols-2 w-full h-full">
                              {coverImages.map((src, idx) => (
                                <CoverImage key={idx} src={src} alt="" type="track" className="w-full h-full object-cover opacity-80" />
                              ))}
                            </div>
                          ) : coverImages.length > 0 ? (
                            <CoverImage src={coverImages[0]} alt="" type="track" className="w-full h-full object-cover opacity-80" />
                          ) : (
                            <span className="material-icons-round text-2xl text-zinc-500">lock</span>
                          )}
                        </Link>

                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/playlist/${playlist.id}`}
                            className="font-bold text-sm text-zinc-200 hover:text-white transition-colors truncate block"
                          >
                            {playlist.name}
                          </Link>
                          <p className="text-zinc-500 text-xs line-clamp-1 mt-0.5">
                            {playlist.description || `${trackCount} ${trackCount === 1 ? 'track' : 'tracks'}`}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-mono text-zinc-500 uppercase">
                              {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
                            </span>
                            <span className="text-zinc-700">&bull;</span>
                            <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
                              Private
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-zinc-800/80 light:border-zinc-700">
                      <span className="text-[11px] font-medium tracking-wide text-zinc-500">
                        Private
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={false}
                        onClick={() => togglePlaylistVisibility(playlist.id)}
                        title={`Make ${playlist.name} public`}
                        className="group relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900 bg-zinc-700"
                      >
                        <span className="sr-only">Make {playlist.name} public</span>
                        <span
                          aria-hidden="true"
                          className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out translate-x-0"
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* TABS & MAIN CONTENT SECTIONS */}
      <div className="space-y-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-900 light:border-zinc-700 pb-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'all'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <span className="material-icons-round text-base">dashboard</span>
            <span>All Favorites</span>
          </button>

          <button
            onClick={() => setActiveTab('artists')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'artists'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <span className="material-icons-round text-base">people</span>
            <span>Favorite Artists</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'artists' ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
              {displayArtists.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('albums')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'albums'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <span className="material-icons-round text-base">album</span>
            <span>Favorite Albums</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'albums' ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
              {displayAlbums.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tracks')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'tracks'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <span className="material-icons-round text-base">graphic_eq</span>
            <span>Favorite Tracks</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'tracks' ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
              {displayTracks.length}
            </span>
          </button>
        </div>

        {/* SECTION 1: FAVORED ARTISTS */}
        {(activeTab === 'all' || activeTab === 'artists') && (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 light:border-zinc-700 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <span className="material-icons-round text-lg">people</span>
                </div>
                <div>
                  <h2 className="font-sans font-extrabold text-lg text-white tracking-tight">
                    Favorite Artists
                  </h2>
                  <p className="text-zinc-500 text-xs">
                    Last 20 artists suggested from listening history
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs text-zinc-500">
                {displayArtists.length} Artists
              </span>
            </div>

            {displayArtists.length === 0 ? (
              <div className="bg-zinc-900/20 border border-zinc-900/50 light:border-zinc-700 rounded-2xl p-8 text-center space-y-2">
                <span className="material-icons-round text-4xl text-zinc-600">person_off</span>
                <p className="text-zinc-400 text-sm">No public favorite artists available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
                {displayArtists.map((artist) => {
                  const isPublic = isItemPublic('artists', artist.id);
                  return (
                    <div
                      key={artist.id}
                      className={`group bg-zinc-900/30 hover:bg-zinc-900/80 border rounded-2xl p-3.5 flex flex-col justify-between transition-all ${
                        isPublic ? 'border-zinc-800 hover:border-zinc-700 light:border-zinc-700' : 'border-zinc-900 light:border-zinc-700 opacity-70'
                      }`}
                    >
                      <Link
                        href={`/artist/${artist.id}`}
                        className="flex flex-col items-center text-center space-y-2.5 group/link"
                      >
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-950 border border-zinc-800 light:border-zinc-700 shadow-md group-hover/link:scale-105 transition-transform">
                          <CoverImage
                            src={artist.image}
                            alt={artist.name}
                            type="artist"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-bold text-xs text-white group-hover/link:text-blue-400 truncate w-full">
                          {artist.name}
                        </span>
                      </Link>

                      {/* Tailwind Visibility Toggle */}
                      {isCurrentUser && (
                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-zinc-800/80 light:border-zinc-700">
                          <span className={`text-[11px] font-medium tracking-wide ${isPublic ? 'text-zinc-200' : 'text-zinc-500'}`}>
                            {isPublic ? 'Public' : 'Private'}
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isPublic}
                            onClick={() => toggleVisibility('artists', artist.id)}
                            title={`Toggle visibility for ${artist.name}`}
                            className={`group relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${
                              isPublic ? 'bg-blue-600' : 'bg-zinc-700'
                            }`}
                          >
                            <span className="sr-only">Toggle visibility for {artist.name}</span>
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                isPublic ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* SECTION 2: FAVORITE ALBUMS */}
        {(activeTab === 'all' || activeTab === 'albums') && (
          <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-zinc-900 light:border-zinc-700 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <span className="material-icons-round text-lg">album</span>
                </div>
                <div>
                  <h2 className="font-sans font-extrabold text-lg text-white tracking-tight">
                    Favorite Albums
                  </h2>
                  <p className="text-zinc-500 text-xs">
                    Last 20 albums suggested from listening history
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs text-zinc-500">
                {displayAlbums.length} Albums
              </span>
            </div>

            {displayAlbums.length === 0 ? (
              <div className="bg-zinc-900/20 border border-zinc-900/50 light:border-zinc-700 rounded-2xl p-8 text-center space-y-2">
                <span className="material-icons-round text-4xl text-zinc-600">album</span>
                <p className="text-zinc-400 text-sm">No public favorite albums available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
                {displayAlbums.map((album) => {
                  const isPublic = isItemPublic('albums', album.id);
                  const albumUrl = album.releaseId
                    ? `/album/${album.releaseId}`
                    : album.releaseGroupId
                    ? `/album/${album.releaseGroupId}`
                    : album.id && album.id.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)
                    ? `/album/${album.id}`
                    : `/album/${encodeURIComponent(album.id)}`;

                  const artistUrl = album.artistId
                    ? `/artist/${album.artistId}`
                    : `/artist/${encodeURIComponent(album.artist)}`;

                  return (
                    <div
                      key={album.id}
                      className={`group bg-zinc-900/30 hover:bg-zinc-900/80 border rounded-2xl p-3 flex flex-col justify-between transition-all ${
                        isPublic ? 'border-zinc-800 hover:border-zinc-700 light:border-zinc-700' : 'border-zinc-900 light:border-zinc-700 opacity-70'
                      }`}
                    >
                      <div className="space-y-2">
                        <Link href={albumUrl} className="block relative aspect-square rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 light:border-zinc-700 shadow">
                          <CoverImage
                            src={album.coverUrl}
                            alt={album.title}
                            type="album"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </Link>
                        <div className="text-left min-w-0">
                          <Link
                            href={albumUrl}
                            className="font-bold text-xs text-white truncate block hover:text-blue-400 transition-colors"
                          >
                            {album.title}
                          </Link>
                          <Link
                            href={artistUrl}
                            className="text-[11px] text-zinc-400 hover:text-zinc-200 hover:underline truncate block mt-0.5 transition-colors"
                          >
                            {album.artist}
                          </Link>
                        </div>
                      </div>

                      {/* Tailwind Visibility Toggle */}
                      {isCurrentUser && (
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800/80 light:border-zinc-700">
                          <span className={`text-[11px] font-medium tracking-wide ${isPublic ? 'text-zinc-200' : 'text-zinc-500'}`}>
                            {isPublic ? 'Public' : 'Private'}
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isPublic}
                            onClick={() => toggleVisibility('albums', album.id)}
                            title={`Toggle visibility for ${album.title}`}
                            className={`group relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${
                              isPublic ? 'bg-blue-600' : 'bg-zinc-700'
                            }`}
                          >
                            <span className="sr-only">Toggle visibility for {album.title}</span>
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                isPublic ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* SECTION 3: FAVORITE TRACKS */}
        {(activeTab === 'all' || activeTab === 'tracks') && (
          <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-zinc-900 light:border-zinc-700 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <span className="material-icons-round text-lg">graphic_eq</span>
                </div>
                <div>
                  <h2 className="font-sans font-extrabold text-lg text-white tracking-tight">
                    Favorite Tracks
                  </h2>
                  <p className="text-zinc-500 text-xs">
                    Last 20 tracks suggested from listening history
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs text-zinc-500">
                {displayTracks.length} Tracks
              </span>
            </div>

            {displayTracks.length === 0 ? (
              <div className="bg-zinc-900/20 border border-zinc-900/50 light:border-zinc-700 rounded-2xl p-8 text-center space-y-2">
                <span className="material-icons-round text-4xl text-zinc-600">music_note</span>
                <p className="text-zinc-400 text-sm">No public favorite tracks available.</p>
              </div>
            ) : (
              <div className="bg-zinc-900/20 border border-zinc-900/40 light:border-zinc-700 rounded-2xl overflow-hidden divide-y divide-zinc-900/40 shadow-lg">
                {displayTracks.map((track) => {
                  const isCurrent = currentTrack?.id === track.id;
                  const isPublic = isItemPublic('tracks', track.id);

                  const artistUrl = track.artistId
                    ? `/artist/${track.artistId}`
                    : `/artist/${encodeURIComponent(track.artist)}`;

                  const trackAlbumUrl = track.releaseId
                    ? `/album/${track.releaseId}`
                    : (track as any).releaseGroupId
                    ? `/album/${(track as any).releaseGroupId}`
                    : track.albumId
                    ? `/album/${track.albumId}`
                    : track.album && ALBUM_COVER_MAP[track.album.toLowerCase()]?.match(/release-group\/([^/]+)/)?.[1]
                    ? `/album/${ALBUM_COVER_MAP[track.album.toLowerCase()].match(/release-group\/([^/]+)/)![1]}`
                    : track.album
                    ? `/album/${encodeURIComponent(track.album)}`
                    : '#';

                  return (
                    <div
                      key={track.id}
                      className={`flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-zinc-900/40 transition-colors group ${
                        isCurrent ? 'bg-blue-950/20 text-blue-400' : 'text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 truncate flex-1 min-w-0 pr-3">
                        <button
                          onClick={() => playTrack(track, displayTracks)}
                          className={`w-8 h-8 rounded-full bg-zinc-800 hover:bg-blue-500 hover:text-white flex items-center justify-center text-zinc-300 transition-all cursor-pointer shrink-0 ${
                            isCurrent ? 'bg-blue-500 text-white' : ''
                          }`}
                          title={isCurrent && isPlaying ? 'Pause' : 'Play Track'}
                        >
                          {isCurrent && isPlaying ? (
                            <span className="material-icons-round text-sm block">pause</span>
                          ) : (
                            <span className="material-icons-round text-sm block pl-0.5">play_arrow</span>
                          )}
                        </button>

                        <Link href={`/track/${track.id}`} className="shrink-0">
                          <CoverImage
                            src={track.coverUrl}
                            alt={track.title}
                            type="track"
                            className="w-10 h-10 object-cover rounded-lg bg-zinc-950 border border-zinc-800 light:border-zinc-700 shadow shrink-0 hover:opacity-80 transition-opacity"
                          />
                        </Link>

                        <div className="truncate text-left flex-1 min-w-0">
                          <Link
                            href={`/track/${track.id}`}
                            className="font-bold text-sm block truncate text-white hover:text-blue-400 transition-all"
                          >
                            {track.title}
                          </Link>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5 truncate">
                            <Link
                              href={artistUrl}
                              className="font-semibold text-zinc-300 hover:text-blue-400 hover:underline truncate transition-colors"
                            >
                              {track.artist}
                            </Link>
                            {track.album && (
                              <>
                                <span>&bull;</span>
                                <Link
                                  href={trackAlbumUrl}
                                  className="text-zinc-500 hover:text-zinc-300 hover:underline truncate max-w-[160px] transition-colors"
                                >
                                  {track.album}
                                </Link>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 pl-2">
                        <span className="font-mono text-xs text-zinc-500 hidden sm:inline-block">
                          {track.duration ? `${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, '0')}` : '3:00'}
                        </span>
                        <TrackMenu track={track} />

                        {/* Tailwind Visibility Toggle */}
                        {isCurrentUser && (
                          <div className="flex items-center gap-2 shrink-0 border-l border-zinc-800 pl-2">
                            <span className={`text-[11px] font-medium tracking-wide ${isPublic ? 'text-zinc-200' : 'text-zinc-500'}`}>
                              {isPublic ? 'Public' : 'Private'}
                            </span>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isPublic}
                              onClick={() => toggleVisibility('tracks', track.id)}
                              title={`Toggle visibility for ${track.title}`}
                              className={`group relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${
                                isPublic ? 'bg-blue-600' : 'bg-zinc-700'
                              }`}
                            >
                              <span className="sr-only">Toggle visibility for {track.title}</span>
                              <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                  isPublic ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

