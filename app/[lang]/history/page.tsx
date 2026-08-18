import type { Metadata } from 'next';
import HistoryClient from './HistoryClient';

export const metadata: Metadata = {
  title: "Music history - Muzikoo.com",
  description: "View and manage your recent search queries and music playback activity. - Muzikoo.com",
  openGraph: {
    title: "Music history - Muzikoo.com",
    description: "View and manage your recent search queries and music playback activity. - Muzikoo.com",
    type: "website",
    siteName: "Muzikoo.com",
    url: "https://muzikoo.com/history",
  },
};

export default function HistoryPage() {
  return <HistoryClient />;
}
