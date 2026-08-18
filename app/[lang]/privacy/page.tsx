import type { Metadata } from 'next';
import PrivacyClient from './PrivacyClient';

export const metadata: Metadata = {
  title: "Privacy Policy - Muzikoo Player",
  description: "Zero Tracker Guarantee, Open API Data Access, and Privacy Policy for Muzikoo Player.",
  openGraph: {
    title: "Privacy Policy - Muzikoo Player",
    description: "Zero Tracker Guarantee, Open API Data Access, and Privacy Policy for Muzikoo Player.",
    type: "website",
    siteName: "Muzikoo.com",
    url: "https://muzikoo.com/privacy",
  },
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}
