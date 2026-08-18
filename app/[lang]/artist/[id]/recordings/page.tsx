import type { Metadata } from 'next';
import RecordingsClient from './RecordingsClient';
import { getArtistMetadata } from '@/lib/seo';

type Props = {
  params: Promise<{ id: string; lang: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return getArtistMetadata(id, 'tracks');
}

export default function ArtistRecordingsPage() {
  return <RecordingsClient />;
}
