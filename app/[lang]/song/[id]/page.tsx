import type { Metadata } from 'next';
import TrackClient from '../../track/[id]/TrackClient';
import { getTrackMetadata } from '@/lib/seo';

type Props = {
  params: Promise<{ id: string; lang: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return getTrackMetadata(id);
}

export default function SongPage() {
  return <TrackClient />;
}
