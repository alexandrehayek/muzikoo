import type { Metadata } from 'next';
import AboutClient from './AboutClient';

export const metadata: Metadata = {
  title: "About - Muzikoo",
  description: "Search for music, discover songs & create beautiful playlists. The music catalog is built on open data from MusicBrainz and Last.fm.",
  openGraph: {
    title: "About - Muzikoo",
    description: "Search for music, discover songs & create beautiful playlists. Built on open data from MusicBrainz, Last.fm, and open community sources.",
    type: "website",
    siteName: "Muzikoo",
    url: "https://muzikoo.com/about",
  },
};

export default function AboutPage() {
  return <AboutClient />;
}
