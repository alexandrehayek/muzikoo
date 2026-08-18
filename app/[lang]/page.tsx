import type { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: "Muzikoo Player",
  description: "Muzikoo Player to search for music, discover songs & create beautiful playlists.",
  openGraph: {
    title: "Muzikoo Player",
    description: "Muzikoo Player to search for music, discover songs & create beautiful playlists.",
    type: "website",
    siteName: "Muzikoo.com",
    url: "https://muzikoo.com",
  },
};

export default function HomePage() {
  return <HomeClient />;
}
