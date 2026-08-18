import type { Metadata } from 'next';
import ReleaseClient from './ReleaseClient';
import { getReleaseMetadata } from '@/lib/seo';

type Props = {
  params: Promise<{ id: string; lang: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return getReleaseMetadata(id);
}

export default function ReleasePage() {
  return <ReleaseClient />;
}
