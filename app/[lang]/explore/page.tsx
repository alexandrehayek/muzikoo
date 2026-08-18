import type { Metadata } from 'next';
import ExploreClient from './ExploreClient';

export const metadata: Metadata = {
  title: "Explore music charts - Muzikoo.com",
  description: "Discover trending tracks and top artists around the world powered by Last.fm Geo data. - Muzikoo.com",
  openGraph: {
    title: "Explore music charts - Muzikoo.com",
    description: "Discover trending tracks and top artists around the world powered by Last.fm Geo data. - Muzikoo.com",
    type: "website",
    siteName: "Muzikoo.com",
    url: "https://muzikoo.com/explore",
  },
};

export default function ExplorePage() {
  return <ExploreClient />;
}
