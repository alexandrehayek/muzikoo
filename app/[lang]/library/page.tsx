import type { Metadata } from 'next';
import LibraryClient from './LibraryClient';

export const metadata: Metadata = {
  title: "Music library - Muzikoo.com",
  description: "Manage your custom playlist collections and saved music. - Muzikoo.com",
  openGraph: {
    title: "Music library - Muzikoo.com",
    description: "Manage your custom playlist collections and saved music. - Muzikoo.com",
    type: "website",
    siteName: "Muzikoo.com",
    url: "https://muzikoo.com/library",
  },
};

export default function LibraryPage() {
  return <LibraryClient />;
}
