import type { Metadata } from 'next';
import ArtistClient from './ArtistClient';
import { getArtistMetadata } from '@/lib/seo';

type Props = {
  params: Promise<{ id: string; lang: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return getArtistMetadata(id, 'main');
}

export default function ArtistPage() {
  return <ArtistClient />;
}
