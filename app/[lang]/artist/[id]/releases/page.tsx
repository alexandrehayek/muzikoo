import type { Metadata } from 'next';
import AlbumsClient from '../albums/AlbumsClient';
import { getArtistMetadata } from '@/lib/seo';

type Props = {
  params: Promise<{ id: string; lang: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return getArtistMetadata(id, 'albums');
}

export default function ArtistReleasesPage() {
  return <AlbumsClient />;
}
