import type { Metadata } from 'next';
import BiographyClient from './BiographyClient';
import { getArtistMetadata } from '@/lib/seo';

type Props = {
  params: Promise<{ id: string; lang: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return getArtistMetadata(id, 'biography');
}

export default function ArtistBiographyPage() {
  return <BiographyClient />;
}
