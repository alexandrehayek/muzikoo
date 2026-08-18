import type { Metadata } from 'next';
import TermsClient from './TermsClient';

export const metadata: Metadata = {
  title: "Terms of Service - Muzikoo Player",
  description: "Core Service Agreement, Supabase storage guidelines, and terms of service for Muzikoo Player.",
  openGraph: {
    title: "Terms of Service - Muzikoo Player",
    description: "Core Service Agreement, Supabase storage guidelines, and terms of service for Muzikoo Player.",
    type: "website",
    siteName: "Muzikoo.com",
    url: "https://muzikoo.com/terms",
  },
};

export default function TermsPage() {
  return <TermsClient />;
}
